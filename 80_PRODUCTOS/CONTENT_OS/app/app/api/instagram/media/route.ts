import { NextRequest, NextResponse } from 'next/server'
import { getIGMedia, marcaConfigurada } from '@/lib/instagramClient'
import { marcaDesdeParam } from '@/lib/marcas'
import type { IGMediaItem, IGReelData } from '@/lib/instagramTypes'

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDate(timestamp: string): string {
  const d = new Date(timestamp)
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

interface Averages {
  reach: number
  saves: number
  engagement_rate: number
  avg_watch_time_s: number
}

function computeAverages(items: IGMediaItem[]): Averages {
  if (items.length === 0) return { reach: 0, saves: 0, engagement_rate: 0, avg_watch_time_s: 0 }
  const sum = items.reduce(
    (acc, item) => ({
      reach: acc.reach + (item.insights?.reach ?? 0),
      saves: acc.saves + (item.insights?.saves ?? 0),
      engagement_rate: acc.engagement_rate + (item.insights?.engagement_rate ?? 0),
      avg_watch_time_s: acc.avg_watch_time_s + ((item.insights?.avg_watch_time_ms ?? 0) / 1000),
    }),
    { reach: 0, saves: 0, engagement_rate: 0, avg_watch_time_s: 0 }
  )
  return {
    reach: sum.reach / items.length,
    saves: sum.saves / items.length,
    engagement_rate: sum.engagement_rate / items.length,
    avg_watch_time_s: sum.avg_watch_time_s / items.length,
  }
}

function delta(value: number, avg: number): number {
  if (avg === 0) return 0
  return Math.round(((value - avg) / avg) * 100)
}

function toReelData(item: IGMediaItem, avg: Averages): IGReelData {
  const ins = item.insights
  const avg_watch_time_s = (ins?.avg_watch_time_ms ?? 0) / 1000

  return {
    id: item.id,
    thumbnail: item.thumbnail_url ?? '',
    caption: item.caption ?? '',
    date: formatDate(item.timestamp),
    permalink: item.permalink,
    metrics: {
      views: ins?.views ?? 0,
      reach: ins?.reach ?? 0,
      likes: ins?.likes ?? 0,
      comments: ins?.comments ?? 0,
      shares: ins?.shares ?? 0,
      saves: ins?.saves ?? 0,
      avg_watch_time_s,
      duration_s: item.video_duration ?? 0,
      engagement_rate: ins?.engagement_rate ?? 0,
    },
    avg_comparison: [
      { metric: 'Reach', delta: delta(ins?.reach ?? 0, avg.reach) },
      { metric: 'Saves', delta: delta(ins?.saves ?? 0, avg.saves) },
      { metric: 'Engagement', delta: delta(ins?.engagement_rate ?? 0, avg.engagement_rate) },
      { metric: 'Watch time', delta: delta(avg_watch_time_s, avg.avg_watch_time_s) },
    ],
    transcription: [],
    ai_insights: [],
    improvement_points: [],
    transcribed: false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === '1'
    const marca = marcaDesdeParam(request.nextUrl.searchParams.get('marca') ?? undefined)
    // Distinguir "sin conectar" de "sin reels": la lista vacía se ve igual
    // en pantalla y significan cosas muy distintas.
    if (!marcaConfigurada(marca)) {
      return NextResponse.json({ reels: [], sinConectar: true })
    }
    const media = await getIGMedia(refresh, marca)
    const avg = computeAverages(media)
    const reels: IGReelData[] = media.map((item) => toReelData(item, avg))
    return NextResponse.json({ reels })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
