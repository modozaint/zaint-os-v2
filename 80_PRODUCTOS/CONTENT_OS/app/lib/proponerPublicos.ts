import { IDENTIDADES } from './identidades'
import type { MarcaId } from './marcas'
import type { TipoPieza } from './piezas'
import { GROQ_CHAT_URL, MODELO_RAZONAMIENTO } from './modelosGroq'

/**
 * LOS PÚBLICOS DE UNA IDEA — la primera de las tres preguntas.
 *
 * Viene textual del prompt del chat de contenido (`CONTENIDO/PROMPT_CHAT_CONTENIDO.md`,
 * «Paso 3 — Las preguntas. Tres, y ni una más»), y esa fuente manda dos cosas
 * que aquí son código, no adorno:
 *
 *   · **«las opciones salen de TU análisis de la idea, no de una lista
 *     guardada»** — por eso esto es una llamada al modelo con la idea adentro
 *     y no un array de públicos fijos por marca. Si fuera una lista, la
 *     pregunta dejaría de servir al segundo uso.
 *   · **«marca cuál se cruza con la audiencia que la marca ya tiene, pero no
 *     te limites a esa»** — de ahí `ya_es_suyo`: se señala, no se filtra.
 *
 * ⚠️ ESCRIBE GROQ, NO CLAUDE, y es a propósito. Esto corre ANTES de generar,
 * o sea que se paga en espera mientras Santiago mira la pantalla: quiere ser
 * corto y barato. El guion —donde la calidad sí decide— sigue yendo a Claude.
 */

export interface PublicoPropuesto {
  /** A quién le habla. Corto, reconocible. */
  nombre: string
  /** Una línea de cómo cambia el video con ese público. */
  cambia: string
  /** Si se cruza con la audiencia que la marca ya tiene. Se marca, no se filtra. */
  ya_es_suyo: boolean
}

export async function proponerPublicos(
  marca: MarcaId,
  tipo: TipoPieza,
  idea: string
): Promise<PublicoPropuesto[]> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Falta GROQ_API_KEY')
  if (!idea.trim()) throw new Error('Escribí una idea primero')

  const identidad = IDENTIDADES[marca]

  const system = `Sos el estratega de contenido de ${identidad.quien}

<voz>
${identidad.voz}
</voz>

Tu única tarea ahora: mirar UNA idea y decir a qué públicos le podría servir.

Reglas:
· Entre 3 y 4 públicos, ni uno más. Salen de analizar ESTA idea, no de una lista de siempre.
· Cada uno con una línea concreta de CÓMO CAMBIA EL VIDEO si le hablás a ese: qué se muestra,
  qué se asume que ya sabe, qué se le pide al final. Nada de "sería más emocional".
· Marcá con ya_es_suyo=true el que se cruza con la audiencia que la marca YA tiene, pero incluí
  al menos uno que todavía no sea suyo: a veces el mejor video le habla a quien no te sigue.
· Los nombres son de personas reales, no de segmentos de marketing. "Tatuadores que revenden
  aftercare", no "clientes potenciales del sector".

Respondé SOLO con JSON válido con esta forma:
{"publicos":[{"nombre":"...","cambia":"...","ya_es_suyo":true}]}`

  const user = `Formato: ${tipo}.
Idea, tal como la escribió Santiago: "${idea.trim()}"`

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO_RAZONAMIENTO,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      // Corto de verdad: son 4 líneas. Pedir de más solo alarga la espera y
      // se come el cupo de 8.000 por minuto que después necesita el guion.
      max_tokens: 900,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    if (res.status === 413 || res.status === 429) {
      throw new Error('Se acabó el cupo de este minuto de Groq. Esperá un minuto o escribí el público a mano.')
    }
    throw new Error(`Groq respondió ${res.status}`)
  }

  const data = await res.json()
  const crudo = data.choices?.[0]?.message?.content
  if (!crudo) throw new Error('El modelo no devolvió nada')

  let out: { publicos?: unknown }
  try {
    out = JSON.parse(crudo)
  } catch {
    throw new Error('El modelo devolvió algo que no es JSON')
  }

  const lista = Array.isArray(out.publicos) ? out.publicos : []
  return lista
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      nombre: String(p.nombre ?? '').trim(),
      cambia: String(p.cambia ?? '').trim(),
      ya_es_suyo: p.ya_es_suyo === true,
    }))
    .filter((p) => p.nombre)
    .slice(0, 4)
}
