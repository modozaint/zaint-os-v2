import { NextResponse } from "next/server";
import { listarLeads } from "@/lib/store";
import { airtableActivo, sincronizarLeads } from "@/lib/airtable";

export const maxDuration = 180;

/** Empuja TODOS los leads actuales a Airtable (crea/actualiza por Id). */
export async function POST() {
  if (!airtableActivo()) {
    return NextResponse.json(
      { error: "Airtable no configurado. Falta AIRTABLE_TOKEN o AIRTABLE_BASE_ID en .env.local" },
      { status: 400 },
    );
  }
  const leads = listarLeads();
  const sincronizados = await sincronizarLeads(leads);
  return NextResponse.json({ sincronizados, total: leads.length });
}

/** ¿Airtable está conectado? Devuelve también el link a la base para abrir el CRM. */
export async function GET() {
  const base = process.env.AIRTABLE_BASE_ID;
  return NextResponse.json({
    activo: airtableActivo(),
    url: base ? `https://airtable.com/${base}` : null,
  });
}
