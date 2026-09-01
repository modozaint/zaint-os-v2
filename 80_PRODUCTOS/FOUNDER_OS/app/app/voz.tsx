'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { interpretar, type BolsilloConocido, type HabitoConocido, type Interpretacion } from '@/lib/dictado'
import { enlaceDe } from './borrador'

type Estado = { vida: number; faltan: number; metaNivel: string; primera: string | null }

/**
 * Boton flotante de voz, al estilo del que usa Parcero Financiero: circulo
 * fijo abajo a la derecha, siempre alcanzable con el pulgar.
 *
 * Escucha CONTINUA y se detiene a mano. La version anterior usaba
 * `continuous = false`, que corta al primer silencio: hablar pausado o pensar
 * a media frase la mataba. Ahora se para cuando uno decide, y recien ahi actua.
 *
 * ⚠️ Este boton NO guarda nada (cambio del 2026-08-14). Entiende, te lleva a la
 * pantalla que corresponde y deja el dato escrito esperando tu confirmacion.
 * Las preguntas si se responden aqui mismo: leer no cambia nada.
 *
 * ⚠️ El reconocimiento lo hace el navegador (Web Speech API), no un modelo de
 * pago. Por eso hablarle a la app cuesta cero, sin importar cuanto se use.
 */
export function Voz({
  habitos,
  bolsillos = [],
  estado,
}: {
  habitos: HabitoConocido[]
  bolsillos?: BolsilloConocido[]
  estado?: Estado
}) {
  const [oyendo, setOyendo] = useState(false)
  const [motivo, setMotivo] = useState<string | null>(null)
  const [parcial, setParcial] = useState('')
  const [respuesta, setRespuesta] = useState<{ texto: string; ok: boolean } | null>(null)
  const router = useRouter()

  const rec = useRef<any>(null)
  const firme = useRef('')          // lo ya reconocido en firme
  const queriaParar = useRef(false) // distingue parada del usuario de corte del navegador

  useEffect(() => {
    if (!window.isSecureContext) {
      setMotivo('El micrófono necesita HTTPS. En este computador funciona en localhost.')
      return
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { setMotivo('Tu navegador no soporta dictado. Prueba con Chrome.'); return }

    const r = new SR()
    r.lang = 'es-CO'
    r.continuous = true       // no cortar al primer silencio
    r.interimResults = true
    r.maxAlternatives = 1

    r.onresult = (e: any) => {
      let enVivo = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript
        if (e.results[i].isFinal) firme.current += txt + ' '
        else enVivo += txt
      }
      setParcial((firme.current + enVivo).trim())
    }

    // El navegador corta solo tras un silencio largo. Si el usuario no pidio
    // parar, se vuelve a arrancar: asi el dictado dura lo que uno quiera.
    r.onend = () => {
      if (queriaParar.current) { setOyendo(false); return }
      try { r.start() } catch { setOyendo(false) }
    }

    r.onerror = (e: any) => {
      const err = e?.error
      if (err === 'no-speech') return          // silencio: onend lo reanuda
      queriaParar.current = true
      setOyendo(false)
      if (err === 'not-allowed') setMotivo('Permiso de micrófono denegado. Actívalo en el candado de la barra de direcciones.')
      else if (err === 'audio-capture') setMotivo('No encuentro micrófono conectado.')
      else if (err === 'network') setRespuesta({ texto: 'Sin conexión para reconocer la voz.', ok: false })
    }

    rec.current = r
    return () => { queriaParar.current = true; try { r.abort() } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function arrancar() {
    firme.current = ''
    setParcial(''); setRespuesta(null)
    queriaParar.current = false
    try { rec.current?.start(); setOyendo(true) } catch {}
  }

  function parar() {
    queriaParar.current = true
    try { rec.current?.stop() } catch {}
    setOyendo(false)
    const frase = (firme.current + ' ' + parcial).trim() || parcial.trim()
    if (!frase) { setRespuesta({ texto: 'No escuché nada.', ok: false }); return }

    const i = interpretar(frase, habitos, bolsillos)

    // Lo que cambia algo: se lleva a su pantalla y espera confirmacion.
    if (i.tipo === 'habito' || i.tipo === 'tarea' || i.tipo === 'movimiento') {
      setParcial('')
      router.push(enlaceDe(i))
      return
    }
    // Lo que solo pregunta: se responde aqui.
    setRespuesta(responder(i, bolsillos, estado, () => router.push('/')))
  }

  if (motivo) {
    return <p className="voz-no">{motivo}</p>
  }

  return (
    <>
      {(oyendo || parcial || respuesta) && (
        <div className="voz-panel" onClick={() => !oyendo && setRespuesta(null)}>
          {oyendo && (
            <div className="voz-vivo">
              <Barras />
              <span>{parcial || 'Te escucho… toca el micrófono para terminar'}</span>
            </div>
          )}
          {!oyendo && respuesta && (
            <span className={'voz-resp' + (respuesta.ok ? ' ok' : ' no')}>{respuesta.texto}</span>
          )}
        </div>
      )}

      <button
        className={'fab' + (oyendo ? ' on' : '')}
        onClick={() => (oyendo ? parar() : arrancar())}
        aria-label={oyendo ? 'Terminar dictado' : 'Hablarle a la app'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <path d="M12 19v3" />
        </svg>
      </button>
    </>
  )
}

/** Preguntas: se leen y se contestan. Nunca escriben. */
function responder(
  i: Interpretacion,
  bolsillos: BolsilloConocido[],
  estado: Estado | undefined,
  irAInicio: () => void,
): { texto: string; ok: boolean } {
  if (i.tipo === 'consulta_plata') {
    if (i.bolsilloId) {
      const b = bolsillos.find(x => x.id === i.bolsilloId)
      if (b && b.saldo !== undefined) {
        return { texto: `${b.nombre}: $ ${Math.round(b.saldo).toLocaleString('es-CO')}`, ok: true }
      }
    }
    const total = bolsillos.reduce((s, b) => s + (b.saldo ?? 0), 0)
    if (bolsillos.length === 0) return { texto: 'Todavía no tienes bolsillos creados.', ok: false }
    return {
      texto: `En bolsillos tienes $ ${Math.round(total).toLocaleString('es-CO')}.`,
      ok: true,
    }
  }

  if (i.tipo === 'consulta') {
    // Sin el tablero cargado no se puede responder de memoria: se va a Inicio,
    // que es donde vive ese dato. Inventarlo seria peor que moverse.
    if (!estado) { irAInicio(); return { texto: 'Te llevo a Inicio…', ok: true } }

    if (i.que === 'vida') return { texto: `Tienes ${estado.vida} de vida.`, ok: true }
    if (i.que === 'falta') {
      if (estado.metaNivel === 'ninguno') {
        return { texto: 'Hoy es día protegido: no falta nada.', ok: true }
      }
      return {
        texto: estado.faltan > 0
          ? `Te falta${estado.faltan > 1 ? 'n' : ''} ${estado.faltan} en ${estado.metaNivel}.`
          : 'Ya cumpliste la meta de hoy.',
        ok: true,
      }
    }
    return {
      texto: estado.primera ? `Lo primero: ${estado.primera}` : 'Hoy no hay nada que quepa.',
      ok: true,
    }
  }

  return {
    texto: `No entendí «${i.tipo === 'nada' ? i.oido : ''}». Prueba «hice ejercicio», «gasté 20 mil en domicilios» o «añadir X a tareas».`,
    ok: false,
  }
}

function Barras() {
  return (
    <span className="ondas" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  )
}
