'use client'

import { useState } from 'react'
import { pesos, pct, type Resumen, type LineaPresupuesto } from '@/lib/plata'

/**
 * Tu presupuesto: en qué se va la plata y cuánto sobra.
 *
 * 🔑 Muestra los DOS escenarios porque confundirlos invierte la conclusión:
 * el mismo mes es un déficit de −$78.050 o un superávit de +$265.167 según
 * cuál se lea. Arranca en «después», que es el plan vigente.
 */
export function Presupuesto({ antes, despues }: { antes: Resumen | null; despues: Resumen | null }) {
  const [ver, setVer] = useState<'antes' | 'despues'>(despues ? 'despues' : 'antes')
  const r = ver === 'despues' ? despues : antes
  const otro = ver === 'despues' ? antes : despues

  if (!r) {
    return (
      <p className="plan-vacio" style={{ marginTop: 18 }}>
        Todavía no hay presupuesto cargado. <b>Corre la migración 006</b> y aquí
        aparecen los dos escenarios.
      </p>
    )
  }

  const bueno = r.excedente >= 0

  return (
    <>
      {antes && despues && (
        <>
          <div className="antes-despues">
            <div>
              <span>ANTES</span>
              <b className={antes.excedente < 0 ? 'mal' : ''}>
                {antes.excedente < 0 ? '−' : ''}{pesos(Math.abs(antes.excedente))}
              </b>
              <em>/mes</em>
            </div>
            <div>
              <span>DESPUÉS</span>
              <b className={despues.excedente >= 0 ? 'bien' : 'mal'}>
                {despues.excedente < 0 ? '−' : ''}{pesos(Math.abs(despues.excedente))}
              </b>
              <em>/mes</em>
            </div>
          </div>

          <div className="cambio-tabs">
            <button className={ver === 'antes' ? 'on' : ''} onClick={() => setVer('antes')}>
              Antes de la asesoría
            </button>
            <button className={ver === 'despues' ? 'on' : ''} onClick={() => setVer('despues')}>
              Con la asesoría
            </button>
          </div>
        </>
      )}

      <div className={'veredicto' + (bueno ? ' bien' : ' mal')}>
        <b>{bueno ? 'Vas en superávit' : 'Estás en déficit'}</b>
        <span>
          {bueno
            ? 'Cada mes te sobra, después de ahorrar. Esto acumulas al año:'
            : 'Cada mes gastas más de lo que ganas. Así se acumula al año:'}
        </span>
        <div className="veredicto-cifras">
          <div>
            <em>AL MES</em>
            <b>{r.excedente < 0 ? '−' : ''}{pesos(Math.abs(r.excedente))}</b>
          </div>
          <div>
            <em>AL AÑO</em>
            <b>{r.excedente < 0 ? '−' : ''}{pesos(Math.abs(r.excedente) * 12)}</b>
          </div>
        </div>
      </div>

      <div className="cuadros">
        <Cuadro etiqueta="Ingresos mensuales" valor={pesos(r.ingresos)} />
        <Cuadro etiqueta="Gastos" valor={pesos(r.gastos)} />
        <Cuadro etiqueta="Ahorro" valor={pesos(r.ahorro)} />
        <Cuadro etiqueta="Excedente" valor={pesos(r.excedente)} tono={bueno ? 'bien' : 'mal'} />
      </div>

      <div className="uso">
        <div className="uso-cab mono">CÓMO USAS TUS INGRESOS</div>
        <div className="uso-fila">
          <div>
            <em>USAS</em>
            <b className={r.usadoPct > 100 ? 'mal' : ''}>{pct(r.usadoPct)}</b>
            <span>de tus ingresos en gastos</span>
          </div>
          <div>
            <em>CAPACIDAD DE AHORRO</em>
            <b className={r.capacidadPct < 0 ? 'mal' : 'bien'}>{pct(r.capacidadPct)}</b>
            <span>te queda para ahorrar e invertir</span>
          </div>
        </div>
        <div className="uso-barra">
          <i className="g" style={{ width: Math.min(100, r.usadoPct) + '%' }} />
          <i className="a" style={{ width: Math.min(100 - Math.min(100, r.usadoPct), (r.ahorro / r.ingresos) * 100) + '%' }} />
        </div>
        <div className="uso-leyenda">
          <span><i className="p g" /> Gastos {pesos(r.gastos)}</span>
          <span><i className="p a" /> Ahorro {pesos(r.ahorro)}</span>
          <span><i className="p e" /> Excedente {pesos(r.excedente)}</span>
        </div>
      </div>

      <div className="seccion mono">Detalle por categoría</div>

      <div className="fijos">
        <div>
          <b>Gastos fijos = Hogar + Necesidades básicas</b>
          <em>Se leen juntas. Lo ideal es entre 50 % y 60 % de tus ingresos.</em>
        </div>
        <div className="fijos-num">
          <b className={r.fijosPct >= 50 && r.fijosPct <= 60 ? 'bien' : ''}>
            {Math.round(r.fijosPct)} %
          </b>
          <span>{pesos(r.fijos)}</span>
          <em className="mono">IDEAL 50-60 %</em>
        </div>
      </div>

      {r.lineas.map(l => <Categoria key={l.id} l={l} />)}

      {otro && (
        <p className="pista" style={{ marginTop: 16 }}>
          {ver === 'despues'
            ? 'Este es el plan que armaste. El «antes» solo sirve para ver de dónde saliste.'
            : 'Así estabas antes. Toca «Con la asesoría» para ver el plan vigente.'}
        </p>
      )}
    </>
  )
}

