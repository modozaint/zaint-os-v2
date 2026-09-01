'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { fijarTurno } from './acciones'

type T = { id: string; nombre: string; meta_nivel: string; meta_habitos: number; descripcion: string }

export function SelectorTurno({ turnos, activo }: { turnos: T[]; activo: string | null }) {
  const [abierto, setAbierto] = useState(false)
  const [pendiente, iniciar] = useTransition()
  const actual = turnos.find(t => t.id === activo)

  return (
    <>
      <button className="chip-turno" onClick={() => setAbierto(true)}
              style={{ opacity: pendiente ? 0.6 : 1 }}>
        <span className="mono">{actual ? actual.nombre : 'Marcar turno de hoy'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {abierto && (
        <div className="hoja-fondo" onClick={() => setAbierto(false)}>
          <div className="hoja" onClick={e => e.stopPropagation()}>
            <h3>Turno de hoy</h3>
            <p className="sub">Decide qué te exige el día. En turno de 12 h, el mínimo ya es cumplir.</p>

            <Link className="hoja-cuadro" href="/turnos">
              Ver el cuadro del mes y pasar los cambios →
            </Link>

            {turnos.map(t => (
              <button
                key={t.id}
                className={'hoja-niv' + (activo === t.id ? ' on' : '')}
                onClick={() => { setAbierto(false); iniciar(async () => { await fijarTurno(t.id) }) }}
              >
                <b className="mono">{t.id === 'POSTURNO' ? 'POST' : t.id}</b>
                <span>
                  {t.nombre}
                  <em className="meta-turno">
                    {t.meta_nivel === 'ninguno'
                      ? 'Día protegido · no pierdes vida'
                      : `${t.meta_habitos} hábito${t.meta_habitos > 1 ? 's' : ''} en ${t.meta_nivel}`}
                  </em>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
