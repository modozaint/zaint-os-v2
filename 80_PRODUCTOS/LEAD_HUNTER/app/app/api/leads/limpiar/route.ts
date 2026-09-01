import { NextResponse } from "next/server";
import { limpiarLeads, type ModoLimpieza } from "@/lib/store";

const MODOS: ModoLimpieza[] = ["todos", "reunion", "cerrados"];

/**
 * Limpia el tablero del cliente activo. Body: { modo: "todos"|"reunion"|"cerrados" }
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { modo?: ModoLimpieza };
  const modo = b.modo && MODOS.includes(b.modo) ? b.modo : "todos";
  const borrados = limpiarLeads(modo);
  return NextResponse.json({ borrados, modo });
}
