'use client'

import { Suspense, useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { marcarHabito, guardarNota, crearTarea, moverPlata } from './acciones'
import { leerBorrador, PARAM, type Borrador } from './borrador'
import type { BolsilloConocido } from '@/lib/dictado'

/**
 * "Esto entendí" — la tarjeta donde el dictado espera tu visto bueno.
 *
 * Nada de lo que se dicta llega a la base sin pasar por aqui. Es a proposito:
 * el reconocimiento de voz se equivoca, y una cifra mal oida en el bolsillo
 * equivocado es peor que escribirla a mano. Aqui se ve, se corrige y se guarda.
 */

type Props = {
  /** Que tipo confirma esta pantalla. Si el borrador es de otro, no se pinta. */
  acepta: Borrador['tipo']
  bolsillos?: BolsilloConocido[]
}

export function Confirmar(props: Props) {
  return (
    <Suspense fallback={null}>
      <Tarjeta {...props} />
    </Suspense>
  )
}

function Tarjeta({ acepta, bolsillos = [] }: Props) {
  const params = useSearchParams()
  const router = useRouter()
  const ruta = usePathname()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const inicial = leerBorrador(params.get(PARAM))
  const [b, setB] = useState<Borrador | null>(inicial)

  // La URL manda: si llega un dictado nuevo estando la tarjeta abierta, se
  // reemplaza en vez de quedarse mostrando el anterior.
  useEffect(() => {
    setB(leerBorrador(params.get(PARAM)))
    setError(null)
  }, [params])

  if (!b || b.tipo !== acepta) return null

  function cerrar() {
    setB(null)
    router.replace(ruta)
  }

  function guardar() {
    if (!b) return
    setError(null)
    iniciar(async () => {
      if (b.tipo === 'tarea') {
        if (!b.texto.trim()) { setError('Escribe de qué es la tarea'); return }
        const r = await crearTarea({ texto: b.texto, peldano: 3, minutos: b.minutos, origen: 'voz' })
        if (r?.error) { setError(r.error); return }
      }
      if (b.tipo === 'movimiento') {
        if (!b.bolsilloId) { setError('Elige de qué bolsillo sale'); return }
        if (!(b.monto > 0)) { setError('El monto tiene que ser mayor que cero'); return }
        const r = await moverPlata({
          bolsillo_id: b.bolsilloId, tipo: b.mov, monto: b.monto, nota: b.nota ?? undefined,
        })
        if (r?.error) { setError(r.error); return }
      }
      if (b.tipo === 'habito') {
        await marcarHabito(b.habitoId, b.nivel)
        if (b.nota) await guardarNota(b.habitoId, b.nota)
      }
      cerrar()
    })
  }

  return (
    <div className="conf">
      <div className="conf-cab">
        <span className="conf-tit mono">Esto entendí</span>
        <span className="conf-sub">no se guarda hasta que confirmes</span>
      </div>

      {b.tipo === 'movimiento' && (
        <Movimiento b={b} bolsillos={bolsillos} cambiar={setB} />
      )}
      {b.tipo === 'tarea' && <Tarea b={b} cambiar={setB} />}
      {b.tipo === 'habito' && <Habito b={b} cambiar={setB} />}

      {error && <p className="conf-error">{error}</p>}

      <div className="conf-botones">
        <button className="conf-ok" onClick={guardar} disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar'}
        </button>
        <button className="conf-no" onClick={cerrar} disabled={pendiente}>
          Descartar
        </button>
      </div>
    </div>
  )
}

// ---------- Movimiento de plata ----------

function Movimiento({
  b, bolsillos, cambiar,
}: {
  b: Extract<Borrador, { tipo: 'movimiento' }>
  bolsillos: BolsilloConocido[]
  cambiar: (b: Borrador) => void
}) {
  const elegido = bolsillos.find(x => x.id === b.bolsilloId)
  const saldo = elegido?.saldo
  const despues = saldo === undefined ? null : b.mov === 'cargar' ? saldo + b.monto : saldo - b.monto

  return (
    <>
      <div className="conf-tipo">
        <button
          className={'conf-op' + (b.mov === 'descargar' ? ' on' : '')}
          onClick={() => cambiar({ ...b, mov: 'descargar' })}
        >Sacar</button>
        <button
          className={'conf-op' + (b.mov === 'cargar' ? ' on' : '')}
          onClick={() => cambiar({ ...b, mov: 'cargar' })}
        >Meter</button>
      </div>

      <label className="conf-campo">
        <span>Monto</span>
        <input
          inputMode="numeric"
          className="conf-monto"
          value={b.monto ? b.monto.toLocaleString('es-CO') : ''}
          onChange={e => {
            const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
            cambiar({ ...b, monto: Number.isNaN(n) ? 0 : n })
          }}
        />
      </label>

      <label className="conf-campo">
        <span>{b.mov === 'cargar' ? 'A qué bolsillo' : 'De qué bolsillo'}</span>
        <select
          value={b.bolsilloId ?? ''}
          onChange={e => cambiar({
            ...b,
            bolsilloId: e.target.value ? Number(e.target.value) : null,
            bolsilloNombre: bolsillos.find(x => x.id === Number(e.target.value))?.nombre ?? null,
          })}
        >
          <option value="">— elige —</option>
          {bolsillos.map(x => (
            <option key={x.id} value={x.id}>{x.nombre}</option>
          ))}
        </select>
      </label>

      <label className="conf-campo">
        <span>Nota</span>
        <input
          value={b.nota ?? ''}
          placeholder="en qué fue"
          onChange={e => cambiar({ ...b, nota: e.target.value || null })}
        />
      </label>

      {despues !== null && (
        <p className="conf-saldo">
          {elegido!.nombre}: <b>$ {saldo!.toLocaleString('es-CO')}</b> → <b>$ {despues.toLocaleString('es-CO')}</b>
          {despues < 0 && <span className="conf-alerta"> · queda en rojo</span>}
        </p>
      )}
    </>
  )
}

// ---------- Tarea ----------

function Tarea({
  b, cambiar,
}: {
  b: Extract<Borrador, { tipo: 'tarea' }>
  cambiar: (b: Borrador) => void
}) {
  return (
    <>
      <label className="conf-campo">
        <span>Tarea</span>
        <input value={b.texto} onChange={e => cambiar({ ...b, texto: e.target.value })} />
      </label>
      <label className="conf-campo">
        <span>Minutos (opcional)</span>
        <input
          inputMode="numeric"
          value={b.minutos ?? ''}
          placeholder="—"
          onChange={e => {
            const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
            cambiar({ ...b, minutos: Number.isNaN(n) ? null : n })
          }}
        />
      </label>
    </>
  )
}

// ---------- Hábito ----------

const NIVELES = ['minimo', 'normal', 'super'] as const

function Habito({
  b, cambiar,
}: {
  b: Extract<Borrador, { tipo: 'habito' }>
  cambiar: (b: Borrador) => void
}) {
  return (
    <>
      <p className="conf-nombre">{b.nombre}</p>
      <div className="conf-tipo">
        {NIVELES.map(n => (
          <button
            key={n}
            className={'conf-op' + (b.nivel === n ? ' on' : '')}
            onClick={() => cambiar({ ...b, nivel: n })}
          >{n === 'super' ? 'súper' : n === 'minimo' ? 'mínimo' : 'normal'}</button>
        ))}
      </div>
      <label className="conf-campo">
        <span>Nota (opcional)</span>
        <input
          value={b.nota ?? ''}
          placeholder="qué hiciste exactamente"
          onChange={e => cambiar({ ...b, nota: e.target.value || null })}
        />
      </label>
    </>
  )
}
