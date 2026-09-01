import { NextResponse } from "next/server";
import { leadsEscalados, leadsParaRuta, registrarLlamada } from "@/lib/store";
import type { ResultadoLlamada } from "@/lib/types";

const RESULTADOS: ResultadoLlamada[] = [
  "no_contesto",
  "interesado",
  "llamar_despues",
  "no_interesa",
];

/**
 * Las dos colas de la Ruta:
 * - leads: contactos nuevos por teléfono/WhatsApp (la jornada normal).
 * - escalados: los que el agente no pudo resolver y esperan a un humano.
 */
export async function GET() {
  return NextResponse.json({
    leads: leadsParaRuta(),
    escalados: leadsEscalados(),
  });
}

/** Registra el resultado de un contacto. Body: { leadId, resultado, nota? } */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    leadId?: string;
    resultado?: ResultadoLlamada;
    nota?: string;
  };
  if (!b.leadId || !b.resultado || !RESULTADOS.includes(b.resultado)) {
    return NextResponse.json(
      { error: "Faltan leadId o resultado válido." },
      { status: 400 },
    );
  }
  const lead = registrarLlamada(b.leadId, b.resultado, b.nota);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ lead });
}
