import fs from 'fs'
import os from 'os'
import path from 'path'
import type { IGMediaItem, IGInsights, IGCacheEntry } from './instagramTypes'
import { MARCA_IDS_OPERATIVAS, MARCA_DEFAULT, esMarca, type MarcaId } from './marcas'

// El único directorio escribible en serverless (Vercel) es el tmp del sistema
const CACHE_DIR = path.join(os.tmpdir(), 'instagram-cache')
const CACHE_HOURS_MEDIA = 6
const CACHE_HOURS_INSIGHTS = 24

// --- Cache helpers (fail-soft: un caché roto nunca debe tumbar la app) ---

function cachePath(key: string): string | null {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    return path.join(CACHE_DIR, `${key}.json`)
  } catch {
    return null
  }
}

function loadCache<T>(key: string, maxHours: number): T | null {
  const p = cachePath(key)
  if (!p) return null
  try {
    if (!fs.existsSync(p)) return null
    const entry: IGCacheEntry<T> = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const ageH = (Date.now() - new Date(entry.cached_at).getTime()) / 3_600_000
    return ageH > maxHours ? null : entry.payload
  } catch {
    return null
  }
}

function saveCache<T>(key: string, payload: T): void {
  const p = cachePath(key)
  if (!p) return
  try {
    fs.writeFileSync(p, JSON.stringify({ cached_at: new Date().toISOString(), payload }, null, 2))
  } catch {
    // sin caché — seguimos con datos en vivo
  }
}

// --- API ---

// La lista de marcas vive en `lib/marcas.ts` — ahí y en ningún otro lado.
// Se re-exporta desde aquí porque hay código que ya la importaba de este
// módulo, y romper esos imports no aporta nada.
export { MARCA_DEFAULT, esMarca }
export type { MarcaId }

/**
 * Las credenciales de una marca: un token y el id de su cuenta de Instagram.
 *
 * 🔑 UN token sirve para VARIAS cuentas. Verificado el 2026-08-16 pidiendo
 * media e insights de @dermatinta y @houseofkaizen con el mismo: mientras el
 * mismo usuario de Facebook administre las dos y el permiso se haya dado sobre
 * ambas al iniciar sesión, alcanza uno solo. Por eso `INSTAGRAM_ACCESS_TOKEN`
 * es el compartido y `IG_<MARCA>_TOKEN` existe solo por si alguna cuenta algún
 * día cuelga de otro usuario.
 *
 * Lo que SÍ cambia por marca siempre es el `user_id`: es la cuenta misma.
 * Por eso una marca sin `IG_<MARCA>_USER_ID` cuenta como no conectada, aunque
 * haya token — y así MODOZAINT no finge estar lista.
 */
function getCredentials(marca: MarcaId = MARCA_DEFAULT): { token: string; userId: string } | null {
  const sufijo = marca.toUpperCase()
  const token = process.env[`IG_${sufijo}_TOKEN`] || process.env.INSTAGRAM_ACCESS_TOKEN
  let userId = process.env[`IG_${sufijo}_USER_ID`]

  // El .env viejo no tenía variables por marca y su única cuenta era la de
  // Dermatinta. Se respeta para no romper nada que ya funcionaba.
  if (!userId && marca === MARCA_DEFAULT) userId = process.env.INSTAGRAM_USER_ID

  if (!token || !userId) return null
  return { token, userId }
}

/**
 * ¿Esta marca tiene credenciales?
 *
 * Hay que preguntarlo ANTES de pedir datos, porque sin token las funciones de
 * abajo devuelven vacío (`[]`, `0`) para no tumbar la app — y una pantalla de
 * ceros se lee como "esta marca no tuvo alcance", que es falso. La diferencia
 * entre "cero" y "sin conectar" tiene que verse.
 */
export function marcaConfigurada(marca: MarcaId): boolean {
  return getCredentials(marca) !== null
}

// Qué marcas tienen credenciales de verdad. Sirve para no pintar en la UI
// un selector con marcas que van a devolver vacío.
export function marcasConfiguradas(): MarcaId[] {
  // Aunque queden variables antiguas en Vercel, no se sincronizan otras
  // cuentas: el Content OS opera solamente MODOZAINT.
  return MARCA_IDS_OPERATIVAS.filter((m) => getCredentials(m) !== null)
}

