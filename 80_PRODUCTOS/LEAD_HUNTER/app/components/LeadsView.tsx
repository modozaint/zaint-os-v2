"use client";

import { useEffect, useMemo, useState } from "react";
import { MarcaVideo } from "@/components/MarcaVideo";
import {
  Eraser,
  AtSign,
  KanbanSquare,
  Search,
  Table2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  ESTADOS,
  ESTADO_COLOR,
  ESTADO_PUNTO,
  type EstadoLead,
  type Lead,
  type OrigenLead,
} from "@/lib/types";
import { arrobaInstagram, urlInstagram } from "@/lib/contacto";
import { LeadCard } from "./LeadCard";

type Vista = "kanban" | "tabla";

/** Etiqueta corta de la fuente/origen del lead, para la columna de la tabla. */
const FUENTE_LABEL: Record<OrigenLead, string> = {
  linkedin_busqueda: "LinkedIn",
  negocio_maps: "Google Maps",
  instagram: "Instagram",
  compra: "Compró",
  visita_producto: "Visitó",
  interaccion_post: "Interactuó",
};

const ESTADO_LABEL: Record<EstadoLead, string> = ESTADOS.reduce(
  (acc, e) => ({ ...acc, [e.id]: e.label }),
  {} as Record<EstadoLead, string>,
);

export function LeadsView({
  leads,
  onAbrir,
  onMover,
  onEliminar,
  onIrABusqueda,
  onLimpiar,
}: {
  leads: Lead[];
  onAbrir: (lead: Lead) => void;
  onMover: (id: string, estado: EstadoLead) => void;
  onEliminar: (id: string) => void;
  onIrABusqueda: () => void;
  onLimpiar: (modo: "todos" | "reunion" | "cerrados") => void;
}) {
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<EstadoLead | null>(null);
  const [menuLimpiar, setMenuLimpiar] = useState(false);
  const [vista, setVista] = useState<Vista>("kanban");

  useEffect(() => {
    try {
      const v = localStorage.getItem("lh_vista_leads");
      if (v === "kanban" || v === "tabla") setVista(v);
    } catch {}
  }, []);

  function cambiarVista(v: Vista) {
    setVista(v);
    try {
      localStorage.setItem("lh_vista_leads", v);
    } catch {}
  }

  if (!leads.length) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-16">
        <div className="card-li max-w-sm rounded-lg bg-li-surface px-8 py-10 text-center">
          <h2 className="text-[18px] font-semibold">Aún no hay leads</h2>
          <p className="mt-2 text-[15px] text-li-text-2">
            Empieza una búsqueda.
          </p>
          <button
            onClick={onIrABusqueda}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
          >
            <Search size={16} strokeWidth={2.5} />
            Ir a Búsqueda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-6 py-6">
      <div className="mb-5 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-semibold tracking-tight">Leads
          <MarcaVideo escena={2} />
        </h1>
          {/* Toggle de vista Kanban / Tabla */}
          <div className="inline-flex rounded-lg border border-li-border p-0.5">
            <button
              onClick={() => cambiarVista("kanban")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                vista === "kanban" ? "bg-li-blue text-white" : "text-li-text-2 hover:text-li-text"
              }`}
            >
              <KanbanSquare size={14} /> Kanban
            </button>
            <button
              onClick={() => cambiarVista("tabla")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                vista === "tabla" ? "bg-li-blue text-white" : "text-li-text-2 hover:text-li-text"
              }`}
            >
              <Table2 size={14} /> Tabla
            </button>
          </div>
        </div>
        {menuLimpiar ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-li-text-2">Limpiar:</span>
            <button
              onClick={() => {
                onLimpiar("cerrados");
                setMenuLimpiar(false);
              }}
              className="rounded-full border border-li-border px-3 py-1.5 text-[13px] font-medium text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
            >
              Cerrados (reunión + frío)
            </button>
            <button
              onClick={() => {
                onLimpiar("todos");
                setMenuLimpiar(false);
              }}
              className="rounded-full bg-red-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700"
            >
              Todos
            </button>
            <button
              onClick={() => setMenuLimpiar(false)}
              className="text-[13px] text-li-text-2 hover:underline"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMenuLimpiar(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-li-border px-4 py-2 text-[13.5px] font-medium text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
          >
            <Eraser size={15} /> Limpiar tablero
          </button>
        )}
      </div>

      {vista === "tabla" ? (
        <TablaLeads leads={leads} onAbrir={onAbrir} onEliminar={onEliminar} />
      ) : (
      <div
        className="scroll-fino grid min-h-0 flex-1 gap-4 overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${ESTADOS.length}, minmax(248px, 1fr))`,
        }}
      >
        {ESTADOS.map(({ id, label }) => {
          const deLaColumna = leads.filter((l) => l.estado === id);
          const resaltada = encima === id && arrastrando !== null;
          return (
            <section
              key={id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setEncima(id);
              }}
              onDragLeave={() => setEncima((v) => (v === id ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData("text/plain");
                if (leadId) onMover(leadId, id);
                setEncima(null);
                setArrastrando(null);
              }}
              className={`flex min-h-0 flex-col rounded-lg border transition-colors ${
                resaltada
                  ? "border-li-blue bg-li-blue/[0.06]"
                  : "border-li-border bg-black/[0.02]"
              }`}
            >
              <header className="flex shrink-0 items-center justify-between border-b border-li-border px-3.5 py-3">
                <h2 className="text-[14px] font-semibold">{label}</h2>
                <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-li-text-2">
                  {deLaColumna.length}
                </span>
              </header>

              <div className="scroll-fino flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
                {deLaColumna.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    arrastrando={arrastrando === lead.id}
                    onAbrir={() => onAbrir(lead)}
                    onEliminar={onEliminar}
                    onDragStart={() => setArrastrando(lead.id)}
                    onDragEnd={() => {
                      setArrastrando(null);
                      setEncima(null);
                    }}
                  />
                ))}
                {!deLaColumna.length && (
                  <p className="px-1 py-6 text-center text-[13px] text-li-text-2/70">
                    Arrastrá tarjetas acá
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      )}
    </div>
  );
}

