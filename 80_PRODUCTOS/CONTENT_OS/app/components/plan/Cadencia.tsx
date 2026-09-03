"use client"

import { useEffect, useState } from "react"
import { Gauge } from "lucide-react"
import { MARCAS_OPERATIVAS, type MarcaId } from "@/lib/marcas"
import { TIPOS, type Meta, type TipoPieza } from "@/lib/piezasTipos"

/**
 * LA CADENCIA — cuántas piezas por semana, por marca.
 *
 * Vive en la base y no en el código justamente para que se pueda bajar sin
 * tocar nada el mes que el turno no dé. Una meta que no se puede bajar se
 * ignora, y una meta ignorada no mide nada.
 *
 * "Sin meta" es una opción legítima, no un olvido: es lo que corresponde a una
 * marca en mantenimiento, y hace que el calendario no le pinte huecos que
 * nadie va a llenar.
 */
export function Cadencia() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [estado, setEstado] = useState<"cargando" | "listo" | "sin-tablas" | "error">("cargando")
  const [guardada, setGuardada] = useState<MarcaId | null>(null)

  useEffect(() => {
    fetch("/api/metas")
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) {
          setEstado(d.faltaMigracion ? "sin-tablas" : "error")
          return
        }
        setMetas(d.metas)
        setEstado("listo")
      })
      .catch(() => setEstado("error"))
  }, [])

  async function guardar(marca: MarcaId, cambios: Partial<Meta>) {
    setMetas((prev) => {
      const existe = prev.some((m) => m.marca_id === marca)
      return existe
        ? prev.map((m) => (m.marca_id === marca ? { ...m, ...cambios } : m))
        : [...prev, { marca_id: marca, piezas_por_semana: 0, tipo_principal: "reel", activa: false, ...cambios } as Meta]
    })
    await fetch("/api/metas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marca_id: marca, ...cambios }),
    })
    setGuardada(marca)
    setTimeout(() => setGuardada(null), 1600)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Gauge size={15} style={{ color: "var(--text-secondary)" }} />
        <h2 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Cadencia por marca
        </h2>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Cuántas piezas por semana espera cada marca. Es lo que el calendario usa
        para decir si vas al ritmo. <strong>Cero = sin meta</strong>, que es lo
        correcto para una marca en mantenimiento.
      </p>

      {estado === "sin-tablas" && (
        <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
          Todavía no existe la tabla <code>metas</code>: falta correr{" "}
          <code>003_piezas_y_metas.sql</code> en Supabase.
        </p>
      )}

      {estado === "listo" && (
        <div className="flex flex-col gap-2">
          {MARCAS_OPERATIVAS.map((m) => {
            const meta = metas.find((x) => x.marca_id === m.id)
            const porSemana = meta?.piezas_por_semana ?? 0
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-4 rounded-xl p-4"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {m.nombre}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                      {porSemana > 0 ? `${porSemana * 4} al mes` : "sin meta declarada"}
                      {guardada === m.id && " · guardado ✓"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={21}
                    value={porSemana}
                    onChange={(e) =>
                      guardar(m.id, { piezas_por_semana: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-16 rounded-lg px-3 py-1.5 text-right font-mono text-[12px] transition-colors focus:outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                    aria-label={`Piezas por semana de ${m.nombre}`}
                  />
                  <select
                    value={meta?.tipo_principal ?? "reel"}
                    onChange={(e) => guardar(m.id, { tipo_principal: e.target.value as TipoPieza })}
                    className="cursor-pointer rounded-lg px-2 py-1.5 text-[11.5px] focus:outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-secondary)",
                    }}
                    aria-label={`Formato principal de ${m.nombre}`}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                    /semana
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
