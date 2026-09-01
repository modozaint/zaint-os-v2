import { NextResponse } from "next/server";
import { ajustesActivos, guardarLeads } from "@/lib/store";
import { analizarPerfil } from "@/lib/claude";
import { identificadorDe, traerPerfil, unipileConfigurado } from "@/lib/unipile";
import { pareceEmpresa } from "@/lib/tipo-perfil";
import type { Lead } from "@/lib/types";

export const maxDuration = 60;

/**
 * Añade UN lead a partir de la URL de su perfil de LinkedIn.
 *
 * Para qué sirve: la búsqueda masiva es para llenar el embudo, pero muchas
 * veces aparece un prospecto puntual (te lo pasaron, lo viste en un post) y
 * había que hacer una búsqueda entera para meterlo. Además el perfil lo lee
 * Unipile, que ya está conectado, así que no gasta créditos de Apify.
 *
 * Body: { perfilUrl: string }
 */
export async function POST(req: Request) {
  if (!unipileConfigurado()) {
    return NextResponse.json(
      { ok: false, motivo: "Falta conectar la cuenta de LinkedIn (Unipile)." },
      { status: 400 },
    );
  }

  const { perfilUrl } = (await req.json().catch(() => ({}))) as { perfilUrl?: string };
  if (!perfilUrl?.trim()) {
    return NextResponse.json({ ok: false, motivo: "Falta perfilUrl." }, { status: 400 });
  }

  try {
    const p = await traerPerfil(identificadorDe(perfilUrl));

    // El headline suele venir como "cargo en empresa": se parte para que el
    // analista tenga los dos campos separados, como en la búsqueda masiva.
    const [cargo, empresa] = p.headline.includes(" en ")
      ? [p.headline.split(" en ")[0].trim(), p.headline.split(" en ").slice(1).join(" en ").trim()]
      : [p.headline, ""];

    const ajustes = ajustesActivos();
    const analisis = await analizarPerfil(
      {
        perfilUrl: `https://www.linkedin.com/in/${p.identificador}/`,
        nombre: p.nombre,
        cargo,
        empresa,
        ubicacion: p.ubicacion,
        fotoUrl: p.fotoUrl,
        headline: p.headline,
      },
      null, // sin último post: Unipile no lo trae en esta llamada
      ajustes,
    );

    const lead: Lead = {
      id: `li-manual-${Date.now()}`,
      nombre: p.nombre,
      cargo,
      empresa,
      ubicacion: p.ubicacion,
      fotoUrl: p.fotoUrl,
      perfilUrl: `https://www.linkedin.com/in/${p.identificador}/`,
      headline: p.headline,
      ultimoPost: null,
      sinPost: true,
      resumen: analisis.resumen,
      porQueBuenLead: analisis.porQueBuenLead,
      mensaje: analisis.mensaje,
      // Sin esto la solicitud sale pelada y el mensaje de apertura queda
      // hablando solo: dice "te comentaba que..." refiriéndose a una nota que
      // nunca se envió.
      notaInvitacion: analisis.notaInvitacion,
      esEmpresa: pareceEmpresa(p.nombre, p.headline),
      estado: "nuevos",
      nota: "",
      creadoEn: Date.now(),
      origen: "linkedin_busqueda",
      contacto: "",
      // Ya resuelto: el contacto real no tendrá que volver a buscarlo.
      providerId: p.providerId,
    };

    guardarLeads([lead]);
    return NextResponse.json({ ok: true, lead, yaConectados: p.yaConectados });
  } catch (e) {
    return NextResponse.json(
      { ok: false, motivo: e instanceof Error ? e.message : "error" },
      { status: 502 },
    );
  }
}
