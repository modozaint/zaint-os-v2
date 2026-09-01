import { NextResponse } from "next/server";
import { sugerencias, type TipoCatalogo } from "@/lib/unipile";

/**
 * Autocompletado del vocabulario propio de LinkedIn: ubicaciones, industrias y
 * cargos. Existe para que en la app se ELIJA de una lista en vez de escribir a
 * mano — así el término es siempre uno que LinkedIn reconoce.
 *
 * GET /api/linkedin/catalogo?tipo=INDUSTRY&q=comercio
 */
const TIPOS: TipoCatalogo[] = ["LOCATION", "INDUSTRY", "JOB_TITLE", "COMPANY", "SERVICE"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = (searchParams.get("tipo") ?? "").toUpperCase() as TipoCatalogo;
  const q = searchParams.get("q") ?? "";

  if (!TIPOS.includes(tipo)) {
    return NextResponse.json(
      { error: `tipo inválido; usá uno de: ${TIPOS.join(", ")}` },
      { status: 400 },
    );
  }
  if (q.trim().length < 2) return NextResponse.json({ opciones: [] });

  return NextResponse.json({ opciones: await sugerencias(tipo, q) });
}
