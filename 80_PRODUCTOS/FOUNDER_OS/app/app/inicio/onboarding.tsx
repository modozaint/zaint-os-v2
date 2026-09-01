'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { guardarConfig, guardarArea, terminarOnboarding } from '../acciones'
import { Icono, ICONO_HABITO } from '../iconos'
import { Radar } from '../radar'

const PASOS = ['Bienvenida', 'Tu norte', 'Tus áreas', 'Tus hábitos', 'Listo']

const CICLO: [string, string, string][] = [
  ['1', 'Marcas el turno', 'El día decide qué te exige'],
  ['2', 'Cumples hábitos', 'En mínimo, normal o super'],
  ['3', 'Ganas XP', 'Cada área sube de nivel'],
  ['4', 'Ves el desequilibrio', 'El radar no miente'],
]

export function Onboarding({ config, areas, habitos }: { config: any; areas: any[]; habitos: any[] }) {
  const [paso, setPaso] = useState(0)
  const [nombre, setNombre] = useState(config?.nombre ?? '')
  const [norte, setNorte] = useState(config?.norte ?? '')
  const [meta, setMeta] = useState(config?.meta_12m ?? '')
  const [turnos, setTurnos] = useState(config?.trabaja_por_turnos ?? true)
  const [pendiente, iniciar] = useTransition()
  const router = useRouter()

  const porArea = new Map<string, any[]>()
  for (const h of habitos) {
    const l = porArea.get(h.area_id) ?? []
    l.push(h)
    porArea.set(h.area_id, l)
  }
  const sinHabito = areas.filter(a => !porArea.get(a.id)?.length)
  const primerNombre = nombre ? nombre.split(' ')[0] : ''

  function siguiente() {
    if (paso === 1) {
      iniciar(async () => {
        await guardarConfig({ nombre, norte, meta_12m: meta, trabaja_por_turnos: turnos })
        setPaso(2)
      })
    } else if (paso === PASOS.length - 1) {
      iniciar(async () => {
        await terminarOnboarding()
        router.push('/')
      })
    } else {
      setPaso(p => p + 1)
    }
  }

  return (
    <main className="wrap onb">
      <div className="pasos">
        {PASOS.map((_, i) => (
          <span key={i} className={'paso' + (i <= paso ? ' on' : '')} />
        ))}
      </div>

      {paso === 0 && (
        <>
          <h1 className="onb-h1">Tu vida, medida<br />como un juego</h1>
          <p className="onb-sub">Cinco áreas. Hábitos reales. Un solo tablero.</p>
          <div className="onb-caja">
            <p>
              Cada día cumples hábitos y ganas experiencia en el área a la que pertenecen.
              Lo que no se registra, no sube. <b>El sistema no te pide perfección: te pide
              que se vea dónde estás flojo.</b>
            </p>
          </div>
          <div className="ciclo">
            {CICLO.map(([n, t, d]) => (
              <div key={n} className="ciclo-item">
                <span className="ciclo-num mono">{n}</span>
                <b>{t}</b>
                <em>{d}</em>
              </div>
            ))}
          </div>
        </>
      )}

      {paso === 1 && (
        <>
          <h1 className="onb-h1">Tu norte</h1>
          <p className="onb-sub">Sin esto, los hábitos son tareas sueltas.</p>
          <div className="campo">
            <label>¿Cómo te llamas?</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="campo">
            <label>¿Hacia dónde vas?</label>
            <textarea
              className="nota"
              rows={4}
              value={norte}
              onChange={e => setNorte(e.target.value)}
              placeholder="La vida que estás construyendo, en tus palabras."
            />
          </div>
          <div className="campo">
            <label>Tu meta de los próximos 12 meses</label>
            <input value={meta} onChange={e => setMeta(e.target.value)} placeholder="Concreta y medible" />
          </div>
          <button className={'opcion' + (turnos ? ' on' : '')} onClick={() => setTurnos(!turnos)}>
            <b>Trabajo por turnos rotativos</b>
            <em>La exigencia de cada día se ajusta al turno. Un día de 12 h no pide lo mismo que uno libre.</em>
          </button>
        </>
      )}

      {paso === 2 && (
        <>
          <h1 className="onb-h1">Tus áreas</h1>
          <p className="onb-sub">Toca una para definir qué significa ganar en ella.</p>
          {areas.map(a => <EditorArea key={a.id} a={a} />)}
        </>
      )}

      {paso === 3 && (
        <>
          <h1 className="onb-h1">Tus hábitos</h1>
          <p className="onb-sub">Cada uno pertenece a un área y tiene tres niveles.</p>

          {sinHabito.length > 0 && (
            <div className="aviso">
              <b>{sinHabito.length} área{sinHabito.length > 1 ? 's' : ''} sin hábito:</b>{' '}
              {sinHabito.map(a => a.nombre).join(', ')}. Un área sin hábito nunca sube de nivel.
            </div>
          )}

          {areas.map(a => (
            <div key={a.id} className="area-hab">
              <div className="area-hab-top">
                <i className="punto" style={{ background: a.color }} />
                <span>{a.nombre}</span>
              </div>
              {(porArea.get(a.id) ?? []).map(h => (
                <div key={h.id} className="hab-mini">
                  <span className="hab-mini-nom">
                    <Icono nombre={h.icono ?? ICONO_HABITO[h.id] ?? 'target'} tam={15} />
                    {h.nombre}
                  </span>
                  <em>{h.minimo} · {h.normal} · {h.super}</em>
                </div>
              ))}
              {!porArea.get(a.id)?.length && <p className="hab-vacio">Sin hábitos</p>}
            </div>
          ))}
          <p className="pista">Los hábitos se crean y editan en Ajustes cuando quieras.</p>
        </>
      )}

      {paso === 4 && (
        <>
          <h1 className="onb-h1">Listo{primerNombre ? ', ' + primerNombre : ''}</h1>
          <p className="onb-sub">Así se ve tu punto de partida.</p>
          <div className="radar-caja">
            <Radar datos={areas.map(a => ({ nombre: a.nombre, valor: 0, color: a.color }))} max={100} />
          </div>
          <div className="onb-caja">
            <p>
              Todo en cero, y está bien: <b>es el primer día.</b> Lo único que hace subir esto
              es marcar lo que ya haces. Empieza por el turno de hoy.
            </p>
          </div>
        </>
      )}

      <div className="onb-pie">
        {paso > 0 && <button className="atras" onClick={() => setPaso(p => p - 1)}>Atrás</button>}
        <button className="guardar" onClick={siguiente} disabled={pendiente}>
          {pendiente ? 'Guardando…' : paso === PASOS.length - 1 ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </main>
  )
}

function EditorArea({ a }: { a: any }) {
  const [def, setDef] = useState(a.definicion_ganar ?? '')
  const [nom, setNom] = useState(a.nombre)
  const [abierto, setAbierto] = useState(false)
  const [pendiente, iniciar] = useTransition()
  const cambiado = def !== a.definicion_ganar || nom !== a.nombre

  return (
    <div className="area-card" style={{ padding: 14 }}>
      <button
        className="area-card-top desplegable"
        onClick={() => setAbierto(o => !o)}
      >
        <i className="punto" style={{ background: a.color, width: 10, height: 10 }} />
        <span className="area-card-nom">{nom}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: 15, height: 15, opacity: 0.5, transform: abierto ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!abierto && (
        <div className="area-def" style={{ marginTop: 6, marginBottom: 0 }}>
          {def || 'Sin definir'}
        </div>
      )}

      {abierto && (
        <div style={{ marginTop: 12 }}>
          <div className="campo">
            <label>Nombre</label>
            <input value={nom} onChange={e => setNom(e.target.value)} />
          </div>
          <div className="campo">
            <label>¿Qué es ganar en esta área?</label>
            <textarea className="nota" rows={2} value={def} onChange={e => setDef(e.target.value)} />
          </div>
          <button
            className="guardar"
            disabled={!cambiado || pendiente}
            onClick={() => iniciar(async () => {
              await guardarArea(a.id, nom, def)
              setAbierto(false)
            })}
          >
            {pendiente ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}
