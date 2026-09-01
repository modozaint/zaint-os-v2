import { NextResponse } from "next/server";
import {
  ApifyLimiteError,
  slugDePerfil,
  traerUltimosPosts,
  LIMITE_DURO,
} from "@/lib/apify";
import { buscarPersonas } from "@/lib/unipile";
import { analizarEnLote, analizarPerfil } from "@/lib/claude";
import { guardarLeads, obtenerAjustes, registrarExtraccion } from "@/lib/store";
import type { Lead, ParametrosBusqueda } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  let cuerpo: ParametrosBusqueda;
  try {
    cuerpo = (await req.json()) as ParametrosBusqueda;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!cuerpo.keyword?.trim()) {
    return NextResponse.json(
      { error: "Escribí un rubro o palabra clave." },
      { status: 400 },
    );
  }

  const parametros: ParametrosBusqueda = {
    keyword: cuerpo.keyword,
    titles: Array.isArray(cuerpo.titles) ? cuerpo.titles : [],
    country: cuerpo.country?.trim() || "United States",
    regiones: Array.isArray(cuerpo.regiones) ? cuerpo.regiones : [],
    city: cuerpo.city ?? "",
    limit: Math.min(Math.max(Number(cuerpo.limit) || 20, 1), LIMITE_DURO),
    industrias: Array.isArray(cuerpo.industrias) ? cuerpo.industrias : [],
    ubicacion: cuerpo.ubicacion ?? null,
    soloCualificados: cuerpo.soloCualificados === true,
  };

  // Ya NO hay barrera de presupuesto de Apify en esta ruta: desde el 02-08 la
  // búsqueda de personas la hace Unipile, que va incluido en su suscripción y
  // no se cobra por lead. El tope de gasto sigue vigente para Maps e Instagram,
  // que sí corren sobre Apify.

  const ubicacionLog =
    parametros.ubicacion?.title ||
    (parametros.regiones.length
      ? parametros.regiones.join(", ")
      : [parametros.city, parametros.country].filter(Boolean).join(", "));
  const registrar = (resultados: number) =>
    registrarExtraccion({
      fuente: "linkedin",
      termino: parametros.keyword,
      ubicacion: ubicacionLog,
      solicitados: parametros.limit,
      resultados,
      // Cero: la búsqueda de personas ya no consume Apify (va por Unipile).
      costoUsd: 0,
    });

  try {
    // 1. Perfiles — por Unipile, con la cuenta real de LinkedIn.
    const perfiles = await buscarPersonas({
      ...parametros,
      industrias: (parametros.industrias ?? []).map((i) => i.id),
      ubicacionId: parametros.ubicacion?.id,
    });
    if (!perfiles.length) {
      registrar(0);
      // Un resultado vacío tiene varias causas que en pantalla se ven iguales.
      // En vez de "no se encontró nada", se dice QUÉ se buscó y qué aflojar: la
      // causa más común es sumar cargos, porque se agregan a la palabra clave y
      // estrechan la búsqueda (ej. "ecommerce" trae gente; "ecommerce Dueño de
      // tienda" no trae a nadie).
      const aplicados = [
        `palabra clave "${parametros.keyword}"`,
        parametros.titles.length && `${parametros.titles.length} cargo(s)`,
        parametros.industrias?.length &&
          `industria ${parametros.industrias.map((i) => i.title).join(", ")}`,
        ubicacionLog && `ubicación ${ubicacionLog}`,
      ].filter(Boolean);

      const sugerencia = parametros.titles.length
        ? "Probá quitando los cargos: se suman a la palabra clave y son lo que más estrecha la búsqueda."
        : parametros.industrias?.length
          ? "Probá con una industria más amplia, o quitándola y dejando solo la palabra clave."
          : "Probá una palabra clave más general, o una ubicación más amplia.";

      return NextResponse.json({
        leads: [],
        diagnostico: `LinkedIn no devolvió a nadie con ${aplicados.join(" + ")}. ${sugerencia}`,
      });
    }

    // 2. Último post de cada uno (1 por perfil, y si falla seguimos igual)
    const posts = await traerUltimosPosts(
      perfiles.map((p) => p.perfilUrl).filter(Boolean),
    );

    // 3. Análisis IA + mensaje, en paralelo con tope
    const ajustes = obtenerAjustes();
    const ahora = Date.now();
    const leads: Lead[] = [];

    await analizarEnLote(perfiles, 5, async (perfil, i) => {
      const ultimoPost = perfil.perfilUrl
        ? (posts.get(slugDePerfil(perfil.perfilUrl)) ?? null)
        : null;
      try {
        const analisis = await analizarPerfil(perfil, ultimoPost, ajustes);
        leads.push({
          id: `${ahora}-${i}`,
          nombre: perfil.nombre,
          cargo: perfil.cargo,
          empresa: perfil.empresa,
          ubicacion: perfil.ubicacion,
          fotoUrl: perfil.fotoUrl,
          perfilUrl: perfil.perfilUrl,
          headline: perfil.headline,
          // Unipile ya devuelve el id interno de LinkedIn en la búsqueda, así
          // que el motor de contacto no tiene que ir a resolverlo después.
          providerId: perfil.providerId,
          ultimoPost,
          sinPost: !ultimoPost,
          // Cuenta de empresa vs persona: cambia cómo la saluda el mensaje y
          // cómo la trata el setter después.
          esEmpresa: perfil.esEmpresa,
          motivoEmpresa: perfil.motivoEmpresa,
          resumen: analisis.resumen,
          porQueBuenLead: analisis.porQueBuenLead,
          encaje: analisis.encaje,
          porQueEncaje: analisis.porQueEncaje,
          mensaje: analisis.mensaje,
          // Viaja dentro de la solicitud de conexión; `mensaje` sale después,
          // cuando acepta, como continuación de esta nota.
          notaInvitacion: analisis.notaInvitacion,
          estado: "nuevos",
          nota: "",
          creadoEn: ahora + i,
        });
      } catch (e) {
        console.warn(`[search] falló el análisis de ${perfil.nombre}:`, (e as Error).message);
      }
    });

    leads.sort((a, b) => a.creadoEn - b.creadoEn);

    // Calidad antes que cantidad: LinkedIn no deja filtrar por cargo, así que
    // el descarte se hace acá, con el juicio de la IA que ya leyó cada perfil.
    // Una solicitud gastada en alguien que no puede comprar cuesta doble: es
    // una menos del cupo diario y ensucia el embudo.
    const descartados = leads.filter((l) => l.encaje === "bajo");
    const finales = parametros.soloCualificados
      ? leads.filter((l) => l.encaje !== "bajo")
      : leads;

    guardarLeads(finales);
    registrar(finales.length);
    return NextResponse.json({
      leads: finales,
      calidad: {
        alto: leads.filter((l) => l.encaje === "alto").length,
        medio: leads.filter((l) => l.encaje === "medio").length,
        bajo: descartados.length,
        descartados: parametros.soloCualificados ? descartados.length : 0,
        // Para poder explicar en pantalla POR QUÉ se descartó a alguien.
        motivos: descartados.slice(0, 5).map((l) => ({
          nombre: l.nombre,
          porQue: l.porQueEncaje ?? "",
        })),
      },
    });
  } catch (e) {
    if (e instanceof ApifyLimiteError) {
      return NextResponse.json({ error: e.message, limite: true }, { status: 429 });
    }
    console.error("[search]", e);
    return NextResponse.json(
      { error: (e as Error).message || "Falló la búsqueda." },
      { status: 500 },
    );
  }
}
