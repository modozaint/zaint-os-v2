"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Building2,
  CalendarCheck,
  Check,
  CheckCheck,
  ExternalLink,
  Info,
  Lightbulb,
  Mail,
  MapPin,
  Search,
  Send,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MarcaVideo } from "@/components/MarcaVideo";
import type { Lead, MensajeChat } from "@/lib/types";

/**
 * CONVERSACIONES — el hilo de cada lead, y la posibilidad de meter mano.
 *
 * Por qué existe: el agente sabe cuándo NO sabe. Cuando se traba marca el lead
 * como escalado y deja escrito qué necesita. Hasta ahora eso moría en una
 * alerta: para contestarle a esa persona había que abrir LinkedIn aparte y
 * buscar el hilo a mano, perdiendo todo el contexto que el sistema ya tenía.
 *
 * Acá se ve la conversación completa —incluida la nota que viajó dentro de la
 * solicitud, que en LinkedIn no se puede releer— y se responde desde el mismo
 * lugar. Lo que se escribe sale por LinkedIn de verdad.
 *
 * El panel derecho es lo que ninguna bandeja de LinkedIn tiene: mientras leés
 * el hilo, al lado está por qué la IA eligió a esta persona y qué tan buen
 * cliente la juzgó. Contestar sin cambiar de pantalla es todo el punto.
 */
