"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  Hash,
  Lock,
  MapPinned,
  Radar,
  Star,
} from "lucide-react";
import { estimarCosto, formatearUsd } from "@/lib/costo";
import { PAISES, PAIS_DEFAULT, TODO_EEUU } from "@/lib/us-states";
import { ciudadesDe } from "@/lib/ciudades";
import type { Canal } from "@/lib/types";
import { MarcaVideo } from "./MarcaVideo";

export type Fuente = "linkedin" | "negocios" | "ecommerce";
export type FuenteScraping = "negocios" | "linkedin" | "instagram";

/** Sentinela del <select> de ciudad para "no está en la lista, la escribo". */
const CIUDAD_OTRA = "__otra__";

/** Consulta compartida que se aplica a todas las fuentes marcadas. */
export interface ConsultaMulti {
  fuentes: FuenteScraping[];
  keyword: string;
  country: string;
  city: string;
  /** Departamento/provincia/estado — opcional, afina cuando la ciudad no alcanza. */
  departamento: string;
  cantidad: number;
}

function porLead(n: number): string {
  return `$${n.toFixed(3).replace(".", ",")}`;
}

/**
 * Las fuentes. Hoy el sistema es de prospección en LinkedIn: es la única
 * conectada. Las otras dos están construidas por dentro (el motor es el mismo,
 * solo cambia de dónde salen los datos) pero se muestran cerradas para que la
 * herramienta haga UNA cosa y se entienda de inmediato.
 */
const FUENTES = [
  {
    id: "linkedin" as const,
    titulo: "LinkedIn",
    nota: "decisores por cargo",
    Icono: Briefcase,
    trae: "Personas por cargo, rubro y ubicación, con su perfil y últimos posts para personalizar el mensaje.",
    costo: estimarCosto,
    lista: true,
  },
  {
    id: "negocios" as const,
    titulo: "Google Maps",
    nota: "negocios con teléfono",
    Icono: MapPinned,
    trae: "Negocios de un nicho + ciudad, con teléfono y web. Se contactan por llamada o WhatsApp.",
    costo: () => 0,
    lista: false,
  },
  {
    id: "instagram" as const,
    titulo: "Instagram",
    nota: "cuentas por hashtag · DM",
    Icono: Hash,
    trae: "Cuentas que publican sobre el tema. Contacto por DM.",
    costo: () => 0,
    lista: false,
  },
];

/**
 * BÚSQUEDAS GUARDADAS — los nichos donde un sistema de prospección se vende
 * solo, porque el comprador ya vive del mismo problema: conseguir clientes B2B.
 * Un clic deja todo listo; siguen siendo editables después.
 */
interface Preset {
  id: string;
  etiqueta: string;
  keyword: string;
  country: string;
  city: string;
  porQue: string;
  favorita?: boolean;
}

const PRESETS: Preset[] = [
  {
    id: "agencias",
    etiqueta: "Agencias de marketing",
    keyword: "agencia de marketing digital",
    country: "Colombia",
    city: "",
    porQue: "Viven de conseguir clientes y le venden a otras empresas. El dolor es el suyo.",
    favorita: true,
  },
  {
    id: "consultoras",
    etiqueta: "Consultores y consultoras",
    keyword: "consultor de negocios",
    country: "Colombia",
    city: "",
    porQue: "Venden servicios de ticket alto: una reunión más al mes ya paga el sistema.",
    favorita: true,
  },
  {
    id: "software",
    etiqueta: "Software y SaaS B2B",
    keyword: "software empresarial",
    country: "Colombia",
    city: "",
    porQue: "Ciclo de venta largo y consultivo. Entienden lo que hace la herramienta sin explicación.",
  },
  {
    id: "reclutamiento",
    etiqueta: "Reclutamiento y headhunting",
    keyword: "reclutamiento y selección de personal",
    country: "Colombia",
    city: "",
    porQue: "Ya trabajan dentro de LinkedIn todos los días. Cero fricción para adoptarlo.",
  },
  {
    id: "contable",
    etiqueta: "Servicios contables y legales",
    keyword: "servicios contables para empresas",
    country: "Colombia",
    city: "",
    porQue: "Clientes recurrentes y prospección casi siempre por referido: el canal está vacío.",
  },
  {
    id: "logistica",
    etiqueta: "Logística e importación",
    keyword: "logística e importaciones",
    country: "Colombia",
    city: "",
    porQue: "Venden a empresas por volumen; un solo cliente nuevo justifica el año.",
  },
];

