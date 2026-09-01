/**
 * El puente entre lo que se dicta y la pantalla donde se confirma.
 *
 * Decision de Santiago (2026-08-14): la voz NO guarda. Lleva el dato hasta la
 * pantalla que le corresponde, lo deja escrito y espera. Ahi es donde se ve si
 * el microfono oyo bien — y si no, se corrige antes de tocar la base.
 *
 * Por que viaja en la URL y no en un estado de React: entre pantallas hay una
 * navegacion de servidor, y cualquier estado en memoria se pierde en el camino.
 * En la URL sobrevive, y de paso el boton de atras funciona solo.
 */

import type { Interpretacion } from '@/lib/dictado'

/** Lo unico que se confirma. Las consultas no crean borrador: solo responden. */
export type Borrador = Extract<Interpretacion, { tipo: 'habito' | 'tarea' | 'movimiento' }>

export const PARAM = 'd'

/** Donde se confirma cada cosa. */
export const DESTINO: Record<Borrador['tipo'], string> = {
  habito: '/',
  tarea: '/tareas',
  movimiento: '/dinero',
}

/** base64 seguro para URL: sin +, sin / y sin = que rompan el query. */
function aBase64Url(s: string): string {
  return btoa(encodeURIComponent(s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(s: string): string {
  const base = s.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(atob(base + '==='.slice((base.length + 3) % 4)))
}

export function enlaceDe(b: Borrador): string {
  return `${DESTINO[b.tipo]}?${PARAM}=${aBase64Url(JSON.stringify(b))}`
}

/** Devuelve null ante cualquier basura: un query manipulado no debe romper la app. */
export function leerBorrador(valor: string | null): Borrador | null {
  if (!valor) return null
  try {
    const b = JSON.parse(deBase64Url(valor))
    if (b && (b.tipo === 'habito' || b.tipo === 'tarea' || b.tipo === 'movimiento')) return b
    return null
  } catch {
    return null
  }
}
