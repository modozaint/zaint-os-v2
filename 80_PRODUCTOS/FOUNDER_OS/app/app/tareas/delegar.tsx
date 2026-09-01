'use client'

import { useState, useTransition } from 'react'
import { fijarPrecioHora, fijarDelegacion, marcarPedido } from '../acciones'
import { pesos } from '@/lib/plata'
import { precioHora, cuestaHacerla, veredicto, type Tarea } from '@/lib/tiempo'

/**
 * El precio de la hora, arriba de la lista.
 *
 * De la sesion 2 con Pablo (19-ago) y del destilado de Freddy Vega: se calcula
 * con lo que uno QUIERE ganar dividido por las horas que de verdad tiene.
 * Dividirlo por las 192 de un mes de oficina daria un numero falso — las otras
 * 178 se las lleva la clinica.
 */
export function PrecioDeLaHora({ meta, horas }: { meta: number; horas: number }) {
  const [editar, setEditar] = useState(false)
  const [m, setM] = useState(String(meta))
  const [h, setH] = useState(String(horas))
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  const precio = precioHora(Number(m) || 0, Number(h) || 0)

  return (
    <div className="hora">
      <div className="hora-cab">
        <span className="hora-lab">Tu hora vale</span>
        <b className="mono hora-num">{pesos(precio)}</b>
        <button className="hora-editar" onClick={() => setEditar(e => !e)}>
          {editar ? 'listo' : 'ajustar'}
        </button>
      </div>

      {!editar ? (
        <p className="hora-pie mono">
          {pesos(Number(m) || 0)} al mes ÷ {h} h reales
        </p>
      ) : (
        <div className="hora-campos">
          <label>
            <span>¿Cuánto quieres ganar al mes?</span>
            <input type="number" inputMode="numeric" value={m}
                   onChange={e => setM(e.target.value)} />
          </label>
          <label>
            <span>¿Cuántas horas tienes al mes, de verdad?</span>
            <input type="number" inputMode="numeric" value={h}
                   onChange={e => setH(e.target.value)} />
          </label>
          <p className="hora-nota">
            No las 192 de un mes completo: las tuyas, las que quedan fuera de la clínica.
          </p>
          {error && <p className="entrar-error">{error}</p>}
          <button
            className="guardar" disabled={pendiente}
            onClick={() => iniciar(async () => {
              const r = await fijarPrecioHora(Number(m) || 0, Number(h) || 0)
              if (r?.error) setError(r.error)
              else { setError(null); setEditar(false) }
            })}
          >{pendiente ? 'Guardando…' : 'Guardar'}</button>
        </div>
      )}
    </div>
  )
}

/**
 * El bloque de delegacion de UNA tarea.
 *
 * La cuenta es simple: lo que cuesta hacerla con tus manos contra lo que
 * costaria que otro la haga. Pero el boton que importa no es el que decide, es
 * el que PIDE — lo que quedo escrito en la sesion del 19-ago es que a Santiago
 * no le falta saber que delegar: le falta pedirlo, y por eso todo el cuadrante
 * "delegar" termina cayendo en "hacer". Un mensaje ya escrito y un enlace de
 * WhatsApp convierten esa decision en un toque.
 */