export function FuentesView({
  cargando,
  onBuscarMulti,
}: {
  canal?: Canal;
  clienteNombre?: string;
  cargando: boolean;
  modoDev?: boolean;
  onBuscarMulti: (q: ConsultaMulti) => void;
  onAvanzada?: (f: "negocios" | "linkedin") => void;
  onElegirEcommerce?: () => void;
}) {
  // LinkedIn es la única fuente conectada: viene marcada y no se desmarca.
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [keyword, setKeyword] = useState(PRESETS[0].keyword);
  const [country, setCountry] = useState(PRESETS[0].country || PAIS_DEFAULT);
  const [ciudadSel, setCiudadSel] = useState("");
  const [ciudadOtra, setCiudadOtra] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [masInfo, setMasInfo] = useState(true);
  const [cantidad, setCantidad] = useState(15);
  const [topeUsd, setTopeUsd] = useState(5);
  const [usadoUsd, setUsadoUsd] = useState<number | null>(null);

  const ciudades = ciudadesDe(country);
  const city = ciudadSel === CIUDAD_OTRA ? ciudadOtra.trim() : ciudadSel;

  function cambiarPais(p: string) {
    setCountry(p);
    setCiudadSel("");
    setCiudadOtra("");
  }

  /** Un preset deja la búsqueda lista: nicho, país y ciudad de una vez. */
  function aplicarPreset(p: Preset) {
    setPresetId(p.id);
    setKeyword(p.keyword);
    setCountry(p.country);
    setCiudadSel(p.city);
    setCiudadOtra("");
  }

  // Presupuesto tope + gasto ya consumido, para la barra de costo.
  useEffect(() => {
    fetch("/api/gasto")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.topeUsd === "number") setTopeUsd(d.topeUsd);
        if (typeof d.usadoUsd === "number") setUsadoUsd(d.usadoUsd);
      })
      .catch(() => {});
  }, []);

  const costoTotal = useMemo(() => estimarCosto(cantidad), [cantidad]);
  const presetActivo = PRESETS.find((p) => p.id === presetId);
  const puedeBuscar = keyword.trim().length > 0 && !cargando;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-9">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          <Radar size={22} className="text-li-blue" /> Extracción
          <MarcaVideo escena={1} />
        </h1>
        <p className="mt-1 text-[14.5px] text-li-text-2">
          De acá salen los leads. Elegí una búsqueda guardada o escribí el nicho a mano.
        </p>
      </header>

      {/* BÚSQUEDAS GUARDADAS — lo primero que se ve: no arranca en blanco. */}
      <section className="card-li rounded-lg bg-li-surface p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Star size={15} className="text-li-blue" fill="currentColor" /> Búsquedas
          guardadas
        </h2>
        <p className="mt-0.5 text-[12.5px] text-li-text-2">
          Los nichos donde un sistema de prospección se vende solo. Un clic la deja lista.
        </p>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = presetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => aplicarPreset(p)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  on
                    ? "border-li-blue bg-li-blue text-white"
                    : "border-li-border text-li-text-2 hover:border-li-blue hover:text-li-text"
                }`}
              >
                {p.favorita && (
                  <Star size={11} fill="currentColor" className={on ? "" : "text-amber-500"} />
                )}
                {p.etiqueta}
              </button>
            );
          })}
        </div>

        {presetActivo && (
          <p className="mt-3 rounded-md border-l-2 border-li-blue bg-li-blue/[0.05] px-3 py-2 text-[12.5px] leading-snug text-li-text-2">
            <strong className="text-li-text">Por qué este nicho:</strong>{" "}
            {presetActivo.porQue}
          </p>
        )}
      </section>

      {/* FUENTES */}
      <div className="card-li mt-4 overflow-hidden rounded-lg bg-li-surface">
        <div className="border-b border-li-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
          Fuente
        </div>
        <div className="divide-y divide-li-border">
          {FUENTES.map((f) => (
            <div
              key={f.id}
              className={`flex items-center gap-2.5 px-4 py-2.5 ${
                f.lista ? "bg-li-blue/[0.05]" : "opacity-55"
              }`}
            >
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${
                  f.lista
                    ? "border-li-blue bg-li-blue text-white"
                    : "border-li-border bg-black/[0.04]"
                }`}
              >
                {f.lista ? <Check size={12} strokeWidth={3} /> : <Lock size={9} />}
              </span>
              <f.Icono size={15} className="shrink-0 text-li-text-2" />
              <span className="truncate text-[14px] font-medium">{f.titulo}</span>
              {f.lista ? (
                <span className="ml-auto shrink-0 text-[12px] text-li-text-2">
                  <span className="hidden sm:inline">{f.nota} · </span>
                  <span className="font-semibold tabular-nums text-li-text">
                    {porLead(f.costo(1))}
                  </span>
                  /lead
                </span>
              ) : (
                <span className="ml-auto shrink-0 rounded-full border border-li-border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-li-text-2">
                  Próximamente
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="border-t border-li-border px-4 py-2.5 text-[12px] leading-snug text-li-text-2">
          <strong className="text-li-text">LinkedIn:</strong> {FUENTES[0].trae}
        </p>
      </div>

      {/* CONSULTA */}
      <div className="card-li mt-4 rounded-lg bg-li-surface p-5">
        <label className="block text-[13.5px] font-semibold">Rubro / nicho</label>
        <input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPresetId(""); // escribir a mano deja de ser un preset
          }}
          placeholder="Ej: agencias de marketing, consultores, software B2B"
          className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
        />

        <button
          type="button"
          onClick={() => setMasInfo((v) => !v)}
          className="mt-4 flex w-full items-center gap-1.5 text-[13px] font-semibold text-li-blue"
        >
          <ChevronDown
            size={15}
            className={`transition-transform ${masInfo ? "rotate-180" : ""}`}
          />
          Dónde buscar
        </button>

        {masInfo && (
          <div className="mt-3 space-y-4 rounded-lg border border-dashed border-li-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[13.5px] font-semibold">País</label>
                <select
                  value={country}
                  onChange={(e) => cambiarPais(e.target.value)}
                  className="mt-1.5 h-[46px] w-full rounded-md border border-li-border bg-li-surface px-3 text-[15px] outline-none focus:border-li-blue"
                >
                  {PAISES.map((c) => (
                    <option key={c} value={c}>
                      {c === TODO_EEUU ? "Estados Unidos" : c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13.5px] font-semibold">Ciudad</label>
                <select
                  value={ciudadSel}
                  onChange={(e) => setCiudadSel(e.target.value)}
                  className="mt-1.5 h-[46px] w-full rounded-md border border-li-border bg-li-surface px-3 text-[15px] outline-none focus:border-li-blue"
                >
                  <option value="">Todo el país</option>
                  {ciudades.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={CIUDAD_OTRA}>Otra ciudad (escribir)…</option>
                </select>
                {ciudadSel === CIUDAD_OTRA && (
                  <input
                    value={ciudadOtra}
                    onChange={(e) => setCiudadOtra(e.target.value)}
                    placeholder="Escribí la ciudad"
                    autoFocus
                    className="mt-1.5 h-[42px] w-full rounded-md border border-li-border bg-li-surface px-3 text-[14px] outline-none focus:border-li-blue"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold">
                Departamento{" "}
                <span className="font-normal text-li-text-2">(opcional)</span>
              </label>
              <input
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ej: Antioquia — solo si la ciudad no alcanza a afinar"
                className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2 text-[14px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <label className="text-[13.5px] font-semibold">Cuántos traer</label>
            <span className="text-[14px] font-semibold tabular-nums text-li-blue">
              {cantidad}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-li-blue)]"
          />
        </div>

        {(() => {
          const usado = usadoUsd ?? 0;
          const proyectado = usado + costoTotal;
          const anchoUsado = topeUsd > 0 ? Math.min(100, (usado / topeUsd) * 100) : 0;
          const anchoBusqueda =
            topeUsd > 0 ? Math.min(100 - anchoUsado, (costoTotal / topeUsd) * 100) : 0;
          const excede = topeUsd > 0 && proyectado > topeUsd;
          return (
            <div className="mt-4 rounded-lg border border-li-border bg-black/[0.02] px-4 py-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-li-text-2">
                    Leads
                  </div>
                  <div className="mt-0.5 text-[18px] font-bold tabular-nums text-li-text">
                    {cantidad}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-li-text-2">
                    Cuesta
                  </div>
                  <div
                    className={`mt-0.5 text-[18px] font-bold tabular-nums ${
                      excede ? "text-red-600" : "text-li-blue"
                    }`}
                  >
                    ~{formatearUsd(costoTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-li-text-2">
                    Tope del mes
                  </div>
                  <div className="mt-0.5 text-[18px] font-bold tabular-nums text-li-text-2">
                    {formatearUsd(topeUsd)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
                <div className="h-full bg-li-text-2/40" style={{ width: `${anchoUsado}%` }} />
                <div
                  className={`h-full transition-all ${excede ? "bg-red-500" : "bg-li-blue"}`}
                  style={{ width: `${anchoBusqueda}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-li-text-2">
                <span>
                  {usadoUsd != null ? `Ya usado ${formatearUsd(usado)}` : "LinkedIn"}
                </span>
                {excede ? (
                  <span className="font-semibold text-red-600">
                    Supera el tope — se bloquea antes de gastar
                  </span>
                ) : (
                  <span>Proyectado {formatearUsd(proyectado)}</span>
                )}
              </div>
            </div>
          );
        })()}

        <button
          onClick={() =>
            onBuscarMulti({
              fuentes: ["linkedin"],
              keyword,
              country,
              city,
              departamento: departamento.trim(),
              cantidad,
            })
          }
          disabled={!puedeBuscar}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-li-blue py-3 text-[16px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Radar size={18} strokeWidth={2.5} />
          {cargando ? "Extrayendo…" : `Extraer ${cantidad} leads de LinkedIn`}
        </button>
      </div>
    </div>
  );
}
