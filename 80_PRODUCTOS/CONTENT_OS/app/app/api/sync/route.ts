import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getIGMedia, marcasConfiguradas } from '@/lib/instagramClient'
import type { MarcaId } from '@/lib/marcas'
import { cleanTranscription } from '@/lib/transcriptionCleaner'
import { upsertPost } from '@/lib/db/posts'
import { upsertMetrics } from '@/lib/db/metrics'
import { upsertTranscription } from '@/lib/db/transcriptions'

interface TranscriptionCache {
  lines?: string[]
  ai_insights?: string[]
  improvement_points?: string[]
  visual_analysis?: string
  duration_s?: number
}

function getCachedAnalysis(mediaId: string): TranscriptionCache | null {
  try {
    // Los archivos se guardan como {id}.json (sin prefijo ig_)
    const p = path.resolve(process.cwd(), `data/transcriptions/${mediaId}.json`)
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Trae TODAS las marcas conectadas, no solo la primera.
 *
 * Antes llamaba a getIGMedia() sin marca, asi que siempre bajaba Dermatinta.
 * MODOZAINT y Kaizen quedaban con cero posts en la base — y eso deja al
 * generador de guiones sin "lo que ya funciono" justo en las marcas donde mas
 * falta hace.
 */
export async function POST() {
  try {
    const marcas = marcasConfiguradas()
    let synced = 0, withEmbeddings = 0, errors = 0
    let total = 0
    const porMarca: Record<string, number> = {}

    for (const marca of marcas) {
    const media = await getIGMedia(true, marca)
    total += media.length
    porMarca[marca] = media.length

    for (const item of media) {
      try {
        // 1. Upsert post
        await upsertPost(item, marca as MarcaId)

        // 2. Upsert métricas
        if (item.insights) {
          await upsertMetrics(item.id, item.insights)
        }

        // 3. Si hay análisis completo en cache → limpiar texto, embeber y guardar todo en Supabase
        const cached = getCachedAnalysis(item.id)
        if (cached?.lines?.length) {
          const rawText = cached.lines.join(' ')
          const cleanedText = await cleanTranscription(rawText)

          await upsertTranscription({
            postId: item.id,
            text: cleanedText,
            lines: cached.lines,
            ai_insights: cached.ai_insights,
            improvement_points: cached.improvement_points,
            visual_analysis: cached.visual_analysis,
            duration_s: cached.duration_s,
            caption: item.caption,
          })
          withEmbeddings++
        }

        synced++
      } catch (err) {
        console.error(`Error sincronizando ${item.id}:`, err)
        errors++
      }
    }
    }

    return NextResponse.json({
      ok: true,
      total,
      porMarca,
      synced,
      withEmbeddings,
      errors,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
