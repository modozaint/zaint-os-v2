import { supabase } from './supabaseClient'
import type { MarcaId } from './instagramClient'

/**
 * BANCO DE REFERENTES — perfiles que se estudian.
 *
 * NO son los videos de inspiración: esos llegan por la skill /video y viven
 * en VIDEOTECA/ del vault. Un perfil se sigue en el tiempo (cómo evoluciona,
 * qué le funciona); un video se destila una vez y se cierra.
 *
 * El campo que hace útil esta tabla es `que_tomar`: guarda la INSTRUCCIÓN,
 * no la referencia. "El corte del segundo 3", no "me gusta esta cuenta".
 * Sin eso, esto es un tablero de favoritos y no un insumo para escribir.
 */

export type Plataforma = 'ig' | 'tiktok' | 'yt'

export type CategoriaReferente =
  | 'hook'
  | 'edicion'
  | 'formato'
  | 'posicionamiento'
  | 'arte'
  | 'oferta'

export interface Referente {
  id: string
  handle: string
  plataforma: Plataforma
  marca_id: MarcaId | null
  que_tomar: string
  por_que: string | null
  categoria: CategoriaReferente | null
  url: string | null
  seguidores: number | null
  ultima_revision: string | null
  created_at: string
}

export interface ReferenteNuevo {
  handle: string
  plataforma?: Plataforma
  marca_id?: MarcaId | null
  que_tomar: string
  por_que?: string
  categoria?: CategoriaReferente
  url?: string
  seguidores?: number
}

/** Normaliza el handle: acepta '@cuenta', 'cuenta' o la URL del perfil. */
export function normalizarHandle(entrada: string): string {
  const limpio = entrada.trim()
  const desdeUrl = limpio.match(
    /(?:instagram\.com|tiktok\.com|youtube\.com)\/@?([A-Za-z0-9._-]+)/i
  )
  const base = desdeUrl ? desdeUrl[1] : limpio.replace(/^@/, '')
  return base.replace(/\/+$/, '').toLowerCase()
}

/** Deduce la plataforma desde una URL. Si no se puede, devuelve null. */
export function plataformaDesdeUrl(url: string): Plataforma | null {
  if (/instagram\.com/i.test(url)) return 'ig'
  if (/tiktok\.com/i.test(url)) return 'tiktok'
  if (/youtube\.com|youtu\.be/i.test(url)) return 'yt'
  return null
}

export async function listarReferentes(marca?: MarcaId): Promise<Referente[]> {
  let q = supabase.from('referentes').select('*').order('created_at', { ascending: false })
  if (marca) q = q.eq('marca_id', marca)
  const { data, error } = await q
  if (error) throw new Error(`No se pudieron leer los referentes: ${error.message}`)
  return (data ?? []) as Referente[]
}

export async function crearReferente(r: ReferenteNuevo): Promise<Referente> {
  const handle = normalizarHandle(r.handle)
  if (!handle) throw new Error('El handle no puede estar vacío')
  // que_tomar es obligatorio a propósito: un referente sin instrucción de
  // qué tomar no sirve para nada, y es justo lo que se olvida al guardar.
  if (!r.que_tomar?.trim()) {
    throw new Error('Falta "qué tomar": sin eso el referente no es un insumo, es un favorito')
  }

  const fila = {
    handle,
    plataforma: r.plataforma ?? (r.url ? plataformaDesdeUrl(r.url) ?? 'ig' : 'ig'),
    marca_id: r.marca_id ?? null,
    que_tomar: r.que_tomar.trim(),
    por_que: r.por_que?.trim() || null,
    categoria: r.categoria ?? null,
    url: r.url?.trim() || null,
    seguidores: r.seguidores ?? null,
  }

  const { data, error } = await supabase.from('referentes').insert(fila).select().single()
  if (error) {
    if (error.code === '23505') {
      throw new Error(`"${handle}" ya está guardado como referente de esa marca`)
    }
    throw new Error(`No se pudo guardar: ${error.message}`)
  }
  return data as Referente
}

export async function actualizarReferente(
  id: string,
  cambios: Partial<ReferenteNuevo>
): Promise<void> {
  const { error } = await supabase.from('referentes').update(cambios).eq('id', id)
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`)
}

export async function borrarReferente(id: string): Promise<void> {
  const { error } = await supabase.from('referentes').delete().eq('id', id)
  if (error) throw new Error(`No se pudo borrar: ${error.message}`)
}

/** Marca que un referente se usó en una pieza. Cierra el ciclo. */
export async function registrarUso(
  referenteId: string,
  postId: string | null,
  nota?: string
): Promise<void> {
  const { error } = await supabase
    .from('referente_usos')
    .insert({ referente_id: referenteId, post_id: postId, nota: nota?.trim() || null })
  if (error) throw new Error(`No se pudo registrar el uso: ${error.message}`)
}

/**
 * Cuántas piezas salieron de cada referente.
 * Es lo que separa un banco vivo de un cementerio de favoritos: un
 * referente con 0 usos lleva meses ahí sin haber producido nada.
 */
export async function usosPorReferente(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('referente_usos').select('referente_id')
  if (error) return {}
  const conteo: Record<string, number> = {}
  for (const fila of data ?? []) {
    const id = (fila as { referente_id: string }).referente_id
    conteo[id] = (conteo[id] ?? 0) + 1
  }
  return conteo
}
