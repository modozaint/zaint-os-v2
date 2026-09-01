/**
 * LOS DOS USUARIOS — client-safe, y a propósito sin un solo import.
 *
 * Mismo patrón que `lib/marcas.ts` y `lib/piezasTipos.ts`: lo importa el
 * navegador, el servidor y el proxy (que corre en edge), así que no puede
 * arrastrar nada de Node detrás.
 *
 * ⚠️ ESTO NO ES AUTENTICACIÓN, Y NO PRETENDE SERLO.
 *
 * La contraseña del equipo sigue siendo UNA sola y compartida. Esto solo
 * responde "¿quién está escribiendo?" para poder firmar las ideas. Cualquiera
 * que tenga la clave puede decir que es el otro, y no se le puede quitar el
 * acceso a uno solo sin cambiársela a los dos.
 *
 * Es una limitación ELEGIDA por Santiago el 2026-08-21 sabiéndola, con la
 * recomendación contraria escrita al lado (una contraseña por persona). Entre
 * dos socios alcanza. **El gatillo para pasar a cuentas reales con Supabase
 * Auth es que entre una tercera persona** — no una fecha.
 *
 * Agregar a alguien = una línea aquí. Ninguna migración: `piezas.autor` es
 * texto libre en base justamente para que esta lista sea la única fuente.
 */

export const USUARIOS = [
  { id: 'santiago', nombre: 'Santiago', inicial: 'S' },
  { id: 'victor', nombre: 'Víctor', inicial: 'V' },
] as const

export type UsuarioId = (typeof USUARIOS)[number]['id']

/** La cookie es PROPIA y aparte de `dt_session`. Ver el comentario en `proxy.ts`. */
export const COOKIE_USUARIO = 'dt_usuario'

export function esUsuario(valor: unknown): valor is UsuarioId {
  return typeof valor === 'string' && USUARIOS.some((u) => u.id === valor)
}

/**
 * Nunca devuelve undefined para un id conocido; para lo demás devuelve null,
 * que es lo honesto: las 8 piezas de antes del 21-ago no tienen autor y
 * ponerles uno sería inventarlo.
 */
export function usuarioPorId(id: string | null | undefined) {
  return USUARIOS.find((u) => u.id === id) ?? null
}

/** Cómo se muestra un autor en pantalla. Un autor vacío se dice, no se esconde. */
export function nombreDeAutor(id: string | null | undefined): string {
  return usuarioPorId(id)?.nombre ?? '—'
}
