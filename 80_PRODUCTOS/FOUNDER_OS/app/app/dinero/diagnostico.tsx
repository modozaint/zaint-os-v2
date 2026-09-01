'use client'

import { useState } from 'react'
import { pesos, type Diagnostico } from '@/lib/plata'

/**
 * El diagnóstico que salió de las llamadas con el asesor.
 * A diferencia del presupuesto, aquí no se calcula nada: es texto que se
 * escribió una vez y que hay que poder releer el día que no dan ganas.
 */
export function DiagnosticoVista({ d }: { d: Diagnostico | null }) {
  const [abierta, setAbierta] = useState<number | null>(null)

  if (!d) {
    return (
      <p className="plan-vacio" style={{ marginTop: 18 }}>
        Todavía no hay diagnóstico cargado. <b>Corre la migración 007</b> y aquí
        aparece completo.
      </p>
    )
  }

  const fecha = d.fecha_asesoria
    ? new Date(d.fecha_asesoria + 'T12:00:00').toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <>
      {fecha && <p className="pista" style={{ marginBottom: 14 }}>Asesoría del {fecha}</p>}

      {/* Los números duros */}
      <div className="diag-nums">
        <Fila etiqueta="Te entra" valor={pesos(d.te_entra)} />
        <Fila etiqueta="Te sale" valor={pesos(d.te_sale)} />
        <Fila etiqueta="Diferencia" valor={pesos(d.diferencia)} tono="bien" />
        <Fila etiqueta="Capacidad de ahorro" valor={d.capacidad_ahorro ?? '—'} tono="bien" />
        <Fila etiqueta="Nivel de endeudamiento" valor={d.nivel_endeudamiento + ' %'} />
        <Fila etiqueta="Gastos fijos" valor={d.gastos_fijos_pct + ' %'} />
        <Fila etiqueta="Capacidad de endeudamiento" valor={pesos(d.capacidad_endeudamiento)} />
      </div>

      {/* Lo que creías vs. la realidad */}
      {d.creias && (
        <div className="bloque destacado">
          <div className="bloque-cab mono">¿CÓMO VES LA PLATA?</div>
          <h3>Lo que creías vs. la realidad</h3>
          <p>{d.creias}</p>
        </div>
      )}

      {/* El perfil */}
      {d.perfil.map(b => (
        <div key={b.id} className="bloque">
          <h3>{b.titulo}</h3>
          <p>{b.cuerpo}</p>
        </div>
      ))}

      {/* Recomendaciones */}
      {d.recomendaciones.length > 0 && (
        <>
          <div className="seccion mono">Recomendaciones para ti</div>
          {d.recomendaciones.map((r, i) => (
            <button
              key={r.id}
              className={'reco' + (abierta === r.id ? ' on' : '')}
              onClick={() => setAbierta(a => (a === r.id ? null : r.id))}
            >
              <div className="reco-cab">
                <span className="reco-n mono">{i + 1}</span>
                <span className="reco-tit">{r.titulo}</span>
                <span className="reco-flecha">{abierta === r.id ? '−' : '+'}</span>
              </div>
              {abierta === r.id && <p className="reco-cuerpo">{r.cuerpo}</p>}
            </button>
          ))}
        </>
      )}

      {/* Los dos planes */}
      <div className="seccion mono">Tu plan</div>

      {d.mini_plan && (
        <div className="plan-caja ya">
          <div className="plan-tag mono">PARA EMPEZAR YA</div>
          <p>{d.mini_plan}</p>
        </div>
      )}

      {d.plan_fondo && (
        <div className="plan-caja fondo">
          <div className="plan-tag mono">EL CAMBIO DE FONDO</div>
          <p>{d.plan_fondo}</p>
        </div>
      )}

      {/* El mensaje personal */}
      {d.mensaje && (
        <div className="mensaje-personal">
          <p>{d.mensaje}</p>
        </div>
      )}
    </>
  )
}

function Fila({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: 'bien' }) {
  return (
    <div className="diag-fila">
      <span>{etiqueta}</span>
      <b className={tono ?? ''}>{valor}</b>
    </div>
  )
}
