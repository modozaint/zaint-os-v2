import { NextResponse } from "next/server";
import { ApifyLimiteError } from "@/lib/apify";
import { LIMITE_NEGOCIOS, buscarNegocios } from "@/lib/gmaps";
import { analizarEnLote, analizarNegocio } from "@/lib/claude";
import { guardarLeads, obtenerAjustes, registrarExtraccion } from "@/lib/store";
import { verificarPresupuesto } from "@/lib/apify-usage";
import { estimarCostoNegocios } from "@/lib/costo";
import type { Lead, ParametrosNegocios } from "@/lib/types";

export const maxDuration = 300;

/** Busca NEGOCIOS locales (Google Maps), los analiza con IA y crea leads. */
export async function POST(req: Request) {
  let cuerpo: ParametrosNegocios;
  try {
    cuerpo = (await req.json()) as ParametrosNegocios;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!cuerpo.keyword?.trim()) {
    return NextResponse.json({ error: "Escribí un rubro (ej: taller mecánico)." }, { status: 400 });
  }
  if (!cuerpo.ubicacion?.trim()) {
    return NextResponse.json({ error: "Escribí una ubicación (ej: Medellín, Colombia)." }, { status: 400 });
  }

  const params: ParametrosNegocios = {
    keyword: cuerpo.keyword,
    ubicacion: cuerpo.ubicacion,
    cantidad: Math.min(Math.max(Number(cuerpo.cantidad) || 10, 1), LIMITE_NEGOCIOS),
    soloConWeb: Boolean(cuerpo.soloConWeb),
    omitirCerrados: cuerpo.omitirCerrados !== false, // por defecto sí omite
    minEstrellas: Number(cuerpo.minEstrellas) || 0,
  };

  const chequeo = await verificarPresupuesto(estimarCostoNegocios(params.cantidad));
  if (!chequeo.ok) {
    return NextResponse.json({ error: chequeo.mensaje, presupuesto: true }, { status: 402 });
  }

  const registrar = (resultados: number) =>
    registrarExtraccion({
      fuente: "negocios",
      termino: params.keyword,
      ubicacion: params.ubicacion,
      solicitados: params.cantidad,
      resultados,
      costoUsd: estimarCostoNegocios(params.cantidad),
    });

  try {
    const negocios = await buscarNegocios(params);
    if (!negocios.length) {
      registrar(0);
      return NextResponse.json({ leads: [] });
    }

    const ajustes = obtenerAjustes();
    const ahora = Date.now();
    const leads: Lead[] = [];

    await analizarEnLote(negocios, 5, async (n, i) => {
      try {
        const a = await analizarNegocio(n, ajustes);
        leads.push({
          id: `gm-${ahora}-${i}`,
          nombre: n.nombre,
          cargo: n.categoria,
          empresa: n.nombre,
          ubicacion: n.ciudad,
          fotoUrl: null,
          perfilUrl: n.web || n.mapsUrl,
          headline: [n.categoria, n.rating != null ? `${n.rating}★ (${n.reseñas ?? 0})` : ""]
            .filter(Boolean)
            .join(" · "),
          ultimoPost: null,
          sinPost: true,
          resumen: a.resumen,
          porQueBuenLead: a.porQueBuenLead,
          mensaje: a.mensaje,
          estado: "nuevos",
          nota: "",
          creadoEn: ahora + i,
          origen: "negocio_maps",
          contacto: n.telefono,
        });
      } catch (e) {
        console.warn(`[buscar-negocios] falló ${n.nombre}:`, (e as Error).message);
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
    console.error("[buscar-negocios]", e);
    return NextResponse.json(
      { error: (e as Error).message || "Falló la búsqueda de negocios." },
      { status: 500 },
    );
  }
}
