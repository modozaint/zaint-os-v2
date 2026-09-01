"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, Check, ChevronDown, Columns3, CalendarDays, Table2 } from "lucide-react"
import { MARCA_DEFAULT, esMarca, type MarcaId } from "@/lib/marcas"
import type { EstadoPieza, Meta, Pieza, TipoPieza } from "@/lib/piezasTipos"
import { Pipeline } from "./Pipeline"
import { Calendario } from "./Calendario"
import { Tabla } from "./Tabla"
import { CapturaIdeas } from "./CapturaIdeas"

type Vista = "pipeline" | "calendario" | "tabla"

/**
 * EL PLAN — Pipeline, Calendario y Tabla sobre los MISMOS datos.
 *
 * Son tres preguntas distintas sobre la misma tabla: el Pipeline responde
 * "¿dónde se atasca?", el Calendario "¿qué sigue y voy al ritmo?" y la Tabla
 * "¿cómo cargo la semana entera de una sentada?". Por eso comparten estado y
 * se cambian con una pestaña, en vez de ser tres páginas que se desincronizan.
 *
 * ⚠️ Se cargan las piezas de TODAS las marcas, no solo la activa: la tabla
 * filtra por marca del lado del cliente y el banco de ideas es compartido —
 * una idea de Kaizen anotada mientras mirabas Dermatinta tiene que aparecer.
 * Pipeline y Calendario siguen viendo solo la marca activa, que es lo suyo.
 */
function esVista(v: string | null): v is Vista {
  return v === "pipeline" || v === "calendario" || v === "tabla"
}