// Insights por video
async function getIGInsights(mediaId: string, token: string, forceRefresh = false): Promise<IGInsights> {
  if (!forceRefresh) {
    const cached = loadCache<IGInsights>(`insights_${mediaId}`, CACHE_HOURS_INSIGHTS)
    if (cached) return cached
  }

  const metrics = 'views,reach,likes,comments,shares,saved,ig_reels_avg_watch_time'
  const url = `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${metrics}&access_token=${token}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.error) {
    return { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
  }

  const getValue = (name: string) =>
    data.data?.find((d: { name: string }) => d.name === name)?.values?.[0]?.value ?? 0

  const views = getValue('views')
  const reach = getValue('reach')
  const likes = getValue('likes')
  const comments = getValue('comments')
  const shares = getValue('shares')
  const saves = getValue('saved')
  const avg_watch_time_ms = getValue('ig_reels_avg_watch_time')
  const engagement_rate = reach > 0 ? (likes + comments + shares + saves) / reach : 0

  const insights: IGInsights = { views, reach, likes, comments, shares, saves, avg_watch_time_ms, engagement_rate }
  saveCache(`insights_${mediaId}`, insights)
  return insights
}

// Obtiene lista de media con insights — fetch paginado, sin límite de 50
export async function getIGMedia(
  forceRefresh = false,
  marca: MarcaId = MARCA_DEFAULT
): Promise<IGMediaItem[]> {
  // La clave del caché lleva la marca. Sin esto, la primera marca que se
  // consulte deja su caché y las otras dos leen SUS datos como propios.
  const cacheKey = `media_list_${marca}`
  if (!forceRefresh) {
    const cached = loadCache<IGMediaItem[]>(cacheKey, CACHE_HOURS_MEDIA)
    if (cached) return cached
  }

  const creds = getCredentials(marca)
  if (!creds) return []
  const { token, userId } = creds
  const fields = 'id,caption,media_type,thumbnail_url,permalink,timestamp,video_duration'
  const allItems: IGMediaItem[] = []

  // Fetch paginado — itera todas las páginas hasta que no haya "next"
  let url: string | null =
    `https://graph.facebook.com/v21.0/${userId}/media?fields=${fields}&limit=50&access_token=${token}`

  while (url) {
    const currentUrl: string = url
    const res = await fetch(currentUrl)
    const data = await res.json()
    if (data.error) throw new Error(`IG API: ${data.error.message}`)

    const page = (data.data ?? []).filter(
      (m: IGMediaItem) => m.media_type === 'VIDEO' || m.media_type === 'REEL'
    )
    allItems.push(...page)

    url = data.paging?.next ?? null
  }

  const withInsights = await Promise.all(
    allItems.map(async (item: IGMediaItem) => ({
      ...item,
      insights: await getIGInsights(item.id, token, forceRefresh),
    }))
  )

  saveCache(cacheKey, withInsights)
  return withInsights
}

// Seguidores actuales — cache 6h
export async function getFollowerCount(marca: MarcaId = MARCA_DEFAULT): Promise<number> {
  const cacheKey = `follower_count_${marca}`
  const cached = loadCache<number>(cacheKey, 6)
  if (cached !== null) return cached

  const creds = getCredentials(marca)
  if (!creds) return 0
  const { token, userId } = creds
  const url = `https://graph.facebook.com/v21.0/${userId}?fields=followers_count&access_token=${token}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) return 0
  const count = data.followers_count ?? 0
  saveCache(cacheKey, count)
  return count
}

// media_url fresca — NUNCA cachear, expira ~1h
export async function getIGMediaUrl(mediaId: string, marca: MarcaId = MARCA_DEFAULT): Promise<string> {
  const creds = getCredentials(marca)
  if (!creds) throw new Error(`Sin credenciales de Instagram para la marca "${marca}"`)
  const { token } = creds
  const url = `https://graph.facebook.com/v21.0/${mediaId}?fields=media_url&access_token=${token}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`IG API: ${data.error.message}`)
  if (!data.media_url) throw new Error(`No media_url disponible para ${mediaId}`)
  return data.media_url
}
