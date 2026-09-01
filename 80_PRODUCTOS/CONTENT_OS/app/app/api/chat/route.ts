import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch } from '@/lib/db/transcriptions'
import { supabase } from '@/lib/supabaseClient'
import { MARCA_DEFAULT, esMarca, type MarcaId } from '@/lib/marcas'
import { bloqueDeIdentidad } from '@/lib/identidades'
import { MODELO_RAZONAMIENTO } from '@/lib/modelosGroq'

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_API_KEY = process.env.GROQ_API_KEY

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toString()
}

const PERFORMANCE_KEYWORDS = /mejor|top|más (views?|reach|saves?|shares?|likes?|viral|visto|guardado|compartido|comentado|funcionó|funcionaron|performó|engagement|exitoso|exitosos)/i

async function buildRAGContext(query: string, marca: MarcaId): Promise<string> {
  // 1. Traer todos los posts con métricas y transcripciones de una sola vez
  const [postsRes, transcriptionsRes] = await Promise.all([
    supabase.from('posts').select('id, caption, published_at, metrics(*)').eq('marca_id', marca),
    supabase.from('transcriptions').select('post_id, text, ai_insights, improvement_points, visual_analysis'),
  ])

  const allPosts = postsRes.data ?? []
  const transcByPostId = Object.fromEntries((transcriptionsRes.data ?? []).map(t => [t.post_id, t]))

  // Helper: post compacto (solo métricas) — para listas largas y top performers
  const formatPostCompact = (p: typeof allPosts[0], rank?: string) => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    const caption = p.caption?.split('\n')[0]?.slice(0, 60) ?? '(sin caption)'
    const date = p.published_at
      ? new Date(p.published_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''
    const metrics = m
      ? `Reach: ${fmt(m.reach)} | Likes: ${fmt(m.likes)} | Saves: ${fmt(m.saves)} | Shares: ${fmt(m.shares)} | ER: ${(m.engagement_rate * 100).toFixed(2)}%`
      : 'Sin métricas'
    const prefix = rank ? `${rank} ` : ''
    return `${prefix}"${caption}" (${date}) — ${metrics}`
  }

  // Helper: post completo con transcripción — para resultados semánticos relevantes
  const formatPost = (p: typeof allPosts[0], rank?: string) => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    const t = transcByPostId[p.id]
    const caption = p.caption?.split('\n')[0]?.slice(0, 70) ?? '(sin caption)'
    const date = p.published_at
      ? new Date(p.published_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''
    const metrics = m
      ? `Reach: ${fmt(m.reach)} | Likes: ${fmt(m.likes)} | Saves: ${fmt(m.saves)} | Shares: ${fmt(m.shares)} | Comments: ${fmt(m.comments)} | ER: ${(m.engagement_rate * 100).toFixed(2)}%`
      : 'Sin métricas'
    const transcription = t?.text ? `\n   Transcripción: ${t.text.slice(0, 180)}` : ''
    const insights = t?.ai_insights?.length ? `\n   Insight: ${(t.ai_insights as string[])[0]}` : ''
    const prefix = rank ? `${rank} ` : ''
    return `${prefix}"${caption}" (${date})\n   ${metrics}${transcription}${insights}`
  }

  // 2. KPIs globales
  const postsWithMetrics = allPosts.filter(p => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    return m && m.reach > 0
  })
  const total = postsWithMetrics.length

  if (total === 0) {
    return 'No hay datos disponibles aún. Ejecutá /api/sync para sincronizar los datos de Instagram.'
  }

  const avgReach = Math.round(postsWithMetrics.reduce((s, p) => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    return s + (m?.reach ?? 0)
  }, 0) / total)

  const avgER = ((postsWithMetrics.reduce((s, p) => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    return s + (m?.engagement_rate ?? 0)
  }, 0) / total) * 100).toFixed(2)

  const avgSaves = Math.round(postsWithMetrics.reduce((s, p) => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    return s + (m?.saves ?? 0)
  }, 0) / total)

  const globalSummary = `=== MÉTRICAS GLOBALES (${total} posts) ===
Reach promedio: ${fmt(avgReach)} | Saves promedio: ${fmt(avgSaves)} | Engagement Rate promedio: ${avgER}%`

  // 3. Siempre incluir top performers (responde las preguntas más comunes)
  const sortedByReach = [...postsWithMetrics].sort((a, b) => {
    const ma = Array.isArray(a.metrics) ? a.metrics[0] : a.metrics
    const mb = Array.isArray(b.metrics) ? b.metrics[0] : b.metrics
    return (mb?.reach ?? 0) - (ma?.reach ?? 0)
  })
  const sortedBySaves = [...postsWithMetrics].sort((a, b) => {
    const ma = Array.isArray(a.metrics) ? a.metrics[0] : a.metrics
    const mb = Array.isArray(b.metrics) ? b.metrics[0] : b.metrics
    return (mb?.saves ?? 0) - (ma?.saves ?? 0)
  })
  const sortedByER = [...postsWithMetrics].sort((a, b) => {
    const ma = Array.isArray(a.metrics) ? a.metrics[0] : a.metrics
    const mb = Array.isArray(b.metrics) ? b.metrics[0] : b.metrics
    return (mb?.engagement_rate ?? 0) - (ma?.engagement_rate ?? 0)
  })

  // Top performers compactos (solo métricas, sin transcripción) para no inflar tokens
  const topPerformers = `=== TOP PERFORMERS ===
Top 5 por REACH: ${sortedByReach.slice(0, 5).map((p, i) => formatPostCompact(p, `#${i + 1}`)).join('\n')}
Top 5 por SAVES: ${sortedBySaves.slice(0, 5).map((p, i) => formatPostCompact(p, `#${i + 1}`)).join('\n')}
Top 5 por ER: ${sortedByER.slice(0, 5).map((p, i) => formatPostCompact(p, `#${i + 1}`)).join('\n')}`

  // 4. Si la pregunta es sobre rendimiento → top performers compactos + top 10 por reach
  const isPerformanceQuestion = PERFORMANCE_KEYWORDS.test(query)
  if (isPerformanceQuestion) {
    const top10ByReach = sortedByReach
      .slice(0, 10)
      .map((p, i) => formatPostCompact(p, `${i + 1}.`))
      .join('\n')

    return `${topPerformers}

