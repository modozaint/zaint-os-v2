"use client"

import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import {
  ANGULOS,
  FUNCIONES,
  ROTACIONES,
  TIPOS,
  type Funcion,
  type Meta,
  type Pieza,
  type Rotacion,
  type TipoPieza,
} from "@/lib/piezasTipos"
import { marcaPorId, type MarcaId } from "@/lib/marcas"

/**
 * EL BALANCE DEL MES — lo que convierte el calendario en un sistema.
 *
 * Una grilla de fechas te dice CUÁNDO. Esto te dice QUÉ FALTA, que es la
 * pregunta que de verdad frena a la hora de sentarse a producir.
 *
 * Mide las tres rejillas de Converzzo contra lo planeado:
 *   · frecuencia por formato (el curso la da por formato, no en bloque)
 *   · mezcla de funciones (arranque: 50 adquisición / 25 autoridad / 25 conversión)
 *   · rotación 70 probado / 20 en prueba / 10 experimental
 *
 * Y avisa de la única regla dura del curso que se puede verificar sola:
 * **no repetir el mismo ángulo dos días seguidos.**
 *
 * Todo se calcula sobre las piezas AGENDADAS del mes. Una pieza sin fecha no
 * cuenta: todavía no es un plan, es una idea.
 */

function porcentaje(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100)
}

export function Balance({
  piezas,
  marca,
  meta,
  mes,
}: {
  piezas: Pieza[]
  marca: MarcaId
  meta: Meta | undefined
  mes: Date
}) {
  const color = marcaPorId(marca).color

  const delMes = useMemo(
    () =>
      piezas.filter((p) => {
        if (!p.fecha_objetivo) return false
        const d = new Date(p.fecha_objetivo + "T00:00:00")
        return d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear()
      }),
    [piezas, mes]
  )

  // Ángulo repetido en días consecutivos — la única regla del curso que se
  // puede comprobar sin criterio humano.
  const choques = useMemo(() => {
    const conAngulo = delMes
      .filter((p) => p.angulo && p.fecha_objetivo)
      .sort((a, b) => (a.fecha_objetivo! < b.fecha_objetivo! ? -1 : 1))
    const out: { fecha: string; angulo: string }[] = []
    for (let i = 1; i < conAngulo.length; i++) {
      const ant = conAngulo[i - 1]
      const act = conAngulo[i]
      if (ant.angulo !== act.angulo) continue
      const d1 = new Date(ant.fecha_objetivo! + "T00:00:00").getTime()
      const d2 = new Date(act.fecha_objetivo! + "T00:00:00").getTime()
      const dias = Math.round((d2 - d1) / 86_400_000)
      if (dias <= 1) {
        out.push({
          fecha: act.fecha_objetivo!,
          angulo: ANGULOS.find((a) => a.id === act.angulo)?.label ?? act.angulo!,
        })
      }
    }
    return out
  }, [delMes])

  if (delMes.length === 0) {
    return (
      <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
        Todavía no hay piezas agendadas este mes. El balance aparece cuando les pongas fecha.
      </p>
    )
  }

  const semanasDelMes = 4.3
  const frecuencias = meta?.frecuencias
  const mezcla = meta?.mezcla ?? { adquisicion: 50, autoridad: 25, conversion: 25 }
  const rotObjetivo = meta?.rotacion_objetivo ?? { probado: 70, prueba: 20, experimental: 10 }

  return (
    <div className="flex flex-col gap-5">
      {choques.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg p-3"
          style={{ background: "var(--color-negative-bg)" }}
        >
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-negative)" }} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11.5px] font-semibold" style={{ color: "var(--color-negative)" }}>
              Mismo ángulo dos días seguidos
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {choques.map((c) => `${c.angulo} el ${c.fecha.slice(8)}`).join(" · ")} — el curso pide no
              repetir ángulo en días consecutivos.
            </span>
          </div>
        </div>
      )}

      {/* Formato: lo planeado contra la frecuencia declarada */}
      {frecuencias && (
        <Seccion titulo="Por formato, a la semana">
          <div className="flex flex-col gap-2">
            {TIPOS.map((t) => {
              const objetivo = frecuencias[t.id as TipoPieza] ?? 0
              if (objetivo === 0) return null
              const hechas = delMes.filter((p) => p.tipo === t.id).length
              const porSemana = +(hechas / semanasDelMes).toFixed(1)
              const alcanza = porSemana >= objetivo
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-[70px] text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                    {t.label}
                  </span>
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, porcentaje(porSemana, objetivo))}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span
                    className="w-[92px] text-right text-[11px] tabular-nums"
                    style={{ color: alcanza ? color : "var(--text-faint)" }}
                  >
                    {porSemana} / {objetivo} sem
                  </span>
                </div>
              )
            })}
          </div>
        </Seccion>
      )}

      {/* Mezcla de funciones */}
      <Seccion titulo={`Para qué sirven — objetivo ${mezcla.adquisicion}/${mezcla.autoridad}/${mezcla.conversion}`}>
        <Barras
          items={FUNCIONES.map((f) => ({
            label: f.label,
            real: porcentaje(delMes.filter((p) => p.funcion === f.id).length, delMes.length),
            objetivo: mezcla[f.id as Funcion] ?? 0,
          }))}
          color={color}
        />
        {delMes.some((p) => !p.funcion) && (
          <p className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
            {delMes.filter((p) => !p.funcion).length} pieza(s) sin función asignada — no entran al balance.
          </p>
        )}
      </Seccion>

      {/* Rotación 70/20/10 */}
      <Seccion titulo="Rotación — cuánto es apuesta segura">
        <Barras
          items={ROTACIONES.map((r) => ({
            label: r.label,
            real: porcentaje(delMes.filter((p) => p.rotacion === r.id).length, delMes.length),
            objetivo: rotObjetivo[r.id as Rotacion] ?? 0,
          }))}
          color={color}
        />
      </Seccion>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="section-label">{titulo}</h3>
      {children}
    </section>
  )
}

/**
 * Cada barra muestra lo real contra el objetivo, con el objetivo marcado como
 * una línea. Un número suelto ("32 %") no dice si está bien; comparado con la
 * marca, sí.
 */
function Barras({
  items,
  color,
}: {
  items: { label: string; real: number; objetivo: number }[]
  color: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => {
        const desvio = it.real - it.objetivo
        const bien = Math.abs(desvio) <= 10
        return (
          <div key={it.label} className="flex items-center gap-3">
            <span className="w-[80px] text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
              {it.label}
            </span>
            <div
              className="relative h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, it.real)}%`, background: color }}
              />
              {/* La marca del objetivo */}
              <span
                className="absolute top-0 h-full w-px"
                style={{ left: `${Math.min(100, it.objetivo)}%`, background: "var(--text-secondary)" }}
                title={`objetivo ${it.objetivo}%`}
              />
            </div>
            <span
              className="w-[92px] text-right text-[11px] tabular-nums"
              style={{ color: bien ? color : "var(--text-faint)" }}
            >
              {it.real}% {desvio === 0 ? "" : desvio > 0 ? `(+${desvio})` : `(${desvio})`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
