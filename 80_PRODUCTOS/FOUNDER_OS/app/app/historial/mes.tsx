'use client'

import { useMemo } from 'react'

export type HabitoMes = { id: string; nombre: string; color: string }
export type RegistroMes = { fecha: string; habito_id: string; nivel: string }

const OPACIDAD: Record<string, number> = { minimo: 0.38, normal: 0.7, super: 1 }
const DIA_CORTO = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * El periodo de un vistazo: una fila por habito, una casilla por dia.
 *
 * Por que existe. La pantalla de Hoy responde "que me falta ahora" y la lista
 * de abajo responde "que hice ese dia", pero ninguna responde la pregunta que
 * de verdad sostiene un habito: "¿lo estoy sosteniendo?". Eso solo se ve en
 * una reja — la racha se mira, no se calcula.
 *
 * Recibe las fechas ya calculadas: sirve igual para una semana que para un
 * mes, y quien decide el periodo es la pantalla, no esta pieza.
 */
export function Reja({
  habitos, registros, fechas, hoy, abierto, onAbrir,
}: {
  habitos: HabitoMes[]
  registros: RegistroMes[]
  fechas: string[]
  hoy: string
  abierto: string | null
  onAbrir: (fecha: string) => void
}) {
  const semana = fechas.length <= 8

  const datos = useMemo(() => {
    const puestos = new Map<string, string>()
    for (const r of registros) puestos.set(r.fecha + '|' + r.habito_id, r.nivel)

    const pasados = fechas.filter(d => d <= hoy)
    const posibles = pasados.length * habitos.length
    const hechos = pasados.reduce(
      (s, d) => s + habitos.filter(h => puestos.has(d + '|' + h.id)).length, 0)

    const porDia = fechas.map(d => ({
      fecha: d,
      n: habitos.filter(h => puestos.has(d + '|' + h.id)).length,
      futuro: d > hoy,
    }))

    // Racha: dias seguidos hacia atras desde el ultimo dia ya vivido del
    // periodo. Se corta en el primer dia sin marcar.
    const rachas = new Map<string, number>()
    for (const h of habitos) {
      let n = 0
      for (const d of [...pasados].reverse()) {
        if (puestos.has(d + '|' + h.id)) n++
        else break
      }
      rachas.set(h.id, n)
    }

    return {
      puestos, porDia, rachas, hechos,
      pct: posibles > 0 ? Math.round((hechos / posibles) * 100) : 0,
    }
  }, [fechas, registros, habitos, hoy])

  const maxDia = Math.max(1, ...datos.porDia.map(d => d.n))

  return (
    <div className={'mes' + (semana ? ' ancha' : '')}>
      {/* La curva: cuantos habitos por dia. Sube cuando el periodo va bien y se
          aplana cuando se abandona, que es justo lo que hay que ver. */}
      <svg className="mes-curva" viewBox={`0 0 ${datos.porDia.length * 4} 30`} preserveAspectRatio="none">
        <polyline
          points={datos.porDia.map((d, i) =>
            `${i * 4 + 2},${30 - (d.futuro ? 0 : (d.n / maxDia) * 26) - 2}`).join(' ')}
          fill="none" stroke="var(--oliva)" strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round"
        />
      </svg>

      <div className="mes-reja">
        <div className="mes-nombres">
          <div className="mes-esquina" />
          {habitos.map(h => (
            <div key={h.id} className="mes-nom">
              <i className="punto" style={{ background: h.color }} />
              <span>{h.nombre}</span>
              {(datos.rachas.get(h.id) ?? 0) > 1 && (
                <em className="mono mes-racha">{datos.rachas.get(h.id)}</em>
              )}
            </div>
          ))}
        </div>

        <div className="mes-scroll">
          <div className="mes-numeros">
            {fechas.map(d => (
              <span key={d} className={'mes-num' + (d === hoy ? ' hoy' : '')}>
                {semana && <i>{DIA_CORTO[new Date(d + 'T12:00:00').getDay()]}</i>}
                {Number(d.slice(8))}
              </span>
            ))}
          </div>

          {habitos.map(h => (
            <div key={h.id} className="mes-fila">
              {fechas.map(d => {
                const nivel = datos.puestos.get(d + '|' + h.id)
                return (
                  <button
                    key={d}
                    className={'celda'
                      + (d === hoy ? ' hoy' : '')
                      + (d === abierto ? ' viendo' : '')
                      + (d > hoy ? ' futuro' : '')}
                    style={nivel ? { background: h.color, opacity: OPACIDAD[nivel] ?? 0.7 } : undefined}
                    title={`${h.nombre} · ${Number(d.slice(8))}`}
                    onClick={() => onAbrir(d)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mes-pie mono">
        {datos.pct}% de lo posible · toca una casilla para abrir ese día
      </p>
    </div>
  )
}
