"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarClock,
  History,
  Loader2,
  MapPin,
  MessageCircle,
  PhoneCall,
  PhoneOff,
  Snowflake,
  Sparkles,
  ThumbsUp,
  X,
} from "lucide-react";
import type { Lead, ResultadoLlamada } from "@/lib/types";

function soloDigitos(tel: string): string {
  return tel.replace(/[^0-9]/g, "");
}

const ACCIONES: {
  id: ResultadoLlamada;
  label: string;
  Icono: typeof PhoneOff;
  clase: string;
}[] = [
  {
    id: "no_contesto",
    label: "No contestó",
    Icono: PhoneOff,
    clase: "border-li-border text-li-text-2 hover:border-li-text-2",
  },
  {
    id: "interesado",
    label: "Interesado",
    Icono: ThumbsUp,
    clase: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    id: "llamar_despues",
    label: "Llamar después",
    Icono: CalendarClock,
    clase: "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
  {
    id: "no_interesa",
    label: "No le interesa",
    Icono: Snowflake,
    clase: "border-li-border text-li-text-2 hover:border-red-300 hover:text-red-600",
  },
];

export function ConsolaLlamada({
  lead,
  trabajando,
  onCerrar,
  onRegistrar,
  onAbrirFicha,
}: {
  lead: Lead | null;
  trabajando: boolean;
  onCerrar: () => void;
  onRegistrar: (lead: Lead, resultado: ResultadoLlamada, nota: string) => void;
  onAbrirFicha?: (id: string) => void;
}) {
  const [nota, setNota] = useState("");

  // Al cambiar de contacto, limpiar el campo de notas nuevo.
  useEffect(() => {
    setNota("");
  }, [lead?.id]);

  // Cerrar con Escape
  useEffect(() => {
    if (!lead) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lead, onCerrar]);

  const tel = lead?.contacto ?? "";
  const wa = soloDigitos(tel);
  const texto = encodeURIComponent(lead?.mensaje ?? "");
  // El historial de llamadas se guarda como líneas en la nota (bitácora).
  const historial = (lead?.nota ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              className="scroll-fino max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-li-surface shadow-2xl"
            >
              {/* Cabecera */}
              <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-li-border bg-li-surface px-5 pb-4 pt-5">
                <div className="min-w-0">
                  <h2 className="truncate text-[19px] font-semibold leading-tight">
                    {lead.nombre}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-li-text-2">
                    {[lead.cargo || lead.empresa, lead.ubicacion]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {tel ? (
                    <p className="mt-1 flex items-center gap-1.5 font-mono text-[15px] font-semibold tabular-nums text-li-text">
                      <MapPin size={13} className="text-li-text-2" /> {tel}
                    </p>
                  ) : (
                    lead.ubicacion && (
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-li-text-2">
                        <MapPin size={13} /> {lead.ubicacion}
                      </p>
                    )
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {(lead.intentosLlamada ?? 0) > 0 && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700">
                      {lead.intentosLlamada} intento(s)
                    </span>
                  )}
                  <button
                    onClick={onCerrar}
                    aria-label="Cerrar"
                    className="rounded-full p-1.5 text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              <div className="space-y-5 px-5 py-5">
                {/* Investigación del prospecto */}
                <section className="rounded-lg bg-li-blue/[0.06] p-4">
                  <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-li-blue">
                    <Sparkles size={13} /> Investigación del prospecto
                  </h3>
                  {lead.resumen && (
                    <p className="mt-2 text-[14px] leading-relaxed">{lead.resumen}</p>
                  )}
                  {lead.porQueBuenLead && (
                    <p className="mt-2 border-l-2 border-li-blue pl-3 text-[13.5px] leading-relaxed text-li-text-2">
                      {lead.porQueBuenLead}
                    </p>
                  )}
                </section>

                {/* Notas del agente IA */}
                {lead.notaAgente && (
                  <section className="rounded-lg border border-li-border bg-black/[0.02] p-3.5">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wide text-li-text-2">
                      Notas del agente
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-li-text">
                      {lead.notaAgente}
                    </p>
                  </section>
                )}

                {/* Guion / mensaje sugerido */}
                {lead.mensaje && (
                  <section>
                    <h3 className="text-[12px] font-semibold uppercase tracking-wide text-li-text-2">
                      Guion sugerido (para leer o adaptar)
                    </h3>
                    <p className="mt-2 rounded-lg border border-li-border bg-black/[0.02] p-3 text-[13.5px] leading-relaxed text-li-text">
                      {lead.mensaje}
                    </p>
                  </section>
                )}

                {/* Historial de contacto */}
                {historial.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-li-text-2">
                      <History size={13} /> Historial de contacto
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {historial.map((l, i) => (
                        <li
                          key={i}
                          className="rounded-md bg-black/[0.03] px-3 py-2 text-[13px] leading-snug text-li-text-2"
                        >
                          {l}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Acciones de contacto */}
                <section className="flex flex-wrap items-center gap-2">
                  {tel && (
                    <a
                      href={`tel:${tel}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
                    >
                      <PhoneCall size={16} /> Llamar
                    </a>
                  )}
                  {wa && (
                    <a
                      href={`https://wa.me/${wa}?text=${texto}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-[14px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  {onAbrirFicha && (
                    <button
                      onClick={() => onAbrirFicha(lead.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-li-border px-5 py-2.5 text-[14px] font-semibold text-li-text transition-colors hover:border-li-blue hover:text-li-blue"
                    >
                      Ver ficha / chat completo
                    </button>
                  )}
                  {!tel && !wa && (
                    <span className="text-[12.5px] text-li-text-2">
                      Sin teléfono: se contacta por DM desde la ficha.
                    </span>
                  )}
                </section>

                {/* Registrar la llamada */}
                <section className="rounded-lg border border-li-border p-4">
                  <h3 className="text-[13px] font-semibold">Registrar la llamada</h3>
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows={3}
                    placeholder="¿Qué pasó en la llamada? Datos que dio, objeciones, próximos pasos…"
                    className="mt-2 w-full resize-y rounded-md border border-li-border bg-li-surface p-3 text-[14px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
                  />
                  <p className="mb-2 mt-3 text-[12px] font-medium uppercase tracking-wide text-li-text-2">
                    Resultado
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ACCIONES.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => onRegistrar(lead, a.id, nota)}
                        disabled={trabajando}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40 ${a.clase}`}
                      >
                        {trabajando ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <a.Icono size={14} />
                        )}
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] text-li-text-2">
                    La nota se guarda en el historial y el resultado mueve la tarjeta solo.
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
