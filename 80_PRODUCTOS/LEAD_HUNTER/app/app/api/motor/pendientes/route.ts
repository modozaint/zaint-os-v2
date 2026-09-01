import { NextResponse } from "next/server";
import { pendientes } from "@/lib/motor-pasos";
import { unipileConfigurado } from "@/lib/unipile";

/**
 * PASO 1 — ¿a quién le toca?
 *
 * Solo lee: devuelve los leads que están listos para que el agente actúe, y
 * por qué (aceptó la invitación / respondió). No toca nada, así que se puede
 * llamar las veces que sea.
 */
export async function POST() {
  if (!unipileConfigurado()) {
    return NextResponse.json({ ok: false, motivo: "unipile-no-configurado", pendientes: [] });
  }
  const lista = pendientes();
  return NextResponse.json({ ok: true, cuantos: lista.length, pendientes: lista });
}

export const GET = POST;
