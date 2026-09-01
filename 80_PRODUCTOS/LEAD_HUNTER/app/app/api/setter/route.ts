import { NextResponse } from "next/server";
import {
  actualizarLead,
  ajustesDeLead,
  obtenerCadencia,
  obtenerLead,
} from "@/lib/store";
import { responderComoSetter } from "@/lib/setter";
import { camposEscalado } from "@/lib/escalado";
import { calcomConfigurado, disponibilidad } from "@/lib/calcom";
import type { EstadoLead, MensajeChat } from "@/lib/types";

/**
 * El setter de IA responde a un mensaje (simulado) del lead.
 * Body: { leadId: string, mensajeLead: string }
 *
 * Flujo:
 *  1. Si el hilo está vacío, lo sembramos con el primer mensaje ya enviado.
 *  2. Agregamos el mensaje del lead.
 *  3. Claude responde como setter (con todo el contexto del perfil + oferta).
 *  4. Guardamos su respuesta y movemos el kanban:
 *     - agendó  → "reunion"
 *     - si no   → "respondieron"
 */
export async function POST(req: Request) {
  let body: { leadId?: string; mensajeLead?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { leadId, mensajeLead } = body;
  if (!leadId || !mensajeLead?.trim()) {
    return NextResponse.json(
      { error: "Faltan leadId o mensajeLead." },
      { status: 400 },
    );
  }

  const lead = obtenerLead(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }

  const ahora = Date.now();
  const hilo: MensajeChat[] = [...(lead.conversacion ?? [])];

  // 1. Sembrar con el primer mensaje si el hilo está vacío.
  if (hilo.length === 0 && lead.mensaje) {
    hilo.push({ de: "setter", texto: lead.mensaje, cuando: lead.contactadoEn ?? ahora });
  }

  // 2. Mensaje del lead.
  hilo.push({ de: "lead", texto: mensajeLead.trim(), cuando: ahora });

  // 3. El setter responde. Con los horarios reales de la agenda a mano, para
  //    que proponga dos días concretos en vez de mandar un link suelto.
  let r;
  try {
    const ajustes = ajustesDeLead(lead);
    const disp = calcomConfigurado()
      ? await disponibilidad().catch(() => undefined)
      : undefined;
    r = await responderComoSetter(lead, ajustes, hilo, disp);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  // 4. Guardar respuesta + mover kanban.
  //    agendó → reunión · descartó → frío · pospuso (interesado, para después)
  //    → futuro (con fecha de re-contacto) · resto → respondieron (activo).
  hilo.push({ de: "setter", texto: r.respuesta, cuando: Date.now() });
  const nuevoEstado: EstadoLead = r.agendo
    ? "reunion"
    : r.descarta
      ? "frio"
      : r.posponer
        ? "futuro"
        : "respondieron";

  const cambios: Parameters<typeof actualizarLead>[1] = {
    conversacion: hilo,
    estado: nuevoEstado,
    // El hilo ya incluye la respuesta recién generada: la regla de escalado se
    // evalúa sobre la conversación completa (ver lib/escalado.ts).
    ...camposEscalado(lead, hilo, r.escala, r.motivo),
  };
  if (r.nota) cambios.notaAgente = r.nota;
  if (r.posponer) {
    const dias = obtenerCadencia().diasReContacto;
    cambios.recontactarEn = Date.now() + dias * 24 * 60 * 60 * 1000;
  }
  const actualizado = actualizarLead(leadId, cambios);

  return NextResponse.json({
    lead: actualizado,
    respuesta: r.respuesta,
    agendo: r.agendo,
    escala: r.escala,
    descarta: r.descarta,
    posponer: r.posponer,
  });
}
