import { NextResponse } from "next/server";
import { listarExtracciones } from "@/lib/store";

/** Historial de extracciones (corridas de búsqueda), de la más reciente primero. */
export async function GET() {
  return NextResponse.json({ extracciones: listarExtracciones() });
}
