"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Sparkles, X, Film, LayoutGrid, Circle, ArrowRight, ArrowLeft, AlertCircle,
  Users, Quote, Camera, Check,
} from "lucide-react"
import { MARCA_DEFAULT, esMarca, marcaPorId, type MarcaId } from "@/lib/marcas"
import {
  ANGULOS, FUNCIONES, ROTACIONES,
  type Angulo, type Escena, type Funcion, type HookCompleto, type Rotacion, type TipoPieza,
} from "@/lib/piezasTipos"
import type { PublicoPropuesto } from "@/lib/proponerPublicos"
import { cn } from "@/lib/utils"

/**
 * NUEVA PIEZA — la puerta de entrada del sistema.
 *
 * Escribís una idea en una línea y sale una pieza con guion, guardada en el
 * Plan. Tres campos y un botón: cualquier cosa de más aquí es fricción en el
 * único punto donde la fricción se paga cara, porque es el paso que se hace
 * a las 11 de la noche después de un turno.
 *
 * Debajo del resultado se dice DE QUÉ se alimentó. Un guion que no se puede
 * auditar es un guion en el que no se puede confiar.
 *
 * ── Dos formas de abrirla, UN solo camino de generación ──
 *
 *   1. Desde el encabezado, sin props: escribís la idea en el momento.
 *   2. Con `analizar`: una idea YA GUARDADA del banco, con su texto adentro.
 *
 * El caso 2 existe porque el paso «después se analiza y se organiza como pieza
 * para grabar» ya era esto — lo único que faltaba era poder dispararlo sobre
 * una idea anotada en vez de tener que reescribirla. Y ACTUALIZA esa fila: no
 * nace una pieza nueva, así que el banco no se llena de duplicados.
 */

export interface IdeaAAnalizar {
  id: string
  idea: string
  tipo: TipoPieza
  marca_id: string | null
}

/**
 * LO QUE HAY PARA MOSTRAR — la tercera pregunta.
 *
 * Es una lista fija a propósito, al revés que la del público: la respuesta no
 * depende de la idea sino de lo que Santiago tiene a mano ese día, y son
 * siempre las mismas cinco. Salen textuales de `PROMPT_CHAT_CONTENIDO.md`:
 * *«¿grabación, producto en mano, pantalla, proceso, nada?»*
 */
const MATERIALES = ["grabación", "producto en mano", "pantalla", "proceso", "nada"]

const FORMATOS: { id: TipoPieza; label: string; Icon: typeof Film }[] = [
  { id: "reel", label: "Reel", Icon: Film },
  { id: "carrusel", label: "Carrusel", Icon: LayoutGrid },
  { id: "story", label: "Story", Icon: Circle },
]

interface Resultado {
  /** El id de la fila guardada. Es lo que permite abrir su ficha al terminar. */
  id: string
  titulo: string
  eje: string
  funcion: Funcion | null
  angulo: Angulo | null
  rotacion: Rotacion | null
  duracion_objetivo: string
  portada: string
  brief: Record<string, string>
  hooks: HookCompleto[]
  escenas: Escena[]
  cta: { momento: string; que_pide: string } | null
  loop: string
  guion: string
  fuentes: { referentes: number; posts: number }
  porVerificar: string[]
}

