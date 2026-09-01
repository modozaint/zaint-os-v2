'use client'

import { useMemo, useState } from 'react'
import { Reja, type RegistroMes } from './mes'
import { Completar, type HabitoLlenable } from './completar'
import { sePuedeLlenar, ventanaDeLlenado, VENTANA_LLENADO } from '@/lib/tiempo'

export type DiaHistorico = {
  fecha: string
  turno: string | null
  metaHabitos: number
  metaNivel: string
  metaCumplida: boolean
  balance?: number | null
  /** Ya paso por `cerrar_dia`: su vida esta cobrada y no se recalcula. */
  cerrado?: boolean
  /** habito_id -> nivel de ESE dia. Lo necesita el editor de dias pasados. */
  marcados?: Record<string, string>
  energia: number | null
  apunte: string | null
  agradezco: string | null
  sinFila?: boolean
  habitos: { nombre: string; nivel: string; xp: number; nota: string | null; color: string }[]
}

const ETIQUETA: Record<string, string> = { minimo: 'Mín', normal: 'Normal', super: 'Super' }
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

type Rango = 'hoy' | 'semana' | 'mes'

/**
 * Historial con tres alcances, que es como se pregunta de verdad:
 *   hoy    → ¿qué llevo AHORA?
 *   semana → ¿cómo vengo?
 *   mes    → ¿lo estoy sosteniendo?
 *
 * El rango manda sobre las dos cosas a la vez: la reja de arriba y la lista de
 * abajo. Que mostraran periodos distintos seria tener dos pantallas en una.
 */
