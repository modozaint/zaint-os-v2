import Anthropic from '@anthropic-ai/sdk'

/**
 * EL GUIONISTA BUENO — Claude Opus 5.
 *
 * Groq es gratis y sirve para probar, pero tiene dos techos que ya nos
 * pegaron de frente:
 *   1. 8.000 tokens POR MINUTO contando entrada y salida. Una sola generación
 *      se come casi todo el presupuesto del minuto.
 *   2. Los modelos se retiran sin avisar — el 17 de agosto la generación
 *      amaneció rota por eso, sin que nadie hubiera tocado el código.
 *
 * Decisión de Santiago (2026-08-18): *"si necesitamos añadir tokens de
 * Anthropic, tenemos, si es para hacer lo mejor en nuestro contenido"*.
 *
 * Costo real medido: un guion consume ~1.900 de entrada y ~1.200 de salida.
 * A precio de Opus 5 eso es alrededor de 4 centavos de dólar por guion — sus
 * 12 reels al mes salen por menos de un dólar.
 *
 * 🔒 Si la llave no está, `disponible()` devuelve false y el sistema sigue con
 * Groq. Nunca se cae por esto.
 */

export const MODELO_CLAUDE = 'claude-opus-5'

export function disponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/**
 * El esquema del guion, en JSON Schema.
 *
 * Se declara así —y no pidiéndolo en el prompt— porque Claude puede GARANTIZAR
 * la forma con salidas estructuradas: nunca devuelve un JSON a medias ni
 * inventa un campo. Con Groq eso era una súplica en el prompt y a veces
 * fallaba; aquí es un contrato.
 */
const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'titulo', 'funcion', 'angulo', 'rotacion', 'duracion_objetivo',
    'eje', 'portada', 'brief', 'hooks', 'escenas', 'cta', 'loop',
  ],
  properties: {
    titulo: { type: 'string', description: 'Máximo 8 palabras' },
    funcion: { type: 'string', enum: ['adquisicion', 'autoridad', 'conversion'] },
    angulo: {
      type: 'string',
      enum: [
        'tutorial', 'comparacion', 'desmitificacion', 'correcto_incorrecto',
        'consejo', 'transformacion', 'reto', 'storytelling', 'review',
      ],
    },
    rotacion: { type: 'string', enum: ['probado', 'prueba', 'experimental'] },
    duracion_objetivo: { type: 'string', enum: ['0-20 s', '~30 s', '60-90 s'] },
    eje: { type: 'string', description: 'El ángulo de ESTA pieza, 2-4 palabras' },
    portada: { type: 'string', description: 'Qué frame se usa de portada y por qué frena el scroll' },
    brief: {
      type: 'object',
      additionalProperties: false,
      required: ['que_es', 'para_que_cuenta', 'horas', 'como_sabremos'],
      properties: {
        que_es: { type: 'string' },
        para_que_cuenta: { type: 'string' },
        horas: { type: 'string' },
        como_sabremos: { type: 'string' },
      },
    },
    hooks: {
      type: 'array',
      description: 'Exactamente 3, entrando por puertas distintas de verdad',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['visual', 'verbal', 'textual', 'auditivo', 'arquetipo'],
        properties: {
          visual: { type: 'string', description: 'Qué se ve en el frame del segundo 0' },
          verbal: { type: 'string', description: 'La frase, palabra por palabra' },
          textual: { type: 'string', description: 'El texto en pantalla que sostiene el hook sin sonido' },
          auditivo: { type: 'string', description: 'Corte, silencio, sonido real o audio en tendencia' },
          arquetipo: { type: 'string' },
        },
      },
    },
    escenas: {
      type: 'array',
      description: 'Un hook nuevo cada ~3 segundos. Las duraciones suman la duración objetivo',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['segundos', 'se_ve', 'se_dice', 'texto_pantalla', 'sonido'],
        properties: {
          segundos: { type: 'string', description: 'Ej: "0-3"' },
          se_ve: { type: 'string' },
          se_dice: { type: 'string' },
          texto_pantalla: { type: 'string' },
          sonido: { type: 'string' },
        },
      },
    },
    cta: {
      type: 'object',
      additionalProperties: false,
      required: ['momento', 'que_pide'],
      properties: {
        momento: { type: 'string', description: 'En qué segundo entra. Va en el CENTRO, no al final' },
        que_pide: { type: 'string' },
      },
    },
    loop: { type: 'string', description: 'Cómo cierra para enganchar con el arranque' },
  },
} as const

export async function escribirConClaude(system: string, user: string) {
  const client = new Anthropic()

  const res = await client.beta.messages.create({
    model: MODELO_CLAUDE,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      format: { type: 'json_schema', schema: ESQUEMA },
      // Escribir un guion bueno es trabajo de criterio, no de volumen.
      effort: 'high',
    },
    // Los clasificadores pueden declinar una petición. Sin esto, la generación
    // simplemente se detiene; con esto Anthropic la reintenta en otro modelo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  })

  if (res.stop_reason === 'refusal') {
    throw new Error(
      'El modelo declinó escribir esta pieza. Reformulá la idea y volvé a intentar.'
    )
  }

  const bloque = res.content.find((b) => b.type === 'text')
  if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto')

  return {
    json: JSON.parse(bloque.text) as Record<string, unknown>,
    consumo: {
      entrada: res.usage.input_tokens,
      salida: res.usage.output_tokens,
    },
  }
}
