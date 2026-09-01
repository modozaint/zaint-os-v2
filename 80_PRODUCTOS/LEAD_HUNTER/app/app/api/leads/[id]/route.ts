import { NextResponse } from "next/server";
import { actualizarLead, eliminarLead } from "@/lib/store";
import { ESTADOS, type EstadoLead } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cuerpo = (await req.json()) as {
    estado?: string;
    nota?: string;
    mensaje?: string;
    reiniciarConversacion?: boolean;
  };

  const cambios: {
    estado?: EstadoLead;
    nota?: string;
    mensaje?: string;
    chatId?: string;
    conversacion?: never[];
  } = {};

  if (cuerpo.estado !== undefined) {
    if (!ESTADOS.some((e) => e.id === cuerpo.estado)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    cambios.estado = cuerpo.estado as EstadoLead;
  }
  if (cuerpo.nota !== undefined) cambios.nota = String(cuerpo.nota);
  // Revisar y ajustar el pitch de apertura antes de que salga es parte del
  // freno de mano: el analista propone, pero el mensaje real lo aprueba uno.
  if (cuerpo.mensaje !== undefined) cambios.mensaje = String(cuerpo.mensaje);
  // Borra el hilo del lado de la app para poder redisparar la apertura (Fase A)
  // en una corrida de prueba. No toca LinkedIn: el hilo real hay que limpiarlo
  // aparte si se quiere grabar desde cero.
  if (cuerpo.reiniciarConversacion === true) {
    cambios.chatId = undefined;
    cambios.conversacion = [];
  }

  const lead = actualizarLead(id, cambios);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ lead });
}

/** Elimina un lead del tablero. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = eliminarLead(id);
  if (!ok) {
    return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
