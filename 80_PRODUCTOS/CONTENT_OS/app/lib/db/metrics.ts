import { supabase } from '../supabaseClient'
import type { IGInsights } from '../instagramTypes'

export async function upsertMetrics(postId: string, insights: IGInsights) {
  const { error } = await supabase.from('metrics').upsert({
    post_id: postId,
    views: insights.views ?? 0,
    reach: insights.reach,
    likes: insights.likes,
    comments: insights.comments,
    shares: insights.shares,
    saves: insights.saves,
    avg_watch_time_ms: insights.avg_watch_time_ms ?? 0,
    engagement_rate: insights.engagement_rate ?? 0,
    captured_at: new Date().toISOString(),
  }, { onConflict: 'post_id' })

  if (error) throw new Error(`upsertMetrics ${postId}: ${error.message}`)
}

/**
 * Métricas de un video de TikTok.
 *
 * OJO CON `reach`: TikTok no lo expone y NO se inventa. Queda en 0 a propósito.
 * La métrica de alcance de TikTok es `views` — mezclarla con el `reach` de
 * Instagram produciría comparaciones falsas entre plataformas, que es
 * exactamente lo que el generador de guiones no debe leer.
 * Tampoco hay `saves`: la Display API no lo entrega.
 */
export async function upsertMetricsTikTok(
  postId: string,
  video: { view_count?: number; like_count?: number; comment_count?: number; share_count?: number }
) {
  const { error } = await supabase.from('metrics').upsert({
    post_id: postId,
    views: video.view_count ?? 0,
    reach: 0,
    likes: video.like_count ?? 0,
    comments: video.comment_count ?? 0,
    shares: video.share_count ?? 0,
    saves: 0,
    captured_at: new Date().toISOString(),
  }, { onConflict: 'post_id' })

  if (error) throw new Error(`upsertMetricsTikTok ${postId}: ${error.message}`)
}
