"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { estimarCostoNegocios, formatearUsd } from "@/lib/costo";
import type { ParametrosNegocios } from "@/lib/types";

const RUBROS = [
  "Taller mecánico",
  "Clínica dental",
  "Restaurante",
  "Barbería",
  "Inmobiliaria",
  "Gimnasio",
];

const ESTRELLAS = [
  { v: 0, l: "Cualquier rating" },
  { v: 3, l: "3★ o más" },
  { v: 4, l: "4★ o más" },
];

export function BusquedaNegocios({
  onBuscar,
  cargando,
}: {
  onBuscar: (p: ParametrosNegocios) => void;
  cargando: boolean;
}) {
  const [keyword, setKeyword] = useState("");
  const [ubicacion, setUbicacion] = useState("Medellín, Colombia");
  const [cantidad, setCantidad] = useState(15);
  const [soloConWeb, setSoloConWeb] = useState(false);
  const [omitirCerrados, setOmitirCerrados] = useState(true);
  const [minEstrellas, setMinEstrellas] = useState(0);

  const costo = useMemo(() => estimarCostoNegocios(cantidad), [cantidad]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar({ keyword, ubicacion, cantidad, soloConWeb, omitirCerrados, minEstrellas });
      }}
      className="card-li rounded-lg bg-li-surface p-6"
    >
      {/* Rubro */}
      <label className="block text-[14px] font-semibold" htmlFor="rubro">
        Rubro del negocio
      </label>
      <input
        id="rubro"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Ej: taller mecánico, clínica dental"
        className="mt-2 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
      />
      <div className="mt-2.5 flex flex-wrap gap-2">
        {RUBROS.map((s) => (
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

      {/* Ubicación */}
      <div className="mt-7">
        <label className="block text-[14px] font-semibold" htmlFor="ubic">
          Ubicación
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-li-border bg-li-surface px-3">
          <MapPin size={16} className="shrink-0 text-li-text-2" />
          <input
            id="ubic"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ciudad, País — ej: Medellín, Colombia"
            className="w-full bg-transparent py-2.5 text-[15px] outline-none"
          />
        </div>
        <p className="mt-1.5 text-[12px] text-li-text-2">
          Una ubicación por búsqueda. Podés afinar con la zona: "Laureles, Medellín, Colombia".
        </p>
      </div>

      {/* Filtros de calidad */}
      <div className="mt-7">
        <label className="block text-[14px] font-semibold">Filtros de calidad</label>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={soloConWeb}
              onChange={(e) => setSoloConWeb(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-li-blue)]"
            />
            Solo con página web activa
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={omitirCerrados}
              onChange={(e) => setOmitirCerrados(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-li-blue)]"
            />
            Omitir negocios cerrados
          </label>
          <select
            value={minEstrellas}
            onChange={(e) => setMinEstrellas(Number(e.target.value))}
            className="rounded-md border border-li-border bg-li-surface px-3 py-2 text-[14px] outline-none focus:border-li-blue"
          >
            {ESTRELLAS.map((e) => (
              <option key={e.v} value={e.v}>
                {e.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cantidad */}
      <div className="mt-7">
        <div className="flex items-baseline justify-between">
          <label className="text-[14px] font-semibold" htmlFor="cant">
            Cantidad
          </label>
          <span className="text-[14px] font-semibold tabular-nums text-li-blue">
            {cantidad} negocios
          </span>
        </div>
        <input
          id="cant"
          type="range"
          min={5}
          max={50}
          step={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--color-li-blue)]"
        />
        <p className="mt-1.5 text-[12px] text-li-text-2">
          Coste estimado en Apify:{" "}
          <span className="font-medium tabular-nums">~{formatearUsd(costo)}</span>
          {" "}(medido: ~$0,007 por negocio)
        </p>
      </div>

      <button
        type="submit"
        disabled={cargando || !keyword.trim() || !ubicacion.trim()}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-li-blue py-3 text-[16px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Search size={18} strokeWidth={2.5} />
        Buscar negocios
      </button>
    </form>
  );
}
