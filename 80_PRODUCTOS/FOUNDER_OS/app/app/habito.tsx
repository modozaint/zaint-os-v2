'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { marcarHabito, guardarNota, guardarEvidencia } from './acciones'
import { conectarNavegador } from '@/lib/supabase-navegador'
import { hoyBogota } from '@/lib/tiempo'
import { achicar } from '@/lib/foto'
import { Icono, ICONO_HABITO } from './iconos'
import type { Nivel } from '@/lib/tipos'

const XP: Record<string, number> = { minimo: 10, normal: 25, super: 50 }
const ETIQUETA: Record<string, string> = { minimo: 'Mín', normal: 'Normal', super: 'Super' }

type H = {
  id: string; nombre: string; minimo: string; normal: string; super: string
  porque: string | null; icono: string | null
  nivel_hoy: string | null; nota_hoy: string | null; evidencia_hoy: string | null
}

export function TarjetaHabito({ h, color }: { h: H; color?: string }) {
  const [abierto, setAbierto] = useState(false)
  const [nivel, setNivel] = useState(h.nivel_hoy)
  const [nota, setNota] = useState(h.nota_hoy ?? '')
  const [foto, setFoto] = useState(h.evidencia_hoy)
  const [pendiente, iniciar] = useTransition()
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)

  const opciones: { k: Nivel; texto: string }[] = [
    { k: 'minimo', texto: h.minimo },
    { k: 'normal', texto: h.normal },
    { k: 'super', texto: h.super },
  ]

  function elegir(k: Nivel | null) {
    setNivel(k)
    if (k === null) { setNota(''); setFoto(null) }
    iniciar(async () => { await marcarHabito(h.id, k) })
  }

  function cerrar() {
    setAbierto(false)
    if (nivel && nota !== (h.nota_hoy ?? '')) {
      iniciar(async () => { await guardarNota(h.id, nota) })
    }
  }

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError(null)

    // Se ve DE UNA, mientras sube. La foto ya esta tomada: esperar a que el
    // servidor conteste para mostrarla es lo que la hacia sentir perdida.
    const previa = URL.createObjectURL(f)
    const antes = foto
    setFoto(previa)
    setSubiendo(true)

    try {
      const liviana = await achicar(f)
      const db = conectarNavegador()

      const { data: sesion } = await db.auth.getUser()
      if (!sesion.user) throw new Error('Sesión vencida. Vuelve a entrar.')

      const ext = liviana.type === 'image/jpeg' ? 'jpg'
        : (liviana.name.split('.').pop() ?? 'jpg').toLowerCase()
      const ruta = `${sesion.user.id}/${hoyBogota()}/${h.id}-${Date.now()}.${ext}`

      // Del celular al bucket, sin pasar por el servidor: asi no hay limite de
      // tamano que la corte a la mitad.
      const { error: fallo } = await db.storage.from('evidencia')
        .upload(ruta, liviana, { contentType: liviana.type || 'image/jpeg', upsert: true })
      if (fallo) throw new Error(fallo.message)

      const r = await guardarEvidencia(h.id, ruta)
      if (r?.error) throw new Error(r.error)
      if (r?.url) setFoto(r.url)
    } catch (err: any) {
      setFoto(antes)
      setError(err?.message ?? 'Falló la subida')
    } finally {
      URL.revokeObjectURL(previa)
      setSubiendo(false)
    }
  }

  return (
    <>
      <button
        className={'tarjeta' + (nivel ? ' hecho' : '')}
        style={{ opacity: pendiente ? 0.6 : 1 }}
        onClick={() => setAbierto(true)}
      >
        {nivel && <span className="tarjeta-nivel mono">{ETIQUETA[nivel]}</span>}
        <div
          className="tarjeta-ico"
          style={color && !nivel ? { color, borderColor: color + '4D' } : undefined}
        >
          <Icono nombre={h.icono ?? ICONO_HABITO[h.id] ?? 'target'} />
        </div>
        <div className="tarjeta-nom">{h.nombre}</div>
        <div className="tarjeta-xp mono">{nivel ? `+${XP[nivel]} XP` : '+10 · 25 · 50'}</div>
        {(h.nota_hoy || h.evidencia_hoy) && <span className="marca-detalle" />}
      </button>

      {abierto && (
        <div className="hoja-fondo" onClick={cerrar}>
          <div className="hoja" onClick={e => e.stopPropagation()}>
            <h3>{h.nombre}</h3>
            <p className="sub">¿Hasta dónde llegaste hoy?</p>

            {h.porque && <PorQue texto={h.porque} />}

            {opciones.map(o => (
              <button
                key={o.k}
                className={'hoja-niv' + (nivel === o.k ? ' on' : '')}
                onClick={() => elegir(o.k)}
              >
                <b className="mono">{ETIQUETA[o.k]}</b>
                <span>{o.texto}</span>
                <i className="mono">+{XP[o.k]}</i>
              </button>
            ))}

            {nivel && (
              <div className="detalle">
                <div className="detalle-cab">
                  <span className="mono">Detalle · opcional</span>
                  <Dictado onTexto={t => setNota(n => (n ? n + ' ' : '') + t)} />
                </div>

                <textarea
                  className="nota"
                  placeholder="Qué hiciste exactamente. Ej: 80 flexiones, 4 series de fondos, 3 km caminando."
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  rows={3}
                />

                <input ref={inputFoto} type="file" accept="image/*" capture="environment"
                       onChange={elegirFoto} hidden />

                {foto ? (
                  <div className={'foto-ok' + (subiendo ? ' subiendo' : '')}>
                    <img src={foto} alt="evidencia" />
                    {subiendo && <span className="foto-estado mono">Guardando…</span>}
                    <button onClick={() => inputFoto.current?.click()} disabled={subiendo}>
                      Cambiar foto
                    </button>
                  </div>
                ) : (
                  <button className="foto-btn" onClick={() => inputFoto.current?.click()} disabled={subiendo}>
                    {subiendo ? 'Subiendo…' : '📷  Añadir foto de evidencia'}
                  </button>
                )}

                {error && <p className="error">{error}</p>}

                <button className="guardar" onClick={cerrar}>Listo</button>
                <button className="hoja-quitar" onClick={() => { elegir(null); setAbierto(false) }}>
                  Quitar el registro de hoy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** Dictado por voz con la API nativa del navegador. Gratis, sin servidor. */
function Dictado({ onTexto }: { onTexto: (t: string) => void }) {
  const [oyendo, setOyendo] = useState(false)
  const [hay, setHay] = useState(false)
  const [motivo, setMotivo] = useState<string | null>(null)
  const rec = useRef<any>(null)

  useEffect(() => {
    // El microfono SOLO funciona en contexto seguro: HTTPS o localhost.
    // Por IP local en HTTP el navegador lo bloquea sin avisar.
    if (!window.isSecureContext) {
      setMotivo('Necesita HTTPS')
      return
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) {
      setMotivo('Tu navegador no lo soporta')
      return
    }
    setHay(true)
    const r = new SR()
    r.lang = 'es-CO'
    r.continuous = false
    r.interimResults = false
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((x: any) => x[0].transcript).join(' ')
      if (t) onTexto(t.trim())
    }
    r.onend = () => setOyendo(false)
    r.onerror = (e: any) => {
      setOyendo(false)
      if (e?.error === 'not-allowed') setMotivo('Permiso de microfono denegado')
      else if (e?.error === 'no-speech') setMotivo('No se escucho nada')
    }
    rec.current = r
    return () => { try { r.abort() } catch {} }
  }, [onTexto])

  if (!hay) return <span className="mic-no">{motivo ?? 'Dictado no disponible'}</span>

  return (
    <button
      className={'mic' + (oyendo ? ' on' : '')}
      title={motivo ?? ''}
      onClick={() => {
        if (oyendo) { rec.current?.stop(); setOyendo(false) }
        else { try { rec.current?.start(); setOyendo(true) } catch {} }
      }}
    >
      {oyendo ? '● Grabando…' : '🎙 Dictar'}
    </button>
  )
}

/** El porque del habito: la brujula a nivel de habito. Se lee el dia que no dan ganas. */
function PorQue({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="porque">
      <button className="porque-btn" onClick={() => setAbierto(a => !a)}>
        <span>Por que hago esto</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round"
             style={{ transform: abierto ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {abierto && <p className="porque-txt">{texto}</p>}
    </div>
  )
}
