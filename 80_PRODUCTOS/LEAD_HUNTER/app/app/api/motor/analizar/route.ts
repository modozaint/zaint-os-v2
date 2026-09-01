import { NextResponse } from "next/server";
import { analizar } from "@/lib/motor-pasos";

export const maxDuration = 120;

/**
 * PASO 2 — leer la conversación y decidir qué contestar.
 *
 * Transcribe las notas de voz, corre el agente y devuelve el mensaje
 * PROPUESTO junto con lo que entendió del lead. **No envía nada**: este es el
 * paso que se puede revisar antes de que salga algo hacia LinkedIn.
 *
 * Body: { leadId: string }
 */
export async function POST(req: Request) {
  const { leadId } = (await req.json().catch(() => ({}))) as { leadId?: string };
  if (!leadId) {
    return NextResponse.json({ ok: false, motivo: "falta-leadId" }, { status: 400 });
  }
  try {
    const analisis = await analizar(leadId);
    return NextResponse.json({ ok: true, ...analisis });
  } catch (e) {
    return NextResponse.json(
      { ok: false, leadId, motivo: e instanceof Error ? e.message : "error" },
      { status: 502 },
    );
  }
}
