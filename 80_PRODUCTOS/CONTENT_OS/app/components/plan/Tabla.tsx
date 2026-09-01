"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, FileText, Plus, Trash2 } from "lucide-react"
import { MARCAS, marcaPorId, type MarcaId } from "@/lib/marcas"
import { USUARIOS } from "@/lib/usuarios"
import { ESTADOS, TIPOS, type EstadoPieza, type Pieza, type TipoPieza } from "@/lib/piezasTipos"

/**
 * LA TABLA — la vista para cargar y editar en volumen.
 *
 * Es la MISMA fila de `piezas` que pinta el calendario y el pipeline, vista de
 * otra forma. Por eso cambiarle la fecha acá la mueve allá sin sincronizar
 * nada: no hay dos copias que puedan discrepar, hay una fila y tres vistas.
 *
 * Para qué sirve de verdad: cargar diez piezas seguidas sin abrir diez
 * formularios, y corregir en línea lo que en el calendario obligaría a
 * arrastrar. El calendario responde "¿qué día está vacío?"; esto responde
 * "¿cómo meto la semana entera de una sentada?".
 *
 * Se guarda al SALIR de la celda, no en cada tecla: guardar por tecla manda
 * un pedido por letra y deja la fila peleando contra lo que estás escribiendo.
 */

type Columna =
  | "fecha_objetivo" | "marca_id" | "tipo" | "titulo" | "idea" | "estado" | "eje" | "autor"

/**
 * ⭐ `idea` va JUSTO DESPUÉS del título y es la columna más ancha de todas.
 *
 * El título es un nombre corto para reconocer la pieza; la idea es lo que de
 * verdad se sube ese día. Santiago la llamó «lo principal» (2026-08-26), y el
 * campo existía en la base desde el principio sin poder escribirse desde la
 * app: se llenaba solo cuando la IA analizaba una idea. Esa era la razón real
 * para seguir volviendo al Excel.
 */
const COLUMNAS: { id: Columna; label: string; ancho: string }[] = [
  { id: "fecha_objetivo", label: "Fecha", ancho: "130px" },
  { id: "marca_id", label: "Marca", ancho: "150px" },
  { id: "tipo", label: "Tipo", ancho: "110px" },
  { id: "titulo", label: "Título", ancho: "minmax(190px, 0.85fr)" },
  { id: "idea", label: "Idea", ancho: "minmax(300px, 1.7fr)" },
  { id: "estado", label: "Estado", ancho: "130px" },
  { id: "eje", label: "Eje", ancho: "150px" },
  { id: "autor", label: "Autor", ancho: "120px" },
]

const GRID = COLUMNAS.map((c) => c.ancho).join(" ") + " 62px"

/** Vacíos al final siempre: una pieza sin fecha no es "antes del 1 de enero". */
function comparar(a: string | null, b: string | null, dir: 1 | -1): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b) * dir
}

