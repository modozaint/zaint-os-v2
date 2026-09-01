import { supabase } from '../supabaseClient'
import type { MarcaId } from '../marcas'
import { refrescarToken, type TikTokTokens, type TikTokUser } from '../tiktokClient'

/**
 * Los tokens de OAuth viven en la base, no en variables de entorno.
 *
 * Razón concreta: el access_token de TikTok caduca a las 24 horas. Guardarlo en
 * Vercel obligaría a pegarlo a mano todos los días, y el sync amanecería roto
 * cada mañana sin que nadie tocara nada — el peor tipo de fallo, porque parece
 * que el sistema funciona hasta que se mira el dato.
 *
 * 🔒 La tabla `conexiones` tiene RLS activo y CERO políticas: solo la service
 *    key puede leerla. Con la clave publicable, esa tabla no existe.
 */

export type Plataforma = 'instagram' | 'tiktok'

export interface Conexion {
  marca_id: MarcaId
  plataforma: Plataforma
  open_id: string | null
  handle: string | null
  display_name: string | null
  access_token: string | null
  refresh_token: string | null
  expira_en: string | null
  refresh_expira_en: string | null
  scope: string | null
}

/** Margen de seguridad: se renueva antes de que caduque, no cuando ya falló. */
const MARGEN_MS = 5 * 60 * 1000

export async function guardarConexion(
  marca: MarcaId,
  plataforma: Plataforma,
  tokens: TikTokTokens,
  user?: TikTokUser
) {
  const ahora = Date.now()
  const { error } = await supabase.from('conexiones').upsert(
    {
      marca_id: marca,
      plataforma,
      open_id: tokens.open_id ?? user?.open_id ?? null,
      handle: user?.username ?? null,
      display_name: user?.display_name ?? null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expira_en: new Date(ahora + tokens.expires_in * 1000).toISOString(),
      refresh_expira_en: new Date(ahora + tokens.refresh_expires_in * 1000).toISOString(),
      scope: tokens.scope ?? null,
      actualizado: new Date().toISOString(),
    },
    { onConflict: 'marca_id,plataforma' }
  )

  if (error) throw new Error(`guardarConexion ${marca}/${plataforma}: ${error.message}`)
}

export async function getConexion(
  marca: MarcaId,
  plataforma: Plataforma
): Promise<Conexion | null> {
  const { data, error } = await supabase
    .from('conexiones')
    .select('*')
    .eq('marca_id', marca)
    .eq('plataforma', plataforma)
    .maybeSingle()

  if (error) throw new Error(`getConexion ${marca}/${plataforma}: ${error.message}`)
  return (data as Conexion) ?? null
}

/** Qué marcas tienen TikTok conectado de verdad. Para no pintar pantallas vacías. */
export async function marcasConectadas(plataforma: Plataforma): Promise<MarcaId[]> {
  const { data, error } = await supabase
    .from('conexiones')
    .select('marca_id')
    .eq('plataforma', plataforma)
    .not('access_token', 'is', null)

  if (error) throw new Error(`marcasConectadas ${plataforma}: ${error.message}`)
  return (data ?? []).map((f) => f.marca_id as MarcaId)
}

/**
 * Devuelve un access_token USABLE: si está por caducar, lo renueva y lo guarda
 * antes de devolverlo. Todo lo que llame a la API de TikTok debe pasar por acá
 * — es el único punto donde se decide si el token sirve.
 */
export async function tokenVigente(marca: MarcaId): Promise<string> {
  const conexion = await getConexion(marca, 'tiktok')
  if (!conexion?.access_token || !conexion.refresh_token) {
    throw new Error(`${marca} no tiene TikTok conectado`)
  }

  const expira = conexion.expira_en ? new Date(conexion.expira_en).getTime() : 0
  if (expira - Date.now() > MARGEN_MS) return conexion.access_token

  // El refresh_token dura un año. Si TAMBIÉN venció, no hay nada que renovar:
  // hay que volver a autorizar a mano, y decirlo claro en vez de fallar con un
  // 401 sin explicación.
  const refreshExpira = conexion.refresh_expira_en
    ? new Date(conexion.refresh_expira_en).getTime()
    : Infinity
  if (refreshExpira < Date.now()) {
    throw new Error(
      `La sesión de TikTok de ${marca} caducó del todo. Hay que volver a conectar la cuenta.`
    )
  }

  const nuevos = await refrescarToken(conexion.refresh_token)
  await guardarConexion(marca, 'tiktok', nuevos)
  return nuevos.access_token
}
