"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  History,
  MapPin,
  Search,
  ShoppingBag,
} from "lucide-react";
import {
  FUENTE_EXTRACCION_LABEL,
  type Extraccion,
  type FuenteExtraccion,
} from "@/lib/types";

const ICONO: Record<FuenteExtraccion, typeof Search> = {
  linkedin: Search,
  negocios: MapPin,
  instagram: Hash,
  ecommerce: ShoppingBag,
};

const ESTADO_BADGE: Record<Extraccion["estado"], { label: string; clase: string }> = {
  completa: { label: "COMPLETA", clase: "text-emerald-600" },
  parcial: { label: "PARCIAL", clase: "text-amber-600" },
  sin_resultados: { label: "SIN RESULTADOS", clase: "text-li-text-2" },
};

function claveMes(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function etiquetaMes(d: Date): string {
  const s = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function etiquetaDia(t: number): string {
  const s = new Date(t).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const FUENTES: (FuenteExtraccion | "todas")[] = [
  "todas",
  "linkedin",
  "negocios",
  "instagram",
  "ecommerce",
];

/**
 * Historial de EXTRACCIONES (no de personas): el registro de cada corrida de
 * búsqueda, mes a mes, con su costo. Filtrable por fuente. Para buscar personas
 * concretas está la sección Leads.
 */
export function HistorialView() {
  const [extracciones, setExtracciones] = useState<Extraccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mes, setMes] = useState(() => new Date());
  const [filtro, setFiltro] = useState<FuenteExtraccion | "todas">("todas");

  useEffect(() => {
    fetch("/api/historial")
      .then((r) => r.json())
      .then((d) => setExtracciones(d.extracciones ?? []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const claveActual = `${mes.getFullYear()}-${mes.getMonth()}`;

  // Todo lo del mes visible (para el resumen del encabezado), y luego filtrado.
  const delMes = useMemo(
    () => extracciones.filter((e) => claveMes(e.cuando) === claveActual),
    [extracciones, claveActual],
  );
  const visibles = useMemo(
    () => (filtro === "todas" ? delMes : delMes.filter((e) => e.fuente === filtro)),
    [delMes, filtro],
  );

  const totalCosto = delMes.reduce((s, e) => s + e.costoUsd, 0);

  // Agrupar por día.
  const porDia = useMemo(() => {
    const map = new Map<string, Extraccion[]>();
    for (const e of visibles) {
      const k = new Date(e.cuando).toDateString();
      (map.get(k) ?? map.set(k, []).get(k)!).push(e);
    }
    return [...map.entries()].sort(
      (a, b) => (b[1][0]?.cuando ?? 0) - (a[1][0]?.cuando ?? 0),
    );
  }, [visibles]);

  function moverMes(delta: number) {
    setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-li-text-2">
          Auditoría
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          <History size={22} className="text-li-blue" /> Historial
        </h1>
        <p className="mt-1 text-[14px] text-li-text-2">
          El registro de cada extracción, mes a mes. Para buscar personas
          concretas, usá la sección Leads.
        </p>
      </header>

      {/* Filtros por fuente */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FUENTES.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
              filtro === f
                ? "bg-li-blue text-white"
                : "border border-li-border text-li-text-2 hover:border-li-blue hover:text-li-blue"
            }`}
          >
            {f === "todas" ? "Todas" : FUENTE_EXTRACCION_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Navegador de mes */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-li-border bg-li-surface px-4 py-3">
        <button
          onClick={() => moverMes(-1)}
          aria-label="Mes anterior"
          className="rounded-lg p-1.5 text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold">{etiquetaMes(mes)}</div>
          <div className="text-[12px] text-li-text-2 tabular-nums">
            {delMes.length} corrida(s) · ${totalCosto.toFixed(2)}
          </div>
        </div>
        <button
          onClick={() => moverMes(1)}
          aria-label="Mes siguiente"
          className="rounded-lg p-1.5 text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {cargando ? (
        <p className="mt-8 text-[14px] text-li-text-2">Cargando…</p>
      ) : porDia.length === 0 ? (
        <div className="mt-6 card-li rounded-xl bg-li-surface p-8 text-center">
          <History size={24} className="mx-auto text-li-text-2" />
          <p className="mt-3 text-[14px] font-medium">Sin extracciones este mes.</p>
          <p className="mt-1 text-[13px] text-li-text-2">
            Cada búsqueda que corras quedará registrada acá.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {porDia.map(([dia, items]) => (
            <div key={dia}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-li-text">
                  {etiquetaDia(items[0].cuando)}
                </h3>
                <span className="text-[12px] text-li-text-2 tabular-nums">
                  {items.length} corrida(s) · $
                  {items.reduce((s, e) => s + e.costoUsd, 0).toFixed(2)}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-li-border">
                {items.map((e, i) => {
                  const Icono = ICONO[e.fuente];
                  const badge = ESTADO_BADGE[e.estado];
                  return (
                    <div
                      key={e.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i > 0 ? "border-t border-li-border/60" : ""
                      }`}
                    >
                      <Icono size={16} className="shrink-0 text-li-text-2" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium text-li-text">
                          {e.termino || "—"}
                          {e.ubicacion && (
                            <span className="text-li-text-2"> · {e.ubicacion}</span>
                          )}
                        </div>
                        <div className="text-[11.5px] text-li-text-2">
                          {new Date(e.cuando).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {FUENTE_EXTRACCION_LABEL[e.fuente]}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[13px] font-semibold tabular-nums text-li-text">
                          {e.resultados} result.
                        </div>
                        <div className={`text-[10.5px] font-semibold ${badge.clase}`}>
                          {badge.label} · ${e.costoUsd.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
