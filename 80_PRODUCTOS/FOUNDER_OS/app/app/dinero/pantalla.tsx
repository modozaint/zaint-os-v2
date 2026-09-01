'use client'

import { useState } from 'react'
import { Dinero } from './dinero'
import { Presupuesto } from './presupuesto'
import { DiagnosticoVista } from './diagnostico'
import {
  pesos, type Banco, type Bolsillo, type Movimiento, type Resumen, type Diagnostico,
  type Quincena,
} from '@/lib/plata'

type Props = {
  bancos: Banco[]; bolsillos: Bolsillo[]; movimientos: Movimiento[]
  total: number; asignadoMes: number
  quincena: Quincena; tocaQuincena: number
  cargadoQuincena: number; faltaQuincena: number
  antes: Resumen | null; despues: Resumen | null
  diagnostico: Diagnostico | null
}

/** Dos vistas del mismo dinero: donde esta hoy (bolsillos) y el plan (presupuesto). */
export function PantallaDinero(p: Props) {
  const [vista, setVista] = useState<'bolsillos' | 'presupuesto' | 'diagnostico'>('bolsillos')
  const vigente = p.despues ?? p.antes

  return (
    <main className="wrap">
      <div className="head">
        <span className="titulo mono cursor">MI DINERO</span>
        <span className="fecha">
          {vista === 'bolsillos' ? pesos(p.total) : vigente ? pesos(vigente.excedente) + '/mes' : ''}
        </span>
      </div>

      <div className="sub-tabs">
        <button className={vista === 'bolsillos' ? 'on' : ''} onClick={() => setVista('bolsillos')}>
          Bolsillos
        </button>
        <button className={vista === 'presupuesto' ? 'on' : ''} onClick={() => setVista('presupuesto')}>
          Presupuesto
        </button>
        <button className={vista === 'diagnostico' ? 'on' : ''} onClick={() => setVista('diagnostico')}>
          Diagnóstico
        </button>
      </div>

      {vista === 'bolsillos' && (
        <Dinero
          bancos={p.bancos} bolsillos={p.bolsillos} movimientos={p.movimientos}
          total={p.total} asignadoMes={p.asignadoMes}
          quincena={p.quincena} tocaQuincena={p.tocaQuincena}
          cargadoQuincena={p.cargadoQuincena} faltaQuincena={p.faltaQuincena}
        />
      )}
      {vista === 'presupuesto' && <Presupuesto antes={p.antes} despues={p.despues} />}
      {vista === 'diagnostico' && <DiagnosticoVista d={p.diagnostico} />}
    </main>
  )
}
