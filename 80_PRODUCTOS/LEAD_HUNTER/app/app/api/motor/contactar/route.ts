import { NextResponse } from "next/server";
import {
  actualizarLead,
  aprobarContacto,
  contactoAprobado,
  listarLeads,
  obtenerCadencia,
  programarContacto,
} from "@/lib/store";
import {
  enviarInvitacion,
  identificadorDe,
  resolverProviderId,
  unipileConfigurado,
} from "@/lib/unipile";
import { recortarNota } from "@/lib/claude";

export const maxDuration = 280;

/**
 * Tope duro por ciclo: protege la cuenta de LinkedIn pase lo que pase.
 *
 * Bajado de 5 a 1 el 16-08, despues del tercer bloqueo de la cuenta.
 *
 * El tope de 5 ya existia, pero el bucle mandaba las cinco SEGUIDAS, sin pausa
 * entre una y otra. El 13-08 salieron asi, y quedo grabado en la API:
 *     13:20:06 - 13:20:06 - 13:20:07 - 13:20:08 - 13:20:08
 * Cinco invitaciones en dos segundos. Ninguna persona hace eso, y LinkedIn
 * suspendio la cuenta ese mismo dia.
 *
 * Con 1 por ciclo el espaciado deja de depender de que el codigo se porte
 * bien: lo impone el reloj de n8n. A 15 minutos por ciclo el techo fisico son
 * 4 invitaciones por hora, aunque se acumulen cien en la cola.
 */
const TOPE_POR_CICLO = 1;

/**
 * Pausa minima real entre dos invitaciones, medida contra el ultimo envio que
 * de verdad salio (no contra un contador en memoria, que se pierde al
 * reiniciar). Segundo candado, por si alguien vuelve a subir el tope.
 */
const PAUSA_MINIMA_MS = 90_000;

/**
 * Cuanto puede haber vencido la hora de un lead y todavia enviarse.
 *
 * Si el sistema estuvo caido tres dias, la cola entera queda vencida, y sin
 * este freno saldria toda junta al volver: que es exactamente como empezaron
 * los bloqueos. Lo que vencio hace mucho no se manda tarde, se reprograma.
 */
const VENCIMIENTO_MAX_MS = 6 * 60 * 60 * 1000;

/**
 * ¿El envío falló porque el servicio está caído, o porque LinkedIn dijo que no?
 *
 * La diferencia decide si el lead queda marcado como contactado. Si LinkedIn
 * rechaza la invitación porque ya son conexión o porque ya se invitó, el
 * contacto está hecho y el sync seguirá desde ahí. Pero si Unipile devuelve
 * 401 (credenciales), 429 (cuota) o 5xx (servicio caído), no salió nada: ese
 * lead tiene que volver a la cola en vez de figurar como contactado.
 */
function esFalloDeInfraestructura(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  // `enviarInvitacion` lanza "Unipile invitar HTTP <status>: <cuerpo>".
  const status = Number(msg.match(/HTTP (\d{3})/)?.[1]);
  if (Number.isFinite(status)) {
    return status === 401 || status === 403 || status === 429 || status >= 500;
  }
  // Sin status: caída de red, DNS, timeout. Tampoco salió nada.
  return /fetch failed|network|ENOTFOUND|ETIMEDOUT|ECONNREFUSED/i.test(msg);
}

/** Un solo ciclo de contacto a la vez (mismo motivo que en /motor/sync). */
let cicloEnCurso = false;

/**
 * CONTACTO REAL con cadencia. Es el flujo que n8n dispara cada tanto.
 *
 * Reparto de responsabilidades a propósito:
 *  - n8n es el RELOJ: pregunta cada X minutos "¿toca contactar a alguien?".
 *  - La APP es la que MANDA: decide a quién y cuándo según la cadencia que el
 *    usuario configuró en la interfaz (días activos, horario, tope diario,
 *    espaciado irregular).
 *
 * Por qué así: la propuesta pide "una cadencia que vos definís". Si la cadencia
 * viviera en los nodos de n8n, cambiarla sería trabajo de desarrollador y el
 * cliente no podría tocarla. Aquí se cambia desde Ajustes y n8n ni se entera.
 *
 * `programarContacto()` ya asigna a cada lead nuevo un momento válido dentro de
 * la ventana configurada, con espaciado irregular. Este endpoint solo envía los
 * que ya cumplieron su hora.
 */
