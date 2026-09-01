import { NextResponse } from "next/server";
import { agendar } from "@/lib/motor-pasos";

export const maxDuration = 60;

/**
 * PASO 3 — reservar en la agenda, si corresponde.
 *
 * Solo actúa cuando el lead ya dio fecha, hora y correo. Si falta alguno,
 * devuelve `intentado: false` y sigue de largo — no es un error, es que
 * todavía no están coordinando.
 *
 * Body: { leadId: string, cita: { fecha, hora, correo } }
 */
export async function POST(req: Request) {
  const { leadId, cita } = (await req.json().catch(() => ({}))) as {
    leadId?: string;
    cita?: { fecha: string; hora: string; correo: string };
  };
  if (!leadId) {
    return NextResponse.json({ ok: false, motivo: "falta-leadId" }, { status: 400 });
  }
  try {
    const resultado = await agendar(leadId, cita);
    return NextResponse.json({ ok: true, leadId, ...resultado });
  } catch (e) {
    return NextResponse.json(
      { ok: false, leadId, motivo: e instanceof Error ? e.message : "error" },
      { status: 502 },
    );
  }
}