export function ChatsView({
  leads,
  onRefrescar,
  onToast,
}: {
  leads: Lead[];
  onRefrescar: () => void;
  onToast: (t: string) => void;
}) {
  const [q, setQ] = useState("");
  const [activoId, setActivoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verPerfil, setVerPerfil] = useState(true);
  const finDelHilo = useRef<HTMLDivElement>(null);

  // Solo los que tienen algo que leer: hilo abierto o al menos una solicitud
  // enviada con su nota. El resto todavía no es una conversación.
  const conversaciones = useMemo(() => {
    const filtro = q.trim().toLowerCase();
    return leads
      .filter((l) => (l.conversacion?.length ?? 0) > 0 || l.contactadoEn)
      .filter(
        (l) =>
          !filtro ||
          [l.nombre, l.empresa, l.headline].join(" ").toLowerCase().includes(filtro),
      )
      .sort((a, b) => {
        // Primero quien necesita a una persona; después, lo más reciente.
        if (Boolean(b.escalado) !== Boolean(a.escalado)) return a.escalado ? -1 : 1;
        return ultimoMomento(b) - ultimoMomento(a);
      });
  }, [leads, q]);

  const activo = conversaciones.find((l) => l.id === activoId) ?? conversaciones[0] ?? null;

  useEffect(() => {
    finDelHilo.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activo?.id, activo?.conversacion?.length]);

  async function enviar() {
    const cuerpo = texto.trim();
    if (!cuerpo || !activo) return;
    setEnviando(true);
    try {
      const r = await fetch(`/api/leads/${activo.id}/responder`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: cuerpo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        onToast(d.error ?? "No se pudo enviar por LinkedIn");
        return;
      }
      setTexto("");
      onToast("Enviado por LinkedIn");
      onRefrescar();
    } finally {
      setEnviando(false);
    }
  }

  const escalados = conversaciones.filter((l) => l.escalado).length;

  return (
    <div className="mx-auto w-full max-w-[78rem] px-5 py-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-[25px] font-semibold tracking-tight">
          Conversaciones
          <MarcaVideo escena={3} />
        </h1>
        <p className="mt-0.5 text-[14px] text-li-text-2">
          {escalados > 0 ? (
            <>
              <strong className="text-red-600">{escalados}</strong>{" "}
              {escalados === 1 ? "espera" : "esperan"} que una persona responda. Lo que
              escribas acá sale por LinkedIn.
            </>
          ) : (
            <>Todo lo que el agente viene conversando. Lo que escribas acá sale por LinkedIn.</>
          )}
        </p>
      </header>

      <div
        className={`card-li grid h-[min(78vh,44rem)] grid-cols-1 overflow-hidden rounded-xl bg-li-surface ${
          verPerfil && activo
            ? "md:grid-cols-[18rem_1fr_19rem]"
            : "md:grid-cols-[18rem_1fr]"
        }`}
      >
        {/* ── Lista de conversaciones ───────────────────────────────── */}
        <aside className="flex min-h-0 flex-col border-b border-li-border md:border-b-0 md:border-r">
          <div className="shrink-0 border-b border-li-border p-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-li-text-2"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar persona o empresa"
                className="h-9 w-full rounded-full border border-li-border bg-black/[0.03] pl-8 pr-3 text-[13px] outline-none focus:border-li-blue"
              />
            </div>
          </div>

          <ul className="scroll-fino min-h-0 flex-1 overflow-y-auto">
            {conversaciones.length === 0 && (
              <li className="px-4 py-8 text-center text-[13px] text-li-text-2">
                Todavía no hay conversaciones. Aparecen cuando sale la primera solicitud.
              </li>
            )}
            {conversaciones.map((l) => {
              const on = activo?.id === l.id;
              const ultimo = (l.conversacion ?? []).slice(-1)[0];
              const suyo = ultimo?.de === "lead";
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setActivoId(l.id)}
                    className={`flex w-full items-center gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors ${
                      on
                        ? "border-li-blue bg-li-blue/[0.07]"
                        : "border-transparent hover:bg-black/[0.03]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar nombre={l.nombre} fotoUrl={l.fotoUrl} size={40} />
                      {l.estado === "reunion" && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-li-surface">
                          <CalendarCheck size={9} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13.5px] font-semibold">
                          {l.nombre}
                        </span>
                        {l.escalado && (
                          <TriangleAlert size={12} className="shrink-0 text-red-600" />
                        )}
                        <span className="ml-auto shrink-0 text-[10.5px] tabular-nums text-li-text-2">
                          {momentoCorto(ultimoMomento(l))}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-li-text-2">
                        {ultimo && !suyo && (
                          <CheckCheck size={12} className="shrink-0 text-li-blue" />
                        )}
                        <span className="truncate">
                          {ultimo ? ultimo.texto : "Solicitud enviada, sin respuesta aún"}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Hilo ──────────────────────────────────────────────────── */}
        <section className="flex min-h-0 flex-col">
          {!activo ? (
            <div className="grid flex-1 place-items-center p-8 text-[13.5px] text-li-text-2">
              Elegí una conversación
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-2.5 border-b border-li-border px-4 py-2.5">
                <Avatar nombre={activo.nombre} fotoUrl={activo.fotoUrl} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold">{activo.nombre}</p>
                  <p className="truncate text-[12px] text-li-text-2">
                    {activo.headline || activo.empresa || "—"}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <EtiquetaEstado estado={activo.estado} />
                  <button
                    onClick={() => setVerPerfil((v) => !v)}
                    title={verPerfil ? "Ocultar el perfil" : "Ver el perfil"}
                    className={`rounded-full p-1.5 transition-colors ${
                      verPerfil
                        ? "bg-li-blue/10 text-li-blue"
                        : "text-li-text-2 hover:bg-black/[0.06]"
                    }`}
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {activo.escalado && (
                <div className="flex shrink-0 items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-900">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>El agente pidió ayuda.</strong>{" "}
                    {activo.motivoEscalado || "No supo cómo seguir."}
                  </span>
                </div>
              )}

              {/* Fondo tipo mensajería: el hilo respira mejor sobre una trama. */}
              <div
                className="scroll-fino min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4"
                style={{
                  backgroundImage:
                    "radial-gradient(currentColor 0.5px, transparent 0.5px)",
                  backgroundSize: "18px 18px",
                  color: "rgba(127,127,127,0.13)",
                }}
              >
                {activo.notaInvitacion?.trim() && (
                  <Burbuja
                    de="setter"
                    etiqueta="Nota dentro de la solicitud"
                    texto={activo.notaInvitacion}
                  />
                )}
                {(activo.conversacion ?? []).map((m, i) => (
                  <Burbuja key={i} de={m.de} texto={m.texto} cuando={m.cuando} />
                ))}
                {!(activo.conversacion ?? []).length && !activo.notaInvitacion && (
                  <p className="py-6 text-center text-[13px] text-li-text-2">
                    Solicitud enviada. Cuando acepte, la conversación arranca sola.
                  </p>
                )}
                <div ref={finDelHilo} />
              </div>

              <div className="shrink-0 border-t border-li-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviar();
                      }
                    }}
                    rows={1}
                    placeholder={
                      activo.chatId
                        ? "Escribí tu respuesta… (Enter para enviar)"
                        : "Todavía no aceptó la solicitud: no se puede escribir aún"
                    }
                    disabled={!activo.chatId || enviando}
                    className="min-h-[2.75rem] flex-1 resize-y rounded-2xl border border-li-border bg-black/[0.03] px-4 py-2.5 text-[13.5px] outline-none focus:border-li-blue disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={enviar}
                    disabled={!texto.trim() || !activo.chatId || enviando}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-li-blue text-white transition-colors hover:bg-li-blue-dark disabled:opacity-40"
                    title="Enviar por LinkedIn"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-li-text-2">
                  Sale por LinkedIn desde tu cuenta. Al responder, el lead deja de estar
                  en la cola de escalados.
                </p>
              </div>
            </>
          )}
        </section>

        {/* ── Perfil: lo que la IA sabe de esta persona ─────────────── */}
        {verPerfil && activo && (
          <aside className="scroll-fino hidden min-h-0 overflow-y-auto border-l border-li-border bg-black/[0.015] md:block">
            <div className="flex items-start justify-between p-4 pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
                El perfil
              </span>
              <button
                onClick={() => setVerPerfil(false)}
                className="rounded p-0.5 text-li-text-2 hover:text-li-text"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col items-center px-4 pb-4 text-center">
              <Avatar nombre={activo.nombre} fotoUrl={activo.fotoUrl} size={72} />
              <p className="mt-2 text-[15px] font-semibold leading-tight">
                {activo.nombre}
              </p>
              {activo.headline && (
                <p className="mt-1 text-[12px] leading-snug text-li-text-2">
                  {activo.headline}
                </p>
              )}
              {activo.perfilUrl && (
                <a
                  href={activo.perfilUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-li-border px-3 py-1.5 text-[12px] font-medium text-li-blue transition-colors hover:border-li-blue"
                >
                  <ExternalLink size={12} /> Ver en LinkedIn
                </a>
              )}
            </div>

            <div className="space-y-1 border-t border-li-border px-4 py-3 text-[12.5px]">
              {activo.empresa && (
                <Dato Icono={Building2} texto={activo.empresa} />
              )}
              {activo.cargo && <Dato Icono={Target} texto={activo.cargo} />}
              {activo.ubicacion && <Dato Icono={MapPin} texto={activo.ubicacion} />}
              {activo.contacto && <Dato Icono={Mail} texto={activo.contacto} />}
            </div>

            {/* El juicio de la IA: por qué esta persona y no otra. */}
            {activo.encaje && (
              <div className="border-t border-li-border px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
                  Encaje con la oferta
                </span>
                <div className="mt-1.5">
                  <BadgeEncaje encaje={activo.encaje} />
                </div>
                {activo.porQueEncaje && (
                  <p className="mt-2 text-[12px] leading-relaxed text-li-text-2">
                    {activo.porQueEncaje}
                  </p>
                )}
              </div>
            )}

            {activo.resumen && (
              <Bloque titulo="Quién es" Icono={Info} texto={activo.resumen} />
            )}
            {activo.porQueBuenLead && (
              <Bloque
                titulo="Por qué se lo eligió"
                Icono={Lightbulb}
                texto={activo.porQueBuenLead}
              />
            )}

            {activo.citaUid && (
              <div className="m-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-900">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CalendarCheck size={13} /> Reunión agendada
                </span>
                <p className="mt-0.5 text-[11.5px] leading-snug">
                  La creó el agente en el calendario, sin intervención.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

/* ── Piezas ──────────────────────────────────────────────────────── */

function Dato({ Icono, texto }: { Icono: typeof Info; texto: string }) {
  return (
    <p className="flex items-start gap-2 py-0.5 text-li-text-2">
      <Icono size={13} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words text-li-text">{texto}</span>
    </p>
  );
}

function Bloque({
  titulo,
  Icono,
  texto,
}: {
  titulo: string;
  Icono: typeof Info;
  texto: string;
}) {
  return (
    <div className="border-t border-li-border px-4 py-3">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
        <Icono size={11} /> {titulo}
      </span>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-li-text-2">{texto}</p>
    </div>
  );
}

function BadgeEncaje({ encaje }: { encaje: "alto" | "medio" | "bajo" }) {
  const estilo = {
    alto: "bg-emerald-100 text-emerald-800 border-emerald-300",
    medio: "bg-amber-100 text-amber-800 border-amber-300",
    bajo: "bg-black/[0.05] text-li-text-2 border-li-border",
  }[encaje];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide ${estilo}`}
    >
      <Target size={11} /> {encaje}
    </span>
  );
}

function EtiquetaEstado({ estado }: { estado: string }) {
  const estilo =
    estado === "reunion"
      ? "bg-emerald-100 text-emerald-700"
      : estado === "frio"
        ? "bg-black/[0.06] text-li-text-2"
        : "bg-li-blue/10 text-li-blue";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${estilo}`}
    >
      {estado}
    </span>
  );
}

function Burbuja({
  de,
  texto,
  cuando,
  etiqueta,
}: {
  de: MensajeChat["de"];
  texto: string;
  cuando?: number;
  etiqueta?: string;
}) {
  const nuestro = de === "setter";
  return (
    <div className={`flex ${nuestro ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${nuestro ? "items-end" : "items-start"}`}>
        {etiqueta && (
          <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium text-li-text-2">
            <Bot size={10} /> {etiqueta}
          </span>
        )}
        <div
          className={`whitespace-pre-wrap px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm ${
            nuestro
              ? "rounded-2xl rounded-br-sm bg-li-blue text-white"
              : "rounded-2xl rounded-bl-sm border border-li-border bg-li-surface text-li-text"
          }`}
        >
          {texto}
          {cuando && (
            <span
              className={`ml-2 inline-flex items-center gap-0.5 align-bottom text-[10px] tabular-nums ${
                nuestro ? "text-white/70" : "text-li-text-2"
              }`}
            >
              {hora(cuando)}
              {nuestro && <Check size={10} strokeWidth={3} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const hora = (t: number) =>
  new Date(t).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/** "14:32" si es hoy, "12 ago" si no: lo que muestra cualquier mensajería. */
function momentoCorto(t: number): string {
  const d = new Date(t);
  const hoy = new Date();
  const mismoDia =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear();
  return mismoDia
    ? d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

const ultimoMomento = (l: Lead) =>
  (l.conversacion ?? []).slice(-1)[0]?.cuando ?? l.contactadoEn ?? l.creadoEn;
