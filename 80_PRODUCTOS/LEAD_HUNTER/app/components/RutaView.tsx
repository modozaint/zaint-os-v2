"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  AtSign,
  MessageCircle,
  Navigation,
  PhoneCall,
  Plus,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Lead, ResultadoLlamada } from "@/lib/types";
import { arrobaInstagram, soloDigitos, urlInstagram } from "@/lib/contacto";

const OBJETIVO_DIA = 20;
/** Cuántos escalados se traen de una: son urgentes, se atienden de a pocos. */
const LOTE_ESCALADOS = 6;

/** De dónde sale el lote que entra a la cola del día. */
type Fuente = "nuevos" | "escalados";

/** Hace cuánto espera un escalado, en texto corto. */
function esperando(desde?: number | null): string {
  if (!desde) return "";
  const horas = Math.floor((Date.now() - desde) / 3_600_000);
  if (horas < 1) return "hace menos de 1 h";
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} día${dias === 1 ? "" : "s"}`;
}

interface Tarea {
  id: string;
  texto: string;
  hecha: boolean;
}

/**
 * Ruta de contacto: la jornada del comercial. Trae un lote de contactos con
 * teléfono y los va sirviendo de a UNO en una tarjeta grande (el de la cola).
 * Se resuelve → avanza solo al siguiente. Arriba, el objetivo del día; abajo,
 * las tareas sueltas de la jornada.
 */
export function RutaView({
  onToast,
  onRefrescarLeads,
}: {
  onToast: (t: string) => void;
  onRefrescarLeads: () => void;
}) {
  const [disponibles, setDisponibles] = useState<Lead[]>([]);
  /** Cola urgente: el agente se trabó y espera a un humano. */
  const [escalados, setEscalados] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);
  /** Cola de trabajo del día (subconjunto traído de la bandeja). */
  const [cola, setCola] = useState<Lead[]>([]);
  const [traidos, setTraidos] = useState<Set<string>>(new Set());
  const [hechosHoy, setHechosHoy] = useState(0);
  /** La tarjeta actual está expandida para clasificar el resultado. */
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Tareas del día (locales, sobreviven al refresco).
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaTarea, setNuevaTarea] = useState("");

  const cargar = useCallback(async () => {
    const d = await fetch("/api/ruta").then((r) => r.json()).catch(() => null);
    setDisponibles(d?.leads ?? []);
    setEscalados(d?.escalados ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    try {
      const raw = localStorage.getItem("lh_ruta_tareas");
      if (raw) setTareas(JSON.parse(raw));
    } catch {}
  }, [cargar]);

  const guardarTareas = useCallback((t: Tarea[]) => {
    setTareas(t);
    try {
      localStorage.setItem("lh_ruta_tareas", JSON.stringify(t));
    } catch {}
  }, []);

  /** Contactos que aún no metí a la cola. */
  const pendientes = useMemo(
    () => disponibles.filter((l) => !traidos.has(l.id)),
    [disponibles, traidos],
  );
  /** Escalados que aún no metí a la cola. */
  const pendientesEscalados = useMemo(
    () => escalados.filter((l) => !traidos.has(l.id)),
    [escalados, traidos],
  );

  /**
   * Trae un lote a la cola del día. Los escalados van adelante: son urgentes,
   * hay alguien esperando una respuesta que el agente no supo dar.
   */
  function traerLote(fuente: Fuente) {
    const esc = fuente === "escalados";
    const lote = (esc ? pendientesEscalados : pendientes).slice(
      0,
      esc ? LOTE_ESCALADOS : OBJETIVO_DIA,
    );
    if (!lote.length) return;
    setCola((prev) => (esc ? [...lote, ...prev] : [...prev, ...lote]));
    setTraidos((prev) => {
      const s = new Set(prev);
      lote.forEach((l) => s.add(l.id));
      return s;
    });
    onToast(
      esc
        ? `${lote.length} escalado(s) al frente de tu ruta`
        : `${lote.length} contacto(s) en tu ruta`,
    );
  }

  const actual = cola[0] ?? null;

  async function registrar(resultado: ResultadoLlamada) {
    if (!actual) return;
    setTrabajando(true);
    const d = await fetch("/api/ruta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: actual.id, resultado, nota }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (!d?.lead) {
      onToast("No se pudo registrar");
      return;
    }
    const toast: Record<ResultadoLlamada, string> = {
      no_contesto: "No contestó · siguiente",
      interesado: `${actual.nombre} → Interesado`,
      llamar_despues: `${actual.nombre} → Volver a llamar`,
      no_interesa: `${actual.nombre} → Descartado`,
    };
    onToast(toast[resultado]);
    // Avanza al siguiente de la cola.
    setCola((prev) => prev.slice(1));
    setHechosHoy((n) => n + 1);
    setExpandido(false);
    setNota("");
    onRefrescarLeads();
  }

  function agregarTarea() {
    const t = nuevaTarea.trim();
    if (!t) return;
    guardarTareas([...tareas, { id: `t-${Date.now()}`, texto: t, hecha: false }]);
    setNuevaTarea("");
  }

  const objetivo = Math.max(cola.length + hechosHoy, hechosHoy, 0) || OBJETIVO_DIA;
  const progreso = objetivo ? Math.min(100, (hechosHoy / objetivo) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
          Tu jornada
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          <Navigation size={22} className="text-li-blue" /> Ruta
        </h1>
      </header>

      {/* Barra de objetivo del día */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-li-text-2">Tu ruta de hoy</span>
          <span className="font-semibold tabular-nums">
            {hechosHoy} / {objetivo}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="h-full rounded-full bg-li-blue transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Aviso permanente: hay gente esperando respuesta de un humano. */}
      {!cargando && pendientesEscalados.length > 0 && actual && (
        <button
          onClick={() => traerLote("escalados")}
          className="mb-4 flex w-full items-center gap-2.5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100"
        >
          <TriangleAlert size={17} className="shrink-0 text-red-600" />
          <span className="min-w-0 flex-1 text-[13.5px] text-red-800">
            <strong>{pendientesEscalados.length} escalado(s) esperando.</strong> El
            agente no pudo resolverlos solo.
          </span>
          <span className="shrink-0 text-[12.5px] font-semibold text-red-700 underline">
            Atender ahora
          </span>
        </button>
      )}

      {cargando ? (
        <p className="text-[15px] text-li-text-2">Cargando…</p>
      ) : !actual ? (
        // Sin contacto en cola: elegir con qué arrancar.
        <div className="card-li rounded-xl bg-li-surface p-8 text-center">
          <Navigation size={26} className="mx-auto text-li-text-2" />
          <p className="mt-3 text-[15px] font-semibold">
            {hechosHoy > 0 ? "¡Ruta completada por ahora!" : "Aún no hay contactos en tu ruta."}
          </p>
          <p className="mt-1 text-[13.5px] text-li-text-2">
            {pendientes.length === 0 && pendientesEscalados.length === 0
              ? "Buscá negocios en Google Maps (traen teléfono) y aparecerán acá."
              : "Elegí con qué arrancar."}
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <button
              onClick={() => traerLote("nuevos")}
              disabled={pendientes.length === 0}
              className="rounded-xl bg-li-blue px-4 py-3 text-left transition-colors hover:bg-li-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold text-white">
                <PhoneCall size={15} /> Traer{" "}
                {Math.min(OBJETIVO_DIA, pendientes.length) || OBJETIVO_DIA} para llamar
              </span>
              <span className="mt-0.5 block text-[12px] text-white/80">
                {pendientes.length} con teléfono en la bandeja
              </span>
            </button>

            <button
              onClick={() => traerLote("escalados")}
              disabled={pendientesEscalados.length === 0}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold text-red-700">
                <TriangleAlert size={15} /> Traer{" "}
                {Math.min(LOTE_ESCALADOS, pendientesEscalados.length) || LOTE_ESCALADOS}{" "}
                escalados
              </span>
              <span className="mt-0.5 block text-[12px] text-red-700/80">
                {pendientesEscalados.length} esperando intervención humana
              </span>
            </button>
          </div>
        </div>
      ) : (
        <TarjetaContacto
          lead={actual}
          posicion={cola.length}
          restantesPendientes={pendientes.length}
          trabajando={trabajando}
          expandido={expandido}
          nota={nota}
          copiado={copiado}
          onCopiar={(tel) => {
            navigator.clipboard?.writeText(tel).catch(() => {});
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1200);
          }}
          onNota={setNota}
          onExpandir={() => setExpandido(true)}
          onNoContesto={() => registrar("no_contesto")}
          onDescartar={() => registrar("no_interesa")}
          onResultado={registrar}
        />
      )}

      {/* Tareas de hoy */}
      <div className="mt-8 card-li rounded-xl bg-li-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-li-text-2">
            Tareas de hoy
          </h3>
          {pendientes.length > 0 && cola.length > 0 && (
            <button
              onClick={() => traerLote("nuevos")}
              className="text-[12px] font-semibold text-li-blue hover:underline"
            >
              + Traer {Math.min(OBJETIVO_DIA, pendientes.length)} más
            </button>
          )}
        </div>

        {tareas.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[12px] text-li-text-2">
              <span>
                {tareas.filter((t) => t.hecha).length} de {tareas.length} hechas
              </span>
              <span className="tabular-nums">
                {Math.round((tareas.filter((t) => t.hecha).length / tareas.length) * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-li-blue transition-all"
                style={{
                  width: `${(tareas.filter((t) => t.hecha).length / tareas.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarTarea()}
            placeholder="Nueva tarea…"
            className="flex-1 rounded-lg border border-li-border bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-li-blue"
          />
          <button
            onClick={agregarTarea}
            className="inline-flex items-center gap-1 rounded-lg bg-li-blue px-3 py-2 text-[13px] font-semibold text-white"
          >
            <Plus size={15} /> Añadir
          </button>
        </div>
        {tareas.length === 0 ? (
          <p className="mt-3 text-[13px] text-li-text-2">Sin tareas para hoy.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {tareas.map((t) => (
              <li key={t.id} className="flex items-center gap-2.5">
                <button
                  onClick={() =>
                    guardarTareas(
                      tareas.map((x) =>
                        x.id === t.id ? { ...x, hecha: !x.hecha } : x,
                      ),
                    )
                  }
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    t.hecha
                      ? "border-li-blue bg-li-blue text-white"
                      : "border-li-border text-transparent"
                  }`}
                >
                  <Check size={13} />
                </button>
                <span
                  className={`flex-1 text-[13.5px] ${t.hecha ? "text-li-text-2 line-through" : "text-li-text"}`}
                >
                  {t.texto}
                </span>
                <button
                  onClick={() => guardarTareas(tareas.filter((x) => x.id !== t.id))}
                  aria-label="Borrar tarea"
                  className="shrink-0 text-li-text-2 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** La tarjeta grande del contacto actual en la cola (estilo referencia). */
function TarjetaContacto({
  lead,
  posicion,
  restantesPendientes,
  trabajando,
  expandido,
  nota,
  copiado,
  onCopiar,
  onNota,
  onExpandir,
  onNoContesto,
  onDescartar,
  onResultado,
}: {
  lead: Lead;
  posicion: number;
  restantesPendientes: number;
  trabajando: boolean;
  expandido: boolean;
  nota: string;
  copiado: boolean;
  onCopiar: (tel: string) => void;
  onNota: (t: string) => void;
  onExpandir: () => void;
  onNoContesto: () => void;
  onDescartar: () => void;
  onResultado: (r: ResultadoLlamada) => void;
}) {
  const tel = lead.contacto ?? "";
  const wa = soloDigitos(tel);
  const texto = encodeURIComponent(lead.mensaje ?? "");
  const arroba = arrobaInstagram(lead);
  const urlIg = urlInstagram(lead);
  const subt =
    [lead.cargo || lead.empresa, lead.ubicacion].filter(Boolean).join(" · ") ||
    lead.headline;

  return (
    <div
      className={`card-li rounded-2xl bg-li-surface p-6 shadow-sm ${
        lead.escalado ? "ring-2 ring-red-300" : ""
      }`}
    >
      <div className="flex items-start justify-between text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
        <span className={lead.escalado ? "text-red-600" : ""}>
          {lead.escalado ? "Escalado · urgente" : "En cola"}
        </span>
        <span className="normal-case">
          {posicion} restante(s) en tu ruta
          {restantesPendientes > 0 && ` · ${restantesPendientes} en bandeja`}
        </span>
      </div>

      <h2 className="mt-2 text-[20px] font-bold leading-tight text-li-text">
        {lead.nombre}
      </h2>
      <p className="mt-0.5 text-[13.5px] text-li-text-2">{subt}</p>
      {(lead.intentosLlamada ?? 0) > 0 && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700">
          <Star size={11} /> {lead.intentosLlamada} intento(s) previos
        </span>
      )}

      {/* Por qué está escalado: lo que el agente no supo responder. */}
      {lead.escalado && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-red-700">
            <TriangleAlert size={13} /> El agente no pudo resolverlo
            {lead.escaladoEn && (
              <span className="normal-case tracking-normal text-red-600/80">
                · {esperando(lead.escaladoEn)}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13.5px] leading-snug text-red-900">
            {lead.motivoEscalado?.trim() ||
              "Ya conversó con esta persona y se quedó sin información para responder."}
          </p>
        </div>
      )}

      {/* Contacto: teléfono si lo hay; si es de Instagram, el perfil. */}
      {tel ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-li-border bg-black/[0.02] px-4 py-3">
          <span className="font-mono text-[22px] font-semibold tabular-nums text-li-text">
            {tel}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${tel}`}
              aria-label="Llamar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-li-blue text-white transition-colors hover:bg-li-blue-dark"
            >
              <PhoneCall size={17} />
            </a>
            {wa && (
              <a
                href={`https://wa.me/${wa}?text=${texto}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
              >
                <MessageCircle size={17} />
              </a>
            )}
            <button
              onClick={() => onCopiar(tel)}
              aria-label="Copiar número"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-li-border text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
            >
              {copiado ? <Check size={17} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      ) : urlIg ? (
        <a
          href={urlIg}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-li-border bg-black/[0.02] px-4 py-3 transition-colors hover:border-li-blue"
        >
          <span className="truncate font-mono text-[18px] font-semibold text-li-text">
            @{arroba}
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 text-white">
            <AtSign size={17} />
          </span>
        </a>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-li-border px-4 py-3 text-[13px] text-li-text-2">
          Sin teléfono ni perfil: abrí la ficha para ver el hilo.
        </p>
      )}

      {/* Resultado */}
      {!expandido ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            disabled={trabajando}
            onClick={onNoContesto}
            className="rounded-xl border border-li-border px-3 py-3 text-[13.5px] font-semibold text-li-text transition-colors hover:border-li-blue disabled:opacity-50"
          >
            No contestó
          </button>
          <button
            disabled={trabajando}
            onClick={onExpandir}
            className="rounded-xl bg-li-blue px-3 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:opacity-50"
          >
            {lead.escalado ? "Ya lo atendí" : "Contactado"}
          </button>
          <button
            disabled={trabajando}
            onClick={onDescartar}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[13.5px] font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            Descartar
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <textarea
            value={nota}
            onChange={(e) => onNota(e.target.value)}
            rows={2}
            placeholder="Nota (opcional): qué dijo, cuándo volver a llamar…"
            className="w-full resize-none rounded-lg border border-li-border bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-li-blue"
          />
          <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
            ¿Cómo quedó?
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              disabled={trabajando}
              onClick={() => onResultado("interesado")}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-2 py-3 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              Interesado
            </button>
            <button
              disabled={trabajando}
              onClick={() => onResultado("llamar_despues")}
              className="rounded-xl border border-li-border px-2 py-3 text-[13px] font-semibold text-li-text transition-colors hover:border-li-blue disabled:opacity-50"
            >
              Volver a llamar
            </button>
            <button
              disabled={trabajando}
              onClick={() => onResultado("no_interesa")}
              className="rounded-xl border border-red-200 bg-red-50 px-2 py-3 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              No le interesa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