/**
 * Vista en tabla: 4 columnas y filtros. Cada lead es una fila con lo que se
 * necesita para decidir (quién es · en qué anda · cómo contactarlo), no todos
 * los campos que existen. Lo demás se ve abriendo la ficha.
 */
function TablaLeads({
  leads,
  onAbrir,
  onEliminar,
}: {
  leads: Lead[];
  onAbrir: (lead: Lead) => void;
  onEliminar: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoLead | "todos">("todos");
  const [fuente, setFuente] = useState<OrigenLead | "todas">("todas");
  const [cargo, setCargo] = useState("todos");

  /** Cargos realmente presentes: el filtro solo ofrece lo que existe. */
  const cargos = useMemo(
    () =>
      [...new Set(leads.map((l) => l.cargo?.trim()).filter(Boolean))].sort() as string[],
    [leads],
  );
  /** Fuentes realmente presentes (no listar Instagram si no hay ninguno). */
  const fuentes = useMemo(
    () => [...new Set(leads.map((l) => l.origen ?? "linkedin_busqueda"))],
    [leads],
  );
  /** Cuántos hay por estado: el número va en el propio chip del filtro. */
  const conteo = useMemo(() => {
    const c = {} as Record<EstadoLead, number>;
    for (const e of ESTADOS) c[e.id] = 0;
    for (const l of leads) c[l.estado] = (c[l.estado] ?? 0) + 1;
    return c;
  }, [leads]);

  const filtro = q.trim().toLowerCase();
  const filas = useMemo(
    () =>
      leads.filter((l) => {
        if (estado !== "todos" && l.estado !== estado) return false;
        if (fuente !== "todas" && (l.origen ?? "linkedin_busqueda") !== fuente)
          return false;
        if (cargo !== "todos" && l.cargo?.trim() !== cargo) return false;
        if (!filtro) return true;
        return [l.nombre, l.empresa, l.cargo, l.ubicacion, l.contacto, l.headline]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(filtro);
      }),
    [leads, estado, fuente, cargo, filtro],
  );

  const hayFiltro =
    estado !== "todos" || fuente !== "todas" || cargo !== "todos" || filtro !== "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filtros */}
      <div className="mb-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-li-text-2"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, empresa, @…"
              className="w-full rounded-lg border border-li-border bg-transparent py-2 pl-9 pr-3 text-[13.5px] outline-none focus:border-li-blue"
            />
          </div>

          {fuentes.length > 1 && (
            <select
              value={fuente}
              onChange={(e) => setFuente(e.target.value as OrigenLead | "todas")}
              className="rounded-lg border border-li-border bg-transparent px-2.5 py-2 text-[13px] outline-none focus:border-li-blue"
            >
              <option value="todas">Toda fuente</option>
              {fuentes.map((f) => (
                <option key={f} value={f}>
                  {FUENTE_LABEL[f]}
                </option>
              ))}
            </select>
          )}

          {cargos.length > 0 && (
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="max-w-[190px] rounded-lg border border-li-border bg-transparent px-2.5 py-2 text-[13px] outline-none focus:border-li-blue"
            >
              <option value="todos">Todo cargo</option>
              {cargos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <span className="ml-auto text-[12.5px] tabular-nums text-li-text-2">
            {filas.length} de {leads.length}
          </span>
          {hayFiltro && (
            <button
              onClick={() => {
                setQ("");
                setEstado("todos");
                setFuente("todas");
                setCargo("todos");
              }}
              className="text-[12.5px] font-semibold text-li-blue hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Estados: un chip por estado, con su color y su conteo. */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setEstado("todos")}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors ${
              estado === "todos"
                ? "border-li-text bg-li-text text-white"
                : "border-li-border text-li-text-2 hover:border-li-blue"
            }`}
          >
            Todos {leads.length}
          </button>
          {ESTADOS.map((e) => (
            <button
              key={e.id}
              onClick={() => setEstado(estado === e.id ? "todos" : e.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-all ${ESTADO_COLOR[e.id]} ${
                estado === e.id ? "ring-2 ring-li-blue/40" : "opacity-75 hover:opacity-100"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${ESTADO_PUNTO[e.id]}`} />
              {e.label} {conteo[e.id] ?? 0}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-fino min-h-0 flex-1 overflow-auto rounded-lg border border-li-border">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-li-surface">
            <tr className="border-b border-li-border text-left text-[11.5px] uppercase tracking-wide text-li-text-2">
              <th className="px-3 py-2.5 font-semibold">Lead</th>
              <th className="w-[150px] px-3 py-2.5 font-semibold">Estado</th>
              <th className="w-[190px] px-3 py-2.5 font-semibold">Contacto</th>
              <th className="px-3 py-2.5 font-semibold">Nota</th>
              <th className="w-8 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filas.map((l) => {
              const arroba = arrobaInstagram(l);
              const urlIg = urlInstagram(l);
              const sub = [l.cargo, l.empresa, l.ubicacion].filter(Boolean).join(" · ");
              return (
                <tr
                  key={l.id}
                  onClick={() => onAbrir(l)}
                  className="group cursor-pointer border-b border-li-border/60 transition-colors hover:bg-li-blue/[0.04]"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-6 w-1 shrink-0 rounded-full ${ESTADO_PUNTO[l.estado]}`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-li-text">
                            {l.nombre}
                          </span>
                          {l.escalado && (
                            <TriangleAlert
                              size={13}
                              className="shrink-0 text-red-600"
                              aria-label="Escalado"
                            />
                          )}
                        </div>
                        {sub && (
                          <div className="truncate text-[12px] text-li-text-2">{sub}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${ESTADO_COLOR[l.estado]}`}
                    >
                      {ESTADO_LABEL[l.estado]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {urlIg ? (
                      <a
                        href={urlIg}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-medium text-li-blue hover:underline"
                      >
                        <AtSign size={13} className="shrink-0" />
                        {arroba}
                      </a>
                    ) : l.contacto ? (
                      <span className="font-mono text-[12.5px] text-li-text-2">
                        {l.contacto}
                      </span>
                    ) : (
                      <span className="text-[12px] text-li-text-2/70">
                        {FUENTE_LABEL[l.origen ?? "linkedin_busqueda"]} · sin dato
                      </span>
                    )}
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 text-li-text-2">
                    {(l.motivoEscalado || l.nota || l.notaAgente || "")
                      .split("\n")
                      .pop() || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(l.id);
                      }}
                      aria-label="Eliminar lead"
                      className="rounded p-1 text-li-text-2 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-li-text-2">
                  Ningún lead con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
