'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { guardarApunte } from '../acciones'

export type Apunte = { fecha: string; texto: string }

/**
 * El cuaderno del escritorio: la bitacora.
 *
 * Santiago (23-ago): "que se siente en el escritorio a escribir en el cuaderno
 * y que sea donde pueda llevar mis notas o mi bitacora".
 *
 * Una entrada por dia, guardada en `dias.apunte` — la columna existe desde el
 * esquema inicial y el historial ya la muestra. No se invento una tabla nueva:
 * una tabla nueva es una migracion que hay que acordarse de correr en Supabase,
 * y el dia que no se corre la pantalla falla sin decir por que.
 *
 * Se guarda al soltar (1,2 s sin escribir) y al cerrar. Nada de un boton
 * "guardar" que se olvide: lo escrito se pierde una sola vez y ya no se vuelve
 * a escribir ahi.
 */
export function Cuaderno({
  fecha, inicial, anteriores, onCerrar,
}: {
  fecha: string
  inicial: string
  anteriores: Apunte[]
  onCerrar: () => void
}) {
  const [texto, setTexto] = useState(inicial)
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'guardado' | 'error'>('quieto')
  const [error, setError] = useState<string | null>(null)
  const [, iniciar] = useTransition()
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimo = useRef(inicial)
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { area.current?.focus() }, [])

  function guardar(valor: string) {
    if (valor === ultimo.current) return
    ultimo.current = valor
    setEstado('guardando')
    iniciar(async () => {
      const r = await guardarApunte(fecha, valor)
      if (r?.error) { setEstado('error'); setError(r.error) }
      else { setEstado('guardado'); setError(null) }
    })
  }

  function escribir(valor: string) {
    setTexto(valor)
    setEstado('quieto')
    if (reloj.current) clearTimeout(reloj.current)
    reloj.current = setTimeout(() => guardar(valor), 1200)
  }

  function cerrar() {
    if (reloj.current) clearTimeout(reloj.current)
    guardar(texto)
    onCerrar()
  }

  useEffect(() => () => { if (reloj.current) clearTimeout(reloj.current) }, [])

  return (
    <div className="hoja-fondo" onClick={cerrar}>
      <div className="hoja cuaderno" onClick={e => e.stopPropagation()}>
        <div className="cuaderno-cab">
          <h3>Cuaderno</h3>
          <span className="mono cuaderno-fecha">{comoSeLee(fecha)}</span>
        </div>

        <textarea
          ref={area}
          className="nota cuaderno-hoja"
          placeholder="Qué pasó hoy. Lo que aprendiste, lo que te frenó, lo que no quieres olvidar."
          value={texto}
          onChange={e => escribir(e.target.value)}
          rows={7}
        />

        <div className="cuaderno-estado mono">
          {estado === 'guardando' ? 'Guardando…'
            : estado === 'guardado' ? 'Guardado'
            : estado === 'error' ? (error ?? 'No se pudo guardar')
            : `${texto.trim().length} caracteres`}
        </div>

        {anteriores.length > 0 && (
          <div className="cuaderno-atras">
            <span className="seccion mono">Páginas anteriores</span>
            {anteriores.map(a => (
              <div key={a.fecha} className="cuaderno-vieja">
                <span className="mono">{comoSeLee(a.fecha)}</span>
                <p>{a.texto}</p>
              </div>
            ))}
          </div>
        )}

        <button className="guardar" onClick={cerrar}>Cerrar el cuaderno</button>
      </div>
    </div>
  )
}

/** '2026-08-23' → 'domingo 23 de agosto'. Con hora fija: sin ella la fecha se
 *  interpreta en UTC y en Colombia retrocede un dia. */
function comoSeLee(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}
