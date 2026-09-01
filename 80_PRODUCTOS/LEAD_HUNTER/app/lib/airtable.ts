import type { Lead } from "./types";

/** Nombre de la tabla CRM en Airtable. */
const TABLA = "Leads";

function cfg(): { token: string; base: string } | null {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) return null;
  return { token, base };
}

/** ¿Airtable está configurado? (si no, el sistema sigue con persistencia local). */
export function airtableActivo(): boolean {
  return cfg() !== null;
}

function iso(ms?: number | null): string | undefined {
  return ms ? new Date(ms).toISOString() : undefined;
}

/** Mapea un Lead del sistema a los campos de la tabla de Airtable. */
function leadAFields(lead: Lead): Record<string, unknown> {
  const f: Record<string, unknown> = {
    Nombre: lead.nombre,
    Id: lead.id,
    Cargo: lead.cargo,
    Empresa: lead.empresa,
    Ubicacion: lead.ubicacion,
    Headline: lead.headline,
    Estado: lead.estado,
    Resumen: lead.resumen,
    PorQueBuenLead: lead.porQueBuenLead,
    UltimoPost: lead.ultimoPost ?? "",
    Mensaje: lead.mensaje,
    Nota: lead.nota ?? "",
    Conversacion: JSON.stringify(lead.conversacion ?? []),
    Seguimientos: lead.seguimientos ?? 0,
    Escalado: Boolean(lead.escalado),
  };
  if (lead.perfilUrl) f.PerfilUrl = lead.perfilUrl;
  const p = iso(lead.programadoEn);
  if (p) f.ProgramadoEn = p;
  const c = iso(lead.contactadoEn);
  if (c) f.ContactadoEn = c;
  const r = iso(lead.recontactarEn);
  if (r) f.RecontactarEn = r;
  const cr = iso(lead.creadoEn);
  if (cr) f.CreadoEn = cr;
  return f;
}

/**
 * Upsert por lotes (máx 10 por request, con pausa por el rate limit de Airtable).
 * Usa performUpsert sobre el campo Id: crea o actualiza según exista.
 */
async function upsertLote(leads: Lead[]): Promise<number> {
  const c = cfg();
  if (!c || !leads.length) return 0;
  const url = `https://api.airtable.com/v0/${c.base}/${encodeURIComponent(TABLA)}`;
  let ok = 0;
  for (let i = 0; i < leads.length; i += 10) {
    const lote = leads.slice(i, i + 10);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${c.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: ["Id"] },
        records: lote.map((l) => ({ fields: leadAFields(l) })),
      }),
    });
    if (res.ok) ok += lote.length;
    else console.warn("[airtable] upsert falló:", (await res.text()).slice(0, 200));
    await new Promise((r) => setTimeout(r, 230)); // respetar 5 req/s
  }
  return ok;
}

/** Sincroniza varios leads. Silencioso: nunca rompe la operación del sistema. */
export async function sincronizarLeads(leads: Lead[]): Promise<number> {
  try {
    return await upsertLote(leads);
  } catch {
    return 0;
  }
}

/** Sincroniza un lead (fire-and-forget desde el store). */
export function sincronizarLead(lead: Lead): void {
  if (!airtableActivo()) return;
  upsertLote([lead]).catch(() => {});
}