=== TOP 10 POSTS POR REACH ===
${top10ByReach}

${globalSummary}`
  }

  // 5. Búsqueda semántica para preguntas sobre contenido/temas
  let semanticResults: { post_id: string; text: string; similarity: number }[] = []
  try {
    semanticResults = await semanticSearch(query, 5)
  } catch {
    // Si falla, continuar sin búsqueda semántica
  }

  if (semanticResults.length === 0) {
    // Sin embeddings: top performers + top 10 por reach con transcripción corta
    const top10 = sortedByReach.slice(0, 10).map((p, i) => formatPost(p, `${i + 1}.`)).join('\n\n')
    return `${topPerformers}

=== TOP 10 POSTS POR REACH (con contexto) ===
${top10}

${globalSummary}`
  }

  // 6. Con embeddings: top performers compactos + resultados semánticos con transcripción
  const semanticPostIds = new Set(semanticResults.map(r => r.post_id))
  const extraTopPosts = sortedByReach.slice(0, 3).filter(p => !semanticPostIds.has(p.id))

  const semanticContent = semanticResults
    .map((r, i) => {
      const post = allPosts.find(p => p.id === r.post_id)
      if (!post) return null
      return formatPost(post, `[${i + 1}]`)
    })
    .filter(Boolean)
    .join('\n\n')

  const extraContent = extraTopPosts.length > 0
    ? `\n\n=== TOP POSTS POR REACH (contexto comparativo) ===\n${extraTopPosts.map((p, i) => formatPost(p, `#${i + 1}`)).join('\n\n')}`
    : ''

  return `${topPerformers}

=== POSTS MÁS RELEVANTES PARA TU PREGUNTA ===
${semanticContent}${extraContent}

