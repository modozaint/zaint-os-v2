import { NextRequest, NextResponse } from 'next/server'
import { getIGMediaUrl } from '@/lib/instagramClient'
import { upsertTranscription } from '@/lib/db/transcriptions'
import { cleanTranscription } from '@/lib/transcriptionCleaner'
import { supabase } from '@/lib/supabaseClient'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { MODELO_RAZONAMIENTO } from '@/lib/modelosGroq'

const execFileAsync = promisify(execFile)

const CACHE_DIR = '/tmp/transcriptions'
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const FFMPEG_PATH = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg'

interface TranscriptionResult {
  lines: string[]
  ai_insights: string[]
  improvement_points: string[]
  visual_analysis: string
  duration_s: number
}

// Extrae la duración real del MP4 parseando el box mvhd del moov atom.
// No necesita librerías externas — usa solo el ArrayBuffer del video ya descargado.
function getMp4Duration(buffer: ArrayBuffer): number {
  const data = new Uint8Array(buffer)
  const view = new DataView(buffer)

  for (let i = 4; i < data.length - 32; i++) {
    // Buscar el box 'mvhd' (0x6d766864)
    if (
      data[i] === 0x6d && data[i + 1] === 0x76 &&
      data[i + 2] === 0x68 && data[i + 3] === 0x64
    ) {
      const version = data[i + 4]
      if (version === 0) {
        // creation_time(4) + modification_time(4) + timescale(4) + duration(4)
        const timescale = view.getUint32(i + 12, false)
        const duration = view.getUint32(i + 16, false)
        if (timescale > 0 && duration > 0) return Math.round(duration / timescale)
      } else if (version === 1) {
        // creation_time(8) + modification_time(8) + timescale(4) + duration(8)
        const timescale = view.getUint32(i + 24, false)
        const durationHigh = view.getUint32(i + 28, false)
        const durationLow = view.getUint32(i + 32, false)
        const duration = durationHigh * 0x100000000 + durationLow
        if (timescale > 0 && duration > 0) return Math.round(duration / timescale)
      }
    }
  }
  return 0
}

function cachePath(mediaId: string): string {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  return path.join(CACHE_DIR, `${mediaId}.json`)
}

function loadCache(mediaId: string): TranscriptionResult | null {
  const p = cachePath(mediaId)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}

function saveCache(mediaId: string, result: TranscriptionResult): void {
  fs.writeFileSync(cachePath(mediaId), JSON.stringify(result, null, 2))
}

function splitIntoLines(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

async function transcribeWithGroq(videoBuffer: ArrayBuffer, filename: string): Promise<string> {
  // Los 5xx de Groq (502 Bad Gateway) son transitorios — reintentar hasta 2 veces
  let lastError = ''
  for (let attempt = 1; attempt <= 3; attempt++) {
    const formData = new FormData()
    const blob = new Blob([videoBuffer], { type: 'video/mp4' })
    formData.append('file', blob, filename)
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('language', 'es')
    formData.append('response_format', 'text')

    const res = await fetch(GROQ_WHISPER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    })

    if (res.ok) return res.text()

    lastError = await res.text()
    if (res.status < 500) break // 4xx no se arregla reintentando
    await new Promise((r) => setTimeout(r, 2000 * attempt))
  }
  throw new Error(`Groq Whisper error: ${lastError}`)
}

// Extrae 3 frames del video (inicio ~10%, mitad 50%, final ~90%) y los devuelve como base64.
// Escribe el buffer a un archivo temporal, corre ffmpeg, limpia todo al final.
async function extractFrames(videoBuffer: ArrayBuffer, duration_s: number, mediaId: string): Promise<string[]> {
  const tmpDir = os.tmpdir()
  const videoPath = path.join(tmpDir, `${mediaId}_tmp.mp4`)
  const framePaths = [0, 1, 2].map(i => path.join(tmpDir, `${mediaId}_frame${i}.jpg`))
  const effectiveDuration = duration_s > 0 ? duration_s : 30

  const timestamps = [
    effectiveDuration * 0.1,
    effectiveDuration * 0.5,
    effectiveDuration * 0.9,
  ]

  try {
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer))

    await Promise.all(
      timestamps.map((ts, i) =>
        execFileAsync(FFMPEG_PATH, [
          '-ss', ts.toFixed(2),
          '-i', videoPath,
          '-vframes', '1',
          '-q:v', '3',
          '-y',
          framePaths[i],
        ])
      )
    )

    return framePaths
      .filter(p => fs.existsSync(p))
      .map(p => fs.readFileSync(p).toString('base64'))
  } catch {
    return []
  } finally {
    [videoPath, ...framePaths].forEach(p => { try { fs.unlinkSync(p) } catch {} })
  }
}

