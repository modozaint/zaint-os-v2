/**
 * Cliente de la Display API de TikTok.
 *
 * POR QUÉ NO SE PARECE AL DE INSTAGRAM
 * El token de Instagram dura 60 días y vive en una variable de entorno. El de
 * TikTok dura 24 HORAS. Un valor que caduca todos los días no puede vivir en la
 * configuración de Vercel — nadie lo va a pegar a mano cada mañana. Por eso acá
 * hay OAuth de verdad: los tokens se guardan en la tabla `conexiones` y se
 * refrescan solos antes de cada llamada.
 *
 * Verificado contra la documentación oficial el 2026-08-19:
 *   - access_token  → 86.400 s  (24 h)
 *   - refresh_token → 31.536.000 s (1 año)
 *   - el Video Object SÍ trae view_count, like_count, comment_count y share_count
 *     (no hace falta la Research API, que es solo para instituciones)
 */

const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const USER_URL = 'https://open.tiktokapis.com/v2/user/info/'
const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/'

// user.info.basic  → open_id, avatar
// user.info.profile→ username (el @ real)
// user.info.stats  → follower_count, likes_count, video_count
// video.list       → los videos con sus métricas
export const TIKTOK_SCOPES = 'user.info.basic,user.info.profile,user.info.stats,video.list'

const VIDEO_FIELDS = [
  'id', 'title', 'video_description', 'duration', 'cover_image_url',
  'share_url', 'create_time',
  'like_count', 'comment_count', 'share_count', 'view_count',
].join(',')

const USER_FIELDS = [
  'open_id', 'union_id', 'avatar_url', 'display_name', 'username',
  'follower_count', 'following_count', 'likes_count', 'video_count',
].join(',')

export interface TikTokVideo {
  id: string
  title?: string
  video_description?: string
  duration?: number
  cover_image_url?: string
  share_url?: string
  create_time?: number
  like_count?: number
  comment_count?: number
  share_count?: number
  view_count?: number
}

export interface TikTokUser {
  open_id: string
  username?: string
  display_name?: string
  avatar_url?: string
  follower_count?: number
  likes_count?: number
  video_count?: number
}

export interface TikTokTokens {
  access_token: string
  refresh_token: string
  open_id: string
  scope: string
  expires_in: number
  refresh_expires_in: number
}

function credenciales() {
  // .trim() no es paranoia: al copiar una credencial del panel de TikTok y
  // pegarla en Vercel se arrastra un espacio o un salto de linea con una
  // facilidad enorme, y ese caracter es INVISIBLE en los dos paneles. TikTok
  // entonces responde "corrige lo siguiente: client_key" sin decir que lo que
  // llego venia con basura pegada, y se pierde media hora buscando en el lugar
  // equivocado.
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim()
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim()
  if (!clientKey || !clientSecret) return null
  return { clientKey, clientSecret }
}

/** ¿Está la app de TikTok configurada? Sirve para no pintar botones muertos. */
export function tiktokConfigurado(): boolean {
  return credenciales() !== null
}

/**
 * La URL de redirección tiene que coincidir EXACTAMENTE con la registrada en
 * TikTok for Developers, carácter por carácter. Es la causa número uno de
 * "redirect_uri mismatch", así que se calcula en un solo sitio.
 */
export function redirectUri(): string {
  if (process.env.TIKTOK_REDIRECT_URI) return process.env.TIKTOK_REDIRECT_URI

  const origen = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'
  return `${origen}/api/tiktok/callback`
}

/** Paso 1 del OAuth: a dónde mandamos al navegador. */
export function urlDeAutorizacion(state: string): string {
  const creds = credenciales()
  if (!creds) throw new Error('Falta TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET')

  const params = new URLSearchParams({
    client_key: creds.clientKey,
    scope: TIKTOK_SCOPES,
    response_type: 'code',
    redirect_uri: redirectUri(),
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

async function pedirTokens(body: Record<string, string>): Promise<TikTokTokens> {
  const creds = credenciales()
  if (!creds) throw new Error('Falta TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: creds.clientKey,
      client_secret: creds.clientSecret,
      ...body,
    }),
  })

  const data = await res.json()
  if (data.error || !data.access_token) {
    throw new Error(
      `TikTok OAuth: ${data.error ?? 'sin access_token'} — ${data.error_description ?? ''}`.trim()
    )
  }
  return data as TikTokTokens
}

/** Paso 2: el `code` que devuelve TikTok se cambia por tokens. */
export function canjearCodigo(code: string): Promise<TikTokTokens> {
  // TikTok devuelve el code URL-encoded y a veces con un '*' al final; si se
  // manda tal cual, el canje falla con un error que no dice por qué.
  const limpio = decodeURIComponent(code).replace(/\*$/, '')
  return pedirTokens({
    code: limpio,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(),
  })
}

/** Renueva el access_token con el refresh_token. Se llama solo, antes de expirar. */
export function refrescarToken(refreshToken: string): Promise<TikTokTokens> {
  return pedirTokens({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
}

export async function getTikTokUser(accessToken: string): Promise<TikTokUser> {
  const res = await fetch(`${USER_URL}?fields=${USER_FIELDS}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (data.error?.code && data.error.code !== 'ok') {
    throw new Error(`TikTok user/info: ${data.error.code} — ${data.error.message ?? ''}`)
  }
  return data.data?.user as TikTokUser
}

/**
 * Trae los videos de la cuenta, paginando.
 *
 * El máximo por página es 20 (lo dice la doc), así que pedir más en una sola
 * llamada no sirve de nada: hay que recorrer el cursor.
 */
export async function getTikTokVideos(
  accessToken: string,
  maximo = 60
): Promise<TikTokVideo[]> {
  const videos: TikTokVideo[] = []
  let cursor: number | undefined
  let hayMas = true

  while (hayMas && videos.length < maximo) {
    const res = await fetch(`${VIDEO_LIST_URL}?fields=${VIDEO_FIELDS}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }),
    })

    const data = await res.json()
    if (data.error?.code && data.error.code !== 'ok') {
      throw new Error(`TikTok video/list: ${data.error.code} — ${data.error.message ?? ''}`)
    }

    videos.push(...((data.data?.videos ?? []) as TikTokVideo[]))
    hayMas = Boolean(data.data?.has_more)
    cursor = data.data?.cursor

    // Sin cursor no se puede avanzar: cortar en vez de repetir la misma página.
    if (!cursor) break
  }

  return videos.slice(0, maximo)
}
