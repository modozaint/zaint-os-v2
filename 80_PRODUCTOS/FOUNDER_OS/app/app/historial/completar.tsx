'use client'

import { useState, useTransition } from 'react'
import { marcarHabitoEnFecha } from '../acciones'
import type { Nivel } from '@/lib/tipos'

export type HabitoLlenable = {
  id: string; nombre: string; color: string
  minimo: string; normal: string; super: string
}

const XP: Record<Nivel, number> = { minimo: 10, normal: 25, super: 50 }
const ETIQUETA: Record<Nivel, string> = { minimo: 'Mín', normal: 'Normal', super: 'Super' }
const ORDEN: Nivel[] = ['minimo', 'normal', 'super']

/**
 * Llenar un día que ya pasó.
 *
 * Existe porque el día que Santiago hace turno de 12 h no abre la app, y al
 * otro día ese día se ve vacío aunque no lo estuvo. La regla que él puso —solo
 * la última semana— vive en `sePuedeLlenar` y la vuelve a comprobar el
 * servidor: esto es la comodidad, no el candado.
 *
 * Se marca en el sitio: el nivel elegido se ve de una y el servidor confirma
 * detrás. Si falla, la fila vuelve a como estaba y lo dice.
 */
export function Completar({
  fecha, habitos, marcados, cerrado,
}: {
  fecha: string
  habitos: HabitoLlenable[]
  marcados: Record<string, string>
  cerrado: boolean
}) {
  const [estado, setEstado] = useState<Record<string, string | undefined>>(marcados)
  const [error, setError] = useState<string | null>(null)
  const [, iniciar] = useTransition()

  function elegir(habitoId: string, nivel: Nivel) {
    const antes = estado[habitoId]
    const nuevo = antes === nivel ? null : nivel
    setEstado(e => ({ ...e, [habitoId]: nuevo ?? undefined }))
    setError(null)
    iniciar(async () => {
      const r = await marcarHabitoEnFecha(fecha, habitoId, nuevo)
      if (r?.error) {
        setEstado(e => ({ ...e, [habitoId]: antes }))
        setError(r.error)
      }
    })
  }

  const puestos = habitos.filter(h => estado[h.id]).length

  return (
    <div className="llenar">
      <div className="llenar-cab">
        <span className="mono">Llenar este día</span>
        <span className="mono llenar-cuenta">{puestos}/{habitos.length}</span>
      </div>

      {habitos.map(h => (
        <div key={h.id} className="llenar-fila">
          <div className="llenar-top">
            <i className="punto" style={{ background: h.color }} />
            <span className="llenar-nom">{h.nombre}</span>
            <div className="llenar-nivs">
              {ORDEN.map(n => (
                <button
                  key={n}
                  className={'llenar-niv' + (estado[h.id] === n ? ' on' : '')}
                  style={estado[h.id] === n ? { background: h.color, borderColor: h.color } : undefined}
                  onClick={() => elegir(h.id, n)}
                  aria-label={`${h.nombre}, ${ETIQUETA[n]}: ${h[n]}`}
                >
                  {ETIQUETA[n]}
                </button>
              ))}
            </div>
          </div>
          {/* Que dice el nivel que acaba de marcar: 'Normal' solo no significa
              nada, y sin esto hay que acordarse de lo que pedia cada habito. */}
          {estado[h.id] && (
            <p className="llenar-dice">
              {h[estado[h.id] as Nivel]}
              <em className="mono"> +{XP[estado[h.id] as Nivel]} XP</em>
            </p>
          )}
        </div>
      ))}

      {error && <p className="error">{error}</p>}

      {/* La verdad incómoda, dicha donde se toma la decisión: el XP sí entra,
          la vida de un día ya cerrado no se recalcula. Ver acciones.ts. */}
      <p className="llenar-pie mono">
        {cerrado
          ? 'Este día ya cerró: lo que marques suma XP y sube el área, pero la vida de ese día ya se cobró y no se vuelve a mover.'
          : 'Este día todavía no ha cerrado: lo que marques cuenta completo, XP y vida.'}
      </p>
    </div>
  )
}
