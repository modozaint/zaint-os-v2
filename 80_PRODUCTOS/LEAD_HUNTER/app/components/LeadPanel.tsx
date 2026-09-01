"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AtSign,
  Bot,
  CalendarCheck,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareQuote,
  PhoneCall,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { ESTADOS, type EstadoLead, type Lead, type MensajeChat } from "@/lib/types";
import { accionesDeContacto, type TipoAccion } from "@/lib/contacto";
import { Avatar } from "./Avatar";

export function LeadPanel({
  lead,
  agendaUrl,
  onCerrar,
  onCambiarEstado,
  onCambiarNota,
  onMensajeRegenerado,
  onActualizarLead,
  onEliminar,
  onToast,
}: {
  lead: Lead | null;
  agendaUrl: string;
  onCerrar: () => void;
  onCambiarEstado: (id: string, estado: EstadoLead) => void;
  onCambiarNota: (id: string, nota: string) => void;
  onMensajeRegenerado: (id: string, mensaje: string) => void;
  onActualizarLead: (lead: Lead) => void;
  onEliminar: (id: string) => void;
  onToast: (texto: string) => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [nota, setNota] = useState("");
  const [regenerando, setRegenerando] = useState(false);
  const [respLead, setRespLead] = useState("");
  const [enviandoSetter, setEnviandoSetter] = useState(false);
  const [corriendoAuto, setCorriendoAuto] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [contactando, setContactando] = useState(false);

  useEffect(() => {
    if (lead) {
      setMensaje(lead.mensaje);
      setNota(lead.nota);
      setRespLead("");
      setConfirmarEliminar(false);
    }
  }, [lead]);

  async function enviarAlSetter() {
    if (!lead || !respLead.trim()) return;
    setEnviandoSetter(true);
    try {
      const res = await fetch("/api/setter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, mensajeLead: respLead.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló el setter.");
      onActualizarLead(data.lead);
      setRespLead("");
      if (data.agendo) onToast("Reunión agendada por el setter");
      else if (data.escala) onToast("El setter escaló a un humano");
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setEnviandoSetter(false);
    }
  }

  async function correrAuto() {
    if (!lead) return;
    setCorriendoAuto(true);
    try {
      const res = await fetch("/api/setter/auto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló la simulación.");
      onActualizarLead(data.lead);
      const msg =
        data.resultado === "agendo"
          ? "El setter agendó la reunión solo"
          : data.resultado === "posponer"
            ? "Interesado: quedó para re-contactar"
            : data.resultado === "descarta"
              ? "El lead declinó (frío)"
              : data.resultado === "escala"
                ? "El setter escaló a un humano"
                : "Conversación avanzada (sin cierre aún)";
      onToast(msg);
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setCorriendoAuto(false);
    }
  }

  // Cerrar con Escape
  useEffect(() => {
    if (!lead) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lead, onCerrar]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
    } catch {
      // Fallback para contextos sin permiso de portapapeles
      const ta = document.createElement("textarea");
      ta.value = mensaje;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    onToast("Copiado");
  }

  async function contactarReal() {
    if (!lead) return;
    setContactando(true);
    try {
      const res = await fetch("/api/contactar/real", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.motivo ?? "No se pudo contactar.");
      if (data.lead) onActualizarLead(data.lead);
      onToast("Invitación enviada. Cuando acepte, el setter arranca solo.");
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setContactando(false);
    }
  }

  async function regenerar() {
    if (!lead) return;
    setRegenerando(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/regenerar`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló");
      setMensaje(data.mensaje);
      onMensajeRegenerado(lead.id, data.mensaje);
      onToast("Mensaje regenerado");
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setRegenerando(false);
    }
  }

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
            className="fixed inset-0 z-40 bg-black/25"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${lead.nombre}`}
            className="scroll-fino fixed right-0 top-0 z-50 h-full w-full max-w-[460px] overflow-y-auto bg-li-surface shadow-2xl"
          >
            {/* Cabecera */}
            <header className="sticky top-0 z-10 border-b border-li-border bg-li-surface px-6 pb-5 pt-5">
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="absolute right-4 top-4 rounded-full p-1.5 text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
              >
                <X size={19} />
              </button>

              <div className="flex gap-4 pr-8">
                <Avatar nombre={lead.nombre} fotoUrl={lead.fotoUrl} size={60} />
                <div className="min-w-0">
                  <h2 className="text-[19px] font-semibold leading-tight">
                    {lead.nombre}
                  </h2>
                  <p className="mt-1 text-[14px] leading-snug text-li-text-2">
                    {[lead.cargo, lead.empresa].filter(Boolean).join(" · ") ||
                      lead.headline}
                  </p>
                  {lead.ubicacion && (
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-li-text-2">
                      <MapPin size={12} />
                      {lead.ubicacion}
                    </p>
                  )}
                </div>
              </div>

              {/* Por dónde se contacta ESTE lead: lo decide su origen, no una
                  plantilla fija. Un negocio de Maps se contacta por WhatsApp;
                  uno de Instagram, por DM. */}
              {(() => {
                const acciones = accionesDeContacto(lead, lead.mensaje);
                if (!acciones.length) return null;
                const ICONO: Record<TipoAccion, typeof ExternalLink> = {
                  linkedin: ExternalLink,
                  whatsapp: MessageCircle,
                  llamada: PhoneCall,
                  instagram: AtSign,
                  email: Mail,
                  web: Globe,
                  maps: MapPin,
                };
                return (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {acciones.map((a) => {
                      const Icono = ICONO[a.tipo];
                      const esWa = a.tipo === "whatsapp";
                      return (
                        <a
                          key={a.tipo + a.url}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors ${
                            a.principal
                              ? esWa
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "bg-li-blue text-white hover:bg-li-blue-dark"
                              : "border border-li-border text-li-text-2 hover:border-li-blue hover:text-li-blue"
                          }`}
                        >
                          <Icono size={14} />
                          {a.etiqueta}
                        </a>
                      );
                    })}
                  </div>
                );
              })()}
            </header>

            <div className="space-y-6 px-6 py-6">
              {/* Análisis IA */}
              <section className="rounded-lg bg-li-blue/[0.06] p-4">
                <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-li-blue">
                  <Sparkles size={14} />
                  Análisis IA
                </h3>
                {lead.resumen && (
                  <p className="mt-2.5 text-[14px] leading-relaxed">
                    {lead.resumen}
                  </p>
                )}
                {lead.porQueBuenLead && (
                  <p className="mt-2.5 border-l-2 border-li-blue pl-3 text-[14px] leading-relaxed text-li-text-2">
                    {lead.porQueBuenLead}
                  </p>
                )}
              </section>

              {/* Notas automáticas del agente IA */}
              {lead.notaAgente && (
                <section className="rounded-lg border border-li-border bg-black/[0.02] p-4">
                  <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                    <Bot size={14} /> Notas del agente
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-li-text">
                    {lead.notaAgente}
                  </p>
                </section>
              )}

              {/* Último post */}
              {lead.ultimoPost && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                    <MessageSquareQuote size={14} />
                    Su último post
                  </h3>
                  <blockquote className="mt-2 rounded-lg border border-li-border bg-black/[0.02] p-3.5 text-[13.5px] leading-relaxed text-li-text-2">
                    {lead.ultimoPost.length > 420
                      ? `${lead.ultimoPost.slice(0, 420)}…`
                      : lead.ultimoPost}
                  </blockquote>
                </section>
              )}

              {/* Los dos textos del primer contacto, en el orden en que los
                  recibe la persona: primero la nota que viaja DENTRO de la
                  solicitud —lo único que ve antes de aceptar— y después el
                  mensaje que sale cuando acepta. Estaban los dos guardados,
                  pero acá solo se mostraba el segundo. */}
              {lead.notaInvitacion?.trim() && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                    <Send size={13} />
                    1 · Nota dentro de la solicitud
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border-l-2 border-li-blue bg-li-blue/[0.05] p-3.5 text-[14px] leading-relaxed">
                    {lead.notaInvitacion}
                  </p>
                  <p className="mt-1.5 text-[12px] text-li-text-2">
                    Es lo único que ve antes de aceptar · {lead.notaInvitacion.length}/280 caracteres
                  </p>
                </section>
              )}

              {/* Mensaje */}
              <section>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                  {lead.notaInvitacion?.trim() ? "2 · Mensaje cuando acepta" : "Mensaje generado"}
                </h3>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={9}
                  className="mt-2 w-full resize-y rounded-lg border border-li-border bg-li-surface p-3.5 text-[14px] leading-relaxed outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
                />
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    onClick={copiar}
                    className="inline-flex items-center gap-1.5 rounded-full bg-li-blue px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
                  >
                    <Copy size={15} />
                    Copiar mensaje
                  </button>
                  {lead.perfilUrl && (
                    <a
                      href={lead.perfilUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-li-border px-4 py-2 text-[14px] font-semibold text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
                    >
                      <ExternalLink size={15} />
                      Abrir LinkedIn
                    </a>
                  )}
                  <button
                    onClick={regenerar}
                    disabled={regenerando}
                    className="inline-flex items-center gap-1.5 rounded-full border border-li-border px-4 py-2 text-[14px] font-semibold text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue disabled:opacity-50"
                  >
                    {regenerando ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    Regenerar
                  </button>
                </div>

                {/* Contacto REAL por LinkedIn (Capa 2) */}
                <div className="mt-3 border-t border-li-border pt-3">
                  {lead.chatId ? (
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-700">
                      <Bot size={14} /> Conversación automática activa por LinkedIn.
                    </p>
                  ) : lead.providerId ? (
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-li-text-2">
                      <Loader2 size={14} className="animate-spin" />
                      Invitación enviada. Cuando acepte, el setter escribe solo.
                    </p>
                  ) : (
                    <button
                      onClick={contactarReal}
                      disabled={contactando}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {contactando ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      Conectar por LinkedIn (real)
                    </button>
                  )}
                </div>
              </section>

              {/* Conversación con el setter de IA (simulación) */}
              <ConversacionSetter
                lead={lead}
                agendaUrl={agendaUrl}
                respLead={respLead}
                setRespLead={setRespLead}
                enviando={enviandoSetter}
                onEnviar={enviarAlSetter}
                onAuto={correrAuto}
                corriendoAuto={corriendoAuto}
              />

              {/* Estado + nota */}
              <section className="grid gap-4">
                <div>
                  <label
                    htmlFor="estado"
                    className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2"
                  >
                    Estado
                  </label>
                  <select
                    id="estado"
                    value={lead.estado}
                    onChange={(e) =>
                      onCambiarEstado(lead.id, e.target.value as EstadoLead)
                    }
                    className="mt-2 w-full rounded-md border border-li-border bg-li-surface px-3 py-2.5 text-[14px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="nota"
                    className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2"
                  >
                    Nota
                  </label>
                  <textarea
                    id="nota"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    onBlur={() => onCambiarNota(lead.id, nota)}
                    rows={3}
                    placeholder="Lo que quieras recordar de este lead"
                    className="mt-2 w-full resize-y rounded-md border border-li-border bg-li-surface p-3 text-[14px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
                  />
                </div>
              </section>

              {/* Eliminar lead (confirmación en dos pasos) */}
              <section className="border-t border-li-border pt-4">
                {confirmarEliminar ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-li-text-2">¿Eliminar este lead?</span>
                    <button
                      onClick={() => onEliminar(lead.id)}
                      className="rounded-full bg-red-600 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(false)}
                      className="rounded-full border border-li-border px-4 py-1.5 text-[13px] font-medium text-li-text-2 transition-colors hover:border-li-text-2"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmarEliminar(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-li-border px-4 py-2 text-[13.5px] font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Eliminar lead
                  </button>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** El playground del setter: se ve el hilo y vos hacés de prospecto. */
function ConversacionSetter({
  lead,
  agendaUrl,
  respLead,
  setRespLead,
  enviando,
  onEnviar,
  onAuto,
  corriendoAuto,
}: {
  lead: Lead;
  agendaUrl: string;
  respLead: string;
  setRespLead: (v: string) => void;
  enviando: boolean;
  onEnviar: () => void;
  onAuto: () => void;
  corriendoAuto: boolean;
}) {
  // Si aún no hay hilo, mostramos el primer mensaje ya enviado como apertura.
  const hilo: MensajeChat[] =
    lead.conversacion && lead.conversacion.length
      ? lead.conversacion
      : lead.mensaje
        ? [{ de: "setter", texto: lead.mensaje, cuando: lead.contactadoEn ?? lead.creadoEn }]
        : [];

  const agendada = lead.estado === "reunion";

  return (
    <section>
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-li-blue">
        <Bot size={14} />
        Setter IA · conversación
      </h3>
      <p className="mt-1 text-[12px] text-li-text-2">
        Modo simulación. Escribí como el lead y mirá cómo el setter lo lleva, o dejá que
        el setter converse solo con un lead simulado hasta cerrar.
      </p>

      {lead.escalado && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12.5px] text-red-900">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>Escalado · urgente.</strong> El agente ya conversó con esta persona
            y no pudo responderle.
            {lead.motivoEscalado?.trim() && (
              <span className="mt-0.5 block">{lead.motivoEscalado}</span>
            )}
          </span>
        </div>
      )}

      {lead.estado === "futuro" && lead.recontactarEn && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-[12.5px] text-violet-900">
          <CalendarCheck size={14} className="shrink-0" />
          Prospecto a futuro. Contactar de nuevo el{" "}
          <strong>
            {new Date(lead.recontactarEn).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
          .
        </div>
      )}

      <div className="mt-3 space-y-2 rounded-lg border border-li-border bg-black/[0.02] p-3">
        {hilo.length === 0 && (
          <p className="py-4 text-center text-[13px] text-li-text-2">
            Todavía no hay mensajes.
          </p>
        )}
        {hilo.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.de === "setter" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed ${
                m.de === "setter"
                  ? "rounded-br-sm bg-li-blue text-white"
                  : "rounded-bl-sm border border-li-border bg-li-surface text-li-text"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}

        {agendada && (
          <div className="flex justify-center pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              <CalendarCheck size={13} /> Reunión agendada (automático)
            </span>
          </div>
        )}
      </div>

      {/* Conversación autónoma: el setter cierra solo (demo) */}
      {!agendada && lead.estado !== "frio" && (
        <button
          onClick={onAuto}
          disabled={corriendoAuto}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-li-blue/40 bg-li-blue/5 px-4 py-2.5 text-[13.5px] font-semibold text-li-blue transition-colors hover:bg-li-blue/10 disabled:opacity-60"
        >
          {corriendoAuto ? (
            <>
              <Loader2 size={15} className="animate-spin" /> El setter está conversando…
            </>
          ) : (
            <>
              <Bot size={15} /> Simular conversación completa (auto)
            </>
          )}
        </button>
      )}

      {agendada && agendaUrl && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-[12.5px] text-emerald-900">
          <a
            href={agendaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 underline"
          >
            <ExternalLink size={13} /> Abrir agenda (Cal.com)
          </a>
          <p className="mt-1.5 text-emerald-800/80">
            Cal.com envía la confirmación y el recordatorio antes de la llamada
            automáticamente.
          </p>
        </div>
      )}

      {!agendada && (
        <div className="mt-2.5 flex gap-2">
          <input
            value={respLead}
            onChange={(e) => setRespLead(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onEnviar();
              }
            }}
            disabled={enviando}
            placeholder="Respondé como si fueras el lead…"
            className="flex-1 rounded-full border border-li-border bg-li-surface px-4 py-2 text-[14px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue disabled:opacity-60"
          />
          <button
            onClick={onEnviar}
            disabled={enviando || !respLead.trim()}
            aria-label="Enviar"
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-li-blue text-white transition-colors hover:bg-li-blue-dark disabled:opacity-40"
          >
            {enviando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      )}
    </section>
  );
}