export function NuevaPieza({
  analizar,
  onCerrado,
}: {
  /** Una idea guardada del banco. Si viene, la ventana abre sola y sin botón. */
  analizar?: IdeaAAnalizar | null
  onCerrado?: () => void
} = {}) {
  const router = useRouter()
  const params = useSearchParams()
  const desdeUrl = esMarca(params.get("marca")) ? (params.get("marca") as MarcaId) : MARCA_DEFAULT
  // Una idea guardada se analiza con SU marca, no con la que esté seleccionada
  // arriba: si no, una idea de Kaizen saldría escrita en la voz de Dermatinta.
  const marca: MarcaId = esMarca(analizar?.marca_id) ? (analizar!.marca_id as MarcaId) : desdeUrl

  const controlado = !!analizar
  const [abierto, setAbierto] = useState(controlado)
  const [tipo, setTipo] = useState<TipoPieza>(analizar?.tipo ?? "reel")
  const [idea, setIdea] = useState(analizar?.idea ?? "")
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [res, setRes] = useState<Resultado | null>(null)

  /**
   * ── LAS TRES PREGUNTAS (§4.4) ──
   *
   * No son un formulario nuevo: son las MISMAS tres del chat de contenido
   * (`CONTENIDO/PROMPT_CHAT_CONTENIDO.md`, «Paso 3 — Las preguntas. Tres, y ni
   * una más»), que llevan meses de uso. Traídas, no inventadas.
   *
   * 🔑 Y se pueden saltar enteras. El botón «Generar ya» sigue estando en la
   * primera pantalla, al lado del que pregunta: *«la pregunta ayuda; obligar a
   * contestarla convierte el atajo en un formulario»*. Contestar es lo que
   * mejora el guion, pero a las 11 de la noche a veces solo hay una frase.
   */
  const [enPreguntas, setEnPreguntas] = useState(false)
  const [publicos, setPublicos] = useState<PublicoPropuesto[]>([])
  const [cargandoPublicos, setCargandoPublicos] = useState(false)
  const [errorPublicos, setErrorPublicos] = useState<string | null>(null)
  const [publico, setPublico] = useState("")
  const [verdad, setVerdad] = useState("")
  const [material, setMaterial] = useState<string[]>([])

  const color = marcaPorId(marca).color

  function cerrar() {
    setAbierto(false)
    setRes(null)
    setError(null)
    setIdea("")
    setEnPreguntas(false)
    setPublicos([])
    setErrorPublicos(null)
    setPublico("")
    setVerdad("")
    setMaterial([])
    onCerrado?.()
  }

  /**
   * Abrir las preguntas y, en paralelo, pedirle al modelo los públicos.
   *
   * Se abre la pantalla ANTES de que lleguen: así se puede empezar a escribir
   * el hecho propio —que es la pregunta que decide— mientras la primera
   * termina de cargar. Si se esperara, serían cinco segundos mirando nada.
   */
  async function irAPreguntas() {
    if (!idea.trim()) return
    setEnPreguntas(true)
    if (publicos.length || cargandoPublicos) return
    setCargandoPublicos(true)
    setErrorPublicos(null)
    try {
      const r = await fetch("/api/piezas/publicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marca, tipo, idea }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "No se pudieron proponer públicos")
      setPublicos(d.publicos ?? [])
    } catch (e) {
      // No bloquea: si falla, el público se escribe a mano y se sigue.
      setErrorPublicos(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setCargandoPublicos(false)
    }
  }

  async function generar() {
    if (!idea.trim() || generando) return
    setGenerando(true)
    setError(null)
    try {
      const r = await fetch("/api/piezas/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Con `piezaId`, el servidor actualiza esa fila en vez de crear otra.
        body: JSON.stringify({
          marca, tipo, idea, piezaId: analizar?.id,
          // Van vacías si se saltó: el servidor las descarta y genera igual.
          respuestas: { publico, verdad, material: material.join(", ") },
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "No se pudo generar")
      setRes(d.pieza)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      {!controlado && (
        <button
          onClick={() => setAbierto(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-80"
          style={{ background: color + "26", color: "var(--text-primary)" }}
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">Nueva pieza</span>
        </button>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-[8vh]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
          onClick={cerrar}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[560px] flex-col gap-4 rounded-2xl p-5"
            style={{
              background: "var(--bg-sidebar)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span
                  className="w-fit rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
                  style={{ background: color + "26", color: "var(--text-secondary)" }}
                >
                  {controlado ? "Analizar idea" : "Nueva pieza"} · {marcaPorId(marca).nombre}
                </span>
                <h2 className="font-display text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  {res
                    ? res.titulo
                    : enPreguntas
                      ? "Tres preguntas y lo escribo"
                      : controlado
                        ? "Convertirla en pieza"
                        : "¿Qué vamos a crear?"}
                </h2>
              </div>
              <button
                onClick={cerrar}
                className="cursor-pointer rounded-lg p-1 hover:bg-[var(--hover-bg)]"
                style={{ color: "var(--text-faint)" }}
                aria-label="Cerrar"
              >
                <X size={15} />
              </button>
            </div>

            {!res && !enPreguntas && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATOS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTipo(id)}
                      className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl py-3 transition-colors"
                      style={{
                        background: "var(--bg-elevated)",
                        border: `1px solid ${tipo === id ? color : "var(--border-subtle)"}`,
                        color: tipo === id ? "var(--text-primary)" : "var(--text-faint)",
                      }}
                    >
                      <Icon size={16} />
                      <span className="text-[11.5px]">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="section-label">Idea o tema</label>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={3}
                    placeholder="Escribila como se te ocurra. Ej: la gente cree que el tatuaje solo se cuida las dos primeras semanas…"
                    className="resize-none rounded-xl p-3 text-[13px] leading-relaxed outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {error && (
                  <p
                    className="flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]"
                    style={{ background: "var(--color-negative-bg)", color: "var(--color-negative)" }}
                  >
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                )}

                {/* DOS SALIDAS, Y LAS DOS A LA VISTA.
                    La de arriba pregunta y sale mejor; la de abajo genera de
                    una. El atajo NO esta escondido: esconderlo seria el
                    formulario que el plan pidio no hacer. */}
                <button
                  onClick={irAPreguntas}
                  disabled={!idea.trim() || generando}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium",
                    "transition-opacity disabled:cursor-default disabled:opacity-35"
                  )}
                  style={{ background: color + "33", color: "var(--text-primary)" }}
                >
                  <Sparkles size={14} />
                  Contestar 3 preguntas y escribir
                </button>

                <button
                  onClick={generar}
                  disabled={!idea.trim() || generando}
                  className={cn(
                    "-mt-1 cursor-pointer text-center text-[12px] underline underline-offset-2",
                    "transition-opacity disabled:cursor-default disabled:opacity-35"
                  )}
                  style={{ color: "var(--text-faint)" }}
                >
                  {generando ? "Escribiendo el guion…" : "o generar ya, sin contestar"}
                </button>
              </>
            )}

            {/* ─────────────── LAS TRES PREGUNTAS ─────────────── */}
            {!res && enPreguntas && (
              <>
                {/* 1 · EL PUBLICO. Las opciones salen del analisis de ESTA idea:
                    por eso se piden al modelo y no de una lista guardada. */}
                <div className="flex flex-col gap-2">
                  <label className="section-label flex items-center gap-1.5">
                    <Users size={12} /> ¿A qué público le habla?
                  </label>

                  {cargandoPublicos && (
                    <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
                      Analizando la idea para proponerte públicos…
                    </p>
                  )}

                  {errorPublicos && (
                    <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                      No se pudieron proponer ({errorPublicos}). Escribilo a mano abajo.
                    </p>
                  )}

                  {publicos.map((p) => {
                    const elegido = publico === p.nombre
                    return (
                      <button
                        key={p.nombre}
                        onClick={() => setPublico(elegido ? "" : p.nombre)}
                        className="flex cursor-pointer flex-col gap-0.5 rounded-xl p-2.5 text-left transition-colors"
                        style={{
                          background: "var(--bg-elevated)",
                          border: `1px solid ${elegido ? color : "var(--border-subtle)"}`,
                        }}
                      >
                        <span
                          className="flex items-center gap-1.5 text-[12.5px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {elegido && <Check size={12} style={{ color }} />}
                          {p.nombre}
                          {/* Se marca cual ya es suyo y no se filtra el resto:
                              a veces el mejor video le habla a quien no lo sigue. */}
                          {p.ya_es_suyo && (
                            <span
                              className="rounded px-1 py-0.5 text-[9px] uppercase tracking-wide"
                              style={{ background: color + "26", color: "var(--text-secondary)" }}
                            >
                              ya es suyo
                            </span>
                          )}
                        </span>
                        <span className="text-[11.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                          {p.cambia}
                        </span>
                      </button>
                    )
                  })}

                  {/* Si ninguna convence, se escribe: la fuente lo dice explicito. */}
                  <input
                    value={publicos.some((p) => p.nombre === publico) ? "" : publico}
                    onChange={(e) => setPublico(e.target.value)}
                    placeholder="…o escribí otro público"
                    className="rounded-lg px-3 py-2 text-[12px] outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* 2 · LA QUE DECIDE SI EL VIDEO SIRVE. */}
                <div className="flex flex-col gap-1.5">
                  <label className="section-label flex items-center gap-1.5">
                    <Quote size={12} /> ¿Qué es verdad acá?
                  </label>
                  <p className="-mt-1 text-[11px] leading-snug" style={{ color: "var(--text-faint)" }}>
                    El hecho concreto, la historia real, el número que sí tenés, el error que
                    cometiste, lo que te dijo un cliente. Sin un hecho propio adentro el guion sale
                    genérico y no hay redacción que lo salve.
                  </p>
                  <textarea
                    value={verdad}
                    onChange={(e) => setVerdad(e.target.value)}
                    rows={3}
                    placeholder="Ej: a mí se me infectó uno por dormir sin lavar la sábana, y el tatuador no me lo advirtió."
                    className="resize-none rounded-xl p-3 text-[13px] leading-relaxed outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* 3 · QUE HAY PARA MOSTRAR. Decide el formato antes que nada. */}
                <div className="flex flex-col gap-1.5">
                  <label className="section-label flex items-center gap-1.5">
                    <Camera size={12} /> ¿Qué tenés para mostrar?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MATERIALES.map((m) => {
                      const puesto = material.includes(m)
                      return (
                        <button
                          key={m}
                          onClick={() =>
                            setMaterial((antes) =>
                              // "nada" no convive con las demas: si se elige,
                              // borra el resto; y cualquier otra lo borra a el.
                              m === "nada"
                                ? puesto
                                  ? []
                                  : ["nada"]
                                : puesto
                                  ? antes.filter((x) => x !== m)
                                  : [...antes.filter((x) => x !== "nada"), m]
                            )
                          }
                          className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[11.5px] transition-colors"
                          style={{
                            background: "var(--bg-elevated)",
                            border: `1px solid ${puesto ? color : "var(--border-subtle)"}`,
                            color: puesto ? "var(--text-primary)" : "var(--text-faint)",
                          }}
                        >
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <p
                    className="flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]"
                    style={{ background: "var(--color-negative-bg)", color: "var(--color-negative)" }}
                  >
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEnPreguntas(false)}
                    className="flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2.5 text-[12.5px]"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                  >
                    <ArrowLeft size={13} /> Volver
                  </button>
                  {/* Sin `disabled` por respuestas: se puede escribir el guion
                      con las tres en blanco. La pregunta ayuda, no obliga. */}
                  <button
                    onClick={generar}
                    disabled={generando}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium",
                      "transition-opacity disabled:cursor-default disabled:opacity-35"
                    )}
                    style={{ background: color + "33", color: "var(--text-primary)" }}
                  >
                    <Sparkles size={14} className={generando ? "animate-pulse" : ""} />
                    {generando ? "Escribiendo el guion…" : "Escribir el guion"}
                  </button>
                </div>
              </>
            )}

            {res && (
              <div className="flex flex-col gap-4">
                <Bloque titulo="Brief">
                  <dl className="flex flex-col gap-1.5">
                    {Object.entries(res.brief ?? {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-[12px]">
                        <dt className="w-[110px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                          {k.replace(/_/g, " ")}
                        </dt>
                        <dd style={{ color: "var(--text-secondary)" }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Bloque>

                {/* Clasificación Converzzo — es lo que el calendario mide */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    FUNCIONES.find((f) => f.id === res.funcion)?.label,
                    ANGULOS.find((a) => a.id === res.angulo)?.label,
                    ROTACIONES.find((r) => r.id === res.rotacion)?.label,
                    res.duracion_objetivo,
                  ]
                    .filter(Boolean)
                    .map((t) => (
                      <span
                        key={t as string}
                        className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                        style={{ background: color + "1f", color: "var(--text-secondary)" }}
                      >
                        {t}
                      </span>
                    ))}
                </div>

                {res.portada && (
                  <Bloque titulo="Portada">
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {res.portada}
                    </p>
                  </Bloque>
                )}

                <Bloque titulo="Hooks — cada uno con sus 4 capas">
                  <div className="flex flex-col gap-2">
                    {res.hooks?.map((h, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 rounded-lg p-2.5"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                            Opción {i + 1}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                            {h.arquetipo}
                          </span>
                        </div>
                        <Capa icono="🗣️" nombre="Dice" texto={h.verbal} destacado />
                        <Capa icono="👁️" nombre="Se ve" texto={h.visual} />
                        <Capa icono="🔤" nombre="En pantalla" texto={h.textual} />
                        <Capa icono="🔊" nombre="Suena" texto={h.auditivo} />
                      </div>
                    ))}
                  </div>
                </Bloque>

                {res.escenas?.length > 0 && (
                  <Bloque titulo={`Plan de rodaje — ${res.escenas.length} escenas`}>
                    <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
                      {res.escenas.map((e, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-1 rounded-lg p-2.5"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                        >
                          <span
                            className="text-[10px] font-semibold tabular-nums"
                            style={{ color }}
                          >
                            {e.segundos}
                          </span>
                          <Capa icono="🗣️" nombre="Dice" texto={e.se_dice} destacado />
                          <Capa icono="👁️" nombre="Se ve" texto={e.se_ve} />
                          <Capa icono="🔤" nombre="En pantalla" texto={e.texto_pantalla} />
                          <Capa icono="🔊" nombre="Suena" texto={e.sonido} />
                        </div>
                      ))}
                    </div>
                  </Bloque>
                )}

                {(res.cta || res.loop) && (
                  <Bloque titulo="Cierre">
                    <div className="flex flex-col gap-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {res.cta && (
                        <p>
                          <strong style={{ color: "var(--text-primary)" }}>CTA ({res.cta.momento}):</strong>{" "}
                          {res.cta.que_pide}
                        </p>
                      )}
                      {res.loop && (
                        <p>
                          <strong style={{ color: "var(--text-primary)" }}>Loop:</strong> {res.loop}
                        </p>
                      )}
                    </div>
                  </Bloque>
                )}

                {/* Los números que el modelo puso y nadie verificó. Va ARRIBA de
                    las fuentes a propósito: es lo que hay que mirar antes de grabar. */}
                {res.porVerificar?.length > 0 && (
                  <div
                    className="flex flex-col gap-1.5 rounded-lg p-3"
                    style={{ background: "var(--color-negative-bg)" }}
                  >
                    <p
                      className="flex items-center gap-1.5 text-[11.5px] font-semibold"
                      style={{ color: "var(--color-negative)" }}
                    >
                      <AlertCircle size={12} /> Verificá estos números antes de grabar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {res.porVerificar.map((n) => (
                        <span
                          key={n}
                          className="rounded px-1.5 py-0.5 font-mono text-[11px]"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                      La IA los escribió, no salieron de tus datos. Un número inventado que se
                      publica se vuelve una promesa falsa de la marca.
                    </p>
                  </div>
                )}

                {/* De qué se alimentó — sin esto el guion no se puede auditar */}
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
                  Se escribió con la identidad de {marcaPorId(marca).nombre},{" "}
                  <strong>{res.fuentes?.referentes ?? 0}</strong> referente(s) guardado(s) y{" "}
                  <strong>{res.fuentes?.posts ?? 0}</strong> pieza(s) propia(s) con métricas reales.
                  {res.fuentes?.referentes === 0 &&
                    " Cargá referentes y los próximos guiones van a ser más de esta marca."}
                </p>

                <div className="flex gap-2">
                  {/* ⭐ Termina EN LA FICHA, no en el formulario.
                      Generar y después tener que ir a buscar lo generado es el
                      mismo trabajo partido en dos — y este recuadro tiene las
                      escenas dentro de un scroll de 300px, que sirve para
                      revisar pero no para grabar. */}
                  <button
                    onClick={() => {
                      cerrar()
                      if (res.id) router.push(`/plan/${res.id}/rodaje?marca=${marca}`)
                      else if (!controlado) router.push(`/plan?marca=${marca}`)
                    }}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-medium"
                    style={{ background: color + "33", color: "var(--text-primary)" }}
                  >
                    Abrir la ficha <ArrowRight size={13} />
                  </button>
                  {/* "Otra" no aparece al analizar una idea guardada: ahí no hay
                      otra idea que escribir, es ESTA la que se está convirtiendo. */}
                  {!controlado && (
                    <button
                      onClick={() => {
                        setRes(null)
                        setIdea("")
                      }}
                      className="cursor-pointer rounded-xl px-3 py-2.5 text-[12.5px]"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                    >
                      Otra
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** Una capa del hook. La verbal va destacada: es la que se graba primero. */
function Capa({
  icono,
  nombre,
  texto,
  destacado,
}: {
  icono: string
  nombre: string
  texto?: string
  destacado?: boolean
}) {
  if (!texto) return null
  return (
    <p className="flex gap-1.5 text-[11.5px] leading-snug">
      <span className="flex-shrink-0" title={nombre}>
        {icono}
      </span>
      <span style={{ color: destacado ? "var(--text-primary)" : "var(--text-secondary)" }}>{texto}</span>
    </p>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="section-label">{titulo}</h3>
      {children}
    </section>
  )
}
