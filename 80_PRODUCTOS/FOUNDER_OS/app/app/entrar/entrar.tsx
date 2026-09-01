'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { conectarNavegador } from '@/lib/supabase-navegador'

export function Entrar({ conGoogle = false }: { conGoogle?: boolean }) {
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(params.get('error'))
  // Sin Google no hay nada que elegir: el correo entra directo.
  const [conCorreo, setConCorreo] = useState(!conGoogle)
  const [pendiente, iniciar] = useTransition()

  function entrarConGoogle() {
    setError(null)
    iniciar(async () => {
      const db = conectarNavegador()
      const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Vuelve al MISMO origen desde el que se entro: sirve igual en el
          // celular por IP local que en el dominio de produccion.
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      })
      if (error) setError(error.message)
    })
  }

  return (
    <main className="wrap entrar">
      <div className="entrar-marca">
        <span className="titulo mono cursor">MI VIDA</span>
        <p className="entrar-sub">
          Tus hábitos, tus áreas y lo que cabe hoy. Un solo tablero.
        </p>
      </div>

      <div className="entrar-caja">
        {error && <p className="entrar-error">{traducir(error)}</p>}

        {conGoogle && (
          <button className="google" onClick={entrarConGoogle} disabled={pendiente}>
            <LogoGoogle />
            {pendiente ? 'Abriendo Google…' : 'Continuar con Google'}
          </button>
        )}

        {conGoogle && !conCorreo ? (
          <button className="entrar-cambio" onClick={() => setConCorreo(true)}>
            Entrar con correo y contraseña
          </button>
        ) : (
          <>
            {conGoogle && <div className="separador"><span>o</span></div>}
            <ConCorreo onError={setError} />
          </>
        )}
      </div>

      <p className="entrar-pie">
        Tus datos son tuyos: cada cuenta solo ve los suyos.
      </p>
    </main>
  )
}

/** Correo y contraseña. Se mantiene como salida de emergencia si Google falla. */
function ConCorreo({ onError }: { onError: (m: string | null) => void }) {
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  const router = useRouter()

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    onError(null); setAviso(null)
    iniciar(async () => {
      const db = conectarNavegador()
      if (modo === 'entrar') {
        const { error } = await db.auth.signInWithPassword({ email: correo, password: clave })
        if (error) return onError(error.message)
        router.refresh(); router.push('/')
      } else {
        if (clave.length < 8) return onError('La contraseña necesita al menos 8 caracteres')
        const { data, error } = await db.auth.signUp({ email: correo, password: clave })
        if (error) return onError(error.message)
        if (data.session) { router.refresh(); router.push('/') }
        else setAviso('Cuenta creada. Revisa tu correo para confirmarla y vuelve a entrar.')
      }
    })
  }

  return (
    <form onSubmit={enviar}>
      <div className="campo">
        <label>Correo</label>
        <input
          type="email" inputMode="email" autoComplete="email" required
          value={correo} onChange={e => setCorreo(e.target.value)} placeholder="tu@correo.com"
        />
      </div>
      <div className="campo">
        <label>Contraseña</label>
        <input
          type="password" required
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          value={clave} onChange={e => setClave(e.target.value)}
          placeholder={modo === 'crear' ? 'Mínimo 8 caracteres' : '••••••••'}
        />
      </div>

      {aviso && <p className="entrar-aviso">{aviso}</p>}

      <button className="guardar" type="submit" disabled={pendiente}>
        {pendiente ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
      </button>
      <button
        type="button" className="entrar-cambio"
        onClick={() => { setModo(m => (m === 'entrar' ? 'crear' : 'entrar')); setAviso(null) }}
      >
        {modo === 'entrar' ? '¿Primera vez? Crear cuenta' : 'Ya tengo cuenta'}
      </button>
    </form>
  )
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function traducir(m: string): string {
  if (m.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos'
  if (m.includes('already registered')) return 'Ese correo ya tiene cuenta. Entra en vez de crearla'
  if (m.includes('Email not confirmed')) return 'Falta confirmar el correo. Revisa tu bandeja'
  if (m.includes('provider is not enabled')) return 'Google todavía no está habilitado en Supabase'
  return m
}