export async function POST() {
  if (!unipileConfigurado()) {
    return NextResponse.json({ ok: false, motivo: "unipile-no-configurado" }, { status: 400 });
  }
  if (cicloEnCurso) {
    return NextResponse.json({ ok: true, motivo: "ciclo-en-curso", enviados: [] });
  }
  cicloEnCurso = true;
  try {
    // 1. Los leads nuevos que aún no tienen hora asignada, la reciben ahora
    //    (respetando días, horario y tope diario).
    const programados = programarContacto();

    // 2. Freno de mano: hasta que el usuario revise los primeros mensajes y
    //    libere el envío, NADA sale a LinkedIn. Se devuelve el plan para que
    //    pueda revisarlo desde la app.
    if (!contactoAprobado()) {
      const cuantos = obtenerCadencia().revisarPrimeros;
      const plan = listarLeads()
        .filter((l) => l.estado === "nuevos" && l.programadoEn)
        .sort((a, b) => (a.programadoEn ?? 0) - (b.programadoEn ?? 0))
        .slice(0, cuantos)
        .map((l) => ({
          id: l.id,
          nombre: l.nombre,
          empresa: l.empresa,
          cuando: l.programadoEn,
          mensaje: l.mensaje,
        }));
      return NextResponse.json({
        ok: true,
        motivo: "pendiente-de-revision",
        programados,
        revisarPrimeros: cuantos,
        plan,
        enviados: [],
      });
    }

    // 3. Los que ya cumplieron su hora y se pueden contactar por LinkedIn.
    const ahora = Date.now();

    // Candado de ritmo: si la ultima invitacion salio hace menos de la pausa
    // minima, este ciclo no manda nada. Se mide contra `contactadoEn`, que ya
    // vive en disco, asi que un reinicio del contenedor no lo borra.
    const ultimoEnvio = listarLeads().reduce(
      (max, l) => Math.max(max, l.contactadoEn ?? 0),
      0,
    );
    const desdeElUltimo = ahora - ultimoEnvio;
    if (ultimoEnvio && desdeElUltimo < PAUSA_MINIMA_MS) {
      return NextResponse.json({
        ok: true,
        motivo: "pausa-entre-invitaciones",
        faltanSegundos: Math.ceil((PAUSA_MINIMA_MS - desdeElUltimo) / 1000),
        enviados: [],
      });
    }

    const listos = listarLeads().filter(
      (l) =>
        l.estado === "nuevos" &&
        l.programadoEn &&
        l.programadoEn <= ahora &&
        !l.contactadoEn &&
        l.perfilUrl?.includes("linkedin.com"),
    );

    // Lo que vencio hace demasiado NO se envia: se corre a un hueco nuevo, con
    // separacion irregular, para que la cola acumulada no salga en rafaga.
    const caducados = listos.filter(
      (l) => ahora - (l.programadoEn ?? 0) > VENCIMIENTO_MAX_MS,
    );
    for (const [i, l] of caducados.entries()) {
      const minutos = 20 + i * (25 + Math.floor(Math.random() * 40));
      actualizarLead(l.id, { programadoEn: ahora + minutos * 60_000 });
    }
    if (caducados.length) {
      console.log(
        `[contactar] ${caducados.length} lead(s) con hora vencida: reprogramados en vez de enviados en rafaga`,
      );
    }

    const cola = listos
      .filter((l) => ahora - (l.programadoEn ?? 0) <= VENCIMIENTO_MAX_MS)
      .sort((a, b) => (a.programadoEn ?? 0) - (b.programadoEn ?? 0))
      .slice(0, TOPE_POR_CICLO);

    const enviados: { leadId: string; nombre: string }[] = [];
    const fallidos: { leadId: string; nombre: string; motivo: string }[] = [];

    for (const lead of cola) {
      try {
        const providerId =
          lead.providerId ?? (await resolverProviderId(identificadorDe(lead.perfilUrl)));
        // La nota viaja DENTRO de la solicitud: es lo primero que ve el lead y
        // lo que decide si acepta. Los leads anteriores al 03-08 no la tienen,
        // y en ese caso la solicitud sale pelada como antes.
        const nota = lead.notaInvitacion?.trim()
          ? recortarNota(lead.notaInvitacion)
          : undefined;
        // Si ya son conexión, Unipile rechaza la invitación: no es fatal, el
        // sync abrirá el chat igual en su próximo ciclo.
        let ultimoError: unknown = null;
        try {
          await enviarInvitacion(providerId, nota);
        } catch (e1) {
          ultimoError = e1;
          // Puede fallar por dos motivos distintos: ya son conexión / ya se
          // invitó, o LinkedIn rechazó la nota. Se reintenta sin ella para no
          // perder el contacto por culpa del texto.
          if (nota) {
            try {
              await enviarInvitacion(providerId);
              ultimoError = null;
            } catch (e2) {
              ultimoError = e2;
            }
          }
        }

        // 🔴 Marcar "contactado" cuando el envío falló es la peor mentira que
        // puede decir el tablero. Pasó entre el 5 y el 7 de agosto: Unipile
        // estuvo caído y nueve personas quedaron figurando como contactadas sin
        // que les llegara nada, porque este `actualizarLead` estaba fuera del
        // manejo de error.
        //
        // No todo fallo es igual: si LinkedIn rechaza porque YA son conexión,
        // el contacto está hecho igual y el sync abrirá el chat. Pero si el
        // problema es de credenciales, cuota o servicio caído, no salió nada y
        // el lead tiene que volver a la cola.
        if (ultimoError && esFalloDeInfraestructura(ultimoError)) {
          const motivo = ultimoError instanceof Error ? ultimoError.message : "error";
          console.log(`[contactar] NO se envió -> ${lead.nombre} (${lead.id}): ${motivo}`);
          fallidos.push({ leadId: lead.id, nombre: lead.nombre, motivo });
          continue; // sigue en "nuevos": se reintenta cuando el servicio vuelva
        }

        actualizarLead(lead.id, {
          estado: "contactados",
          providerId,
          contactadoEn: Date.now(),
        });
        console.log(`[contactar] invitación -> ${lead.nombre} (${lead.id})`);
        enviados.push({ leadId: lead.id, nombre: lead.nombre });
      } catch (e) {
        fallidos.push({
          leadId: lead.id,
          nombre: lead.nombre,
          motivo: e instanceof Error ? e.message : "error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      programados,
      enCola: cola.length,
      enviados,
      fallidos,
    });
  } finally {
    cicloEnCurso = false;
  }
}

/**
 * El botón "revisé los primeros, mandá el resto" (y el de volver a frenarlo).
 * Body: { aprobado: boolean }
 */
export async function PATCH(req: Request) {
  const { aprobado } = (await req.json().catch(() => ({}))) as { aprobado?: boolean };
  return NextResponse.json({ ok: true, aprobado: aprobarContacto(aprobado === true) });
}

/** Estado actual del freno, para pintarlo en la interfaz. */
export async function GET() {
  return NextResponse.json({ aprobado: contactoAprobado() });
}
