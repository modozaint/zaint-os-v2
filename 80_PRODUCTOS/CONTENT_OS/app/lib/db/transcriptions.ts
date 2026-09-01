import { supabase } from '../supabaseClient'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

export interface TranscriptionData {
  postId: string
  text: string               // texto limpio completo (para embedding)
  lines?: string[]           // texto dividido en oraciones (para UI)
  ai_insights?: string[]     // 3 insights del análisis IA
  improvement_points?: string[] // 3 puntos de mejora
  visual_analysis?: string   // descripción de frames del video
  duration_s?: number
  caption?: string           // para mejorar señal semántica del embedding
}

export async function upsertTranscription(data: TranscriptionData) {
  const { postId, text, lines, ai_insights, improvement_points, visual_analysis, duration_s, caption } = data

  // Combinar caption + transcripción + insights para mejor señal semántica
  const partsToEmbed = [
    caption ? `[CAPTION] ${caption}` : '',
    `[TRANSCRIPCIÓN] ${text}`,
    ai_insights?.length ? `[INSIGHTS] ${ai_insights.join(' ')}` : '',
  ].filter(Boolean).join('\n')

  const embedding = await getEmbedding(partsToEmbed)

  const { error } = await supabase.from('transcriptions').upsert({
    post_id: postId,
    platform: 'ig',
    text,
    lines: lines ?? null,
    ai_insights: ai_insights ?? null,
    improvement_points: improvement_points ?? null,
    visual_analysis: visual_analysis ?? null,
    duration_s: duration_s ?? 0,
    transcribed_at: new Date().toISOString(),
    embedding,
  }, { onConflict: 'post_id' })

  if (error) throw new Error(`upsertTranscription ${postId}: ${error.message}`)
}

export async function semanticSearch(query: string, topK = 5) {
  const embedding = await getEmbedding(query)

  const { data, error } = await supabase.rpc('search_transcriptions', {
    query_embedding: embedding,
    match_count: topK,
  })

  if (error) throw new Error(`semanticSearch: ${error.message}`)
  return data as { post_id: string; text: string; similarity: number }[]
}

export async function getTranscriptionByPostId(postId: string) {
  const { data, error } = await supabase
    .from('transcriptions')
    .select('text, lines, ai_insights, improvement_points, visual_analysis, duration_s')
    .eq('post_id', postId)
    .single()

  if (error) return null
  return data
}
