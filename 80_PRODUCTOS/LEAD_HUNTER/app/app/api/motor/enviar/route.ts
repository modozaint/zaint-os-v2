import { NextResponse } from "next/server";
import { enviar, type Analisis, type ResultadoAgenda } from "@/lib/motor-pasos";

export const maxDuration = 60;

/**
 * PASO 4 — enviar por LinkedIn y mover el tablero.
 *
 * Es el ÚNICO paso que sale hacia afuera, y va al final a propósito: si algo
 * falló en el análisis o en la agenda, acá no se envía nada y el lead queda
 * exactamente como estaba.
 *
 * Body: { leadId, analisis, agenda }  (los devuelven los pasos 2 y 3)
 */
export async function POST(req: Request) {
  const { leadId, analisis, agenda } = (await req.json().catch(() => ({}))) as {
    leadId?: string;
    analisis?: Analisis;
    agenda?: ResultadoAgenda;
  };
  if (!leadId || !analisis) {
    return NextResponse.json({ ok: false, motivo: "falta-leadId-o-analisis" }, { status: 400 });
  }
  try {
    const resultado = await enviar(
      leadId,
      analisis,
      agenda ?? { intentado: false, agendado: false },
    );
    return NextResponse.json({ ok: true, leadId, nombre: analisis.nombre, ...resultado });
  } catch (e) {
    return NextResponse.json(
      { ok: false, leadId, motivo: e instanceof Error ? e.message : "error" },
      { status: 502 },
    );
  }
}
