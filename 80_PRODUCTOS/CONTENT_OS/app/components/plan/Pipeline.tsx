"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarOff, ChevronLeft, ChevronRight, Plus, Sparkles, Trash2, ExternalLink } from "lucide-react"
import { ESTADOS, TIPOS, type EstadoPieza, type Pieza, type TipoPieza } from "@/lib/piezasTipos"
import { marcaPorId, type MarcaId } from "@/lib/marcas"
import { cn } from "@/lib/utils"


type Rango = "semana" | "mes" | "todo"
const CLAVE_RANGO = "plan_rango"

/** Lunes de la semana de una fecha. La semana arranca lunes, como el turno. */
function lunesDe(f: Date): Date {
  const d = new Date(f)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}
const aISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** Qué días entran en el rango, y cómo se llama. `null` = todos. */
function ventana(rango: Rango, corrimiento: number) {
  const hoy = new Date()
  if (rango === "todo") return { desde: null, hasta: null, titulo: "Todo" }

  if (rango === "semana") {
    const l = lunesDe(hoy)
    l.setDate(l.getDate() + corrimiento * 7)
    const d = new Date(l); d.setDate(d.getDate() + 6)
    const mismoMes = l.getMonth() === d.getMonth()
    return {
      desde: aISO(l), hasta: aISO(d),
      titulo: corrimiento === 0 ? "Esta semana"
        : `${l.getDate()}${mismoMes ? "" : " " + MESES[l.getMonth()]} – ${d.getDate()} ${MESES[d.getMonth()]}`,
    }
  }

  const a = new Date(hoy.getFullYear(), hoy.getMonth() + corrimiento, 1)
  const z = new Date(a.getFullYear(), a.getMonth() + 1, 0)
  return {
    desde: aISO(a), hasta: aISO(z),
    titulo: `${MESES[a.getMonth()]} ${a.getFullYear()}`,
  }
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

/**
 * EL PIPELINE — cinco columnas, una por estado.
 *
 * Para qué sirve de verdad: para ver de un vistazo DÓNDE se atasca el trabajo.
 * Si hay ocho piezas en "editada" y ninguna en "publicada", el problema no es
 * producir, es publicar — y eso solo se ve así, contando por columna.
 *
 * Se mueve con flechas y no arrastrando: arrastrar no funciona con el pulgar,
 * y esto se mira desde el celular en un turno.
 */
export function Pipeline({
  piezas,
  marca,
  onCrear,
  onMover,
  onBorrar,
  rodajeDe,
  onAnalizar,
}: {
  /** A dónde lleva tocar una pieza: su hoja de rodaje. */
  rodajeDe: (id: string) => string
  piezas: Pieza[]
  marca: MarcaId
  onCrear: (titulo: string, tipo: TipoPieza) => Promise<void>
  onMover: (id: string, estado: EstadoPieza) => Promise<void>
  onBorrar: (id: string) => Promise<void>
  /** Mandar una idea a analizar. Antes esto vivia en la lista del banco; al
   *  quitarla, el boton se mudo a la columna IDEA, que es donde viven. */
  onAnalizar: (p: Pieza) => void
}) {
  const [nueva, setNueva] = useState("")
  const [tipoNueva, setTipoNueva] = useState<TipoPieza>("reel")
  const [guardando, setGuardando] = useState(false)

  /**
   * ⭐ ABRE EN LA SEMANA ACTUAL, y eso importa más que el filtro.
   *
   * Abrir el pipeline y ver las 33 piezas del mes no responde ninguna
   * pregunta. Verlo con lo de esta semana responde «qué me toca». El mes y el
   * todo quedan a un toque.
   */
  const [rango, setRango] = useState<Rango>("semana")
  const [corrimiento, setCorrimiento] = useState(0)

  useEffect(() => {
    try {
      const g = localStorage.getItem(CLAVE_RANGO)
      if (g === "semana" || g === "mes" || g === "todo") setRango(g)
    } catch {}
  }, [])

  function cambiarRango(r: Rango) {
    setRango(r); setCorrimiento(0)
    try { localStorage.setItem(CLAVE_RANGO, r) } catch {}
  }

  const { desde, hasta, titulo } = useMemo(() => ventana(rango, corrimiento), [rango, corrimiento])

  /**
   * 🔑 LAS PIEZAS SIN FECHA NO DESAPARECEN AL FILTRAR. Son justo las que hay
   * que agendar: esconderlas sería esconder el trabajo pendiente. Van aparte.
   */
  const { enRango, sinFecha } = useMemo(() => {
    const sin = piezas.filter(p => !p.fecha_objetivo)
    const con = piezas.filter(p =>
      p.fecha_objetivo && (!desde || !hasta || (p.fecha_objetivo >= desde && p.fecha_objetivo <= hasta)))
    return { enRango: con, sinFecha: sin }
  }, [piezas, desde, hasta])

  async function crear() {
    if (!nueva.trim() || guardando) return
    setGuardando(true)
    try {
      await onCrear(nueva, tipoNueva)
      setNueva("")
    } finally {
      setGuardando(false)
    }
  }

  function mover(p: Pieza, direccion: -1 | 1) {
    const i = ESTADOS.findIndex((e) => e.id === p.estado)
    const siguiente = ESTADOS[i + direccion]
    if (siguiente) onMover(p.id, siguiente.id)
  }

  const color = marcaPorId(marca).color

  return (
    <div className="flex flex-col gap-3">
      {/* El rango: qué tramo de tiempo se está mirando */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--bg-elevated)" }}>
          {(["semana", "mes", "todo"] as Rango[]).map(r => (
            <button
              key={r}
              onClick={() => cambiarRango(r)}
              className="cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize"
              style={rango === r
                ? { background: color + "33", color: "var(--text-primary)" }
                : { color: "var(--text-faint)" }}
            >
              {r}
            </button>
          ))}
        </div>

        {rango !== "todo" && (
          <div className="flex items-center gap-1">
            <button onClick={() => setCorrimiento(c => c - 1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--hover-bg)]"
                    style={{ color: "var(--text-faint)" }} aria-label="Anterior">
              <ChevronLeft size={13} />
            </button>
            <span className="min-w-[112px] text-center text-[12px]" style={{ color: "var(--text-secondary)" }}>
              {titulo}
            </span>
            <button onClick={() => setCorrimiento(c => c + 1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--hover-bg)]"
                    style={{ color: "var(--text-faint)" }} aria-label="Siguiente">
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {enRango.length} en este tramo
          {sinFecha.length > 0 && ` · ${sinFecha.length} sin fecha`}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
      {ESTADOS.map((estado, idxEstado) => {
        const enColumna = [...enRango, ...sinFecha].filter((p) => p.estado === estado.id)
        const esUltima = idxEstado === ESTADOS.length - 1

        return (
          <div key={estado.id} className="flex w-[240px] flex-shrink-0 flex-col gap-2.5">
            {/* Cabecera de columna */}
            <div className="flex items-baseline justify-between px-1">
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: esUltima ? color : "var(--text-secondary)" }}
                >
                  {estado.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  {estado.ayuda}
                </span>
              </div>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                {enColumna.length}
              </span>
            </div>

            {/* Tarjetas */}
            <div className="flex flex-col gap-2">
              {enColumna.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col gap-2 rounded-xl p-3"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* El título ES el enlace a la ficha. Los botones de mover y
                      borrar siguen abajo, así que tocar la tarjeta no puede ser
                      ambiguo: el texto abre, los iconos accionan. */}
                  <Link
                    href={rodajeDe(p.id)}
                    className="text-[12.5px] font-medium leading-snug hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {p.titulo}
                  </Link>
                  {!p.fecha_objetivo && (
                    <span className="flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide"
                          style={{ background: "var(--bg-surface)", color: "var(--text-faint)" }}>
                      <CalendarOff size={9} /> sin fecha
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide"
                      style={{ background: color + "1f", color: "var(--text-secondary)" }}
                    >
                      {TIPOS.find((t) => t.id === p.tipo)?.label ?? p.tipo}
                    </span>
                    {p.fecha_objetivo && (
                      <span className="text-[10px] tabular-nums" style={{ color: "var(--text-faint)" }}>
                        {new Date(p.fecha_objetivo + "T00:00:00").toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    )}
                    {p.publicada_url && (
                      <a
                        href={p.publicada_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--text-faint)" }}
                        aria-label="Ver publicada"
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  {p.estado === "idea" && (
                    <button
                      onClick={() => onAnalizar(p)}
                      className="flex w-fit cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
                      style={{ background: color + "26", color: "var(--text-primary)" }}
                      title="Convertirla en pieza con brief, hooks y guion"
                    >
                      <Sparkles size={11} /> Analizar
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => mover(p, -1)}
                      disabled={idxEstado === 0}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-default disabled:opacity-25"
                      style={{ color: "var(--text-faint)" }}
                      aria-label="Retroceder de estado"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      onClick={() => mover(p, 1)}
                      disabled={esUltima}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-default disabled:opacity-25"
                      style={{ color: "var(--text-faint)" }}
                      aria-label="Avanzar de estado"
                    >
                      <ChevronRight size={13} />
                    </button>
                    <button
                      onClick={() => onBorrar(p.id)}
                      className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all hover:bg-[var(--hover-bg)] focus:opacity-100 group-hover:opacity-100"
                      style={{ color: "var(--text-faint)" }}
                      aria-label="Borrar pieza"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Agregar — solo en la primera columna: una pieza nueva siempre
                  es una idea, nunca nace "editada". */}
              {idxEstado === 0 && (
                <div
                  className="flex flex-col gap-2 rounded-xl p-2.5"
                  style={{ border: "1px dashed var(--border-subtle)" }}
                >
                  <input
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && crear()}
                    placeholder="Una idea, en una línea…"
                    className="bg-transparent text-[12px] outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={tipoNueva}
                      onChange={(e) => setTipoNueva(e.target.value as TipoPieza)}
                      className="cursor-pointer rounded-md px-1.5 py-1 text-[10.5px] outline-none"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                    >
                      {TIPOS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={crear}
                      disabled={!nueva.trim() || guardando}
                      className={cn(
                        "ml-auto flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium",
                        "transition-opacity disabled:cursor-default disabled:opacity-30"
                      )}
                      style={{ background: color + "26", color: "var(--text-primary)" }}
                    >
                      <Plus size={11} /> Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
