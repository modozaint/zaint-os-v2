import { NextResponse } from "next/server";
import { listarLeads, obtenerEnvios, procesarContacto } from "@/lib/store";

/**
 * Dispara los envíos (en simulación). Body opcional:
 *   { acelerar?: boolean, cuantos?: number }
 * Sin body: envía solo los que ya vencieron por reloj.
 * Con acelerar:true: envía los próximos `cuantos` (default 3) ignorando la hora
 * — para ver la demo sin esperar. NADA sale a LinkedIn: todo es simulado.
 */
export async function POST(req: Request) {
  let opts: { acelerar?: boolean; cuantos?: number } = {};
  try {
    opts = (await req.json()) as typeof opts;
  } catch {
    // Sin body es válido: procesa los vencidos.
  }

  const hechos = procesarContacto(opts);
  return NextResponse.json({
    enviados: hechos.length,
    hechos,
    envios: obtenerEnvios(),
    leads: listarLeads(),
  });
}
