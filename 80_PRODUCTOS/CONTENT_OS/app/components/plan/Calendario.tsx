"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarOff } from "lucide-react"
import type { Meta, Pieza } from "@/lib/piezasTipos"
import { Balance } from "./Balance"
import { marcaPorId, type MarcaId } from "@/lib/marcas"

/**
 * EL CALENDARIO — responde "¿qué sigue?" y "¿voy o no voy al ritmo?".
 *
 * La meta (3 reels/semana por defecto, editable en Ajustes) NO se pinta como
 * días concretos inventados: se cuenta por semana. Decidir que el reel toca
 * los martes sería una regla que nadie acordó; decir "esta semana van 2 de 3"
 * es un hecho.
 *
 * Agendar es a dos toques —elegir la pieza abajo, tocar el día— porque
 * arrastrar con el pulgar no funciona.
 */

const DIAS = ["L", "M", "X", "J", "V", "S", "D"]

/** Lo que viaja en el arrastre: un tipo propio, no una URL. Es lo que evita
 *  que el navegador dibuje su preview de enlace, que era el bug reportado. */
const TIPO = "application/x-pieza"

/** Lunes de la semana de una fecha. La semana arranca lunes, como el turno. */
function lunesDe(f: Date): Date {
  const d = new Date(f)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function aISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function Calendario({
  piezas,
  marca,
  meta,
  onAgendar,
  rodajeDe,
}: {
  piezas: Pieza[]
  marca: MarcaId
  meta: Meta | undefined
  onAgendar: (id: string, fecha: string | null) => Promise<void>
  /** A dónde lleva tocar una pieza ya agendada: su hoja de rodaje. */
  rodajeDe: (id: string) => string
}) {
  const [mesBase, setMesBase] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  /**
   * ARRASTRAR — el gesto que Santiago intentó solo, sin que nadie se lo dijera.
   *
   * 🔴 POR QUÉ «NO PASABA NADA» ANTES: las piezas del día son enlaces a su
   * ficha, y un enlace **se arrastra solo**: el navegador enseñaba su preview
   * con la URL. Parecía roto y en realidad no había ni una línea de arrastrar.
   *
   * `arrastrando` guarda el id; `sobre` el día debajo del cursor. Sin esa
   * segunda señal, arrastrar se siente peor que tocar: no se ve dónde va a caer.
   */
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)

  function empezar(e: React.DragEvent, id: string) {
    // ⚠️ `clearData()` PRIMERO: el navegador ya metió `text/uri-list` por ser
    // un enlace, y es lo que dibuja el preview que estorbaba.
    e.dataTransfer.clearData()
    e.dataTransfer.setData(TIPO, id)
    e.dataTransfer.effectAllowed = "move"
    setArrastrando(id)
  }

  function encima(e: React.DragEvent, iso: string | null) {
    /**
     * ⚠️ SE MIRA LO QUE TRAE EL ARRASTRE, no el estado de React.
     *
     * Antes preguntaba por `arrastrando`, y eso falla: `setArrastrando` es
     * asíncrono, así que los primeros `dragover` llegan cuando el estado
     * todavía es null y el día no se resaltaba. `dataTransfer.types` sí está
     * disponible desde el primer evento — `getData` no, por seguridad, pero
     * los tipos sí.
     */
    if (!e.dataTransfer.types.includes(TIPO)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setSobre(iso ?? "sin-fecha")
  }

  async function soltar(e: React.DragEvent, iso: string | null) {
    const id = e.dataTransfer.getData(TIPO) || arrastrando
    setArrastrando(null); setSobre(null)
    if (!id) return
    e.preventDefault()
    await onAgendar(id, iso)
  }

  const color = marcaPorId(marca).color
  const hoyISO = aISO(new Date())
  const porSemana = meta?.piezas_por_semana ?? 0

  // Las semanas que toca dibujar: desde el lunes de la semana del día 1 hasta
  // cubrir el último día del mes.
  const semanas = useMemo(() => {
    const primero = new Date(mesBase.getFullYear(), mesBase.getMonth(), 1)
    const ultimo = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 0)
    const out: Date[][] = []
    const cursor = lunesDe(primero)
    while (cursor <= ultimo) {
      const semana: Date[] = []
      for (let i = 0; i < 7; i++) {
        semana.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      out.push(semana)
    }
    return out
  }, [mesBase])

  const porFecha = useMemo(() => {
    const m: Record<string, Pieza[]> = {}
    for (const p of piezas) {
      if (!p.fecha_objetivo) continue
      ;(m[p.fecha_objetivo] ??= []).push(p)
    }
    return m
  }, [piezas])

  const sinFecha = piezas.filter((p) => !p.fecha_objetivo && p.estado !== "publicada")

  async function tocarDia(iso: string) {
    if (!seleccionada) return
    await onAgendar(seleccionada, iso)
    setSeleccionada(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mes */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() - 1, 1))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-[var(--hover-bg)]"
          style={{ color: "var(--text-faint)" }}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <span
          className="min-w-[150px] text-[14px] font-semibold capitalize"
          style={{ color: "var(--text-primary)" }}
        >
          {mesBase.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-[var(--hover-bg)]"
          style={{ color: "var(--text-faint)" }}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={14} />
        </button>

        {porSemana > 0 && (
          <span className="ml-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
            meta: {porSemana} por semana
          </span>
        )}
      </div>

      {/* Encabezado de días */}
      <div className="grid grid-cols-[1fr_46px] gap-2">
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((d) => (
            <span
              key={d}
              className="px-1 text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-faint)" }}
            >
              {d}
            </span>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          sem
        </span>
      </div>

      {/* Semanas */}
      <div className="flex flex-col gap-1.5">
        {semanas.map((semana, i) => {
          const enSemana = semana.reduce((n, d) => n + (porFecha[aISO(d)]?.length ?? 0), 0)
          const cumple = porSemana > 0 && enSemana >= porSemana

          return (
            <div key={i} className="grid grid-cols-[1fr_46px] items-stretch gap-2">
              <div className="grid grid-cols-7 gap-1.5">
                {semana.map((d) => {
                  const iso = aISO(d)
                  const delMes = d.getMonth() === mesBase.getMonth()
                  const delDia = porFecha[iso] ?? []
                  const esHoy = iso === hoyISO

                  return (
                    <button
                      key={iso}
                      /* Para poder señalar un día concreto al probar el
                         arrastre: sin esto hay que adivinarlo por su número. */
                      data-dia={iso}
                      onClick={() => tocarDia(iso)}
                      onDragOver={(e) => encima(e, iso)}
                      onDragLeave={() => setSobre(s => (s === iso ? null : s))}
                      onDrop={(e) => soltar(e, iso)}
                      /* ⚠️ SIN `disabled`. Lo tenía para avisar de que no se
                         puede agendar sin una pieza elegida — pero un <button>
                         deshabilitado apaga TAMBIÉN los enlaces de adentro, y
                         desde que cada pieza abre su ficha eso significaba que
                         tocarla no hacía nada. `tocarDia` ya se protege sola. */
                      className="flex min-h-[78px] flex-col gap-1 rounded-lg p-1.5 text-left transition-colors"
                      style={{
                        background: sobre === iso ? color + "2e"
                          : delMes ? "var(--bg-elevated)" : "transparent",
                        border: sobre === iso
                          ? `1px dashed ${color}`
                          : esHoy ? `1px solid ${color}` : "1px solid var(--border-subtle)",
                        opacity: delMes ? 1 : 0.4,
                        cursor: seleccionada ? "pointer" : undefined,
                      }}
                    >
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ color: esHoy ? color : "var(--text-faint)" }}
                      >
                        {d.getDate()}
                      </span>
                      {/* Título Y idea. El título es un nombre para reconocerla;
                          la idea es lo que se sube ese día — y era lo único que
                          este calendario no decía. Recortada, porque en una
                          casilla de calendario no cabe entera y media idea
                          legible vale más que un título solo. */}
                      {/* ⚠️ El día entero es el botón de AGENDAR. Por eso la pieza
                          es un enlace que CORTA la propagación: sin eso, tocar
                          una pieza para abrir su ficha agendaría encima la que
                          estuviera seleccionada abajo. */}
                      {delDia.slice(0, 2).map((p) => (
                        <Link
                          key={p.id}
                          href={rodajeDe(p.id)}
                          draggable
                          onDragStart={(e) => empezar(e, p.id)}
                          onDragEnd={() => { setArrastrando(null); setSobre(null) }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col rounded px-1 py-0.5 leading-tight hover:brightness-125"
                          style={{ background: color + "26", color: "var(--text-primary)" }}
                          title={p.idea ? `${p.titulo} — ${p.idea}` : p.titulo}
                        >
                          <span className="truncate text-[9.5px]">{p.titulo}</span>
                          {p.idea && (
                            <span
                              className="truncate text-[8.5px]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {p.idea}
                            </span>
                          )}
                        </Link>
                      ))}
                      {delDia.length > 2 && (
                        <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
                          +{delDia.length - 2}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Progreso de la semana contra la meta */}
              <div
                className="flex flex-col items-center justify-center rounded-lg px-1"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
                title={
                  porSemana > 0
                    ? `${enSemana} de ${porSemana} piezas agendadas esta semana`
                    : "Esta marca no tiene meta de cadencia"
                }
              >
                {porSemana > 0 ? (
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: cumple ? color : "var(--text-faint)" }}
                  >
                    {enSemana}/{porSemana}
                  </span>
                ) : (
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--text-faint)" }}>
                    {enSemana}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* El balance del mes — lo que convierte la grilla en un sistema */}
      <div
        className="mt-1 rounded-xl p-4"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <Balance piezas={piezas} marca={marca} meta={meta} mes={mesBase} />
      </div>

      {/* Sin fecha — la bandeja desde donde se agenda, y a donde se devuelve */}
      <div
        className="flex flex-col gap-2 rounded-xl pt-1 transition-colors"
        style={sobre === "sin-fecha"
          ? { background: color + "1f", outline: `1px dashed ${color}`, outlineOffset: 4 }
          : undefined}
        onDragOver={(e) => encima(e, null)}
        onDragLeave={() => setSobre(s => (s === "sin-fecha" ? null : s))}
        onDrop={(e) => soltar(e, null)}
      >
        <div className="flex items-center gap-2">
          <CalendarOff size={12} style={{ color: "var(--text-faint)" }} />
          <span className="section-label">Sin fecha ({sinFecha.length})</span>
          {arrastrando && (
            <span className="text-[11px]" style={{ color }}>
              soltá acá para quitarle la fecha
            </span>
          )}
          {seleccionada && (
            <span className="text-[11px]" style={{ color }}>
              tocá un día para agendarla
            </span>
          )}
        </div>

        {sinFecha.length === 0 ? (
          <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            Todas las piezas tienen fecha.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sinFecha.map((p) => {
              const activa = seleccionada === p.id
              return (
                <button
                  key={p.id}
                  draggable
                  onDragStart={(e) => empezar(e, p.id)}
                  onDragEnd={() => { setArrastrando(null); setSobre(null) }}
                  onClick={() => setSeleccionada(activa ? null : p.id)}
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[11.5px] transition-colors"
                  style={{
                    background: activa ? color + "33" : "var(--bg-elevated)",
                    border: `1px solid ${activa ? color : "var(--border-subtle)"}`,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.titulo}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
