'use client'

import { useState, useTransition } from 'react'
import { crearTarea, cerrarTarea, archivarTarea } from '../acciones'
import { Cuentas } from './cuentas'
import { PrecioDeLaHora, Delegar } from './delegar'
import { precioHora, type Cuenta, type Peldano, type Tarea } from '@/lib/tiempo'

/** "hoy", "ayer" o la fecha corta. Ver cuando se anoto algo dice mucho. */
function cuando(iso: string): string {
  const d = new Date(iso)
  const hoy = new Date()
  const dia = (x: Date) => x.toISOString().slice(0, 10)
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  if (dia(d) === dia(hoy)) return 'hoy'
  if (dia(d) === dia(ayer)) return 'ayer'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function ListaTareas({
  tareas, peldanos, areas, cuentas, sinCuenta, metaIngreso, horasLibres,
}: {
  tareas: Tarea[]; peldanos: Peldano[]; areas: any[]
  cuentas: Cuenta[]; sinCuenta: number
  metaIngreso: number; horasLibres: number
}) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [peldano, setPeldano] = useState(3)
  const [minutos, setMinutos] = useState('30')
  const [cuenta, setCuenta] = useState<number | null>(null)
  const [pendiente, iniciar] = useTransition()

  const precio = precioHora(metaIngreso, horasLibres)
  const pendientes = tareas.filter(t => t.estado !== 'hecha')
  const hechas = tareas.filter(t => t.estado === 'hecha')
  const porCuenta = new Map(cuentas.map(c => [c.id, c]))

  const porPeldano = peldanos.map(p => ({
    p,
    items: pendientes.filter(t => t.peldano === p.n),
  })).filter(g => g.items.length > 0)

  function anadir() {
    if (!texto.trim()) return
    iniciar(async () => {
      await crearTarea({
        texto,
        peldano,
        minutos: minutos ? parseInt(minutos, 10) : null,
        cuenta_id: cuenta,
      })
      setTexto(''); setMinutos('30'); setAbierto(false)
    })
  }

  return (
    <main className="wrap" style={{ opacity: pendiente ? 0.7 : 1 }}>
      <div className="head">
        <span className="titulo mono cursor">TAREAS</span>
        <span className="fecha">{pendientes.length} pendientes</span>
      </div>

      <PrecioDeLaHora meta={metaIngreso} horas={horasLibres} />


      <p className="pista" style={{ marginBottom: 16 }}>
        Todo lo que crees que hay que hacer. <b>No las asignas a un día</b> —
        el día toma las que caben, empezando por las más cerca de vender.
      </p>

      {!abierto ? (
        <button className="unico-add grande" onClick={() => setAbierto(true)}>
          + Añadir tarea
        </button>
      ) : (
        <div className="unico" style={{ marginTop: 0 }}>
          <textarea
            className="nota" rows={2} value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="¿Qué hay que hacer?" autoFocus
          />

          {cuentas.length > 0 && (
            <div className="campo">
              <label>¿De qué cuenta sale?</label>
              <div className="cuenta-elige">
                {cuentas.map(c => (
                  <button
                    key={c.id}
                    className={'cuenta-chip' + (cuenta === c.id ? ' on' : '')}
                    onClick={() => setCuenta(cuenta === c.id ? null : c.id)}
                    style={cuenta === c.id ? { borderColor: c.color, color: c.color } : undefined}
                  >
                    <i className="punto" style={{ background: c.color }} />
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="campo">
            <label>¿Qué tan cerca está de vender?</label>
            {peldanos.map(p => (
              <button
                key={p.n}
                className={'peldano-opt' + (peldano === p.n ? ' on' : '')}
                onClick={() => setPeldano(p.n)}
                style={peldano === p.n ? { borderColor: p.color } : undefined}
              >
                <b style={{ color: p.color }}>{p.n}</b>
                <span>{p.nombre}<em>{p.descripcion}</em></span>
              </button>
            ))}
          </div>

          <div className="campo">
            <label>¿Cuántos minutos pide?</label>
            <input
              type="number" inputMode="numeric" value={minutos}
              onChange={e => setMinutos(e.target.value)} placeholder="30"
            />
          </div>

          <button className="guardar" onClick={anadir} disabled={!texto.trim() || pendiente}>
            {pendiente ? 'Guardando…' : 'Añadir a la lista'}
          </button>
          <button className="hoja-quitar" onClick={() => setAbierto(false)}>Cancelar</button>
        </div>
      )}

      {porPeldano.map(({ p, items }) => (
        <div key={p.n} className="grupo">
          <div className="grupo-cab">
            <i className="punto" style={{ background: p.color }} />
            <span>{p.n} · {p.nombre}</span>
            <em>{items.length}</em>
          </div>
          {items.map(t => {
            const c = t.cuenta_id ? porCuenta.get(t.cuenta_id) : null
            return (
              <div key={t.id} className="tarea lista-item">
                <button
                  className="tarea-check"
                  onClick={() => iniciar(async () => { await cerrarTarea(t.id, true) })}
                  aria-label="Marcar hecha"
                />
                <span className="tarea-cuerpo">
                  <span className="tarea-txt">{t.texto}</span>
                  <span className="tarea-meta">
                    {t.origen === 'voz' && <i className="dictada" title="Dictada">◗ dictada</i>}
                    {c
                      ? <i className="cuenta-tag" style={{ color: c.color }}>{c.nombre}</i>
                      : <i className="cuenta-tag suelta">sin cuenta</i>}
                    {t.minutos && <i className="mono">{t.minutos} min</i>}
                    {t.creada_en && <i className="mono cuando">{cuando(t.creada_en)}</i>}
                  </span>
                </span>
                <button
                  className="tarea-x"
                  onClick={() => iniciar(async () => { await archivarTarea(t.id) })}
                  aria-label="Archivar"
                >×</button>
                <Delegar tarea={t} precio={precio} />
              </div>
            )
          })}
        </div>
      ))}

      {/* ⬇️ LAS CUENTAS BAJAN AL FINAL. Santiago (26-ago): «que en tareas no
          salgan por cuenta — todas las tareas igual son para MODOZAINT o para
          la persona que esté ahí».
          No se borran: la cuenta es el dato que dice de qué frente salen las
          horas, y eso sostiene el candado de capacidad. Deja de encabezar la
          pantalla y pasa a ser lo que es — una referencia, plegada. La lista
          sigue agrupada por peldaño (lo más cerca de vender primero), que
          nunca fue por cuenta. */}
      <details className="cuentas-plegadas">
        <summary>Las cuentas y sus horas</summary>
        <Cuentas cuentas={cuentas} sinCuenta={sinCuenta} />
      </details>

      {pendientes.length === 0 && (
        <p className="plan-vacio" style={{ marginTop: 20 }}>
          La lista está vacía. <b>Añade lo que sabes que hay que hacer</b> y el día
          irá tomando lo que quepa.
        </p>
      )}

      {hechas.length > 0 && (
        <details className="fuera" style={{ marginTop: 20 }}>
          <summary>{hechas.length} hechas</summary>
          {hechas.map(t => (
            <div key={t.id} className="tarea hecha lista-item">
              <button
                className="tarea-check on"
                onClick={() => iniciar(async () => { await cerrarTarea(t.id, false) })}
              >✓</button>
              <span className="tarea-cuerpo"><span className="tarea-txt">{t.texto}</span></span>
            </div>
          ))}
        </details>
      )}
    </main>
  )
}
