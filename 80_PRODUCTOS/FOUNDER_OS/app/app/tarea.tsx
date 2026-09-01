'use client'

import { useTransition } from 'react'
import { cerrarTarea } from './acciones'
import { enHoras, type Encaje, type Peldano, type Tarea } from '@/lib/tiempo'

type Props = {
  caben: Encaje[]
  noCaben: Encaje[]
  hechasHoy: Tarea[]
  peldanos: Peldano[]
  capacidad: number
  minutosAsignados: number
  tipoDeDia: string
  libreBruto: number
}

export function PlanDelDia({
  caben, noCaben, hechasHoy, peldanos, capacidad, minutosAsignados, tipoDeDia, libreBruto,
}: Props) {
  const [pendiente, iniciar] = useTransition()
  const color = (n: number) => peldanos.find(p => p.n === n)?.color ?? '#7A879B'
  const libre = capacidad - minutosAsignados

  if (capacidad === 0) {
    return (
      <div className="plan protegido">
        <div className="plan-cab mono">
          Hoy<span>{tipoDeDia}</span>
        </div>
        <p className="plan-vacio">
          <b>Descansar es la tarea.</b> Sales de una noche: el día es para recuperar,
          y eso no cuenta como fallar.
        </p>
      </div>
    )
  }

  return (
    <div className="plan" style={{ opacity: pendiente ? 0.65 : 1 }}>
      <div className="plan-cab mono">
        Lo que cabe hoy
        <span>{tipoDeDia} · {enHoras(capacidad)}</span>
      </div>

      <div className="regla">
        <div className="regla-barra">
          {caben.map(t => (
            <i
              key={t.id}
              style={{ width: `${Math.min(100, (t.minutos / capacidad) * 100)}%`, background: color(t.peldano) }}
              title={`${t.texto} · ${t.minutos} min`}
            />
          ))}
        </div>
        <div className="regla-pie mono">
          <span>{minutosAsignados} de {capacidad} min</span>
          {libre > 0 && <span className="libre">quedan {libre}</span>}
        </div>
      </div>

      {caben.length === 0 && (
        <p className="plan-vacio">
          Nada de la lista cabe en {enHoras(capacidad)}. <b>Añade algo pequeño o descansa.</b>
        </p>
      )}

      {caben.map((t, i) => (
        <button
          key={t.id}
          className={'tarea' + (i === 0 ? ' primera' : '')}
          onClick={() => iniciar(async () => { await cerrarTarea(t.id, true) })}
        >
          <span className="tarea-check" />
          <span className="tarea-cuerpo">
            <span className="tarea-txt">{t.texto}</span>
            <span className="tarea-meta">
              <i className="pel" style={{ color: color(t.peldano) }}>● {t.peldano}</i>
              <i className="mono">{t.minutos} min</i>
              {i === 0 && <i className="primero">empieza por esta</i>}
            </span>
          </span>
        </button>
      ))}

      {hechasHoy.map(t => (
        <button
          key={t.id}
          className="tarea hecha"
          onClick={() => iniciar(async () => { await cerrarTarea(t.id, false) })}
        >
          <span className="tarea-check on">✓</span>
          <span className="tarea-cuerpo"><span className="tarea-txt">{t.texto}</span></span>
        </button>
      ))}

      {noCaben.length > 0 && (
        <details className="fuera">
          <summary>
            {noCaben.length} {noCaben.length === 1 ? 'tarea no cabe' : 'tareas no caben'} hoy
          </summary>
          {noCaben.map(t => (
            <div key={t.id} className="tarea fuera-item">
              <span className="tarea-cuerpo">
                <span className="tarea-txt">{t.texto}</span>
                <span className="tarea-meta">
                  <i className="pel" style={{ color: color(t.peldano) }}>● {t.peldano}</i>
                  <i className="mono">{t.minutos} min</i>
                </span>
              </span>
            </div>
          ))}
          <p className="fuera-nota">
            No caben en el bloque de hoy. Están ordenadas por cercanía a la venta,
            así que las primeras entran en cuanto tengas más tiempo.
          </p>
        </details>
      )}

      <p className="plan-reloj">
        Hoy estás despierto ~{enHoras(libreBruto)} fuera del trabajo.
        <b> El sistema cuenta {enHoras(capacidad)}</b> — el resto es tiempo de reloj, no de cabeza.
      </p>
    </div>
  )
}
