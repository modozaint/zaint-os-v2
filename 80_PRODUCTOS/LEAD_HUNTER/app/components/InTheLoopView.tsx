"use client";

import { useCallback, useEffect, useState } from "react";
import { MarcaVideo } from "@/components/MarcaVideo";
import {
  Bot,
  CheckCircle2,
  AtSign,
  MessageCircle,
  PenLine,
  Repeat,
  Search,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import type { Lead, ResultadoLlamada } from "@/lib/types";
import { arrobaInstagram, urlInstagram } from "@/lib/contacto";
import { Avatar } from "./Avatar";
import { ConsolaLlamada } from "./ConsolaLlamada";
import { ContactoView } from "./ContactoView";

type Tab = "atencion" | "agendados" | "infoagente";

/** Deja solo dígitos para el link de WhatsApp (wa.me/<numero>). */
function soloDigitos(tel: string): string {
  return tel.replace(/[^0-9]/g, "");
}

interface Agentes {
  analista: number;
  setter: number;
  seguidor: number;
  orquestador: number;
}

const DEF_AGENTES: {
  nombre: string;
  desc: string;
  Icono: typeof Bot;
  campo: keyof Agentes;
  unidad: string;
}[] = [
  { nombre: "Analista", desc: "Lee y analiza cada perfil o negocio: quién es y por qué es buen lead.", Icono: Search, campo: "analista", unidad: "perfiles analizados" },
  { nombre: "Redactor", desc: "Escribe el primer mensaje personalizado para cada lead.", Icono: PenLine, campo: "analista", unidad: "mensajes escritos" },
  { nombre: "Setter", desc: "Conversa como humano hasta agendar la reunión o llegar a la negativa.", Icono: Bot, campo: "setter", unidad: "conversaciones" },
  { nombre: "Seguidor", desc: "A quien no responde, insiste con cadencia y ángulos nuevos.", Icono: Repeat, campo: "seguidor", unidad: "seguimientos" },
  { nombre: "Orquestador", desc: "El piloto automático: encadena a todos y decide qué toca en cada ciclo.", Icono: Settings2, campo: "orquestador", unidad: "ciclos corridos" },
];

function InfoAgentes() {
  const [ag, setAg] = useState<Agentes | null>(null);
  useEffect(() => {
    fetch("/api/metricas")
      .then((r) => r.json())
      .then((d) => setAg(d?.agentes ?? null))
      .catch(() => {});
  }, []);
  return (
    <div className="card-li mb-6 rounded-lg bg-li-surface p-5">
      <h2 className="text-[15px] font-semibold">Los agentes de la operación</h2>
      <p className="mt-1 text-[13px] text-li-text-2">
        Cada parte del seguimiento la lleva un agente especializado. Esto es lo que ha
        trabajado cada uno hasta ahora.
      </p>
      <div className="mt-4 space-y-2.5">
        {DEF_AGENTES.map((a) => (
          <div key={a.nombre} className="flex items-start gap-3 rounded-lg border border-li-border p-3">
            <span className="mt-0.5 shrink-0 rounded-lg bg-li-blue/10 p-2 text-li-blue">
              <a.Icono size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold">{a.nombre}</h3>
              <p className="text-[12.5px] leading-snug text-li-text-2">{a.desc}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[18px] font-semibold tabular-nums text-li-blue">
                {ag ? ag[a.campo] : "—"}
              </div>
              <div className="text-[11px] text-li-text-2">{a.unidad}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function badge(l: Lead): { label: string; clase: string } {
  // Escalado = urgente: el agente ya conversó y se quedó sin respuesta. Rojo,
  // no ámbar: hay alguien esperando.
  if (l.escalado)
    return { label: "Escalado · urgente", clase: "border-red-300 bg-red-50 text-red-700" };
  if (l.estado === "reunion")
    return { label: "Agendado", clase: "border-emerald-300 bg-emerald-50 text-emerald-800" };
  if (l.estado === "respondieron")
    return { label: "Respondió", clase: "border-li-blue/30 bg-li-blue/[0.06] text-li-blue" };
  if (l.estado === "futuro")
    return { label: "Contactar después", clase: "border-violet-300 bg-violet-50 text-violet-800" };
  if (l.estado === "contactados")
    return { label: "Contactado", clase: "border-li-border bg-black/[0.03] text-li-text-2" };
  return { label: "Nuevo", clase: "border-li-border bg-black/[0.03] text-li-text-2" };
}

export function InTheLoopView({
  leads: leadsCliente,
  onAbrir,
  onToast,
  onRefrescarLeads,
}: {
  leads: Lead[];
  onAbrir: (id: string) => void;
  onToast: (t: string) => void;
  onRefrescarLeads: () => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<Tab>("atencion");
  const [abierto, setAbierto] = useState<Lead | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    const d = await fetch("/api/bandeja").then((r) => r.json()).catch(() => null);
    setLeads(d?.leads ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const atencion = leads.filter((l) => l.estado !== "reunion");
  const agendados = leads.filter((l) => l.estado === "reunion");
  const lista = tab === "atencion" ? atencion : agendados;

  async function registrar(lead: Lead, resultado: ResultadoLlamada, nota: string) {
    setTrabajando(true);
    const d = await fetch("/api/ruta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, resultado, nota }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (!d?.lead) {
      onToast("No se pudo registrar");
      return;
    }
    onToast(`${lead.nombre}: registrado`);
    setAbierto(null);
    cargar();
    onRefrescarLeads();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          <Repeat size={23} className="text-li-blue" /> In the loop
        
          <MarcaVideo escena={6} />
        </h1>
        <p className="mt-1 text-[15px] text-li-text-2">
          Los contactos que necesitan tu intervención, en un solo lugar. Abrí la ficha
          para trabajarlos. En <strong>Info agente</strong> está el piloto automático y
          qué hace cada agente.
        </p>
      </header>

      {/* Pestañas */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["atencion", "Necesitan tu atención", atencion.length],
            ["agendados", "Agendados", agendados.length],
            ["infoagente", "Info agente", null],
          ] as [Tab, string, number | null][]
        ).map(([id, label, n]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${
              tab === id
                ? "bg-li-blue text-white"
                : "border border-li-border text-li-text-2 hover:border-li-blue"
            }`}
          >
            {label}
            {n != null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                  tab === id ? "bg-white/25" : "bg-black/[0.06]"
                }`}
              >
                {n}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "infoagente" ? (
        <>
          <InfoAgentes />
          <ContactoView
            leads={leadsCliente}
            onRefrescarLeads={onRefrescarLeads}
            onToast={onToast}
          />
        </>
      ) : cargando ? (
        <p className="text-[15px] text-li-text-2">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="card-li rounded-lg bg-li-surface p-10 text-center">
          <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
          <p className="mt-3 text-[15px] font-medium">
            {tab === "atencion" ? "Nada pendiente por ahora" : "Todavía no hay agendados"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map((lead) => {
            const b = badge(lead);
            const wa = lead.contacto ? soloDigitos(lead.contacto) : "";
            const urlIg = urlInstagram(lead);
            return (
              <div
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() => setAbierto(lead)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAbierto(lead);
                  }
                }}
                className="card-li card-li-hover flex w-full cursor-pointer items-start gap-3 rounded-lg bg-li-surface p-4 text-left transition-all hover:-translate-y-0.5"
              >
                <Avatar nombre={lead.nombre} fotoUrl={lead.fotoUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold">{lead.nombre}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${b.clase}`}
                    >
                      {lead.escalado && <TriangleAlert size={11} />}
                      {b.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-li-text-2">
                    {[lead.cargo, lead.empresa].filter(Boolean).join(" · ") || lead.headline}
                  </p>
                  {lead.escalado && lead.motivoEscalado ? (
                    <p className="mt-1.5 flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[12.5px] leading-snug text-red-800">
                      <TriangleAlert size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{lead.motivoEscalado}</span>
                    </p>
                  ) : (
                    lead.notaAgente && (
                      <p className="mt-1.5 flex items-start gap-1.5 rounded-md bg-black/[0.03] px-2.5 py-1.5 text-[12.5px] leading-snug text-li-text-2">
                        <Bot size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{lead.notaAgente}</span>
                      </p>
                    )
                  )}
                </div>
                {urlIg && (
                  <a
                    href={urlIg}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Abrir @${arrobaInstagram(lead)}`}
                    className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-full border border-li-border px-3 py-1.5 text-[12.5px] font-semibold text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
                  >
                    <AtSign size={14} />
                    {arrobaInstagram(lead)}
                  </a>
                )}
                {wa && (
                  <a
                    href={`https://wa.me/${wa}?text=${encodeURIComponent(lead.mensaje ?? "")}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Enviar por WhatsApp"
                    className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[12.5px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ficha emergente (ventana) */}
      <ConsolaLlamada
        lead={abierto}
        trabajando={trabajando}
        onCerrar={() => setAbierto(null)}
        onRegistrar={registrar}
        onAbrirFicha={(id) => {
          setAbierto(null);
          onAbrir(id);
        }}
      />
    </div>
  );
}
