import { NextResponse } from "next/server";
import {
  enHorarioDeEnvio,
  enviarSeguimiento,
  redactarSeguimiento,
  seguimientosParaEnviar,
} from "@/lib/motor-pasos";
import { enfriarInvitacionesVencidas, obtenerCadencia } from "@/lib/store";
import { unipileConfigurado } from "@/lib/unipile";

export const maxDuration = 280;

/** Un solo ciclo de seguimiento a la vez, para no mandar el mismo dos veces. */
let cicloEnCurso = false;

/**
 * SEGUIMIENTO REAL — al lead que nunca contestó.
 *
 * Distinto al flujo de respuestas: acá se le vuelve a escribir a quien se
 * quedó callado, a los días que diga la cadencia configurada en Ajustes.
 *
 * Hasta el 31-07 este flujo era SIMULADO: generaba el mensaje y lo guardaba
 * en el tablero sin mandarlo nunca. Ahora sale de verdad por LinkedIn.
 *
 * Body opcional:
 *   { adelantar?: boolean, cuantos?: number, soloRedactar?: boolean }
 *   - adelantar: ignora el reloj de días (para probar sin esperar 3 días).
 *   - soloRedactar: redacta y devuelve, sin enviar nada. Para revisar antes.
 */
export async function POST(req: Request) {
  if (!unipileConfigurado()) {
    return NextResponse.json({ ok: false, motivo: "unipile-no-configurado" }, { status: 400 });
  }
  if (cicloEnCurso) {
    return NextResponse.json({ ok: true, motivo: "ciclo-en-curso", resultados: [] });
  }

  const { adelantar, cuantos, soloRedactar } = (await req.json().catch(() => ({}))) as {
    adelantar?: boolean;
    cuantos?: number;
    soloRedactar?: boolean;
  };

  cicloEnCurso = true;
  try {
    // Limpieza previa: a quien recibió la solicitud hace semanas y nunca la
    // aceptó no se le puede escribir (LinkedIn no lo permite). Se enfría para
    // que deje de figurar como contactado y quede para re-prospectar.
    const enfriados = enfriarInvitacionesVencidas();
    if (enfriados) {
      console.log(`[seguimiento] ${enfriados} invitación(es) sin respuesta pasaron a frío`);
    }

    const cfg = obtenerCadencia();

    // Fuera de la ventana horaria no se escribe: un mensaje de trabajo a las
    // 3 de la mañana delata que es automático. `adelantar` es para pruebas y
    // sí puede saltarse el horario.
    if (!adelantar && !enHorarioDeEnvio(cfg)) {
      return NextResponse.json({
        ok: true,
        motivo: "fuera-de-horario",
        detalle: `La cadencia envía de ${cfg.horaInicio}:00 a ${cfg.horaFin}:00 en los días configurados.`,
        resultados: [],
      });
    }

    const cola = seguimientosParaEnviar(Boolean(adelantar), cuantos ?? 3);
    const resultados: Record<string, unknown>[] = [];

    for (const p of cola) {
      try {
        const redactado = await redactarSeguimiento(p.leadId);
        if (!redactado.procede) {
          resultados.push({ ...p, enviado: false, motivo: redactado.motivo });
          continue;
        }
        if (soloRedactar) {
          resultados.push({ ...p, enviado: false, borrador: redactado.borrador, motivo: "Solo redactado, no enviado." });
          continue;
        }
        const envio = await enviarSeguimiento(p.leadId, redactado.borrador);
        resultados.push({ ...p, borrador: redactado.borrador, ...envio });
      } catch (e) {
        resultados.push({ ...p, enviado: false, motivo: e instanceof Error ? e.message : "error" });
      }
    }

    return NextResponse.json({
      ok: true,
      enCola: cola.length,
      enviados: resultados.filter((r) => r.enviado).length,
      resultados,
    });
  } finally {
    cicloEnCurso = false;
  }
}

/** Quiénes tienen seguimiento pendiente ahora mismo (solo lectura). */
export async function GET() {
  const cfg = obtenerCadencia();
  return NextResponse.json({
    ok: true,
    enHorario: enHorarioDeEnvio(cfg),
    cadencia: { diasSeguimiento: cfg.diasSeguimiento, horaInicio: cfg.horaInicio, horaFin: cfg.horaFin },
    vencidos: seguimientosParaEnviar(false, 50),
    proximos: seguimientosParaEnviar(true, 50),
  });
}