export function PlanTablero() {
  const params = useSearchParams()
  const desdeUrl = params.get("marca")
  const marca: MarcaId = esMarca(desdeUrl) ? desdeUrl : MARCA_DEFAULT

  /**
   * La vista arranca de la URL. Antes era siempre "pipeline", y desde que la
   * ficha de rodaje tiene botón de volver eso se notaba: entrabas desde el
   * calendario, volvías, y la app te había movido de pestaña sin razón.
   */
  const [vista, setVista] = useState<Vista>(() =>
    esVista(params.get("vista")) ? (params.get("vista") as Vista) : "pipeline"
  )
  /** El selector desplegado o cerrado. Solo se ve la vista activa (plan 4.3.b). */
  const [abriendoVistas, setAbriendoVistas] = useState(false)

  /** Que idea se esta analizando. Antes lo disparaba la lista del banco, que
   *  ya no existe: ahora sale de la columna IDEA del pipeline. */
  const [analizar, setAnalizar] = useState<
    { id: string; idea: string; tipo: TipoPieza; marca_id: string | null } | null
  >(null)

  // La vista elegida se recuerda entre visitas. Con try/catch: si falla, abre
  // en la que este por defecto y no se cae por eso.
  useEffect(() => {
    if (esVista(params.get("vista"))) return
    try {
      const g = localStorage.getItem("plan_vista")
      if (esVista(g)) setVista(g as Vista)
    } catch {}
  }, [params])

  function cambiarVista(v: Vista) {
    setVista(v)
    setAbriendoVistas(false)
    try { localStorage.setItem("plan_vista", v) } catch {}
  }
  const [piezas, setPiezas] = useState<Pieza[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faltaMigracion, setFaltaMigracion] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [rp, rm] = await Promise.all([fetch("/api/piezas"), fetch("/api/metas")])
      const dp = await rp.json()
      if (!rp.ok) {
        if (dp.faltaMigracion) setFaltaMigracion(true)
        throw new Error(dp.error ?? "No se pudieron cargar las piezas")
      }
      setFaltaMigracion(false)
      setPiezas(dp.piezas)
      const dm = await rm.json()
      setMetas(rm.ok ? dm.metas : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const deLaMarca = useMemo(() => piezas.filter((p) => p.marca_id === marca), [piezas, marca])

  // El banco: lo que está anotado y todavía no se analizó, de todas las marcas.
  const ideas = useMemo(
    () =>
      piezas
        .filter((p) => p.estado === "idea")
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [piezas]
  )

  /**
   * Guardar una pieza. El `autor` NO viaja acá: lo sella el servidor con la
   * cookie del usuario activo. Si nadie eligió quién es, responde 401 y ese
   * mensaje se muestra tal cual — anotar una idea sin firma no es una opción.
   */
  async function crear(fila: {
    titulo: string
    marca_id: MarcaId
    tipo: TipoPieza
    idea?: string
    fecha_objetivo?: string | null
  }) {
    const r = await fetch("/api/piezas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fila),
    })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      throw new Error(d.error ?? "No se pudo guardar")
    }
    await cargar()
  }

  // Optimista: mover una tarjeta o corregir una celda tiene que sentirse
  // instantáneo. Si el servidor falla, `cargar()` devuelve la verdad.
  async function parchear(id: string, cambios: Partial<Pieza>) {
    setPiezas((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
    await fetch("/api/piezas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...cambios }),
    })
    await cargar()
  }

  async function borrar(id: string) {
    setPiezas((prev) => prev.filter((p) => p.id !== id))
    await fetch(`/api/piezas?id=${id}`, { method: "DELETE" })
    await cargar()
  }

  if (faltaMigracion) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle size={20} style={{ color: "var(--text-faint)" }} />
        <h2 className="font-display text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Falta correr las migraciones
        </h2>
        <p className="max-w-md text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Las tablas <code>piezas</code> y <code>metas</code> todavía no existen en
          Supabase. Se crean pegando{" "}
          <code>supabase/002_multimarca_y_referentes.sql</code>,{" "}
          <code>supabase/003_piezas_y_metas.sql</code> y{" "}
          <code>supabase/006_autor_y_ideas.sql</code>, en ese orden, en el SQL
          Editor.
        </p>
        <button
          onClick={cargar}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-[12px]"
          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
        >
          Volver a intentar
        </button>
      </div>
    )
  }

  const VISTAS: { id: Vista; label: string; Icon: typeof Columns3 }[] = [
    { id: "pipeline", label: "Pipeline", Icon: Columns3 },
    { id: "calendario", label: "Calendario", Icon: CalendarDays },
    { id: "tabla", label: "Tabla", Icon: Table2 },
  ]

  /**
   * LAS TRES VISTAS, COMPRIMIDAS EN LA QUE SE ESTA VIENDO.
   *
   * Santiago (2026-08-26): «me gustaria que los tres estuviesen comprimidos en
   * el que se esta viendo en el momento; que se seleccione o se pueda desplegar
   * y ahi salgan estas tres opciones».
   *
   * EL COSTO, DICHO UNA VEZ: cambiar de vista pasa de un toque a dos. Vale la
   * pena si se queda mayormente en una, y no si alterna todo el rato entre
   * calendario y pipeline. Es reversible y se sabra usandolo: si en dos semanas
   * resulta que alterna mucho, vuelven a ser pestanas.
   */
  const selectorVistas = () => {
    const activa = VISTAS.find((v) => v.id === vista) ?? VISTAS[0]
    return (
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setAbriendoVistas((a) => !a)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium"
          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          aria-expanded={abriendoVistas}
          aria-label={"Vista: " + activa.label + ". Toca para cambiar"}
        >
          <activa.Icon size={13} /> {activa.label}
          <ChevronDown size={12} style={{ color: "var(--text-faint)" }} />
        </button>

        {abriendoVistas && (
          <>
            {/* Un toque afuera lo cierra: sin esto queda abierto y estorba. */}
            <div className="fixed inset-0 z-10" onClick={() => setAbriendoVistas(false)} />
            <div
              className="absolute left-0 top-full z-20 mt-1 flex min-w-[150px] flex-col overflow-hidden rounded-lg"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              {VISTAS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => cambiarVista(v.id)}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] hover:bg-[var(--hover-bg)]"
                  style={{ color: v.id === vista ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  <v.Icon size={13} />
                  <span className="flex-1 text-left">{v.label}</span>
                  {v.id === vista && <Check size={12} />}
                </button>
              ))}
            </div>
          </>
        )}

        {cargando && (
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            cargando...
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* El banco de ideas va ARRIBA de las pestañas a propósito: se anota
          desde cualquier vista, sin tener que ir a buscar dónde. */}
      <CapturaIdeas
        ideas={ideas}
        marcaActiva={marca}
        onAnotar={(texto, m, tipo) =>
          crear({ titulo: texto, marca_id: m, tipo, idea: texto })
        }
        onBorrar={borrar}
        onCambio={cargar}
        analizar={analizar}
        onAnalizado={() => setAnalizar(null)}
      />

      {selectorVistas()}

      {error && !faltaMigracion && (
        <p
          className="rounded-lg px-3 py-2 text-[12px]"
          style={{ background: "var(--color-negative-bg)", color: "var(--color-negative)" }}
        >
          {error}
        </p>
      )}

      {vista === "pipeline" && (
        <Pipeline
          piezas={deLaMarca}
          marca={marca}
          rodajeDe={(id) => `/plan/${id}/rodaje?desde=pipeline&marca=${marca}`}
          onAnalizar={(p) =>
            setAnalizar({ id: p.id, idea: p.idea ?? p.titulo, tipo: p.tipo, marca_id: p.marca_id })
          }
          onCrear={(titulo, tipo) => crear({ titulo, tipo, marca_id: marca, idea: titulo })}
          onMover={(id, estado: EstadoPieza) => parchear(id, { estado })}
          onBorrar={borrar}
        />
      )}

      {vista === "calendario" && (
        <Calendario
          piezas={deLaMarca}
          marca={marca}
          meta={metas.find((m) => m.marca_id === marca)}
          rodajeDe={(id) => `/plan/${id}/rodaje?desde=calendario&marca=${marca}`}
          onAgendar={(id, fecha) => parchear(id, { fecha_objetivo: fecha })}
        />
      )}

      {vista === "tabla" && (
        <Tabla
          piezas={piezas}
          marcaActiva={marca}
          rodajeDe={(id, m) => `/plan/${id}/rodaje?desde=tabla&marca=${m ?? marca}`}
          onCrear={crear}
          onParchear={parchear}
          onBorrar={borrar}
        />
      )}
    </div>
  )
}
