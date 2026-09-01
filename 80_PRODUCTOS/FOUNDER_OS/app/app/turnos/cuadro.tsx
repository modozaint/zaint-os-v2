'use client'

import { useMemo, useState, useTransition } from 'react'
import { cargarCuadroDelMes, fijarTurnoEnFecha } from '../acciones'
import { conteoDelMes, cuadroDe } from '@/lib/cuadros'

export type TurnoDef = {
  id: string
  nombre: string
  meta_nivel: string
  meta_habitos: number
  horas_clinica: number | null
  descripcion: string | null
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/**
 * El mes entero, un toque por dia.
 *
 * Se pinta por lo que el dia COBRA en horas de clinica, no por su nombre: un
 * turno de 12 h y uno de 6 no son el mismo tipo de dia por mucho que los dos
 * digan "trabajo". El color es la unica forma de ver de un vistazo si el mes
 * viene cargado.
 */
export function Cuadro({
  hoy, turnos, puestos,
}: {
  hoy: string
  turnos: TurnoDef[]
  puestos: Record<string, string>
}) {
  const [mes, setMes] = useState(hoy.slice(0, 7))
  const [eligiendo, setEligiendo] = useState<string | null>(null)
  const [local, setLocal] = useState<Record<string, string | null>>({})
  const [pendiente, iniciar] = useTransition()

  /**
   * El cargador del mes. Solo aparece si hay un cuadro YA LEÍDO para ese mes en
   * `lib/cuadros.ts` — no inventa turnos para un mes del que nadie mandó el PDF.
   */
  const cuadro = cuadroDe(mes)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  function cargarMes() {
    if (!cuadro || cargando) return
    setCargando(true); setResultado(null)
    iniciar(async () => {
      const r = await cargarCuadroDelMes(mes)
      if ('error' in r && r.error) setResultado(r.error)
      else if ('ok' in r) {
        const partes = [`${r.creadas} creados`]
        if (r.corregidas) partes.push(`${r.corregidas} corregidos`)
        if (r.iguales) partes.push(`${r.iguales} ya estaban`)
        if (r.respetadas) partes.push(`${r.respetadas} respetados (ya vividos)`)
        setResultado(partes.join(' · ') + ` — ${r.total} días del mes`)
      }
      setCargando(false)
    })
  }

  const turnoDe = (f: string): string | null =>
    f in local ? local[f] : (puestos[f] ?? null)

  const defDe = (id: string | null) => turnos.find(t => t.id === id) ?? null

  const { celdas, dias } = useMemo(() => {
    const [a, m] = mes.split('-').map(Number)
    const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
    const dd = (n: number) => String(n).padStart(2, '0')
    const lista = Array.from({ length: ultimo }, (_, i) => `${mes}-${dd(i + 1)}`)

    // Lunes primero: el cuadro de la clinica se lee por semana.
    const primero = new Date(`${mes}-01T12:00:00`).getDay()
    const huecos = (primero + 6) % 7

    return { celdas: [...Array(huecos).fill(null), ...lista], dias: lista }
  }, [mes])

  const resumen = useMemo(() => {
    let horas = 0
    let trabajados = 0
    let sinPoner = 0
    for (const f of dias) {
      const t = defDe(turnoDe(f))
      if (!t) { if (f <= hoy) sinPoner++; continue }
      const h = Number(t.horas_clinica ?? 0)
      if (h > 0) { horas += h; trabajados++ }
    }
    return { horas, trabajados, sinPoner }
  }, [dias, local, puestos, turnos, hoy])

  function poner(fecha: string, turnoId: string | null) {
    setLocal(l => ({ ...l, [fecha]: turnoId }))
    setEligiendo(null)
    iniciar(async () => { await fijarTurnoEnFecha(fecha, turnoId) })
  }

  const [a, m] = mes.split('-').map(Number)

  return (
    <>
      <div className="mes-cab" style={{ marginTop: 16 }}>
        <button className="mes-flecha" onClick={() => setMes(correr(mes, -1))}>‹</button>
        <span className="mes-tit">{MESES[m - 1]} {a}</span>
        <button className="mes-flecha" onClick={() => setMes(correr(mes, 1))}>›</button>
        <span className="mes-pct mono" style={{ fontSize: 13 }}>
          {resumen.trabajados} turnos
        </span>
      </div>

      {cuadro && (
        <div className="cargar-cuadro">
          <div className="cargar-cuadro-txt">
            <b>Hay cuadro leído para este mes.</b>
            <span className="mono">
              {Object.entries(conteoDelMes(mes))
                .sort((a, b) => b[1] - a[1])
                .map(([t, n]) => `${n} ${t}`)
                .join(' · ')}
            </span>
            <em>fuente: {cuadro.fuente}</em>
          </div>
          <button onClick={cargarMes} disabled={cargando}>
            {cargando ? 'Cargando…' : 'Cargar el mes'}
          </button>
          {resultado && <p className="cargar-cuadro-res mono">{resultado}</p>}
        </div>
      )}

      <div className="hist-resumen">
        <div><b className="mono">{resumen.trabajados}</b><span>turnos</span></div>
        <div><b className="mono">{resumen.horas}</b><span>horas de clínica</span></div>
        <div><b className="mono">{resumen.sinPoner}</b><span>días sin poner</span></div>
      </div>

      <div className="cuadro" style={{ opacity: pendiente ? 0.7 : 1 }}>
        <div className="cuadro-dias">
          {DIAS.map((d, i) => <span key={i}>{d}</span>)}
        </div>

        <div className="cuadro-rejilla">
          {celdas.map((f, i) => {
            if (!f) return <span key={'x' + i} className="cuadro-hueco" />
            const t = defDe(turnoDe(f))
            return (
              <button
                key={f}
                className={'cuadro-dia'
                  + (f === hoy ? ' hoy' : '')
                  + (t ? ' ' + tono(t) : ' vacio')}
                onClick={() => setEligiendo(f)}
              >
                <i className="cuadro-num">{Number(f.slice(8))}</i>
                <b className="mono cuadro-cod">{t ? corto(t.id) : '·'}</b>
              </button>
            )
          })}
        </div>
      </div>

      <p className="pista" style={{ marginTop: 14 }}>
        Toca cualquier día para ponerle o cambiarle el turno. <b>Sirve para el mes que viene
        también</b>: cuando llegue el cuadro nuevo, lo pasas de una vez y el resto del sistema
        ya sabe qué te exige cada día.
      </p>

      {eligiendo && (
        <div className="hoja-fondo" onClick={() => setEligiendo(null)}>
          <div className="hoja" onClick={e => e.stopPropagation()}>
            <h3>{comoSeLee(eligiendo)}</h3>
            <p className="sub">Qué turno tienes ese día. Decide qué te exige y cuánto cabe.</p>

            {turnos.map(t => (
              <button
                key={t.id}
                className={'hoja-niv' + (turnoDe(eligiendo) === t.id ? ' on' : '')}
                onClick={() => poner(eligiendo, t.id)}
              >
                <b className="mono">{corto(t.id)}</b>
                <span>
                  {t.nombre}
                  <em className="meta-turno">
                    {Number(t.horas_clinica ?? 0) > 0 && `${t.horas_clinica} h de clínica · `}
                    {t.meta_nivel === 'ninguno'
                      ? 'día protegido, no pierdes vida'
                      : `${t.meta_habitos} hábito${t.meta_habitos > 1 ? 's' : ''} en ${t.meta_nivel}`}
                  </em>
                </span>
              </button>
            ))}

            {turnoDe(eligiendo) && (
              <button className="hoja-quitar" onClick={() => poner(eligiendo, null)}>
                Quitar el turno de ese día
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** POSTURNO no cabe en una casilla de celular. */
function corto(id: string): string {
  if (id === 'POSTURNO') return 'PST'
  if (id === 'DESCANSO') return 'DES'
  if (id === 'COMPLETO') return 'CMP'
  return id.slice(0, 4)
}

/** El color sale de las horas que cobra el dia, no del nombre del turno. */
function tono(t: TurnoDef): string {
  const h = Number(t.horas_clinica ?? 0)
  if (h >= 10) return 'duro'
  if (h > 0) return 'medio'
  if (t.meta_nivel === 'ninguno') return 'protegido'
  return 'libre'
}

function correr(mes: string, paso: number): string {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1 + paso, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function comoSeLee(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}
