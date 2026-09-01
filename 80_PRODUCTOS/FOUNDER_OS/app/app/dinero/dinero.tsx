'use client'

import { useState, useTransition } from 'react'
import {
  crearBanco, crearBolsillo, editarBolsillo, llenarQuincena,
  moverPlata, fijarSaldoBanco, borrarBolsillo, borrarMovimiento,
} from '../acciones'
import {
  pesos, nombreRitmo, tocaEstaQuincena, RITMOS,
  type Banco, type Bolsillo, type Movimiento as MovimientoTipo, type Quincena, type Ritmo,
} from '@/lib/plata'

type Props = {
  bancos: Banco[]; bolsillos: Bolsillo[]; movimientos: MovimientoTipo[]
  total: number; asignadoMes: number
  quincena: Quincena; tocaQuincena: number; cargadoQuincena: number; faltaQuincena: number
}

export function Dinero({
  bancos, bolsillos, movimientos, asignadoMes,
  quincena, tocaQuincena, cargadoQuincena, faltaQuincena,
}: Props) {
  const [nuevoBanco, setNuevoBanco] = useState(false)
  const [pendiente] = useTransition()

  return (
    <div style={{ opacity: pendiente ? 0.7 : 1 }}>
      {tocaQuincena > 0 && (
        <PanelQuincena
          q={quincena} toca={tocaQuincena} cargado={cargadoQuincena} falta={faltaQuincena}
        />
      )}

      <p className="pista" style={{ marginBottom: 16 }}>
        Cada peso con un trabajo asignado. <b>Lo que no está en un bolsillo</b> es
        lo que todavía no decidiste en qué se va.
      </p>

      {bancos.length === 0 && !nuevoBanco && (
        <div className="unico">
          <p className="plan-vacio" style={{ marginBottom: 12 }}>
            Todavía no hay bancos. <b>Empieza por uno</b> y luego repartes su plata
            en bolsillos.
          </p>
          <button className="guardar" onClick={() => setNuevoBanco(true)}>
            + Añadir banco
          </button>
        </div>
      )}

      {nuevoBanco && <FormBanco onListo={() => setNuevoBanco(false)} />}

      {bancos.map(b => (
        <TarjetaBanco
          key={b.id}
          banco={b}
          bolsillos={bolsillos.filter(x => x.banco_id === b.id)}
          movimientos={movimientos}
          quincena={quincena}
        />
      ))}

      {bancos.length > 0 && !nuevoBanco && (
        <button className="unico-add" onClick={() => setNuevoBanco(true)}>
          + Añadir banco
        </button>
      )}

      {asignadoMes > 0 && (
        <div className="resumen-mes">
          <span>Asignado al mes en bolsillos</span>
          <b className="mono">{pesos(asignadoMes)}</b>
        </div>
      )}
    </div>
  )
}

/**
 * El panel del dia de pago. Responde una sola pregunta: ¿cuanto me falta meter
 * en esta quincena? Con el boton que lo hace de una, que es el ritual que en
 * Parcero tocaba a mano, bolsillo por bolsillo.
 */