/**
 * Una categoría con su detalle. Se despliega porque «Educación y negocio
 * $98.400» no dice nada: lo útil es ver que ahí adentro está Claude, la cuota
 * de manejo y Shopify — y lo que ya se dejó de pagar.
 */
function Categoria({ l }: { l: LineaPresupuesto }) {
  const [abierta, setAbierta] = useState(false)
  const activos = l.conceptos.filter(c => c.activo)
  const fuera = l.conceptos.filter(c => !c.activo)
  const ahorrado = fuera.reduce((s, c) => s + c.monto_mes, 0)
  const grupos = [...new Set(activos.map(c => c.grupo ?? ''))]

  return (
    <div className="cat">
      <button className="cat-top" onClick={() => setAbierta(a => !a)} disabled={!l.conceptos.length}>
        <i className="punto" style={{ background: l.color }} />
        <span className="cat-nom">{l.nombre}</span>
        <b className="cat-monto">{pesos(l.monto)}</b>
        <span className={'cat-dif ' + (l.sano ? 'bien' : 'mal')}>
          {l.sano ? '+' : '−'}{pesos(Math.abs(l.diferencia))}
        </span>
      </button>

      <div className="cat-pcts">
        ideal {l.ideal_pct} % · <b className={l.sano ? 'bien' : 'mal'}>vas en {Math.round(l.pct)} %</b>
        {l.mas_es_mejor && <em> · entre más, mejor</em>}
        {!!l.conceptos.length && (
          <button className="cat-ver" onClick={() => setAbierta(a => !a)}>
            {abierta ? 'ocultar' : `ver los ${activos.length}`}
          </button>
        )}
      </div>

      <div className="cat-barra">
        <i style={{
          width: Math.min(100, (l.pct / Math.max(l.ideal_pct, l.pct || 1)) * 100) + '%',
          background: l.color,
        }} />
      </div>

      {abierta && (
        <div className="conceptos">
          {grupos.map(g => (
            <div key={g}>
              {g && <div className="concepto-grupo mono">{g}</div>}
              {activos.filter(c => (c.grupo ?? '') === g).map(c => (
                <div key={c.id} className="concepto">
                  <span>
                    {c.concepto}
                    {c.detalle && <em>{c.detalle}</em>}
                  </span>
                  <b className="mono">{pesos(c.monto_mes)}</b>
                </div>
              ))}
            </div>
          ))}

          {fuera.length > 0 && (
            <div className="ya-no">
              <div className="ya-no-cab mono">
                YA NO LO PAGAS · {pesos(ahorrado)} al mes
              </div>
              {fuera.map(c => (
                <div key={c.id} className="concepto tachado">
                  <span>
                    {c.concepto}
                    {c.detalle && <em>{c.detalle}</em>}
                  </span>
                  <b className="mono">{pesos(c.monto_mes)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Cuadro({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: 'bien' | 'mal' }) {
  return (
    <div className="cuadro">
      <span>{etiqueta}</span>
      <b className={tono ?? ''}>{valor}</b>
    </div>
  )
}
