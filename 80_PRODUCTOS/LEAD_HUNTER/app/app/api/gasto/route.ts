import { NextResponse } from "next/server";
import { obtenerUsoApify } from "@/lib/apify-usage";
import { guardarPresupuestoTope, obtenerPresupuestoTope } from "@/lib/store";

/** Gasto real de Apify este mes + el presupuesto tope propio. */
export async function GET() {
  const uso = await obtenerUsoApify();
  return NextResponse.json({
    usadoUsd: uso?.usadoUsd ?? null,
    planUsd: uso?.planUsd ?? null,
    topeUsd: obtenerPresupuestoTope(),
    disponible: uso !== null,
  });
}

/** Cambiar el presupuesto tope propio (USD/mes). */
export async function PATCH(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { topeUsd?: number };
  const n = Number(b.topeUsd);
  if (!Number.isFinite(n) || n < 0) {
    return NextResponse.json({ error: "Tope inválido." }, { status: 400 });
  }
  return NextResponse.json({ topeUsd: guardarPresupuestoTope(n) });
}
