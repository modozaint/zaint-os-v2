import { NextResponse } from "next/server";
import {
  actualizarLead,
  ajustesDeLead,
  obtenerCadencia,
  obtenerLead,
} from "@/lib/store";
import { correrConversacionAutonoma, resultadoAEstado } from "@/lib/motor";
import { camposEscalado } from "@/lib/escalado";
import type { Disposicion } from "@/lib/setter";

export const maxDuration = 300;

/**
 * Conversación autónoma suelta (un solo lead, disparada a mano desde el
 * panel). La lógica del bucle vive en lib/motor.ts — el piloto automático
 * (lib/motor + api/motor/tick) llama a la MISMA función sobre un lote.
 * Body: { leadId, maxTurnos?, disposicion? }
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    leadId?: string;
    maxTurnos?: number;
    disposicion?: Disposicion;
  };
  const leadId = body.leadId;
  if (!leadId) {
    return NextResponse.json({ error: "Falta leadId." }, { status: 400 });
  }
  const lead = obtenerLead(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }

  const ajustes = ajustesDeLead(lead);
  let hilo, resultado, nota, motivo;
  try {
    ({ hilo, resultado, nota, motivo } = await correrConversacionAutonoma(lead, ajustes, {
      maxTurnos: body.maxTurnos,
      disposicion: body.disposicion,
    }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const estado = resultadoAEstado(resultado);
  const cambios: Parameters<typeof actualizarLead>[1] = {
    conversacion: hilo,
    estado,
    ...camposEscalado(lead, hilo, resultado === "escala", motivo),
  };
  if (nota) cambios.notaAgente = nota;
  if (resultado === "posponer") {
    const dias = obtenerCadencia().diasReContacto;
    cambios.recontactarEn = Date.now() + dias * 24 * 60 * 60 * 1000;
  }
  const actualizado = actualizarLead(leadId, cambios);

  return NextResponse.json({
    lead: actualizado,
    resultado,
    turnos: Math.floor(hilo.length / 2),
  });
}
