"use client";

import { useCallback, useEffect, useState } from "react";
import { MarcaVideo } from "@/components/MarcaVideo";
import {
  BarChart3,
  Bot,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  Cpu,
  Database,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Repeat,
  Search,
  Send,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { ESTADOS, type EstadoLead, type Lead } from "@/lib/types";

interface Metricas {
  embudo: {
    encontrados: number;
    contactados: number;
    interesados: number;
    reuniones: number;
  };
  tasas: { respuesta: number; agendamiento: number };
  porEstado: Record<EstadoLead, number>;
  actividad: {
    mensajesEnviados: number;
    primeros: number;
    seguimientos: number;
    escalados: number;
  };
  proximosRecontactos: {
    id: string;
    nombre: string;
    empresa: string;
    cuando: number;
  }[];
  agentes: {
    analista: number;
    setter: number;
    seguidor: number;
    orquestador: number;
  };
}

const AGENTES: {
  key: keyof Metricas["agentes"];
  nombre: string;
  rol: string;
  unidad: string;
  Icono: typeof Search;
  color: string;
}[] = [
  {
    key: "analista",
    nombre: "Analista",
    rol: "Lee el perfil (o el evento de ecommerce) y decide si es buen lead: resumen, por qué encaja, y redacta el primer mensaje.",
    unidad: "perfiles analizados",
    Icono: Search,
    color: "text-li-blue",
  },
  {
    key: "setter",
    nombre: "Setter",
    rol: "Conversa 1 a 1 como humano: descubre la necesidad, resuelve dudas, y decide agendar, posponer, descartar o escalar.",
    unidad: "conversaciones activas",
    Icono: MessageSquare,
    color: "text-emerald-600",
  },
  {
    key: "seguidor",
    nombre: "Seguidor",
    rol: "Insiste con un ángulo nuevo a quien no respondió, sin sonar a reclamo, hasta dejarlo frío.",
    unidad: "seguimientos escritos",
    Icono: Repeat,
    color: "text-violet-600",
  },
  {
    key: "orquestador",
    nombre: "Orquestador",
    rol: "Dirige el ciclo completo: decide a quién le toca ahora y encadena a los otros tres agentes.",
    unidad: "ciclos corridos",
    Icono: Cpu,
    color: "text-amber-600",
  },
];

function fmtFecha(ms: number): string {
  return new Date(ms).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PASOS_EMBUDO: {
  key: keyof Metricas["embudo"];
  label: string;
  Icono: typeof Users;
}[] = [
  { key: "encontrados", label: "Encontrados", Icono: Users },
  { key: "contactados", label: "Contactados", Icono: Send },
  { key: "interesados", label: "Respondieron / interesados", Icono: MessageSquare },
  { key: "reuniones", label: "Reunión agendada", Icono: CalendarCheck },
];

export function PanelView({ onToast }: { onToast: (t: string) => void }) {
  const [m, setM] = useState<Metricas | null>(null);
  /** Qué agente está abierto ahora mismo (drill-down), o ninguno. */
  const [agenteAbierto, setAgenteAbierto] = useState<keyof Metricas["agentes"] | null>(
    null,
  );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [airtable, setAirtable] = useState<{ activo: boolean; url: string | null }>({
    activo: false,
    url: null,
  });
  const [sincronizando, setSincronizando] = useState(false);
  const [gasto, setGasto] = useState<{
    usadoUsd: number | null;
    planUsd: number | null;
    topeUsd: number;
    disponible: boolean;
  } | null>(null);
  const [topeEdit, setTopeEdit] = useState("");

  const cargar = useCallback(async () => {
    const d = await fetch("/api/metricas").then((r) => r.json()).catch(() => null);
    if (d) setM(d);
  }, []);

  const cargarGasto = useCallback(async () => {
    const d = await fetch("/api/gasto").then((r) => r.json()).catch(() => null);
    if (d) {
      setGasto(d);
      setTopeEdit(String(d.topeUsd));
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarGasto();
    fetch("/api/airtable/sync")
      .then((r) => r.json())
      .then((d) => setAirtable({ activo: !!d.activo, url: d.url ?? null }))
      .catch(() => {});
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d?.leads ?? []))
      .catch(() => {});
  }, [cargar, cargarGasto]);

  /** Últimos leads que pasaron por el Analista: los que ya tienen resumen escrito. */
  const paraAnalista = leads
    .filter((l) => l.resumen?.trim())
    .sort((a, b) => b.creadoEn - a.creadoEn)
    .slice(0, 8);

  /** Conversaciones donde el Setter ya intervino, más recientes primero. */
  const paraSetter = leads
    .filter((l) => (l.conversacion?.length ?? 0) > 0)
    .sort((a, b) => {
      const ua = a.conversacion?.[a.conversacion.length - 1]?.cuando ?? 0;
      const ub = b.conversacion?.[b.conversacion.length - 1]?.cuando ?? 0;
      return ub - ua;
    })
    .slice(0, 8);

  /** A quiénes ya les escribió el Seguidor, con más seguimientos primero. */
  const paraSeguidor = leads
    .filter((l) => (l.seguimientos ?? 0) > 0)
    .sort((a, b) => (b.seguimientos ?? 0) - (a.seguimientos ?? 0))
    .slice(0, 8);

  async function guardarTope() {
    const n = Number(topeEdit);
    if (!Number.isFinite(n) || n < 0) return;
    const d = await fetch("/api/gasto", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topeUsd: n }),
    })
      .then((r) => r.json())
      .catch(() => null);
    if (d?.topeUsd != null) {
      onToast(`Presupuesto tope: $${d.topeUsd}`);
      cargarGasto();
    }
  }

  async function sincronizar() {
    setSincronizando(true);
    const d = await fetch("/api/airtable/sync", { method: "POST" })
      .then((r) => r.json())
      .catch(() => null);
    setSincronizando(false);
    if (d?.sincronizados != null) {
      onToast(`${d.sincronizados} lead(s) sincronizados con Airtable`);
    } else {
      onToast(d?.error ?? "No se pudo sincronizar");
    }
  }

  if (!m) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10 text-[15px] text-li-text-2">
        Cargando métricas…
      </div>
    );
  }

  const max = Math.max(m.embudo.encontrados, 1);
  const kpis = [
    { n: `${m.tasas.respuesta}%`, l: "Tasa de respuesta", Icono: TrendingUp },
    { n: `${m.tasas.agendamiento}%`, l: "Tasa de agendamiento", Icono: CalendarCheck },
    { n: m.actividad.mensajesEnviados, l: "Mensajes enviados", Icono: Send },
    { n: m.actividad.seguimientos, l: "Seguimientos", Icono: RefreshCw },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-tight">
            <BarChart3 size={24} className="text-li-blue" /> Panel
          
          <MarcaVideo escena={5} />
        </h1>
          <p className="mt-1 text-[15px] text-li-text-2">
            El embudo en vivo: cada número sale del estado real del sistema.
          </p>
        </div>
        <button
          onClick={cargar}
          className="mt-1 inline-flex items-center gap-2 rounded-full border border-li-border px-4 py-2 text-[13.5px] font-medium text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
        >
          <RefreshCw size={15} /> Actualizar
        </button>
      </header>

      {/* Agentes especializados */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Bot size={17} className="text-li-blue" /> Agentes especializados
        </h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          Cada etapa la lleva un agente distinto, con un solo trabajo. Los números son lo
          que cada uno ha hecho hasta ahora.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AGENTES.map((a) => {
            const abierto = agenteAbierto === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setAgenteAbierto(abierto ? null : a.key)}
                aria-expanded={abierto}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  abierto ? "border-li-blue bg-li-blue/[0.04]" : "border-li-border hover:border-li-blue/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    <a.Icono size={16} className={a.color} />
                    {a.nombre}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`text-[20px] font-semibold tabular-nums ${a.color}`}>
                      {m.agentes[a.key]}
                    </span>
                    <ChevronRight
                      size={15}
                      className={`text-li-text-2 transition-transform ${abierto ? "rotate-90" : ""}`}
                    />
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-li-text-2">{a.rol}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-li-text-2">
                  {a.unidad}
                </p>
              </button>
            );
          })}
        </div>

        {/* Drill-down: qué hizo el agente elegido, con datos reales del sistema. */}
        {agenteAbierto && (
          <div className="mt-3 rounded-lg border border-li-border bg-black/[0.02] p-4">
            {agenteAbierto === "analista" && (
              <>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                  Últimos perfiles analizados
                </h3>
                {paraAnalista.length === 0 ? (
                  <p className="mt-2 text-[13px] text-li-text-2">
                    Todavía no analizó ningún perfil. Aparece acá después de la primera búsqueda.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-li-border">
                    {paraAnalista.map((l) => (
                      <li key={l.id} className="py-2.5">
                        <p className="text-[13.5px] font-semibold">
                          {l.nombre}{" "}
                          <span className="font-normal text-li-text-2">
                            {[l.cargo, l.empresa].filter(Boolean).join(" · ")}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-li-text-2">{l.resumen}</p>
                        {l.porQueBuenLead && (
                          <p className="mt-0.5 text-[12px] text-li-blue">{l.porQueBuenLead}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {agenteAbierto === "setter" && (
              <>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                  Conversaciones más recientes
                </h3>
                {paraSetter.length === 0 ? (
                  <p className="mt-2 text-[13px] text-li-text-2">
                    Ninguna conversación activa todavía.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-li-border">
                    {paraSetter.map((l) => {
                      const ultimo = l.conversacion?.[l.conversacion.length - 1];
                      return (
                        <li key={l.id} className="py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13.5px] font-semibold">{l.nombre}</p>
                            <span className="shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-semibold text-li-text-2">
                              {ESTADOS.find((e) => e.id === l.estado)?.label ?? l.estado}
                            </span>
                          </div>
                          {ultimo && (
                            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-li-text-2">
                              <strong className="text-li-text">
                                {ultimo.de === "setter" ? "Él: " : `${l.nombre.split(" ")[0]}: `}
                              </strong>
                              {ultimo.texto}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {agenteAbierto === "seguidor" && (
              <>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                  A quién le está insistiendo
                </h3>
                {paraSeguidor.length === 0 ? (
                  <p className="mt-2 text-[13px] text-li-text-2">
                    Nadie recibió un seguimiento todavía (nadie dejó de responder aún).
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-li-border">
                    {paraSeguidor.map((l) => (
                      <li key={l.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13.5px] font-semibold">{l.nombre}</p>
                          <span className="shrink-0 text-[12px] tabular-nums text-li-text-2">
                            {l.seguimientos} seguimiento{l.seguimientos === 1 ? "" : "s"}
                          </span>
                        </div>
                        {l.notaAgente && (
                          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-li-text-2">
                            {l.notaAgente}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {agenteAbierto === "orquestador" && (
              <>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
                  Cómo trabaja
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-li-text-2">
                  No analiza leads uno por uno: cada {" "}
                  <strong className="text-li-text">ciclo</strong> (n8n lo dispara según la
                  cadencia configurada) revisa quién está listo para el siguiente paso y
                  llama al agente que corresponda — Analista, Setter o Seguidor. Lleva{" "}
                  <strong className="text-li-text">{m.agentes.orquestador}</strong> ciclo
                  {m.agentes.orquestador === 1 ? "" : "s"} corrido
                  {m.agentes.orquestador === 1 ? "" : "s"} desde que se activó.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="card-li rounded-lg bg-li-surface p-4">
            <k.Icono size={16} className="text-li-blue" />
            <div className="mt-2 text-[26px] font-semibold tabular-nums text-li-text">
              {k.n}
            </div>
            <div className="text-[12.5px] text-li-text-2">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Gasto Apify + presupuesto tope */}
      {gasto && (
        <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Wallet size={17} className="text-li-blue" /> Gasto de Apify
          </h2>
          {gasto.disponible && gasto.usadoUsd != null ? (
            <>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-[13px] text-li-text-2">
                  Gastado este mes (real, en vivo)
                </span>
                <span className="text-[15px] font-semibold tabular-nums">
                  ${gasto.usadoUsd.toFixed(2)}
                  <span className="text-li-text-2"> / ${gasto.topeUsd.toFixed(2)} tope</span>
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className={`h-full rounded-full transition-all ${
                    gasto.usadoUsd / Math.max(gasto.topeUsd, 0.01) > 0.85
                      ? "bg-red-500"
                      : gasto.usadoUsd / Math.max(gasto.topeUsd, 0.01) > 0.6
                        ? "bg-amber-500"
                        : "bg-li-blue"
                  }`}
                  style={{
                    width: `${Math.min((gasto.usadoUsd / Math.max(gasto.topeUsd, 0.01)) * 100, 100)}%`,
                  }}
                />
              </div>
              {gasto.planUsd != null && gasto.planUsd > 0 && (
                <p className="mt-1.5 text-[12px] text-li-text-2">
                  Tope del plan de Apify: ${gasto.planUsd.toFixed(2)}/mes.
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-[13px] text-li-text-2">
              No se pudo leer el gasto en vivo (revisá APIFY_TOKEN). El presupuesto tope
              igual protege las búsquedas.
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[13px] text-li-text-2">Presupuesto tope (USD/mes)</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={topeEdit}
              onChange={(e) => setTopeEdit(e.target.value)}
              className="w-24 rounded-md border border-li-border bg-li-surface px-2.5 py-1.5 text-[14px] outline-none focus:border-li-blue"
            />
            <button
              onClick={guardarTope}
              className="rounded-full bg-li-blue px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
            >
              Guardar
            </button>
          </div>
          <p className="mt-2 text-[12px] text-li-text-2">
            Una búsqueda que superaría este tope se bloquea antes de gastar. Poné 0 para
            usar solo el tope del plan.
          </p>
        </div>
      )}

      {/* Embudo */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="text-[15px] font-semibold">Embudo de prospección</h2>
        <div className="mt-4 space-y-2.5">
          {PASOS_EMBUDO.map(({ key, label, Icono }, i) => {
            const n = m.embudo[key];
            const w = Math.max((n / max) * 100, n > 0 ? 8 : 2);
            const prev = i > 0 ? m.embudo[PASOS_EMBUDO[i - 1].key] : n;
            const conv = i > 0 && prev > 0 ? Math.round((n / prev) * 100) : null;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex w-52 shrink-0 items-center gap-2 text-[13.5px]">
                  <Icono size={15} className="shrink-0 text-li-text-2" />
                  <span className="truncate">{label}</span>
                </div>
                <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-black/[0.04]">
                  <div
                    className="flex h-full items-center rounded-md bg-li-blue px-3 text-[14px] font-semibold text-white transition-all"
                    style={{ width: `${w}%` }}
                  >
                    <span className="tabular-nums">{n}</span>
                  </div>
                </div>
                <div className="w-14 shrink-0 text-right text-[12.5px] tabular-nums text-li-text-2">
                  {conv != null ? `${conv}%` : ""}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-li-text-2">
          La columna de la derecha es la conversión de cada paso respecto al anterior.
        </p>
      </div>

      {/* Distribución del kanban */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="text-[15px] font-semibold">Distribución del tablero</h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ESTADOS.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-li-border p-3 text-center"
            >
              <div className="text-[22px] font-semibold tabular-nums text-li-text">
                {m.porEstado[e.id] ?? 0}
              </div>
              <div className="text-[12px] text-li-text-2">{e.label}</div>
            </div>
          ))}
        </div>
        {m.actividad.escalados > 0 && (
          <p className="mt-3 text-[12.5px] text-amber-700">
            {m.actividad.escalados} lead(s) escalado(s): pidieron intervención humana.
          </p>
        )}
      </div>

      {/* Próximos re-contactos */}
      {m.proximosRecontactos.length > 0 && (
        <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <CalendarClock size={17} className="text-li-blue" /> Próximos re-contactos
          </h2>
          <p className="mt-1 text-[13px] text-li-text-2">
            Interesados que pidieron tiempo. El sistema los retoma solo en su fecha.
          </p>
          <ul className="mt-3 divide-y divide-li-border">
            {m.proximosRecontactos.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 py-2.5 text-[14px]"
              >
                <span className="truncate">
                  {r.nombre} <span className="text-li-text-2">· {r.empresa}</span>
                </span>
                <span className="shrink-0 tabular-nums text-li-blue">
                  {fmtFecha(r.cuando)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CRM Airtable */}
      <div className="card-li rounded-lg bg-li-surface p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Database size={17} className="text-li-blue" /> CRM externo (Airtable)
        </h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          {airtable.activo
            ? "Conectado. El sistema sincroniza cada lead solo; este botón fuerza un empuje total."
            : "No configurado. Falta AIRTABLE_TOKEN / AIRTABLE_BASE_ID en .env.local."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={sincronizar}
            disabled={!airtable.activo || sincronizando}
            className="inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} />
            {sincronizando ? "Sincronizando…" : "Sincronizar con Airtable"}
          </button>
          {airtable.url && (
            <a
              href={airtable.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-li-border px-5 py-2.5 text-[14px] font-semibold text-li-text transition-colors hover:border-li-blue"
            >
              <ExternalLink size={16} /> Abrir CRM
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