function PanelQuincena({
  q, toca, cargado, falta,
}: { q: Quincena; toca: number; cargado: number; falta: number }) {
  const [pendiente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const pct = toca > 0 ? Math.min(100, Math.round((cargado / toca) * 100)) : 0
  const listo = falta === 0

  return (
    <div className={'quincena' + (listo ? ' ok' : '')}>
      <div className="quincena-cab">
        <span className="quincena-tit mono">{q.etiqueta}</span>
        <span className="quincena-dias">
          {q.diasRestantes === 1 ? 'último día' : `quedan ${q.diasRestantes} días`}
        </span>
      </div>

      <div className="quincena-cifra">
        <span>{listo ? 'Repartido' : 'Falta meter'}</span>
        <b className="mono">{pesos(listo ? cargado : falta)}</b>
      </div>

      <div className="barra" style={{ height: 7, margin: '10px 0 7px' }}>
        <i style={{ width: pct + '%' }} />
      </div>
      <div className="quincena-pie mono">
        {pesos(cargado)} de {pesos(toca)} · {pct}%
      </div>

      <p className="quincena-explica">
        Tu plata entra <b>dos veces al mes</b>, así que el presupuesto se reparte igual.
        Esta es la mitad del <b>{q.inicio.slice(8)} al {q.fin.slice(8)}</b>: de los bolsillos
        que se llenan ahora, toca meter {pesos(toca)} en total. El resto entra con la otra
        quincena.
      </p>

      {!listo && !confirmar && (
        <button className="quincena-btn" onClick={() => setConfirmar(true)}>
          Repartir la quincena
        </button>
      )}

      {!listo && confirmar && (
        <div className="quincena-confirma">
          <p>Se van a cargar <b>{pesos(falta)}</b> repartidos en los bolsillos que
          les toca esta quincena. Solo lo que falta: lo que ya metiste no se duplica.</p>
          <div className="quincena-acciones">
            <button
              className="guardar" disabled={pendiente}
              onClick={() => iniciar(async () => {
                const r = await llenarQuincena()
                setConfirmar(false)
                if (r?.error) setAviso(r.error)
                else if (r?.cuantos === 0) setAviso('No había nada pendiente.')
                else setAviso(`Listo: ${pesos(r!.total!)} en ${r!.cuantos} bolsillos.`)
              })}
            >{pendiente ? 'Repartiendo…' : 'Sí, repartir'}</button>
            <button className="hoja-quitar" onClick={() => setConfirmar(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {aviso && <p className="quincena-aviso" onClick={() => setAviso(null)}>{aviso}</p>}
    </div>
  )
}

function TarjetaBanco({
  banco, bolsillos, movimientos, quincena,
}: {
  banco: Banco; bolsillos: Bolsillo[]; movimientos: MovimientoTipo[]; quincena: Quincena
}) {
  const [editSaldo, setEditSaldo] = useState(false)
  const [saldo, setSaldo] = useState(String(banco.saldo_total))
  const [nuevo, setNuevo] = useState(false)
  const [pendiente, iniciar] = useTransition()

  const negativo = banco.disponible < 0

  return (
    <div className="banco">
      <div className="banco-cab">
        <div>
          <span className="banco-nom">{banco.nombre}</span>
          <span className="banco-total mono">{pesos(banco.saldo_total)}</span>
        </div>
        <button className="banco-edit" onClick={() => setEditSaldo(e => !e)}>
          {editSaldo ? 'Cerrar' : 'Ajustar'}
        </button>
      </div>

      {editSaldo && (
        <div className="campo" style={{ marginTop: 10 }}>
          <label>¿Cuánto dice tu app del banco?</label>
          <input
            type="number" inputMode="decimal" value={saldo}
            onChange={e => setSaldo(e.target.value)}
          />
          <button
            className="guardar" disabled={pendiente}
            onClick={() => iniciar(async () => {
              await fijarSaldoBanco(banco.id, Number(saldo) || 0)
              setEditSaldo(false)
            })}
          >Guardar saldo</button>
        </div>
      )}

      <div className={'disponible' + (negativo ? ' mal' : '')}>
        <span>{negativo ? 'Repartiste de más' : 'Fuera de bolsillos'}</span>
        <b className="mono">{pesos(Math.abs(banco.disponible))}</b>
      </div>
      {negativo && (
        <p className="disponible-nota">
          Tus bolsillos suman más de lo que hay en el banco. O el saldo está
          desactualizado, o hay plata prometida dos veces.
        </p>
      )}

      {bolsillos.map(b => (
        <TarjetaBolsillo
          key={b.id} bolsillo={b} quincena={quincena}
          movimientos={movimientos.filter(m => m.bolsillo_id === b.id)}
        />
      ))}

      {nuevo
        ? <FormBolsillo bancoId={banco.id} onListo={() => setNuevo(false)} />
        : <button className="unico-add" onClick={() => setNuevo(true)}>
            + Crear bolsillo en {banco.nombre}
          </button>}
    </div>
  )
}

function TarjetaBolsillo({
  bolsillo, movimientos, quincena,
}: { bolsillo: Bolsillo; movimientos: MovimientoTipo[]; quincena: Quincena }) {
  const [modo, setModo] = useState<'cargar' | 'descargar' | null>(null)
  const [verMovs, setVerMovs] = useState(false)
  const [editar, setEditar] = useState(false)
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  // El progreso se mide contra la QUINCENA, no contra el mes: es la pregunta
  // que uno se hace un 16, y contra el mes siempre se veria a medias.
  const toca = tocaEstaQuincena(bolsillo.ritmo, bolsillo.asignacion_mes, quincena.n)
  const pct = toca > 0
    ? Math.min(100, Math.round((bolsillo.cargado_quincena / toca) * 100))
    : 0

  function mover() {
    const n = Number(monto)
    if (!(n > 0)) { setError('Escribe un monto'); return }
    setError(null)
    iniciar(async () => {
      const r = await moverPlata({
        bolsillo_id: bolsillo.id, tipo: modo!, monto: n, nota,
      })
      if (r?.error) setError(r.error)
      else { setMonto(''); setNota(''); setModo(null) }
    })
  }

  return (
    <div className="bolsillo" style={{ opacity: pendiente ? 0.65 : 1 }}>
      <div className="bolsillo-cab">
        <i className="punto" style={{ background: bolsillo.color }} />
        <span className="bolsillo-nom">{bolsillo.nombre}</span>
        <b className="mono bolsillo-saldo">{pesos(bolsillo.saldo)}</b>
      </div>

      {bolsillo.asignacion_mes > 0 && (
        <>
          {toca > 0 ? (
            <>
              <div className="barra" style={{ height: 6, margin: '8px 0 5px' }}>
                <i style={{ width: pct + '%', background: bolsillo.color }} />
              </div>
              <div className="bolsillo-meta mono">
                {pesos(bolsillo.cargado_quincena)} de {pesos(toca)} esta quincena
                <span className="bolsillo-ritmo"> · {nombreRitmo(bolsillo.ritmo)}</span>
              </div>
            </>
          ) : (
            <div className="bolsillo-meta mono" style={{ marginTop: 8 }}>
              No le toca esta quincena
              <span className="bolsillo-ritmo"> · se llena {nombreRitmo(bolsillo.ritmo)}</span>
            </div>
          )}
        </>
      )}

      <div className="bolsillo-acciones">
        <button className="mini cargar" onClick={() => setModo(modo === 'cargar' ? null : 'cargar')}>
          ↑ Cargar
        </button>
        <button className="mini descargar" onClick={() => setModo(modo === 'descargar' ? null : 'descargar')}>
          ↓ Descargar
        </button>
        <button className="mini" onClick={() => setEditar(e => !e)}>Ritmo</button>
        {movimientos.length > 0 && (
          <button className="mini" onClick={() => setVerMovs(v => !v)}>
            Movimientos ({movimientos.length})
          </button>
        )}
      </div>

      {editar && (
        <div className="mover">
          <label className="ritmo-lab">¿Cuándo se llena?</label>
          <div className="ritmos">
            {RITMOS.map(r => (
              <button
                key={r.valor}
                className={'ritmo-op' + (bolsillo.ritmo === r.valor ? ' on' : '')}
                disabled={pendiente}
                onClick={() => iniciar(async () => {
                  const res = await editarBolsillo(bolsillo.id, { ritmo: r.valor })
                  if (res?.error) setError(res.error)
                  else { setError(null); setEditar(false) }
                })}
              >
                <b>{r.texto}</b>
                <em>{r.pista}</em>
              </button>
            ))}
          </div>
          <label className="ritmo-lab">¿Cuánto al mes?</label>
          <input
            type="number" inputMode="decimal" defaultValue={bolsillo.asignacion_mes}
            onBlur={e => {
              const n = Number(e.target.value) || 0
              if (n === bolsillo.asignacion_mes) return
              iniciar(async () => {
                const res = await editarBolsillo(bolsillo.id, { asignacion_mes: n })
                if (res?.error) setError(res.error)
              })
            }}
          />
          {error && <p className="entrar-error">{error}</p>}
        </div>
      )}

      {modo && (
        <div className="mover">
          <input
            type="number" inputMode="decimal" autoFocus placeholder="¿Cuánto?"
            value={monto} onChange={e => setMonto(e.target.value)}
          />
          <input
            type="text" placeholder="¿En qué? (opcional)"
            value={nota} onChange={e => setNota(e.target.value)}
          />
          {error && <p className="entrar-error">{error}</p>}
          <button className="guardar" onClick={mover} disabled={pendiente}>
            {modo === 'cargar' ? 'Meter al bolsillo' : 'Sacar del bolsillo'}
          </button>
        </div>
      )}

      {verMovs && (
        <div className="movs">
          {movimientos.map(m => (
            <Movimiento key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Un movimiento, y el boton para deshacerlo.
 *
 * El saldo no se guarda: se suma de estos. Asi que corregir un error no es
 * "ajustar el saldo" sino borrar el movimiento que lo causo — y por eso pide
 * confirmar en el sitio, sin ventana: borrar plata por un toque accidental
 * seria peor que el error original.
 */
function Movimiento({ m }: { m: MovimientoTipo }) {
  const [confirmar, setConfirmar] = useState(false)
  const [pendiente, iniciar] = useTransition()

  return (
    <div className={'mov' + (confirmar ? ' confirmando' : '')} style={{ opacity: pendiente ? 0.5 : 1 }}>
      <span className={'mov-tipo ' + m.tipo}>{m.tipo === 'cargar' ? '↑' : '↓'}</span>
      <span className="mov-cuerpo">
        <b className="mono">{pesos(m.monto)}</b>
        {m.nota && <em>{m.nota}</em>}
      </span>

      {confirmar ? (
        <span className="mov-confirma">
          <button className="mov-si" disabled={pendiente}
                  onClick={() => iniciar(async () => { await borrarMovimiento(m.id) })}>
            {pendiente ? '…' : 'Borrar'}
          </button>
          <button className="mov-no" onClick={() => setConfirmar(false)}>No</button>
        </span>
      ) : (
        <>
          <span className="mono mov-fecha">
            {new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
          </span>
          <button className="mov-x" title="Deshacer este movimiento"
                  onClick={() => setConfirmar(true)}>×</button>
        </>
      )}
    </div>
  )
}

function FormBanco({ onListo }: { onListo: () => void }) {
  const [nombre, setNombre] = useState('')
  const [saldo, setSaldo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <div className="unico">
      <div className="campo">
        <label>¿Qué banco?</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)}
               placeholder="Bancolombia, NU, Confiar…" autoFocus />
      </div>
      <div className="campo">
        <label>¿Cuánto tienes ahí ahora?</label>
        <input type="number" inputMode="decimal" value={saldo}
               onChange={e => setSaldo(e.target.value)} placeholder="0" />
      </div>
      {error && <p className="entrar-error">{error}</p>}
      <button
        className="guardar" disabled={!nombre.trim() || pendiente}
        onClick={() => iniciar(async () => {
          const r = await crearBanco(nombre, Number(saldo) || 0)
          if (r?.error) setError(r.error); else onListo()
        })}
      >{pendiente ? 'Guardando…' : 'Añadir banco'}</button>
      <button className="hoja-quitar" onClick={onListo}>Cancelar</button>
    </div>
  )
}

function FormBolsillo({ bancoId, onListo }: { bancoId: number; onListo: () => void }) {
  const [nombre, setNombre] = useState('')
  const [asignacion, setAsignacion] = useState('')
  const [ritmo, setRitmo] = useState<Ritmo>('quincenal')
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  const mes = Number(asignacion) || 0

  return (
    <div className="unico">
      <div className="campo">
        <label>¿Para qué es este bolsillo?</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)}
               placeholder="Hogar, Gasolina, Obligaciones…" autoFocus />
      </div>
      <div className="campo">
        <label>¿Cuánto le entra al mes?</label>
        <input type="number" inputMode="decimal" value={asignacion}
               onChange={e => setAsignacion(e.target.value)} placeholder="0" />
      </div>
      <div className="campo">
        <label>¿Cuándo se llena?</label>
        <div className="ritmos">
          {RITMOS.map(r => (
            <button
              key={r.valor} type="button"
              className={'ritmo-op' + (ritmo === r.valor ? ' on' : '')}
              onClick={() => setRitmo(r.valor)}
            >
              <b>{r.texto}</b>
              <em>{r.pista}</em>
            </button>
          ))}
        </div>
        {mes > 0 && (
          <p className="ritmo-pista">
            {ritmo === 'quincenal'
              ? <>Le entran <b>{pesos(Math.round(mes / 2))}</b> en cada quincena.</>
              : <>Le entran <b>{pesos(mes)}</b> {ritmo === 'q1' ? 'con la primera' : 'con la segunda'} quincena.</>}
          </p>
        )}
      </div>
      {error && <p className="entrar-error">{error}</p>}
      <button
        className="guardar" disabled={!nombre.trim() || pendiente}
        onClick={() => iniciar(async () => {
          const r = await crearBolsillo({
            banco_id: bancoId, nombre, asignacion_mes: mes, ritmo,
          })
          if (r?.error) setError(r.error); else onListo()
        })}
      >{pendiente ? 'Guardando…' : 'Crear bolsillo'}</button>
      <button className="hoja-quitar" onClick={onListo}>Cancelar</button>
    </div>
  )
}
