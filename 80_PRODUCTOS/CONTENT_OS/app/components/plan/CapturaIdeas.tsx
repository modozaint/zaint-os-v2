"use client"

import { useState } from "react"
import { Lightbulb, Plus } from "lucide-react"
import { MARCAS, marcaPorId, type MarcaId } from "@/lib/marcas"
import type { Pieza, TipoPieza } from "@/lib/piezasTipos"
import { NuevaPieza, type IdeaAAnalizar } from "./NuevaPieza"

/**
 * EL BANCO DE IDEAS — un renglón, una marca, guardar.
 *
 * Nada más. Ni formulario largo, ni campos obligatorios, ni confirmación:
 * **una idea que cuesta tres clics no se anota**, y una idea que no se anota
 * se pierde. Este es el único punto del sistema donde la fricción se paga en
 * ideas perdidas, no en tiempo.
 *
 * No hay tabla `ideas`. Cada renglón es una fila de `piezas` en estado `idea`
 * — la misma que después lleva brief, hooks y guion. Un dato, un sitio.
 */

/** "hace 5 min" dice más que una fecha cuando lo que importa es si el banco se usa. */

export function CapturaIdeas({
  ideas,
  marcaActiva,
  onAnotar,
  onBorrar,
  onCambio,
  analizar,
  onAnalizado,
}: {
  ideas: Pieza[]
  marcaActiva: MarcaId
  onAnotar: (texto: string, marca: MarcaId, tipo: TipoPieza) => Promise<void>
  onBorrar: (id: string) => Promise<void>
  /** La idea que el pipeline mandó a analizar. El formulario vive acá porque
   *  es donde ya estaba montado; quién lo dispara cambió, no dónde vive. */
  analizar: { id: string; idea: string; tipo: TipoPieza; marca_id: string | null } | null
  onAnalizado: () => void
  /** Se llama al terminar de analizar una idea, para releer la verdad del servidor. */
  onCambio: () => void
}) {
  const [texto, setTexto] = useState("")
  const [marca, setMarca] = useState<MarcaId>(marcaActiva)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const color = marcaPorId(marca).color

  async function anotar() {
    if (!texto.trim() || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await onAnotar(texto.trim(), marca, "reel")
      setTexto("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-3.5"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2">
        <Lightbulb size={13} style={{ color: "var(--text-faint)" }} />
        <span className="section-label">Banco de ideas</span>
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {ideas.length === 0 ? "vacío" : ideas.length + " sin procesar"}
        </span>
      </div>

      {/* La captura: un renglón y ya */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && anotar()}
          placeholder="Anotá la idea como se te ocurra…"
          className="flex-1 rounded-lg px-3 py-2.5 text-[13px] outline-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
        <div className="flex items-center gap-2">
          <select
            value={marca}
            onChange={(e) => setMarca(e.target.value as MarcaId)}
            className="cursor-pointer rounded-lg px-2 py-2 text-[12px] outline-none"
            style={{ background: "var(--bg-surface)", color: "var(--text-secondary)" }}
            aria-label="Marca de la idea"
          >
            {MARCAS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={anotar}
            disabled={!texto.trim() || guardando}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-opacity disabled:cursor-default disabled:opacity-30"
            style={{ background: color + "33", color: "var(--text-primary)" }}
          >
            <Plus size={12} /> {guardando ? "Guardando…" : "Anotar"}
          </button>
        </div>
      </div>

      {error && (
        <p
          className="rounded-lg px-2.5 py-1.5 text-[11.5px]"
          style={{ background: "var(--color-negative-bg)", color: "var(--color-negative)" }}
        >
          {error}
        </p>
      )}

      {/* ⛔ AQUÍ IBA LA LISTA DE IDEAS, y se quitó el 2026-08-26.
          Santiago: *«que solo salga en general en todas las pantallas para
          anotar una nueva idea, pero que no salgan todas las ideas anotadas»*.

          🔑 Y hay una razón dura además del espacio: **la lista duplicaba la
          columna IDEA del pipeline.** Las mismas cinco piezas salían dos
          veces en la misma pantalla. Quitarla no esconde nada — deja de
          mostrarlo dos veces. Se trabajan donde viven: en el pipeline se
          mueven de estado, se arrastran a un día y se analizan. */}

      {/* Se monta solo mientras se analiza: al desmontarse se lleva su estado,
          así la próxima idea no abre con el resultado de la anterior. */}
      {analizar && (
        <NuevaPieza
          analizar={analizar}
          onCerrado={() => {
            onAnalizado()
            onCambio()
          }}
        />
      )}
    </div>
  )
}
