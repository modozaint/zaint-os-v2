import { NextResponse } from "next/server";
import { actualizarLead, obtenerLead } from "@/lib/store";
import {
  enviarInvitacion,
  identificadorDe,
  resolverProviderId,
  unipileConfigurado,
} from "@/lib/unipile";

export const maxDuration = 60;

/**
 * Contacto REAL de un lead por LinkedIn: resuelve su provider_id, le envía una
 * invitación de conexión y lo marca como contactado. El mensaje de apertura lo
 * envía el /motor/sync cuando el lead ACEPTA (LinkedIn no deja escribir antes).
 */
export async function POST(req: Request) {
  if (!unipileConfigurado()) {
    return NextResponse.json({ ok: false, motivo: "unipile-no-configurado" }, { status: 400 });
  }
  const { leadId } = (await req.json().catch(() => ({}))) as { leadId?: string };
  const lead = leadId ? obtenerLead(leadId) : undefined;
  if (!lead) return NextResponse.json({ ok: false, motivo: "lead-no-encontrado" }, { status: 404 });
  if (!lead.perfilUrl?.trim()) {
    return NextResponse.json({ ok: false, motivo: "lead-sin-perfil" }, { status: 400 });
  }

  try {
    const providerId = await resolverProviderId(identificadorDe(lead.perfilUrl));
    // Invitación de conexión. Si ya son conexión / ya invitado, Unipile la rechaza:
    // no es fatal, igual guardamos el providerId y el sync abrirá el chat.
    try {
      await enviarInvitacion(providerId);
    } catch {
      /* ya conectados o ya invitado */
    }
    const act = actualizarLead(lead.id, {
      estado: "contactados",
      providerId,
      contactadoEn: Date.now(),
    });
    return NextResponse.json({ ok: true, lead: act });
  } catch (e) {
    return NextResponse.json(
      { ok: false, motivo: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