export function Delegar({ tarea, precio }: { tarea: Tarea; precio: number }) {
  const [abierto, setAbierto] = useState(false)
  const [costo, setCosto] = useState(tarea.costo_delegar?.toString() ?? '')
  const [quien, setQuien] = useState(tarea.delegar_a ?? '')
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  const propio = cuestaHacerla(tarea.minutos, precio)
  const v = veredicto(propio, tarea.costo_delegar)

  const mensaje = armarMensaje(tarea, quien || tarea.delegar_a, tarea.costo_delegar)

  if (!tarea.minutos) return null

  return (
    <div className="deleg">
      <button className="deleg-cab" onClick={() => setAbierto(a => !a)}>
        <span className="mono deleg-propio">te cuesta {pesos(propio)}</span>
        {v.que === 'delegar' && (
          <span className={'deleg-marca' + (tarea.pedido_enviado ? ' pedido' : '')}>
            {tarea.pedido_enviado ? 'pedido ✓' : `delegar ahorra ${pesos(v.ahorro)}`}
          </span>
        )}
        {v.que === 'hacerla' && <span className="deleg-marca cara">hazla tú</span>}
      </button>

      {abierto && (
        <div className="deleg-cuerpo">
          <div className="deleg-campos">
            <label>
              <span>¿Cuánto costaría que otro la haga?</span>
              <input
                type="number" inputMode="numeric" value={costo} placeholder="0"
                onChange={e => setCosto(e.target.value)}
                onBlur={() => iniciar(async () => {
                  const n = costo === '' ? null : Number(costo)
                  if (n === (tarea.costo_delegar ?? null)) return
                  const r = await fijarDelegacion(tarea.id, { costo_delegar: n })
                  if (r?.error) setError(r.error)
                })}
              />
            </label>
            <label>
              <span>¿A quién?</span>
              <input
                type="text" value={quien} placeholder="Steven, Xiomara…"
                onChange={e => setQuien(e.target.value)}
                onBlur={() => iniciar(async () => {
                  if (quien === (tarea.delegar_a ?? '')) return
                  const r = await fijarDelegacion(tarea.id, { delegar_a: quien || null })
                  if (r?.error) setError(r.error)
                })}
              />
            </label>
          </div>

          {error && <p className="entrar-error">{error}</p>}

          {v.que === 'delegar' && (
            <>
              <p className="deleg-cuenta mono">
                Hacerla tú: {pesos(propio)} · Que la hagan: {pesos(tarea.costo_delegar ?? 0)}
                {' → '}<b>ahorras {pesos(v.ahorro)}</b>
              </p>

              <textarea className="nota deleg-msg" rows={4} readOnly value={mensaje} />

              <div className="deleg-acciones">
                <a
                  className="guardar deleg-wa"
                  href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => iniciar(async () => { await marcarPedido(tarea.id, true) })}
                >Pedirlo por WhatsApp</a>

                <button
                  className="hoja-quitar"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(mensaje)
                      setCopiado(true)
                      setTimeout(() => setCopiado(false), 2000)
                    } catch { setError('No se pudo copiar; selecciona el texto a mano.') }
                  }}
                >{copiado ? 'Copiado ✓' : 'Copiar el mensaje'}</button>
              </div>

              {tarea.pedido_enviado && (
                <button
                  className="deleg-deshacer"
                  onClick={() => iniciar(async () => { await marcarPedido(tarea.id, false) })}
                >Todavía no lo he pedido</button>
              )}
            </>
          )}

          {v.que === 'hacerla' && (
            <p className="deleg-cuenta mono">
              Cuesta más delegarla ({pesos(tarea.costo_delegar ?? 0)}) que hacerla
              ({pesos(propio)}). Hazla tú.
            </p>
          )}

          {v.que === 'no-sabe' && (
            <p className="deleg-cuenta mono">
              Pon cuánto costaría que otro la haga y la cuenta se hace sola.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** El mensaje que se manda. Corto, con el precio adentro y con fecha: pedir sin
 *  decir cuanto ni para cuando es lo que obliga a una segunda conversacion. */
function armarMensaje(t: Tarea, quien: string | null | undefined, costo: number | null | undefined): string {
  const nombre = (quien ?? '').trim()
  const saludo = nombre ? `Hola ${nombre}, ` : 'Hola, '
  const plata = costo && costo > 0 ? ` Te pago ${pesos(costo)}.` : ''
  const tiempo = t.minutos ? ` Son como ${t.minutos} minutos.` : ''
  return `${saludo}¿me ayudas con esto?\n\n${t.texto}\n${tiempo}${plata}\n\n¿Lo puedes tener esta semana?`
}
