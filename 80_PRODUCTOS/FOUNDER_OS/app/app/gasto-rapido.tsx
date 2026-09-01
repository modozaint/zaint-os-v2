'use client'

import { useState, useTransition } from 'react'
import { moverPlata } from './acciones'

export type BolsilloRapido = { id: number; nombre: string; saldo: number }

/**
 * ANOTAR UN GASTO SIN SALIR DEL CUARTO.
 *
 * Santiago (2026-08-26): *«en la interfaz de tu cuarto principal debería de
 * haber como un signito de dinero que sea para anotar los gastos del día a día
 * o para acceder a la billetera mucho más rápido»*.
 *
 * 🔑 La alcancía del cuarto ya lleva a `/dinero`. Esto es lo OTRO que pidió, y
 * es distinto: un gasto se anota **de pie, en diez segundos**. Si hay que
 * abrir una pantalla, esperar a que cargue y buscar un formulario, no se
 * anota — y un gasto que no se anota rompe el presupuesto entero.
 *
 * Por eso son tres toques: el signo, el monto, el bolsillo. Nada más.
 *
 * 🔒 EL CANDADO QUE NO SE TOCA: esto entra a `movimientos`, que es plata
 * PERSONAL. Nunca toca `cuentas` — esas son las unidades de ZAINT y miden
 * HORAS, no pesos. No comparten ni una llave foránea, y es a propósito.
 */
export function GastoRapido({ bolsillos }: { bolsillos: BolsilloRapido[] }) {
  const [abierto, setAbierto] = useState(false)
  const [monto, setMonto] = useState('')
  const [bolsillo, setBolsillo] = useState<number | null>(bolsillos[0]?.id ?? null)
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  const valor = Number(monto.replace(/[^\d]/g, ''))

  function cerrar() {
    setAbierto(false); setMonto(''); setNota(''); setError(null)
  }

  function guardar() {
    if (!(valor > 0) || !bolsillo || pendiente) return
    setError(null)
    iniciar(async () => {
      const r = await moverPlata({
        bolsillo_id: bolsillo, tipo: 'descargar', monto: valor, nota: nota.trim() || undefined,
      })
      if (r?.error) { setError(r.error); return }
      const b = bolsillos.find(x => x.id === bolsillo)
      setListo(`−${valor.toLocaleString('es-CO')} de ${b?.nombre ?? 'el bolsillo'}`)
      cerrar()
      setTimeout(() => setListo(null), 3200)
    })
  }

  if (bolsillos.length === 0) return null

  return (
    <>
      <button
        className="cu-gasto"
        onClick={() => setAbierto(true)}
        aria-label="Anotar un gasto"
        title="Anotar un gasto"
      >
        $
      </button>

      {listo && <p className="cu-gasto-ok mono">{listo}</p>}

      {abierto && (
        <div className="hoja-fondo" onClick={cerrar}>
          <div className="hoja" onClick={e => e.stopPropagation()}>
            <h3>Anotar un gasto</h3>
            <p className="sub">Sale del bolsillo que elijas. No toca las cuentas de ZAINT.</p>

            <input
              className="nota gasto-monto mono"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={monto ? Number(monto.replace(/[^\d]/g, '')).toLocaleString('es-CO') : ''}
              onChange={e => setMonto(e.target.value)}
              aria-label="Cuánto"
            />

            <div className="gasto-bolsillos">
              {bolsillos.map(b => (
                <button
                  key={b.id}
                  className={'gasto-chip' + (bolsillo === b.id ? ' on' : '')}
                  onClick={() => setBolsillo(b.id)}
                >
                  <span>{b.nombre}</span>
                  <em className="mono">{b.saldo.toLocaleString('es-CO')}</em>
                </button>
              ))}
            </div>

            <input
              className="nota"
              placeholder="En qué fue — opcional"
              value={nota}
              onChange={e => setNota(e.target.value)}
              aria-label="En qué"
            />

            {error && <p className="error">{error}</p>}

            <button className="guardar" onClick={guardar} disabled={!(valor > 0) || pendiente}>
              {pendiente ? 'Guardando…' : valor > 0 ? `Anotar ${valor.toLocaleString('es-CO')}` : 'Anotar'}
            </button>
            <button className="hoja-quitar" onClick={cerrar}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  )
}
