import { NextResponse } from "next/server";
import { regenerarMensaje } from "@/lib/claude";
import { actualizarLead, ajustesDeLead, obtenerLead } from "@/lib/store";

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lead = obtenerLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }

  try {
    const mensaje = await regenerarMensaje(
      {
        perfilUrl: lead.perfilUrl,
        nombre: lead.nombre,
        cargo: lead.cargo,
        empresa: lead.empresa,
        ubicacion: lead.ubicacion,
        fotoUrl: lead.fotoUrl,
        headline: lead.headline,
      },
      lead.ultimoPost,
      ajustesDeLead(lead),
      lead.mensaje,
    );
    actualizarLead(id, { mensaje });
    return NextResponse.json({ mensaje });
  } catch (e) {
    console.error("[regenerar]", e);
    return NextResponse.json(
      { error: (e as Error).message || "No se pudo regenerar." },
      { status: 500 },
    );
  }
}
