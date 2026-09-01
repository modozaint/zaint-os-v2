"use client";

import { useMemo, useState } from "react";
import { Briefcase, Factory, MapPinned, Search, X } from "lucide-react";
import { FondoParticulas } from "@/components/FondoParticulas";
import { BusquedaNegocios } from "@/components/BusquedaNegocios";
import { SelectorCatalogo, type OpcionCatalogo } from "@/components/SelectorCatalogo";
import { estimarCosto, formatearUsd } from "@/lib/costo";
import { PAISES, PAIS_DEFAULT, TODO_EEUU, regionesDe } from "@/lib/us-states";
import type { ParametrosBusqueda, ParametrosNegocios } from "@/lib/types";

type Fuente = "linkedin" | "negocios";

const SUGERENCIAS = [
  "Marketing Agency",
  "Growth",
  "Performance Marketing",
  "Paid Media",
  "SEO",
];


export function BusquedaView({
  onBuscar,
  onBuscarNegocios,
  cargando,
  fuenteInicial,
  onVolver,
}: {
  onBuscar: (p: ParametrosBusqueda) => void;
  onBuscarNegocios: (p: ParametrosNegocios) => void;
  cargando: boolean;
  fuenteInicial?: Fuente;
  onVolver?: () => void;
}) {
  const [fuente, setFuente] = useState<Fuente>(fuenteInicial ?? "linkedin");
  const [keyword, setKeyword] = useState("");
  // Cargos e industrias se ELIGEN del catálogo de LinkedIn (id + nombre real),
  // no se escriben: así el término siempre es uno que LinkedIn reconoce.
  const [titles, setTitles] = useState<OpcionCatalogo[]>([]);
  const [industrias, setIndustrias] = useState<OpcionCatalogo[]>([]);
  const [country, setCountry] = useState(PAIS_DEFAULT);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [limit, setLimit] = useState(20);
  /** Descartar de una a quien la IA juzgue que no puede comprar esta oferta. */
  const [soloCualificados, setSoloCualificados] = useState(true);

  const regionesDisponibles = useMemo(() => regionesDe(country), [country]);
  const labelRegion = country === TODO_EEUU ? "estado" : "departamento";

  const costo = useMemo(() => estimarCosto(limit), [limit]);

  return (
    <div className="relative min-h-full">
      <FondoParticulas />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 py-10">
        {onVolver && (
          <button
            onClick={onVolver}
            className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-li-text-2 transition-colors hover:text-li-blue"
          >
            ← Elegir otra fuente
          </button>
        )}
        <header className="mb-5">
          <h1 className="text-[26px] font-semibold tracking-tight">
            Buscar leads
          </h1>
          <p className="mt-1 text-[15px] text-li-text-2">
            {fuente === "linkedin"
              ? "Profesionales en LinkedIn: perfiles B2B, con su último post para personalizar."
              : "Negocios locales en Google Maps: cualquier nicho, con teléfono y web para contactar."}
          </p>
        </header>

        {/* Selector de fuente */}
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          {(
            [
              { id: "linkedin", label: "LinkedIn (personas)", Icono: Briefcase },
              { id: "negocios", label: "Google Maps (negocios)", Icono: MapPinned },
            ] as const
          ).map(({ id, label, Icono }) => {
            const on = fuente === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFuente(id)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[14px] font-semibold transition-colors ${
                  on
                    ? "border-li-blue bg-li-blue/5 text-li-blue"
                    : "border-li-border text-li-text-2 hover:border-li-blue/50"
                }`}
              >
                <Icono size={17} /> {label}
              </button>
            );
          })}
        </div>

        {fuente === "negocios" ? (
          <BusquedaNegocios onBuscar={onBuscarNegocios} cargando={cargando} />
        ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onBuscar({
              keyword,
              // Al motor le viaja el TEXTO del cargo: LinkedIn ignora el id de
              // cargo en la búsqueda normal, pero su término oficial es mejor
              // palabra clave que uno inventado.
              titles: titles.map((t) => t.title),
              country,
              regiones,
              city,
              limit,
              industrias,
              soloCualificados,
            });
          }}
          className="card-li rounded-lg bg-li-surface p-6"
        >
          {/* Rubro */}
          <label className="block text-[14px] font-semibold" htmlFor="keyword">
            Rubro / palabra clave
          </label>
          <input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Ej: agencia de marketing digital"
            className="mt-2 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setKeyword(s)}
                className="rounded-full border border-li-border px-3 py-1 text-[13px] text-li-text-2 transition-colors hover:border-li-blue hover:bg-li-blue/5 hover:text-li-blue"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Industria — el filtro que MÁS cualifica, y el único (con la
              ubicación) que LinkedIn aplica de verdad en la búsqueda normal. */}
          <div className="mt-7">
            <SelectorCatalogo
              tipo="INDUSTRY"
              etiqueta="Industria"
              ayuda="El filtro que más sube la calidad. Escribí para buscar y elegí de la lista de LinkedIn."
              placeholder="Ej: comercio, software, salud…"
              seleccionadas={industrias}
              onChange={setIndustrias}
              icono={<Factory size={15} className="text-li-blue" />}
            />
          </div>

          {/* Cargos */}
          <div className="mt-2">
            <SelectorCatalogo
              tipo="JOB_TITLE"
              etiqueta="Cargos"
              ayuda="Se suman a la palabra clave. LinkedIn no filtra por cargo en la búsqueda normal (eso es de Sales Navigator), pero usar su término oficial mejora los resultados."
              placeholder="Ej: dueño, gerente, fundador…"
              seleccionadas={titles}
              onChange={setTitles}
              icono={<Briefcase size={15} className="text-li-blue" />}
            />
          </div>

          {/* Calidad del lead. LinkedIn no deja filtrar por cargo ni seniority,
              así que el descarte se hace después de traerlos, con el juicio de
              la IA que ya lee cada perfil. */}
          <label className="mt-2 flex cursor-pointer items-start gap-2.5 rounded-lg border border-li-border p-3.5 transition-colors hover:border-li-blue/50">
            <input
              type="checkbox"
              checked={soloCualificados}
              onChange={(e) => setSoloCualificados(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-li-blue)]"
            />
            <span className="text-[13.5px]">
              <span className="font-medium">Descartar a quien no pueda comprar</span>
              <span className="mt-0.5 block text-li-text-2">
                La IA lee cada perfil y saca a estudiantes, gente de otra área y
                puestos sin decisión. Trae menos leads, pero cada solicitud cuenta:
                el cupo diario de LinkedIn es limitado.
              </span>
            </span>
          </label>

          {/* Ubicación */}
          <div className="mt-7">
            <label className="block text-[14px] font-semibold">Ubicación</label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setRegiones([]); // al cambiar de país, volvé a "todo el país"
                }}
                className="h-[46px] w-full rounded-md border border-li-border bg-li-surface px-3 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
              >
                {PAISES.map((c) => (
                  <option key={c} value={c}>
                    {c === TODO_EEUU ? "Estados Unidos" : c}
                  </option>
                ))}
              </select>
              <select
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && !regiones.includes(v)) setRegiones([...regiones, v]);
                }}
                className="h-[46px] w-full rounded-md border border-li-border bg-li-surface px-3 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
              >
                <option value="">
                  {regiones.length ? `Añadir otro ${labelRegion}…` : "Todo el país"}
                </option>
                {regionesDisponibles
                  .filter((r) => !regiones.includes(r))
                  .map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
              </select>
            </div>

            {/* Provincias elegidas (cada una se busca suelta) */}
            {regiones.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {regiones.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 rounded-full bg-li-blue/10 py-1 pl-3 pr-1.5 text-[13px] font-medium text-li-blue"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => setRegiones(regiones.filter((x) => x !== r))}
                      aria-label={`Quitar ${r}`}
                      className="rounded-full p-0.5 transition-colors hover:bg-li-blue/20"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={country === TODO_EEUU ? "Ej: Austin" : "Ej: Medellín"}
              className="mt-3 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
            />
            <p className="mt-1.5 text-[12px] text-li-text-2">
              {regiones.length > 1
                ? `Elegiste ${regiones.length} ${labelRegion}s: cada uno se busca por separado.`
                : `Podés elegir varios ${labelRegion}s, y con UNO afinar aún más por ciudad.`}
            </p>
          </div>

          {/* Cantidad */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <label className="text-[14px] font-semibold" htmlFor="limit">
                Cantidad
              </label>
              <span className="text-[14px] font-semibold tabular-nums text-li-blue">
                {limit} leads
              </span>
            </div>
            <input
              id="limit"
              type="range"
              min={10}
              max={50}
              step={1}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--color-li-blue)]"
            />
            <p className="mt-1.5 text-[12px] text-li-text-2">
              Coste estimado en Apify:{" "}
              <span className="font-medium tabular-nums">
                ~{formatearUsd(costo)}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando || !keyword.trim()}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-li-blue py-3 text-[16px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Search size={18} strokeWidth={2.5} />
            Buscar leads
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
