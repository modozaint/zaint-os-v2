import { NextResponse } from "next/server";
import {
  guardarCadencia,
  listarLeads,
  obtenerCadencia,
  obtenerEnvios,
  programarContacto,
  reprogramarContacto,
} from "@/lib/store";
import type { ConfigCadencia } from "@/lib/types";

/** Estado actual del motor de contacto: cadencia + registro de envíos. */
export async function GET() {
  return NextResponse.json({
    cadencia: obtenerCadencia(),
    envios: obtenerEnvios(),
    leads: listarLeads(),
  });
}

/** Guardar la configuración de cadencia. */
export async function PATCH(req: Request) {
  let cambios: Partial<ConfigCadencia>;
  try {
    cambios = (await req.json()) as Partial<ConfigCadencia>;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const cadencia = guardarCadencia(cambios);
  return NextResponse.json({ cadencia });
}

/**
 * Programar el contacto según la cadencia.
 *
 * Body opcional:
 *   { leadIds?: string[] } — solo esos leads. Sin body: todos los nuevos.
 *   { reprogramar: true }  — REHACE el calendario de los que YA tenían hora,
 *     con la cadencia vigente. Se usa después de cambiarla: sin esto, subir de
 *     3 a 6 por día no adelanta a nadie que ya estuviera agendado.
 */
export async function POST(req: Request) {
  let body: { leadIds?: string[]; reprogramar?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // Sin body: programa todos los nuevos.
  }
  const programados = body.reprogramar
    ? reprogramarContacto()
    : programarContacto(body.leadIds);
  return NextResponse.json({
    programados,
    reprogramados: body.reprogramar ? programados : undefined,
    cadencia: obtenerCadencia(),
    leads: listarLeads(),
  });
}
