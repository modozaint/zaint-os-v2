import { NextResponse } from 'next/server'
import { getTikTokVideos } from '@/lib/tiktokClient'
import { marcasConectadas, tokenVigente } from '@/lib/db/conexiones'
import { upsertPostTikTok } from '@/lib/db/posts'
import { upsertMetricsTikTok } from '@/lib/db/metrics'

/**
 * Baja los videos de TikTok de TODAS las marcas conectadas.
 *
 * Va aparte del sync de Instagram por una razón práctica: si una marca no tiene
 * TikTok conectado, o su token murió, eso no puede tumbar la sincronización de
 * Instagram, que hoy es la que trae los 35 posts que alimentan los guiones.
 * Cada marca falla sola y se reporta sola.
 */
export async function POST() {
  try {
    const marcas = await marcasConectadas('tiktok')

    if (marcas.length === 0) {
      return NextResponse.json({
        ok: true,
        total: 0,
        porMarca: {},
        aviso: 'Ninguna marca tiene TikTok conectado todavía.',
      })
    }

    const porMarca: Record<string, number> = {}
    const fallos: Record<string, string> = {}
    let synced = 0

    for (const marca of marcas) {
      try {
        const token = await tokenVigente(marca)
        const videos = await getTikTokVideos(token)
        porMarca[marca] = videos.length

        for (const video of videos) {
          const postId = await upsertPostTikTok(video, marca)
          await upsertMetricsTikTok(postId, video)
          synced++
        }
      } catch (err) {
        // Una marca caída no arrastra a las demás.
        fallos[marca] = err instanceof Error ? err.message : String(err)
      }
    }

    return NextResponse.json({
      ok: true,
      synced,
      porMarca,
      ...(Object.keys(fallos).length ? { fallos } : {}),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