// Envía los 3 frames al modelo de visión de Groq y devuelve una descripción visual del reel.
async function describeFramesWithGroq(frames: string[]): Promise<string> {
  if (frames.length === 0) return ''

  const imageContent = frames.map(base64 => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${base64}` },
  }))

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `Estas son ${frames.length} capturas de un Reel de Instagram: la primera es del inicio, la segunda del medio, la tercera del final.\n\nDescribí brevemente qué se ve en cada una: persona(s), texto en pantalla, entorno, elementos visuales clave. Sé conciso (1-2 oraciones por fotograma). Respondé en español EXACTAMENTE con este formato (sin texto extra antes ni después):\nFrame inicial: "..."\nFrame medio: "..."\nFrame final: "..."`,
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    }),
  })

  if (!res.ok) return ''
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

interface ReelMetrics {
  reach: number
  likes: number
  saves: number
  comments: number
  shares: number
  engagement_rate: number
  avg_comparison: { metric: string; delta: number }[]
}

function formatMetricsForPrompt(metrics: ReelMetrics): string {
  const er = (metrics.engagement_rate * 100).toFixed(2)
  const lines = [
    `- Reach: ${metrics.reach.toLocaleString('es-AR')}`,
    `- Likes: ${metrics.likes.toLocaleString('es-AR')}`,
    `- Saves: ${metrics.saves.toLocaleString('es-AR')}`,
    `- Comments: ${metrics.comments.toLocaleString('es-AR')}`,
    `- Shares: ${metrics.shares.toLocaleString('es-AR')}`,
    `- Engagement Rate: ${er}%`,
  ]
  if (metrics.avg_comparison?.length) {
    lines.push('\nVs. promedio de los últimos reels:')
    for (const { metric, delta } of metrics.avg_comparison) {
      const sign = delta > 0 ? '+' : ''
      lines.push(`  - ${metric}: ${sign}${delta}%`)
    }
  }
  return lines.join('\n')
}

async function analyzeWithGroq(
  transcript: string,
  metrics: ReelMetrics | null,
  frameDescriptions: string,
): Promise<{ ai_insights: string[]; improvement_points: string[] }> {
  const metricsSection = metrics
    ? `\nMétricas de rendimiento del Reel:\n${formatMetricsForPrompt(metrics)}\n`
    : ''

  const visualSection = frameDescriptions
    ? `\nContexto visual (fotogramas del video):\n${frameDescriptions}\n`
    : ''

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELO_RAZONAMIENTO,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Sos un estratega de contenido especializado en Reels de Instagram. Analizás el script del audio, las métricas de rendimiento y el contexto visual del video para dar insights accionables.

Reglas estrictas:
- Si la transcripción está vacía o tiene menos de 10 palabras, devolvé listas vacías.
- Los insights deben conectar lo que se dice en el script, lo que se ve en el video y los números: ¿qué del guión o el contenido puede explicar el alto/bajo reach, saves o engagement?
- Los puntos de mejora son SOLO sobre el guión/narrativa/estructura del audio — nunca sobre visuals, gráficos, música ni transiciones.
- Citá palabras o frases concretas del script cuando sea relevante.
- Evitá generalidades. Sé quirúrgico y específico.
- Respondé SOLO en JSON válido con las claves "ai_insights" y "improvement_points", cada una con exactamente 3 strings en español.`,
        },
        {
          role: 'user',
          content: `${metricsSection}${visualSection}
Transcripción del Reel:
"""
${transcript || "(sin audio detectado)"}
"""

Analizá el contenido en base a todos los datos disponibles y respondé en JSON: { "ai_insights": ["...", "...", "..."], "improvement_points": ["...", "...", "..."] }`,
        },
      ],
      temperature: 0.4,
      // Los modelos gpt-oss escriben razonamiento ANTES del JSON, y ese
      // razonamiento cuenta como tokens de salida. Con 900 se lo comia entero
      // y moria con "max completion tokens reached before generating valid
      // document" — el JSON nunca llegaba a cerrar. Con margen, cierra.
      max_tokens: 4000,
      // Y se le pide que razone poco: este analisis no lo necesita.
      reasoning_effort: 'low',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq LLaMA error: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(content)
    return {
      ai_insights: Array.isArray(parsed.ai_insights) ? parsed.ai_insights.slice(0, 3) : [],
      improvement_points: Array.isArray(parsed.improvement_points) ? parsed.improvement_points.slice(0, 3) : [],
    }
  } catch {
    return { ai_insights: [], improvement_points: [] }
  }
}

export async function GET(request: NextRequest) {
  const mediaId = request.nextUrl.searchParams.get('id')
  if (!mediaId) {
    return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
  }

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_NOT_CONFIGURED' }, { status: 400 })
  }

  const metricsRaw = request.nextUrl.searchParams.get('metrics')
  let metrics: ReelMetrics | null = null
  if (metricsRaw) {
    try { metrics = JSON.parse(metricsRaw) } catch { /* ignorar si viene malformado */ }
  }

  try {
    const cached = loadCache(mediaId)
    if (cached) {
      return NextResponse.json(cached)
    }
    const mediaUrl = await getIGMediaUrl(mediaId)

    const videoRes = await fetch(mediaUrl)
    if (!videoRes.ok) throw new Error('No se pudo descargar el video de Instagram')

    const videoArrayBuffer = await videoRes.arrayBuffer()

    // Duración real extraída del MP4 — sin APIs externas
    const duration_s = getMp4Duration(videoArrayBuffer)

    // Extraer frames y transcribir en paralelo
    const [frames, rawTranscript] = await Promise.all([
      extractFrames(videoArrayBuffer, duration_s, mediaId),
      transcribeWithGroq(videoArrayBuffer, `${mediaId}.mp4`),
    ])

    const lines = splitIntoLines(rawTranscript)

    // Describir frames con visión (si se extrajeron)
    const frameDescriptions = await describeFramesWithGroq(frames)

    const { ai_insights, improvement_points } = await analyzeWithGroq(rawTranscript, metrics, frameDescriptions)

    const result: TranscriptionResult = { lines, ai_insights, improvement_points, visual_analysis: frameDescriptions, duration_s }

    saveCache(mediaId, result)

    // Guardar en Supabase en background (no bloquea la respuesta al cliente)
    const caption = (await supabase.from('posts').select('caption').eq('id', mediaId).single()).data?.caption ?? undefined
    const cleanedText = await cleanTranscription(lines.join(' '))
    upsertTranscription({
      postId: mediaId,
      text: cleanedText,
      lines,
      ai_insights,
      improvement_points,
      visual_analysis: frameDescriptions || undefined,
      duration_s,
      caption,
    }).catch(err => console.error('Supabase upsert error:', err))

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
