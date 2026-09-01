import { NextResponse } from "next/server";
import { actualizarLead, obtenerLead } from "@/lib/store";
import { enviarEnChat, enviarMensajeNuevo, unipileConfigurado } from "@/lib/unipile";
import type { MensajeChat } from "@/lib/types";

export const maxDuration = 60;

/**
 * RESPONDER A MANO, desde la app, y que salga por LinkedIn.
 *
 * Por qué existe: el agente sabe cuándo NO sabe — cuando se traba, marca el
 * lead como escalado y deja escrito qué necesita. Hasta hoy eso terminaba en
 * una alerta y nada más: no había forma de contestarle a esa persona sin
 * abrir LinkedIn aparte y perder el hilo.
 *
 * Con esto el ciclo se cierra: el agente pide ayuda, un humano entra y
 * responde desde el mismo lugar donde ve la conversación.
 *
 * Al enviar se levanta el escalado: si alguien ya contestó, el lead deja de
 * estar en la cola de "necesita una persona".
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lead = obtenerLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }
  if (!unipileConfigurado()) {
    return NextResponse.json(
      { error: "Falta conectar la cuenta de LinkedIn." },
      { status: 400 },
    );
  }

  const { texto } = (await req.json().catch(() => ({}))) as { texto?: string };
  const mensaje = (texto ?? "").trim();
  if (!mensaje) {
    return NextResponse.json({ error: "Escribí algo para enviar." }, { status: 400 });
  }

  // A propósito NO se valida con el filtro de calidad: eso vigila lo que
  // escribe el modelo. Si una persona decide mandar "dale", es su decisión.

  try {
    let chatId = lead.chatId;
    if (chatId) {
      await enviarEnChat(chatId, mensaje);
    } else if (lead.providerId) {
      // Todavía sin hilo: se abre uno. Solo funciona si ya son conexión.
      chatId = await enviarMensajeNuevo(lead.providerId, mensaje);
    } else {
      return NextResponse.json(
        { error: "Este lead todavía no tiene conexión de LinkedIn." },
        { status: 400 },
      );
    }

    const conversacion: MensajeChat[] = [
      ...(lead.conversacion ?? []),
      { de: "setter", texto: mensaje, cuando: Date.now() },
    ];

    const actualizado = actualizarLead(id, {
      conversacion,
      ...(chatId && chatId !== lead.chatId ? { chatId } : {}),
      // Ya intervino una persona: el lead sale de la cola de escalados.
      escalado: false,
      escaladoEn: null,
      motivoEscalado: "",
    });

    return NextResponse.json({ ok: true, lead: actualizado });
  } catch (e) {
    console.error("[responder]", e);
    return NextResponse.json(
      { error: (e as Error).message || "LinkedIn rechazó el envío." },
      { status: 502 },
    );
  }
}
