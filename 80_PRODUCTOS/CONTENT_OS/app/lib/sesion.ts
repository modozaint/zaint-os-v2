/**
 * LA SESIÓN — el token del equipo, escrito UNA vez.
 *
 * Este cálculo estaba duplicado en `app/api/auth/route.ts` y en `proxy.ts`.
 * Dos copias del mismo hash es exactamente la forma de que un día una cambie
 * y la otra no, y entonces el login "funciona" pero el proxy no reconoce la
 * cookie que él mismo acaba de emitir.
 *
 * Solo usa Web Crypto: corre igual en el edge (proxy) que en Node (rutas API).
 */

export const COOKIE_SESION = 'dt_session'

/**
 * `null` significa "no hay login configurado" (desarrollo local sin
 * DASHBOARD_PASSWORD), no "la clave está mal". Son cosas distintas y quien
 * llama tiene que poder distinguirlas.
 */
export async function tokenEsperado(): Promise<string | null> {
  const pw = process.env.DASHBOARD_PASSWORD
  if (!pw) return null
  return await tokenDe(pw)
}

export async function tokenDe(pw: string): Promise<string> {
  const data = new TextEncoder().encode(`dermatinta:${pw}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 30 días. La app se abre desde el celular en un turno: pedir clave cada día es fricción. */
export const DIAS_DE_SESION = 30
