import { supabase } from '../supabaseClient'
import type { MarcaId } from '../marcas'
import type { IGMediaItem } from '../instagramTypes'

/**
 * Guarda un post con SU MARCA.
 *
 * El `marca_id` no era opcional por diseno: simplemente faltaba. Sin el, todos
 * los posts caian sin marca y "lo que ya funciono" quedaba vacio para las
 * marcas nuevas — justo el dato que hace que un guion no sea generico.
 */
export async function upsertPost(item: IGMediaItem, marca: MarcaId) {
  const { error } = await supabase.from('posts').upsert({
    id: item.id,
    marca_id: marca,
    plataforma: 'instagram',
    caption: item.caption ?? null,
    media_type: item.media_type,
    thumbnail_url: item.thumbnail_url ?? null,
    permalink: item.permalink,
    published_at: item.timestamp,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) throw new Error(`upsertPost ${item.id}: ${error.message}`)
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, metrics(*)')
    .order('published_at', { ascending: false })

  if (error) throw new Error(`getPosts: ${error.message}`)
  return data ?? []
}

/**
 * Guarda un video de TikTok como post.
 *
 * EL PREFIJO `tt_` NO ES COSMÉTICO: `posts.id` es la llave primaria y la
 * comparten las dos plataformas. Los ids de TikTok y los de Instagram son
 * numéricos y de longitud parecida; sin prefijo, una colisión pisaría un post
 * real de una marca con el de otra plataforma, en silencio y sin error.
 */
export async function upsertPostTikTok(
  video: {
    id: string
    title?: string
    video_description?: string
    cover_image_url?: string
    share_url?: string
    create_time?: number
  },
  marca: MarcaId
) {
  const id = `tt_${video.id}`

  const { error } = await supabase.from('posts').upsert({
    id,
    marca_id: marca,
    plataforma: 'tiktok',
    // TikTok separa título y descripción; el texto que de verdad se lee bajo el
    // video es la descripción. El título queda de respaldo.
    caption: video.video_description || video.title || null,
    media_type: 'VIDEO',
    thumbnail_url: video.cover_image_url ?? null,
    permalink: video.share_url ?? null,
    published_at: video.create_time
      ? new Date(video.create_time * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) throw new Error(`upsertPostTikTok ${id}: ${error.message}`)
  return id
}
