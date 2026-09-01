import { NextResponse } from "next/server";
import { calcularMetricas } from "@/lib/metricas";

/** Métricas del embudo, calculadas en vivo desde el estado real del sistema. */
export async function GET() {
  return NextResponse.json(calcularMetricas());
}
