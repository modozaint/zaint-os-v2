import { NextResponse } from "next/server";
import { actualizarLead, aprobarContacto, contactoAprobado, listarLeads } from "@/lib/store";
import { unipileConfigurado, cuentaEnPie } from "@/lib/unipile";
import {
  avisar,
  telegramConfigurado,
  textoEscalado,
  textoServicioCaido,
  textoServicioVuelto,
} from "@/lib/telegram";

export const maxDuration = 120;

/**
 * EL VIGILANTE — avisa al celular cuando el sistema necesita a una persona.
 *
 * Dos cosas se avisan, y las dos nacieron de algo que pasó de verdad:
 *
 * 1. **Un lead trabado.** El agente escala cuando no sabe responder, pero ese
 *    aviso moría en una pantalla que nadie mira. El mensaje lleva el motivo y
 *    el link, para entrar a responder desde el mismo celular.
 *
 * 2. **LinkedIn caído.** El 5 y el 7 de agosto la conexión se cayó y el sistema
 *    siguió como si nada durante horas: un envío que falla se ve igual que un
 *    lead que no contestó. Nueve personas quedaron marcadas como contactadas
 *    sin que les llegara nada.
 *
 * 3. **Y desde el 16-08, además de avisar, FRENA.** Los tres bloqueos de la
 *    cuenta empezaron igual: el servicio se cae, la cola se acumula, y al
 *    volver sale entera de golpe. Cinco invitaciones en dos segundos el 13-08.
 *    Así que cuando LinkedIn se cae, el envío se apaga solo; cuando vuelve,
 *    **no se enciende solo**. Lo enciende una persona, mirando el tablero.
 *
 * Se avisa UNA vez por cosa. Un bot que insiste cada 15 minutos se silencia, y
 * entonces no sirve justo cuando importa.
 */

/** Memoria del último aviso de servicio, para no repetirlo en cada ciclo. */
const g = globalThis as unknown as { __avisoServicio?: { caido: boolean; cuando: number } };
g.__avisoServicio ??= { caido: false, cuando: 0 };

/** Qué avisaría ahora mismo, sin mandar nada. Para revisar antes de conectar. */
export async function GET() {
  const trabados = listarLeads().filter((l) => l.escalado && !l.escaladoAvisadoEn);
  const enPie = unipileConfigurado() ? await cuentaEnPie() : null;
  return NextResponse.json({
    ok: true,
    telegram: telegramConfigurado() ? "configurado" : "sin credenciales",
    leadsTrabadosSinAvisar: trabados.map((l) => ({
      id: l.id,
      nombre: l.nombre,
      motivo: l.motivoEscalado ?? "",
    })),
    linkedin: enPie === null ? "no verificable" : enPie ? "en pie" : "CAÍDO",
    servicioYaAvisado: g.__avisoServicio!.caido,
    envioAprobado: contactoAprobado(),
  });
}

export async function POST() {
  if (!telegramConfigurado()) {
    return NextResponse.json({
      ok: false,
      motivo: "Faltan TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.",
      avisos: 0,
    });
  }

  const avisos: string[] = [];

  // ── 1. ¿Sigue en pie la conexión con LinkedIn? ──
  if (unipileConfigurado()) {
    const enPie = await cuentaEnPie();
    const memoria = g.__avisoServicio!;
    if (enPie === false && !memoria.caido) {
      // Primero se frena, después se avisa. Si Telegram falla, el freno igual
      // quedó puesto: proteger la cuenta no puede depender de que llegue un
      // mensaje.
      const estabaAprobado = contactoAprobado();
      if (estabaAprobado) {
        aprobarContacto(false);
        avisos.push("envio-frenado");
      }
      if (
        await avisar(
          textoServicioCaido(
            estabaAprobado
              ? "La cuenta de LinkedIn no responde. Frené los envíos para que la cola no se acumule."
              : "La cuenta de LinkedIn no responde.",
          ),
        )
      ) {
        memoria.caido = true;
        memoria.cuando = Date.now();
        avisos.push("servicio-caido");
      }
    } else if (enPie === true && memoria.caido) {
      // 🔴 Volvió, pero el envío NO se reanuda solo.
      //
      // Los dos bloqueos peores de la cuenta vinieron justo después de una
      // reconexión: el servicio vuelve, la cola vencida sale entera y LinkedIn
      // lo lee como lo que parece. Reanudar es una decisión de persona, con el
      // tablero delante, no un efecto secundario de que un endpoint responda.
      if (await avisar(textoServicioVuelto())) {
        memoria.caido = false;
        avisos.push("servicio-vuelto");
      }
    }
  }

  // ── 2. Leads que esperan a una persona ──
  const trabados = listarLeads()
    .filter((l) => l.escalado && !l.escaladoAvisadoEn)
    // El más viejo primero: es el que lleva más tiempo esperando.
    .sort((a, b) => (a.escaladoEn ?? 0) - (b.escaladoEn ?? 0));

  for (const l of trabados) {
    const enviado = await avisar(
      textoEscalado(l.nombre, l.motivoEscalado ?? "", l.empresa),
    );
    if (!enviado) break; // si Telegram falla, se reintenta el próximo ciclo
    actualizarLead(l.id, { escaladoAvisadoEn: Date.now() });
    avisos.push(`escalado:${l.nombre}`);
  }

  return NextResponse.json({ ok: true, avisos: avisos.length, detalle: avisos });
}