export function Historia({
  dias, habitos, registros, hoy, huerfanos,
}: {
  dias: DiaHistorico[]
  habitos: HabitoLlenable[]
  registros: RegistroMes[]
  hoy: string
  huerfanos: number
}) {
  const [rango, setRango] = useState<Rango>('semana')
  // Cuantos periodos hacia atras: 0 = el actual, 1 = el anterior.
  const [atras, setAtras] = useState(0)
  const [abierto, setAbierto] = useState<string | null>(dias[0]?.fecha ?? null)
  // Que dia tiene el editor desplegado. Uno a la vez: dos editores abiertos en
  // una pantalla de telefono es como marcar el habito equivocado.
  const [llenando, setLlenando] = useState<string | null>(null)

  const { fechas, titulo } = useMemo(() => calcularRango(rango, atras, hoy), [rango, atras, hoy])

  // Los dias de la ventana que quedaron en blanco. Hoy no entra: todavia esta
  // en curso y no es un dia "sin llenar", es un dia sin terminar.
  const sinLlenar = useMemo(() => {
    const conMarca = new Set(dias.filter(d => d.habitos.length > 0).map(d => d.fecha))
    return ventanaDeLlenado(hoy).filter(f => f < hoy && !conMarca.has(f)).reverse()
  }, [dias, hoy])

  const enRango = dias.filter(d => fechas.includes(d.fecha))
  const marcas = enRango.reduce((s, d) => s + d.habitos.length, 0)
  const xp = enRango.reduce((s, d) => s + d.habitos.reduce((x, h) => x + h.xp, 0), 0)

  return (
    <>
      <div className="rangos">
        {(['hoy', 'semana', 'mes'] as Rango[]).map(r => (
          <button
            key={r}
            className={'rango' + (rango === r ? ' on' : '')}
            onClick={() => { setRango(r); setAtras(0) }}
          >
            {r === 'hoy' ? 'Hoy' : r === 'semana' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      <div className="mes-cab">
        <button className="mes-flecha" disabled={rango === 'hoy'}
                onClick={() => setAtras(a => a + 1)}>‹</button>
        <span className="mes-tit">{titulo}</span>
        <button className="mes-flecha" disabled={atras === 0}
                onClick={() => setAtras(a => Math.max(0, a - 1))}>›</button>
        <span className="mes-pct mono">{marcas} marcas</span>
      </div>

      <div className="hist-resumen">
        <div>
          <b className="mono">{enRango.filter(d => d.habitos.length > 0).length}</b>
          <span>días con registro</span>
        </div>
        <div><b className="mono">{xp}</b><span>XP del periodo</span></div>
        <div>
          <b className="mono">{enRango.filter(d => d.metaCumplida).length}</b>
          <span>metas cumplidas</span>
        </div>
      </div>

      {rango !== 'hoy' && (
        <Reja
          habitos={habitos} registros={registros} fechas={fechas} hoy={hoy}
          abierto={abierto}
          onAbrir={f => {
            setAbierto(f)
            // Sin esto, tocar una casilla abre un dia que quedo fuera de la
            // pantalla y parece que no hizo nada.
            document.getElementById('d-' + f)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        />
      )}

      {sinLlenar.length > 0 && (
        <div className="aviso chico llenables">
          <b>{sinLlenar.length} día{sinLlenar.length === 1 ? '' : 's'} de la última semana
          sin llenar.</b> Si los hiciste y no alcanzaste a marcarlos, todavía estás a tiempo —
          después de {VENTANA_LLENADO} días se cierran.
          <button
            className="llenar-btn"
            onClick={() => {
              const f = sinLlenar[0]
              setRango('semana'); setAtras(0)
              setAbierto(f); setLlenando(f)
              setTimeout(() => {
                document.getElementById('d-' + f)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 60)
            }}
          >
            Llenar el más reciente
          </button>
        </div>
      )}

      {huerfanos > 0 && (
        <div className="aviso chico">
          <b>{huerfanos} día{huerfanos === 1 ? '' : 's'} con hábitos marcados no quedaron
          guardados como día.</b> Se ven acá igual, porque el historial se arma de los
          hábitos, pero les falta el turno y el cierre — por eso la vida no se movió.
        </div>
      )}

      <div className="hist">
        {enRango.length === 0 && <p className="hist-vacio">Nada registrado en este periodo.</p>}

        {enRango.map(d => {
          const xpDia = d.habitos.reduce((s, h) => s + h.xp, 0)
          const esteAbierto = abierto === d.fecha || rango === 'hoy'
          // Los ultimos 7 dias se pueden llenar; mas atras, no. El servidor lo
          // vuelve a comprobar: esto solo decide si se muestra el boton.
          const llenable = sePuedeLlenar(d.fecha, hoy)

          return (
            <div key={d.fecha} id={'d-' + d.fecha}
                 className={'hist-dia' + (esteAbierto ? ' abierto' : '')}>
              <button className="hist-cab" onClick={() => setAbierto(esteAbierto ? null : d.fecha)}>
                <span className="hist-fecha">
                  {comoSeLee(d.fecha)}
                  {d.turno && <em className="hist-turno mono">{d.turno}</em>}
                </span>
                <span className="hist-cifras mono">
                  {llenable && d.habitos.length === 0 && <i className="hist-marca llenar">llenar</i>}
                  <b>{d.habitos.length}</b>
                  <i className="hist-xp">{xpDia} XP</i>
                  {d.metaNivel === 'ninguno'
                    ? <i className="hist-marca prot">·</i>
                    : d.metaCumplida
                      ? <i className="hist-marca ok">meta ✓</i>
                      : <i className="hist-marca no">meta ✗</i>}
                </span>
              </button>

              {esteAbierto && (
                <div className="hist-cuerpo">
                  {d.habitos.length === 0 ? (
                    <p className="hist-vacio">Ese día no quedó ningún hábito marcado.</p>
                  ) : (
                    <div className="hist-habs">
                      {d.habitos.map((h, i) => (
                        <div key={i} className="hist-hab">
                          <i className="punto" style={{ background: h.color }} />
                          <span className="hist-hab-nom">{h.nombre}</span>
                          <span className={'hist-niv ' + h.nivel}>{ETIQUETA[h.nivel] ?? h.nivel}</span>
                          <span className="mono hist-hab-xp">+{h.xp}</span>
                          {h.nota && <p className="hist-nota">{h.nota}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {llenable && (
                    llenando === d.fecha ? (
                      <>
                        <Completar
                          fecha={d.fecha}
                          habitos={habitos}
                          marcados={d.marcados ?? {}}
                          cerrado={Boolean(d.cerrado)}
                        />
                        <button className="llenar-btn cerrar" onClick={() => setLlenando(null)}>
                          Listo
                        </button>
                      </>
                    ) : (
                      <button className="llenar-btn" onClick={() => setLlenando(d.fecha)}>
                        {d.habitos.length === 0
                          ? 'Llenar este día'
                          : 'Añadir o corregir hábitos de este día'}
                      </button>
                    )
                  )}

                  {d.metaNivel !== 'ninguno' && d.metaHabitos > 0 && (
                    <p className="hist-meta mono">
                      Ese día pedía {d.metaHabitos} hábito{d.metaHabitos === 1 ? '' : 's'} en {d.metaNivel}
                    </p>
                  )}
                  {typeof d.balance === 'number' && (
                    <p className="hist-meta mono">
                      Ese día {d.balance > 0 ? 'sumó' : d.balance < 0 ? 'restó' : 'dejó'}{' '}
                      <b style={{ color: d.balance < 0 ? '#E85D5D' : 'var(--oliva)' }}>
                        {d.balance > 0 ? '+' : ''}{d.balance}
                      </b> de vida
                    </p>
                  )}
                  {d.sinFila && d.habitos.length > 0 && (
                    <p className="hist-meta mono">Sin turno guardado</p>
                  )}
                  {d.energia !== null && <p className="hist-extra">Energía: {d.energia}/5</p>}
                  {d.agradezco && <p className="hist-extra gracias">“{d.agradezco}”</p>}
                  {d.apunte && <p className="hist-extra">{d.apunte}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

/** Las fechas que entran en el periodo, y como se llama. */
function calcularRango(rango: Rango, atras: number, hoy: string) {
  const dd = (n: number) => String(n).padStart(2, '0')
  const [a, m, d] = hoy.split('-').map(Number)

  if (rango === 'hoy') return { fechas: [hoy], titulo: 'Hoy' }

  if (rango === 'semana') {
    // Siete dias hacia atras contando hoy. Sin semanas de calendario: lo que
    // uno quiere saber es "como vengo", no en que casilla del almanaque va.
    const fin = new Date(Date.UTC(a, m - 1, d - atras * 7))
    const fechas: string[] = []
    for (let i = 6; i >= 0; i--) {
      const x = new Date(fin.getTime() - i * 86400000)
      fechas.push(`${x.getUTCFullYear()}-${dd(x.getUTCMonth() + 1)}-${dd(x.getUTCDate())}`)
    }
    return {
      fechas,
      titulo: atras === 0
        ? 'Últimos 7 días'
        : `${Number(fechas[0].slice(8))} – ${Number(fechas[6].slice(8))} de ${MESES[Number(fechas[6].slice(5, 7)) - 1]}`,
    }
  }

  const ancla = new Date(Date.UTC(a, m - 1 - atras, 1))
  const anio = ancla.getUTCFullYear()
  const mes = ancla.getUTCMonth() + 1
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  return {
    fechas: Array.from({ length: ultimo }, (_, i) => `${anio}-${dd(mes)}-${dd(i + 1)}`),
    titulo: `${MESES[mes - 1]} ${anio}`,
  }
}

/** '2026-08-14' → 'viernes 14 de agosto'. Con hora fija: sin ella, la fecha
 *  se interpreta en UTC y en Colombia retrocede un día. */
function comoSeLee(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}
