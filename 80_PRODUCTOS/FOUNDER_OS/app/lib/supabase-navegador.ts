'use client'

import { createBrowserClient } from '@supabase/ssr'
import { URL_SUPABASE, CLAVE_PUBLICA } from './config-supabase'

/** Cliente del navegador. Solo se usa para entrar, salir y crear cuenta. */
export function conectarNavegador() {
  return createBrowserClient(URL_SUPABASE, CLAVE_PUBLICA)
}
