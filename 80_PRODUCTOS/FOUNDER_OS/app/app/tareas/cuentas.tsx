'use client'

import { useState, useTransition } from 'react'
import { cambiarEstadoCuenta } from '../acciones'
import { enHoras, type Cuenta } from '@/lib/tiempo'

const ORDEN: Cuenta['estado'][] = ['activa', 'mantenimiento', 'dormida']
const NOMBRE: Record<Cuenta['estado'], string> = {
  activa: 'Activa',
  mantenimiento: 'En mantenimiento',
  dormida: 'Dormida',
}
const EXPLICA: Record<Cuenta['estado'], string> = {
  activa: 'Tiene horas asignadas este mes',
  mantenimiento: 'Cero horas, y es a propósito',
  dormida: 'Archivada, con un gatillo que la despierta',
}

/**
 * Las cuentas que compiten por las mismas horas.
 * El candado de máximo 2 activas lo hace cumplir la base de datos, no esta
 * pantalla: si se pudiera esquivar recargando, no sería un candado.
 */
export function Cuentas({ cuentas, sinCuenta }: { cuentas: Cuenta[]; sinCuenta: number }) {
  const [abierta, setAbierta] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  const activas = cuentas.filter(c => c.estado === 'activa')
  const libres = 2 - activas.length

  function cambiar(c: Cuenta, estado: Cuenta['estado']) {
    setError(null)
    iniciar(async () => {
      const r = await cambiarEstadoCuenta(c.id, estado)
      if (r?.error) setError(traducir(r.error))
      else setAbierta(null)
    })
  }

  if (cuentas.length === 0) return null

  return (
    <div className="cuentas" style={{ opacity: pendiente ? 0.7 : 1 }}>
      <div className="cuentas-cab">
        <span className="mono">CUENTAS</span>
        <span className={'foco' + (libres === 0 ? ' lleno' : '')}>
          {activas.length}/2 activas
        </span>
      </div>

      {error && <p className="entrar-error" style={{ marginBottom: 10 }}>{error}</p>}

      <div className="cuentas-fila">
        {cuentas.map(c => (
          <button
            key={c.id}
            className={'cuenta ' + c.estado + (abierta === c.id ? ' abierta' : '')}
            onClick={() => setAbierta(a => (a === c.id ? null : c.id))}
            style={c.estado === 'activa' ? { borderColor: c.color } : undefined}
          >
            <i className="punto" style={{ background: c.color }} />
            <span className="cuenta-nom">{c.nombre}</span>
            {!!c.pendientes && (
              <span className="cuenta-carga mono">
                {c.pendientes} · {enHoras(c.minutos ?? 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {abierta !== null && (() => {
        const c = cuentas.find(x => x.id === abierta)
        if (!c) return null
        return (
          <div className="cuenta-detalle">
            <div className="cuenta-detalle-cab">
              <b>{c.nombre}</b>
              <span>{NOMBRE[c.estado]}</span>
            </div>
            {c.gatillo && <p className="cuenta-gatillo">Gatillo: {c.gatillo}</p>}
            {c.nota && <p className="cuenta-nota">{c.nota}</p>}
            <div className="cuenta-estados">
              {ORDEN.map(e => (
                <button
                  key={e}
                  className={'estado-opt' + (c.estado === e ? ' on' : '')}
                  onClick={() => cambiar(c, e)}
                  disabled={c.estado === e}
                >
                  <b>{NOMBRE[e]}</b>
                  <em>{EXPLICA[e]}</em>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {sinCuenta > 0 && (
        <p className="cuentas-sueltas">
          <b>{sinCuenta}</b> {sinCuenta === 1 ? 'tarea sin cuenta' : 'tareas sin cuenta'} —
          si no pertenece a ninguna, nadie sabe de dónde salen sus horas.
        </p>
      )}
    </div>
  )
}

function traducir(m: string): string {
  if (m.includes('2 cuentas activas')) {
    return 'Ya hay 2 cuentas activas. Con ~35 h al mes, dos dan ~17 h cada una: alcanza para terminar algo. Para activar esta, otra tiene que salir.'
  }
  return m
}
