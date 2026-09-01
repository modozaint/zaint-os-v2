import { NextResponse } from "next/server";
import { guardarAjustes, obtenerAjustes } from "@/lib/store";
import type { Ajustes } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    ajustes: obtenerAjustes(),
    /**
     * Modo desarrollador: activa lo que configura el SISTEMA (perfiles de
     * cliente, notas técnicas). En la instalación de un cliente no se define
     * MODO_DEV, y esas pantallas desaparecen: él compró una herramienta de
     * prospección, no un panel de configuración de agencia.
     */
    modoDev: Boolean(process.env.MODO_DEV?.trim()),
  });
}

export async function PATCH(req: Request) {
  const cuerpo = (await req.json()) as Partial<Ajustes>;
  const cambios: Partial<Ajustes> = {};

  if (typeof cuerpo.nombre === "string") cambios.nombre = cuerpo.nombre;
  if (typeof cuerpo.empresa === "string") cambios.empresa = cuerpo.empresa;
  if (cuerpo.idioma === "es" || cuerpo.idioma === "en") cambios.idioma = cuerpo.idioma;
  if (typeof cuerpo.agendaUrl === "string") cambios.agendaUrl = cuerpo.agendaUrl.trim();

  return NextResponse.json({ ajustes: guardarAjustes(cambios) });
}
