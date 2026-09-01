import { NextResponse } from "next/server";
import { ApifyLimiteError } from "@/lib/apify";
import { LIMITE_INSTAGRAM, buscarInstagram } from "@/lib/instagram";
import { analizarEnLote, analizarInstagram } from "@/lib/claude";
import { guardarLeads, obtenerAjustes, registrarExtraccion } from "@/lib/store";
import { verificarPresupuesto } from "@/lib/apify-usage";
import { estimarCostoInstagram } from "@/lib/costo";
import type { Lead } from "@/lib/types";

export const maxDuration = 300;

/** Busca CUENTAS de Instagram que publicaron sobre un hashtag, las analiza y crea leads. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    hashtags?: string[];
    cantidad?: number;
  };
  const hashtags = (Array.isArray(b.hashtags) ? b.hashtags : [])
    .map((h) => String(h).trim())
    .filter(Boolean);
  if (!hashtags.length) {
    return NextResponse.json(
      { error: "Escribí un tema/hashtag (ej: skincare, barberia)." },
      { status: 400 },
    );
  }
  const cantidad = Math.min(Math.max(Number(b.cantidad) || 10, 1), LIMITE_INSTAGRAM);

  const chequeo = await verificarPresupuesto(estimarCostoInstagram(cantidad));
  if (!chequeo.ok) {
    return NextResponse.json({ error: chequeo.mensaje, presupuesto: true }, { status: 402 });
  }

  const registrar = (resultados: number) =>
    registrarExtraccion({
      fuente: "instagram",
      termino: hashtags.map((h) => `#${h}`).join(" "),
      ubicacion: "",
      solicitados: cantidad,
      resultados,
      costoUsd: estimarCostoInstagram(cantidad),
    });

  try {
    const cuentas = await buscarInstagram(hashtags, cantidad);
    if (!cuentas.length) {
      registrar(0);
      return NextResponse.json({ leads: [] });
    }

    const ajustes = obtenerAjustes();
    const ahora = Date.now();
    const leads: Lead[] = [];

    await analizarEnLote(cuentas, 5, async (c, i) => {
      try {
        const a = await analizarInstagram(c, ajustes);
        leads.push({
          id: `ig-${ahora}-${i}`,
          nombre: c.nombre,
          cargo: "",
          empresa: "",
          ubicacion: "",
          fotoUrl: null,
          perfilUrl: c.url,
          headline: `@${c.username}`,
          ultimoPost: c.caption || null,
          sinPost: !c.caption,
          resumen: a.resumen,
          porQueBuenLead: a.porQueBuenLead,
          mensaje: a.mensaje,
          estado: "nuevos",
          nota: "",
          creadoEn: ahora + i,
          origen: "instagram",
          contacto: "", // IG no da teléfono: el contacto es DM
        });
      } catch (e) {
        console.warn(`[buscar-instagram] falló @${c.username}:`, (e as Error).message);
      }
    });

    leads.sort((a, b) => a.creadoEn - b.creadoEn);
    guardarLeads(leads);
    registrar(leads.length);
    return NextResponse.json({ leads });
  } catch (e) {
    if (e instanceof ApifyLimiteError) {
      return NextResponse.json({ error: e.message, limite: true }, { status: 429 });
    }
    console.error("[buscar-instagram]", e);
    return NextResponse.json(
      { error: (e as Error).message || "Falló la búsqueda de Instagram." },
      { status: 500 },
    );
  }
}
