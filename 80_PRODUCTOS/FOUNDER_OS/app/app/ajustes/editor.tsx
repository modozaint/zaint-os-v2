'use client'

import { useState, useTransition } from 'react'
import { guardarHabito } from '../acciones'

export function EditorHabito({ h, area }: { h: any; area: string }) {
  const [minimo, setMinimo] = useState(h.minimo)
  const [normal, setNormal] = useState(h.normal)
  const [sup, setSup] = useState(h.super)
  const [pendiente, iniciar] = useTransition()
  const [guardado, setGuardado] = useState(false)

  const cambiado = minimo !== h.minimo || normal !== h.normal || sup !== h.super

  return (
    <div className="habito">
      <div className="habito-top">
        <span className="habito-nom">{h.nombre}</span>
        <span className="habito-area mono">{area}</span>
      </div>

      <div className="campo">
        <label>Mínimo</label>
        <input value={minimo} onChange={e => { setMinimo(e.target.value); setGuardado(false) }} />
      </div>
      <div className="campo">
        <label>Normal</label>
        <input value={normal} onChange={e => { setNormal(e.target.value); setGuardado(false) }} />
      </div>
      <div className="campo">
        <label>Super</label>
        <input value={sup} onChange={e => { setSup(e.target.value); setGuardado(false) }} />
      </div>

      <button
        className="guardar"
        disabled={!cambiado || pendiente}
        onClick={() => iniciar(async () => {
          await guardarHabito(h.id, { minimo, normal, super: sup })
          setGuardado(true)
        })}
      >
        {pendiente ? 'Guardando…' : guardado ? 'Guardado ✓' : cambiado ? 'Guardar' : 'Sin cambios'}
      </button>
    </div>
  )
}