${globalSummary}`
}

export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_NOT_CONFIGURED' }, { status: 400 })
  }

  const { message, history, marca: marcaCruda } = await request.json()
  const marca: MarcaId = esMarca(marcaCruda) ? marcaCruda : MARCA_DEFAULT
  if (!message) {
    return NextResponse.json({ error: 'Falta el mensaje' }, { status: 400 })
  }

  // Enriquecer la búsqueda semántica con el contexto reciente de la conversación
  // Esto permite que preguntas de seguimiento ("Y qué se ve en ese reel?") encuentren el post correcto
  let context: string
  try {
    const recentContext = (history ?? [])
      .slice(-4)
      .map((m: { role: string; content: string }) => m.content)
      .join(' ')
    const searchQuery = recentContext ? `${recentContext} ${message}` : message
    context = await buildRAGContext(searchQuery, marca)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al cargar datos: ${msg}` }, { status: 500 })
  }

  const systemPrompt = `${bloqueDeIdentidad(marca)}

<datos_disponibles>
Tenés acceso a: métricas por post (reach, likes, saves, shares, comments, engagement_rate), captions, fechas de publicación, transcripciones de audio (campo "Transcripción"), análisis IA (campo "Insights IA"), puntos de mejora y descripciones visuales de 3 frames del video (campo "Visual": Frame inicial / Frame medio / Frame final).
No todos los posts tienen todos los campos — si falta la transcripción o el análisis visual para un post específico, aclaralo diciendo que ese reel todavía no fue analizado, NO que "no tenés acceso" al dato.
No tenés acceso a datos de YouTube, Meta Ads, competidores ni followers individuales.
</datos_disponibles>

<datos>
${context}
</datos>

<instrucciones>
PREGUNTAS SOBRE UN POST ESPECÍFICO O EL MÁS RECIENTE:
Usá la fecha published_at para determinar orden temporal. Respondé con el caption (primera línea) y la fecha en la primera línea, luego las métricas en viñetas, y al final una línea de contexto vs. promedio si es relevante. Ejemplo de formato:
**"[caption]"** — [fecha]
- Reach: [N] ([X]% sobre/bajo el promedio)
- Likes: [N] | Saves: [N] | Shares: [N]
- Engagement Rate: [X]%

PREGUNTAS SOBRE MÉTRICAS Y RENDIMIENTO:
Citá siempre números concretos. Para comparar dos o más posts, usá estructura paralela o tabla. Si hay menos de 5 posts relevantes, aclarà que es una tendencia inicial, no un patrón confirmado.

DETECCIÓN DE PATRONES ("qué funciona", "qué temas generan más X"):
1. Listá los top 3 posts por esa métrica con su reach/saves/ER
2. Identificá qué tienen en común: tema, estructura del hook, tono, longitud
3. Formulá una hipótesis concreta y accionable — "Los posts sobre [tema] generan [X]% más saves que el promedio porque..."

ANÁLISIS DE TRANSCRIPCIONES Y SCRIPTS:
Al analizar qué funciona en el contenido, examiná las transcripciones buscando: estructura del hook (primeros 3 segundos), tensión narrativa, especificidad del mensaje, llamadas a la acción. Citá frases concretas cuando sean relevantes.

RECOMENDACIÓN DE SCRIPTS:
Cuando recomiendes un guión, usá siempre esta estructura:
— Hook (0-3 seg): [frase o situación exacta de apertura]
— Desarrollo (4-30 seg): [estructura narrativa con puntos clave]
— Cierre/CTA (últimos 5 seg): [qué pedir o cómo cerrar]
Basate en lo que ya funcionó: mencioná qué posts exitosos inspiran la recomendación.
</instrucciones>

<formato>
- Empezá siempre con la conclusión o el dato más relevante. Nunca con introducción.
- Frases prohibidas para empezar: "Claro", "Por supuesto", "Con gusto", "Basándome en los datos", "No tengo acceso a", "Como analista", "¡Excelente pregunta!".
- Idioma: español, tono directo y profesional — como un consultor que conoce bien el negocio.
- Longitud: preguntas simples → 3-5 líneas. Análisis de patrones o scripts → hasta 20 líneas con estructura clara.
- Usá **negrita** para números clave y conclusiones principales.
- Usá tablas solo para comparar 3+ variables entre múltiples posts.
- Antes de responder, verificá internamente que cada número que citás está presente en los datos provistos. Nunca inventes métricas.
</formato>

<ejemplos>
Usuario: ¿Cuál fue mi reel con más saves?
Respuesta: Tu reel con más saves es **"[primera línea del caption]"** (publicado el [fecha]) con **[N] saves** — [X]x el promedio de la cuenta (**[promedio] saves**). El volumen alto de saves sugiere que el contenido fue percibido como valioso para guardar y revisar — típico de posts educativos o con frameworks accionables.

Usuario: ¿Qué temas me funcionan mejor?
Respuesta: Analizando los posts con mayor reach:
1. **"[caption]"** — [reach] reach, [ER]% ER
2. **"[caption]"** — [reach] reach, [ER]% ER
3. **"[caption]"** — [reach] reach, [ER]% ER
El patrón común: [observación concreta sobre tema/hook/estructura]. Hipótesis: [explicación accionable de por qué funcionan].
</ejemplos>`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history ?? []),
    { role: 'user', content: message },
  ]

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELO_RAZONAMIENTO,
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ reply })
}