export function Tabla({
  piezas,
  marcaActiva,
  onCrear,
  onParchear,
  onBorrar,
  rodajeDe,
}: {
  piezas: Pieza[]
  marcaActiva: MarcaId
  onCrear: (fila: {
    titulo: string
    marca_id: MarcaId
    tipo: TipoPieza
    idea?: string
    fecha_objetivo: string | null
  }) => Promise<void>
  onParchear: (id: string, cambios: Partial<Pieza>) => Promise<void>
  onBorrar: (id: string) => Promise<void>
  /** A dónde lleva el botón de rodaje de cada fila. */
  rodajeDe: (id: string, marca: string | null) => string
}) {
  const [filtroMarca, setFiltroMarca] = useState<MarcaId | "todas">(marcaActiva)
  const [filtroEstado, setFiltroEstado] = useState<EstadoPieza | "todos">("todos")
  const [orden, setOrden] = useState<{ col: Columna; dir: 1 | -1 }>({
    col: "fecha_objetivo",
    dir: 1,
  })

  // La fila vacía del final
  const [nTitulo, setNTitulo] = useState("")
  const [nIdea, setNIdea] = useState("")
  const [nMarca, setNMarca] = useState<MarcaId>(marcaActiva)
  const [nTipo, setNTipo] = useState<TipoPieza>("reel")
  const [nFecha, setNFecha] = useState("")
  const [creando, setCreando] = useState(false)

  const filas = useMemo(() => {
    const f = piezas.filter(
      (p) =>
        (filtroMarca === "todas" || p.marca_id === filtroMarca) &&
        (filtroEstado === "todos" || p.estado === filtroEstado)
    )
    return [...f].sort((a, b) => comparar(a[orden.col] ?? null, b[orden.col] ?? null, orden.dir))
  }, [piezas, filtroMarca, filtroEstado, orden])

  function ordenarPor(col: Columna) {
    setOrden((o) => (o.col === col ? { col, dir: o.dir === 1 ? -1 : 1 } : { col, dir: 1 }))
  }

  async function crear() {
    if (!nTitulo.trim() || creando) return
    setCreando(true)
    try {
      await onCrear({
        titulo: nTitulo.trim(),
        marca_id: nMarca,
        tipo: nTipo,
        idea: nIdea.trim() || undefined,
        fecha_objetivo: nFecha || null,
      })
      setNTitulo("")
      setNIdea("")
      // La fecha y la marca NO se limpian: al cargar diez seguidas casi
      // siempre son las mismas, y volver a elegirlas cada vez es la fricción
      // que hace que se cargue una sola.
    } finally {
      setCreando(false)
    }
  }

  const estiloCelda = {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid transparent",
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filtroMarca}
          onChange={(e) => setFiltroMarca(e.target.value as MarcaId | "todas")}
          className="cursor-pointer rounded-lg px-2 py-1.5 text-[12px] outline-none"
          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          aria-label="Filtrar por marca"
        >
          <option value="todas">Todas las marcas</option>
          {MARCAS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoPieza | "todos")}
          className="cursor-pointer rounded-lg px-2 py-1.5 text-[12px] outline-none"
          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>

        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {filas.length} {filas.length === 1 ? "pieza" : "piezas"}
        </span>
      </div>

      {/* La tabla. Scroll horizontal propio: en el celular no cabe, y el
          cuerpo de la página no debe moverse de lado. */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Encabezado */}
          <div
            className="grid items-center gap-2 border-b px-2 py-2"
            style={{ gridTemplateColumns: GRID, borderColor: "var(--border-subtle)" }}
          >
            {COLUMNAS.map((c) => (
              <button
                key={c.id}
                onClick={() => ordenarPor(c.id)}
                className="flex cursor-pointer items-center gap-1 text-left text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: orden.col === c.id ? "var(--text-primary)" : "var(--text-faint)" }}
              >
                {c.label}
                {orden.col === c.id &&
                  (orden.dir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
              </button>
            ))}
            <span />
          </div>

          {/* Filas */}
          {filas.map((p) => (
            <div
              key={p.id}
              className="group grid items-center gap-2 border-b px-2 py-1"
              style={{ gridTemplateColumns: GRID, borderColor: "var(--border-subtle)" }}
            >
              {/* Al SALIR de la celda, no en cada cambio: escribiendo una fecha a
                  mano el navegador reporta "" hasta que está completa, y guardar
                  eso borraría la fecha que se estaba corrigiendo.
                  La `key` la vuelve a montar cuando el valor cambia desde el
                  servidor —al analizar una idea, por ejemplo—: sin eso el
                  navegador conserva lo viejo y la tabla miente. */}
              <input
                key={"f" + p.id + (p.fecha_objetivo ?? "")}
                type="date"
                defaultValue={p.fecha_objetivo ?? ""}
                onBlur={(e) => {
                  const v = e.target.value || null
                  if (v !== (p.fecha_objetivo ?? null)) onParchear(p.id, { fecha_objetivo: v })
                }}
                className="rounded px-1.5 py-1.5 text-[12px] tabular-nums outline-none focus:border-[var(--border-medium)]"
                style={estiloCelda}
                aria-label="Fecha objetivo"
              />

              <select
                value={p.marca_id ?? ""}
                onChange={(e) => onParchear(p.id, { marca_id: e.target.value })}
                className="cursor-pointer rounded px-1 py-1.5 text-[12px] outline-none"
                style={estiloCelda}
                aria-label="Marca"
              >
                {MARCAS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>

              <select
                value={p.tipo}
                onChange={(e) => onParchear(p.id, { tipo: e.target.value as TipoPieza })}
                className="cursor-pointer rounded px-1 py-1.5 text-[12px] outline-none"
                style={estiloCelda}
                aria-label="Tipo"
              >
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>

              <input
                key={"t" + p.id + p.titulo}
                defaultValue={p.titulo}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  // Un título vacío borraría la pieza de la vista sin borrarla
                  // de la base: se revierte a lo que había.
                  if (!v) {
                    e.target.value = p.titulo
                    return
                  }
                  if (v !== p.titulo) onParchear(p.id, { titulo: v })
                }}
                className="rounded px-1.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--border-medium)]"
                style={estiloCelda}
                aria-label="Título"
              />

              {/* LA IDEA. Mismo trato que las demás: se escribe en la celda y
                  guarda al salir del campo. Vacío se guarda como `null` y no
                  como "", para que "sin idea" sea una sola cosa en la base.
                  La `key` la remonta cuando el valor cambia desde el servidor
                  —al analizar una idea con IA, por ejemplo—: sin eso el
                  navegador conserva lo viejo y la tabla miente. */}
              <input
                key={"i" + p.id + (p.idea ?? "")}
                defaultValue={p.idea ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v !== (p.idea ?? "")) onParchear(p.id, { idea: v || null })
                }}
                placeholder="Qué se sube ese día…"
                title={p.idea ?? undefined}
                className="rounded px-1.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--border-medium)]"
                style={estiloCelda}
                aria-label="Idea"
              />

              <select
                value={p.estado}
                onChange={(e) => onParchear(p.id, { estado: e.target.value as EstadoPieza })}
                className="cursor-pointer rounded px-1 py-1.5 text-[12px] outline-none"
                style={{
                  ...estiloCelda,
                  color: p.estado === "publicada" ? marcaPorId(p.marca_id).color : "var(--text-primary)",
                }}
                aria-label="Estado"
              >
                {ESTADOS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>

              <input
                key={"e" + p.id + (p.eje ?? "")}
                defaultValue={p.eje ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v !== (p.eje ?? "")) onParchear(p.id, { eje: v || null })
                }}
                placeholder="—"
                className="rounded px-1.5 py-1.5 text-[12px] outline-none focus:border-[var(--border-medium)]"
                style={estiloCelda}
                aria-label="Eje"
              />

              <select
                value={p.autor ?? ""}
                onChange={(e) => onParchear(p.id, { autor: e.target.value || null })}
                className="cursor-pointer rounded px-1 py-1.5 text-[12px] outline-none"
                style={estiloCelda}
                aria-label="Autor"
              >
                {/* Vacío es una opción real: las piezas anteriores al 21-ago no
                    tienen autor, y ponerles uno sería inventarlo. */}
                <option value="">—</option>
                {USUARIOS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-0.5">
                {/* Aquí el título es un campo editable, así que no puede ser
                    también el enlace: escribir en él abriría la ficha. Por eso
                    la ficha entra por un botón propio. Siempre visible y no
                    solo al pasar el mouse — en el celular no hay hover. */}
                <Link
                  href={rodajeDe(p.id, p.marca_id)}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--hover-bg)]"
                  style={{ color: "var(--text-faint)" }}
                  aria-label={`Abrir la hoja de rodaje de ${p.titulo}`}
                  title="Hoja de rodaje"
                >
                  <FileText size={12} />
                </Link>
                <button
                  onClick={() => onBorrar(p.id)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all hover:bg-[var(--hover-bg)] focus:opacity-100 group-hover:opacity-100"
                  style={{ color: "var(--text-faint)" }}
                  aria-label="Borrar pieza"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* La fila vacía del final — cargar seguido sin abrir un formulario */}
          <div
            className="grid items-center gap-2 px-2 py-1.5"
            style={{ gridTemplateColumns: GRID }}
          >
            <input
              type="date"
              value={nFecha}
              onChange={(e) => setNFecha(e.target.value)}
              className="rounded px-1.5 py-1.5 text-[12px] tabular-nums outline-none"
              style={{ ...estiloCelda, color: "var(--text-secondary)" }}
              aria-label="Fecha de la pieza nueva"
            />
            <select
              value={nMarca}
              onChange={(e) => setNMarca(e.target.value as MarcaId)}
              className="cursor-pointer rounded px-1 py-1.5 text-[12px] outline-none"
              style={{ ...estiloCelda, color: "var(--text-secondary)" }}
              aria-label="Marca de la pieza nueva"
            >
              {MARCAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <select
              value={nTipo}
              onChange={(e) => setNTipo(e.target.value as TipoPieza)}
              className="cursor-pointer rounded px-1 py-1.5 text-[12px] outline-none"
              style={{ ...estiloCelda, color: "var(--text-secondary)" }}
              aria-label="Tipo de la pieza nueva"
            >
              {TIPOS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              value={nTitulo}
              onChange={(e) => setNTitulo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
              placeholder="Título…"
              className="rounded px-1.5 py-1.5 text-[12.5px] outline-none"
              style={{ ...estiloCelda, border: "1px dashed var(--border-subtle)" }}
              aria-label="Título de la pieza nueva"
            />
            <input
              value={nIdea}
              onChange={(e) => setNIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
              placeholder="Qué se sube ese día — Enter para agregar la fila…"
              className="rounded px-1.5 py-1.5 text-[12.5px] outline-none"
              style={{ ...estiloCelda, border: "1px dashed var(--border-subtle)" }}
              aria-label="Idea de la pieza nueva"
            />
            {/* Nace en estado "idea": es un rótulo, no un campo. */}
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              Idea
            </span>
            <span />
            <span />
            <button
              onClick={crear}
              disabled={!nTitulo.trim() || creando}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-opacity disabled:cursor-default disabled:opacity-25"
              style={{ background: marcaPorId(nMarca).color + "33", color: "var(--text-primary)" }}
              aria-label="Agregar pieza"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
