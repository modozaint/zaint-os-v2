import { NextResponse } from "next/server";
import {
  ajustesDeLead,
  listarLeads,
  obtenerCadencia,
  obtenerEnvios,
  registrarSeguimiento,
  seguimientosPendientes,
} from "@/lib/store";
import { generarSeguimiento } from "@/lib/setter";

export const maxDuration = 300;

/**
 * Procesa los seguimientos (en simulación). Body opcional:
 *   { acelerar?: boolean, cuantos?: number }
 * Sin body: solo los que ya vencieron por la cadencia de días.
 * Con acelerar: los próximos `cuantos` (default 3) ignorando el reloj.
 * NADA sale a LinkedIn: todo simulado.
 */
export async function POST(req: Request) {
  let opts: { acelerar?: boolean; cuantos?: number } = {};
  try {
    opts = (await req.json()) as typeof opts;
  } catch {
    // Sin body: procesa los vencidos.
  }

  const cfg = obtenerCadencia();
  const cola = seguimientosPendientes(Boolean(opts.acelerar), opts.cuantos ?? 3);

  let enviados = 0;
  for (const lead of cola) {
    const n = (lead.seguimientos ?? 0) + 1;
    const esUltimo = n >= cfg.diasSeguimiento.length;
    try {
      const mensaje = await generarSeguimiento(lead, ajustesDeLead(lead), n, esUltimo);
      registrarSeguimiento(lead.id, mensaje);
      enviados++;
    } catch {
      // Si uno falla, seguimos con el resto.
    }
  }

  return NextResponse.json({
    enviados,
    envios: obtenerEnvios(),
    leads: listarLeads(),
  });
}
