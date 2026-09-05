"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Lightbulb, MessageCircleQuestion, Plus, Sparkles } from "lucide-react"
import { MARCA_DEFAULT } from "@/lib/marcas"
import {
  NIVELES_CONTENIDO,
  PILARES_MODOZAINT,
  pilarPorId,
  type PilarId,
} from "@/lib/estrategiaContenido"
import type { Funcion, Pieza } from "@/lib/piezasTipos"

const NIVEL_POR_FUNCION = Object.fromEntries(
  NIVELES_CONTENIDO.map((nivel) => [nivel.funcion, nivel])
) as Record<Funcion, (typeof NIVELES_CONTENIDO)[number]>

function tituloDesde(texto: string, pilar: string) {
  const limpio = texto.replace(/^\s*(pregunta|comentario)\s*:\s*/i, "").trim()
  return `${pilar} - ${limpio.slice(0, 72)}`
}

/**
 * La estrategia y el banco usan la misma tabla `piezas`: una pregunta que
 * aparece varias veces no queda en notas sueltas, entra al ciclo completo de
 * idea -> guion -> grabacion -> publicacion -> medicion.
 */
export function EstrategiaContenido() {
  const [piezas, setPiezas] = useState<Pieza[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pilar, setPilar] = useState<PilarId>(PILARES_MODOZAINT[0].id)
  const [nivel, setNivel] = useState<Funcion>("adquisicion")
  const [referente, setReferente] = useState("")
  const [pregunta, setPregunta] = useState("")
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(`/api/piezas?marca=${MARCA_DEFAULT}`)
      const data = await res.json().catch(() => ({
        error: "ContentOS no pudo leer el servidor de piezas. Revisa la configuracion de Supabase.",
      }))
      if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar las ideas")
      setPiezas(data.piezas)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    // La carga arranca tras montar. Así no se fuerza una actualización de
    // estado sincrona durante el efecto de React.
    void Promise.resolve().then(cargar)
  }, [])

  async function guardarPregunta(e: React.FormEvent) {
    e.preventDefault()
    if (!pregunta.trim() || guardando) return
    setGuardando(true)
    setError(null)
    const pilarActual = pilarPorId(pilar)
    const fuente = referente.trim()
      ? `Pregunta observada en @${referente.trim().replace(/^@/, "")}: `
      : "Pregunta a validar: "
    try {
      const res = await fetch("/api/piezas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marca_id: MARCA_DEFAULT,
          tipo: "reel",
          estado: "idea",
          funcion: nivel,
          eje: pilar,
          titulo: tituloDesde(pregunta, pilarActual?.nombre ?? "Idea"),
          idea: fuente + pregunta.trim(),
        }),
      })
      const data = await res.json().catch(() => ({
        error: "ContentOS no pudo guardar la idea. Revisa la configuracion de Supabase.",
      }))
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar la idea")
      setPregunta("")
      setReferente("")
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  const ideas = piezas.filter((pieza) => pieza.estado === "idea")

  return (
    <div className="flex flex-col gap-6">
      <section
        className="overflow-hidden rounded-2xl p-5 md:p-6"
        style={{
          background: "linear-gradient(125deg, var(--marca-profundo), color-mix(in srgb, var(--marca-acento) 28%, var(--marca-profundo)))",
          color: "var(--marca-papel)",
        }}
      >
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
            <Sparkles size={13} /> Brújula de contenido
          </span>
          <h2 className="font-display text-[25px] font-semibold leading-tight md:text-[32px]">
            IA para construir proyectos propios, no herramientas sueltas.
          </h2>
          <p className="max-w-2xl text-[13px] leading-relaxed opacity-80">
            Los tips atraen; los proyectos, decisiones y pruebas hacen que la audiencia se quede.
            Esta es la base operativa del vibe marketing de MODOZAINT: cada señal se convierte en una decisión trazable.
          </p>
        </div>
      </section>

      <section className="rounded-xl p-4 md:p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="section-label">Ciclo de trabajo</span>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
              La Brújula no reemplaza el criterio: evita que una observación se pierda antes de convertirse en aprendizaje.
            </p>
          </div>
          <Link href="/referentes?marca=modozaint" className="text-[12px] font-medium" style={{ color: "var(--marca-acento)" }}>
            Abrir referentes
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Referentes", href: "/referentes?marca=modozaint", ayuda: "Qué se estudia" },
            { label: "Preguntas", href: "#radar-preguntas", ayuda: "Se anota abajo" },
            { label: "Ideas", href: "#ideas-pendientes", ayuda: "Pilar + nivel" },
            { label: "Plan", href: "/plan?marca=modozaint&vista=pipeline", ayuda: "Ficha y rodaje" },
            { label: "Piezas", href: "/plan?marca=modozaint&vista=calendario", ayuda: "Agenda y grabación" },
            { label: "Métricas", href: "/instagram", ayuda: "IG automático, TikTok manual" },
          ].map((paso, index) => (
            <Link
              key={paso.label}
              href={paso.href}
              className="rounded-lg px-3 py-3 transition-colors hover:brightness-110"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="font-mono text-[10px]" style={{ color: "var(--marca-acento)" }}>0{index + 1}</span>
              <p className="mt-1 text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{paso.label}</p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--text-faint)" }}>{paso.ayuda}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
          Medición y aprendizaje: el reach y las métricas de Instagram se traen automático en{" "}
          <Link href="/instagram" className="underline underline-offset-2">Analizar</Link> y{" "}
          <Link href="/dashboard" className="underline underline-offset-2">Overview</Link>. TikTok se carga manual
          (sin API conectada) hasta que la cuenta se enlace en{" "}
          <Link href="/settings" className="underline underline-offset-2">Settings</Link>. El aprendizaje de cada pieza: qué
          funcionó y por qué— se consulta con datos reales en{" "}
          <Link href="/chat" className="underline underline-offset-2">AI Chat</Link>, nunca inventado.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {NIVELES_CONTENIDO.map((item) => (
          <article
            key={item.funcion}
            className="rounded-xl p-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{item.nombre}</h3>
              <strong className="font-mono text-[20px]" style={{ color: "var(--marca-acento)" }}>{item.proporcion}%</strong>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.detalle}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <span className="section-label">Pilares</span>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
              Un pilar es un territorio repetible, no un tema que se agota en un video.
            </p>
          </div>
          <Link href="/plan?marca=modozaint" className="flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--marca-acento)" }}>
            Ver pipeline <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PILARES_MODOZAINT.map((item, index) => {
            const total = ideas.filter((idea) => idea.eje === item.id).length
            return (
              <article key={item.id} className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[11px]" style={{ color: "var(--marca-acento)" }}>0{index + 1}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--marca-acento)22", color: "var(--text-secondary)" }}>
                    {total} idea{total === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="mt-5 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{item.nombre}</h3>
                <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.detalle}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section id="radar-preguntas" className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <form onSubmit={guardarPregunta} className="rounded-xl p-4 md:p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <MessageCircleQuestion size={16} style={{ color: "var(--marca-acento)" }} />
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Radar de preguntas</h2>
              <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Guarda una pregunta no resuelta como idea, no como captura perdida.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select value={pilar} onChange={(e) => setPilar(e.target.value as PilarId)} className="rounded-lg px-3 py-2.5 text-[12px] outline-none" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} aria-label="Pilar de la idea">
              {PILARES_MODOZAINT.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
            <select value={nivel} onChange={(e) => setNivel(e.target.value as Funcion)} className="rounded-lg px-3 py-2.5 text-[12px] outline-none" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} aria-label="Nivel de contenido">
              {NIVELES_CONTENIDO.map((item) => <option key={item.funcion} value={item.funcion}>{item.nombre} ({item.proporcion}%)</option>)}
            </select>
          </div>
          <input value={referente} onChange={(e) => setReferente(e.target.value)} placeholder="@referente (opcional)" className="mt-3 w-full rounded-lg px-3 py-2.5 text-[12px] outline-none" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
          <textarea value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="¿Qué pregunta siguen haciendo y nadie responde bien?" rows={3} required className="mt-3 w-full resize-none rounded-lg px-3 py-2.5 text-[12.5px] outline-none" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
          <button type="submit" disabled={!pregunta.trim() || guardando} className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium disabled:cursor-default disabled:opacity-40" style={{ background: "var(--marca-acento)", color: "var(--marca-profundo)" }}>
            <Plus size={13} />{guardando ? "Guardando..." : "Enviar al banco de ideas"}
          </button>
          {error && <p className="mt-3 rounded-lg px-3 py-2 text-[11.5px]" style={{ background: "var(--color-negative-bg)", color: "var(--color-negative)" }}>{error}</p>}
        </form>

        <aside className="rounded-xl p-4 md:p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2"><Lightbulb size={16} style={{ color: "var(--marca-acento)" }} /><h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Regla de seleccion</h2></div>
          <ol className="mt-4 flex list-decimal flex-col gap-2 pl-4 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <li>La pregunta viene de una observacion real, no de una suposicion.</li>
            <li>La respuesta se puede probar con pantalla, proyecto o fuente.</li>
            <li>El tip termina conectado a un proyecto de MODOZAINT.</li>
            <li>Sin oferta aprobada, conversion solo valida demanda.</li>
          </ol>
        </aside>
      </section>

      <section id="ideas-pendientes" className="rounded-xl p-4 md:p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="section-label">Ideas pendientes</span>
            <p className="mt-1 text-[11.5px]" style={{ color: "var(--text-faint)" }}>{cargando ? "Cargando..." : `${ideas.length} ideas de MODOZAINT listas para clasificar o guionizar.`}</p>
          </div>
          <Link href="/plan?marca=modozaint" className="text-[12px] font-medium" style={{ color: "var(--marca-acento)" }}>Abrir Plan</Link>
        </div>
        {!cargando && ideas.length > 0 && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {ideas.slice(0, 8).map((idea) => {
              const p = pilarPorId(idea.eje)
              const n = idea.funcion ? NIVEL_POR_FUNCION[idea.funcion] : null
              return <div key={idea.id} className="rounded-lg p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--marca-acento)" }}>{p?.nombre ?? "Sin pilar"}</span>{n && <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{n.nombre}</span>}</div>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{idea.idea ?? idea.titulo}</p>
              </div>
            })}
          </div>
        )}
        {!cargando && ideas.length === 0 && <p className="mt-3 text-[12px]" style={{ color: "var(--text-faint)" }}>Todavia no hay ideas. La primera pregunta observada se guarda arriba.</p>}
      </section>
    </div>
  )
}
