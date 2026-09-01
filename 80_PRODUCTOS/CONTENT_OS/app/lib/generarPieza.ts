import { supabase } from './supabaseClient'
import { IDENTIDADES } from './identidades'
import type { MarcaId } from './marcas'
import type { TipoPieza } from './piezas'

/**
 * DE UNA IDEA A UN GUION.
 *
 * Es la puerta de entrada del Content OS: se escribe una línea y sale una
 * pieza lista para grabar. Lo que hace que el guion no sea genérico son las
 * tres fuentes que se le meten delante al modelo, en este orden de peso:
 *
 *   1. La identidad de la marca  — para que suene a ella y no a "IA de marca"
 *   2. Los referentes guardados  — el `que_tomar`, que es una instrucción
 *   3. Lo que ya funcionó        — los posts propios con más alcance
 *
 * Sin la 1 el guion es intercambiable. Sin la 2 y la 3 es una opinión del
 * modelo. Con las tres es una pieza de ESTA marca.
 */

import { GROQ_CHAT_URL as GROQ_URL, MODELO_RAZONAMIENTO as MODELO } from './modelosGroq'
import { CUATRO_CAPAS, ESTRUCTURA, FORMATO_SALIDA, REGLAS_DURAS, REJILLAS } from './marcoConverzzo'
import type { Angulo, Escena, Funcion, HookCompleto, Rotacion } from './piezasTipos'
import { MODELO_CLAUDE, disponible as claudeDisponible, escribirConClaude } from './escritorClaude'



export interface Brief {
  que_es: string
  para_que_cuenta: string
  horas: string
  como_sabremos: string
  /**
   * Las respuestas a las tres preguntas, si se contestaron.
   *
   * Viven en el brief y no en columnas propias porque son parte de lo que la
   * pieza ES: al volver a la ficha en tres meses, saber a quien le hablaba y
   * que hecho tenia adentro es lo que permite reescribirla sin empezar de
   * cero. Opcionales porque la pregunta se puede saltar entera.
   */
  publico?: string
  verdad?: string
  material?: string
}

/**
 * LO QUE SANTIAGO CONTESTO ANTES DE GENERAR.
 *
 * Las tres preguntas vienen textuales de `CONTENIDO/PROMPT_CHAT_CONTENIDO.md`
 * («Paso 3 — Las preguntas. Tres, y ni una mas»). La segunda es la que decide
 * si el video sirve: *«un guion sin un hecho propio adentro sale generico y no
 * hay redaccion que lo salve»*.
 *
 * Las tres son OPCIONALES. Se puede generar sin contestar nada — obligar a
 * contestarlas convierte el atajo en un formulario, y el atajo es justo lo que
 * se usa a las 11 de la noche despues de un turno.
 */
export interface Respuestas {
  /** 1. A que publico le habla. */
  publico?: string
  /** 2. ⭐ Que es verdad aca: el hecho, la historia, el numero, el error. */
  verdad?: string
  /** 3. Que hay para mostrar: grabacion, producto, pantalla, proceso, nada. */
  material?: string
}

export interface PiezaGenerada {
  titulo: string
  eje: string
  /** Las tres rejillas de Converzzo — el calendario después las mide. */
  funcion: Funcion | null
  angulo: Angulo | null
  rotacion: Rotacion | null
  duracion_objetivo: string
  portada: string
  brief: Brief
  /** Tres opciones, cada una con sus CUATRO capas. */
  hooks: HookCompleto[]
  /** El plan de rodaje: qué se ve, se dice, se lee y se oye en cada tramo. */
  escenas: Escena[]
  cta: { momento: string; que_pide: string } | null
  loop: string
  /** Markdown derivado de las escenas, para leer y copiar de un tirón. */
  guion: string
  /** De qué se alimentó. Se muestra para que el guion sea auditable. */
  fuentes: { referentes: number; posts: number }
  /** Números sueltos en el guion que nadie verificó. Ver `numerosSinVerificar`. */
  porVerificar: string[]
  /**
   * Lo que costó generar esta pieza, en tokens.
   *
   * Se devuelve porque sin esto no se puede decidir nada sobre el modelo: la
   * pregunta "¿vale la pena pagar por uno mejor?" solo se responde con el
   * consumo real delante, no con una estimación.
   */
  consumo: { entrada: number; salida: number }
  /** Qué modelo lo escribió. Se muestra para saber qué se está leyendo. */
  modelo: string
}

/**
 * Caza los números del guion que no vengan marcados.
 *
 * Existe porque pedirle al modelo que no invente cifras NO alcanza: en la
 * primera prueba real escribió "cuesta 50 horas de trabajo" sin que nadie
 * hubiera dicho 50. Un número inventado que se publica se vuelve una promesa
 * falsa de la marca, así que la última defensa no puede ser el prompt.
 *
 * Marca de más antes que de menos: es una lista para revisar de un vistazo,
 * no un bloqueo.
 */
export function numerosSinVerificar(guion: string): string[] {
  // Los que ya vienen marcados no cuentan.
  const limpio = guion.replace(/\[VERIFICAR:[^\]]*\]/gi, '')
  const encontrados = new Set<string>()

  // Las unidades de tiempo corto (min, seg) entran a proposito: el guion dijo
  // "patrones en 5 minutos" sobre su propia maquina y nadie habia dicho 5.
  for (const m of limpio.matchAll(
    /(\$?\d[\d.,]*\s*(?:%|min(?:utos?)?|seg(?:undos?)?|horas?|días?|semanas?|meses?|años?|mil|millones?|veces|k)?)/gi
  )) {
    const bruto = m[1].trim()
    // Los segundos del guion ("0-3 s", "escena 2") son estructura, no afirmaciones.
    const contexto = limpio.slice(Math.max(0, m.index - 12), m.index + bruto.length + 4)
    if (/\d+\s*-\s*\d+\s*s|\(\s*\d+|segundos?|^\s*\d\.\s/i.test(contexto)) continue
    if (/^\d{1,2}$/.test(bruto) && !/%|hora|día|semana|mes|año/i.test(contexto)) continue
    encontrados.add(bruto)
  }
  return [...encontrados].slice(0, 8)
}

/**
 * Lo que ya funcionó de esta marca: los mejores de CADA plataforma, con sus
 * números reales.
 *
 * NO se ordenan todos juntos, y la razón es aritmética: el alcance de un reel
 * de Instagram (`reach`) y las reproducciones de un TikTok (`view_count`) no
 * son la misma medida. Si se mezclaran en una sola lista, cualquier TikTok
 * taparía a todos los reels y el guion se apoyaría en una comparación falsa.
 * Se toman los mejores de cada una, etiquetados, para que el modelo sepa de
 * dónde viene cada número.
 */
async function loQueFunciono(marca: MarcaId): Promise<{ texto: string; n: number }> {
  const { data } = await supabase
    .from('posts')
    .select('caption, published_at, plataforma, metrics(views, reach, saves, shares, engagement_rate)')
    .eq('marca_id', marca)

  const normalizados = (data ?? []).map((p) => {
    const m = Array.isArray(p.metrics) ? p.metrics[0] : p.metrics
    const esTikTok = p.plataforma === 'tiktok'
    return {
      caption: p.caption ?? '',
      plataforma: esTikTok ? 'TikTok' : 'Instagram',
      // Cada plataforma con SU métrica de alcance, nunca la del otro.
      alcance: esTikTok ? (m?.views ?? 0) : (m?.reach ?? 0),
      etiqueta: esTikTok ? 'reproducciones' : 'alcance',
      saves: m?.saves ?? 0,
      esTikTok,
    }
  })

  const mejoresDe = (esTikTok: boolean) =>
    normalizados
      .filter((p) => p.esTikTok === esTikTok && p.alcance > 0)
      .sort((a, b) => b.alcance - a.alcance)
      .slice(0, 5)

  const conMetricas = [...mejoresDe(false), ...mejoresDe(true)]

  if (conMetricas.length === 0) {
    return {
      texto:
        'No hay datos propios todavía para esta marca. NO inventes métricas ni digas que algo "funcionó bien" — apóyate solo en la identidad y en los referentes.',
      n: 0,
    }
  }

  const texto = conMetricas
    .map(
      (p) =>
        `- [${p.plataforma}] "${p.caption.split('\n')[0].slice(0, 90)}" → ${p.etiqueta} ${p.alcance}` +
        (p.esTikTok ? '' : `, guardados ${p.saves}`)
    )
    .join('\n')
  return { texto, n: conMetricas.length }
}

/** Los referentes de esta marca. El campo que importa es `que_tomar`. */
async function referentesDe(marca: MarcaId): Promise<{ texto: string; n: number }> {
  const { data } = await supabase
    .from('referentes')
    .select('handle, que_tomar, categoria')
    .eq('marca_id', marca)
    .limit(12)

  const filas = data ?? []
  if (filas.length === 0) {
    return { texto: 'Todavía no hay referentes guardados para esta marca.', n: 0 }
  }
  const texto = filas
    .map((r) => `- @${r.handle}${r.categoria ? ` (${r.categoria})` : ''}: tomar ${r.que_tomar}`)
    .join('\n')
  return { texto, n: filas.length }
}


export async function generarPieza(
  marca: MarcaId,
  tipo: TipoPieza,
  idea: string,
  respuestas: Respuestas = {}
): Promise<PiezaGenerada> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Falta GROQ_API_KEY')
  if (!idea.trim()) throw new Error('Escribí una idea primero')

  const identidad = IDENTIDADES[marca]
  const [refs, propios] = await Promise.all([referentesDe(marca), loQueFunciono(marca)])

  const system = `Sos el guionista de ${identidad.quien}

<voz>
${identidad.voz}
NUNCA: ${identidad.prohibido}
</voz>

<referentes_guardados>
Cada línea dice qué tomar de esa cuenta. Son instrucciones, no inspiración vaga.
${refs.texto}
</referentes_guardados>

<lo_que_ya_funciono>
Piezas propias de esta marca, ordenadas por alcance real:
${propios.texto}
</lo_que_ya_funciono>

${CUATRO_CAPAS}

${ESTRUCTURA}

${REJILLAS}

${REGLAS_DURAS}

Respondé SOLO con un objeto JSON válido, sin texto alrededor, con exactamente esta forma:
${FORMATO_SALIDA}`

  /**
   * Lo contestado entra ANTES de la instrucción, no después: es contexto, no
   * un requisito más. Y solo entran las que tienen algo — un bloque vacío le
   * dice al modelo «no hay hecho propio», que es exactamente lo contrario de
   * lo que pasa cuando simplemente no se contestó.
   */
  const contestado = [
    respuestas.publico?.trim() && `Le habla a: ${respuestas.publico.trim()}.
Escribí para ESE público: lo que ya sabe no se le explica, y lo que no sabe no se asume.`,
    respuestas.verdad?.trim() && `⭐ EL HECHO PROPIO, en sus palabras: "${respuestas.verdad.trim()}"
Esto es lo que hace que la pieza no sea genérica. Tiene que estar ADENTRO del guion, dicho,
no resumido en el brief. Si es un número o una historia, va tal cual — no lo suavices ni lo
generalices, y no le agregues datos que él no dijo.`,
    respuestas.material?.trim() && `Lo que tiene para mostrar: ${respuestas.material.trim()}.
Las escenas se escriben con ESO. No pidas un plano que no puede grabar.`,
  ].filter(Boolean)

  const bloque = contestado.length
    ? '\n<lo_que_ya_decidio>\n' + contestado.join('\n\n') + '\n</lo_que_ya_decidio>\n'
    : ''

  const user = `Formato: ${tipo}.
Idea de Santiago, tal como la escribió: "${idea.trim()}"
${bloque}
Convertila en una pieza completa: clasificala en las tres rejillas, elegí duración,
escribí 3 hooks con sus cuatro capas cada uno, y el plan de escenas con un hook nuevo
cada ~3 segundos.`

  /**
   * Quién escribe: Claude si hay llave, Groq si no.
   *
   * No es solo calidad. Groq gratis tiene dos techos que ya nos pegaron:
   * 8.000 tokens POR MINUTO —una generación se come casi todo— y modelos que
   * se retiran sin avisar (el 17 de agosto amaneció rota por eso).
   *
   * Claude además GARANTIZA la forma del JSON con salidas estructuradas, en
   * vez de pedirla por prompt y cruzar los dedos.
   */
  // Inicializadas porque el flujo tiene dos caminos y TypeScript no puede
  // probar que uno de los dos siempre asigna. Si ninguno lo hiciera, la
  // comprobación de `out.titulo` de más abajo lo caza igual.
  let out: Partial<PiezaGenerada> = {}
  let consumo: { entrada: number; salida: number } = { entrada: 0, salida: 0 }
  let modeloUsado = ''

  /**
   * ⚠️ Claude puede estar disponible y AUN ASI fallar. Pasó el 2026-08-26: la
   * llave estaba puesta pero **el crédito se acabó**, y como esta rama no
   * atrapaba nada, "Nueva pieza" quedó rota entera — devolviendo un error de
   * facturación a quien solo quería escribir un guion.
   *
   * El comentario de abajo ya prometía que *«nunca se cae por esto»*. Ahora es
   * verdad: si Claude falla por lo que sea, se sigue con Groq y se anota qué
   * modelo escribió de verdad.
   */
  let usarGroq = !claudeDisponible()

  if (!usarGroq) {
    try {
      const r = await escribirConClaude(system, user)
      out = r.json as Partial<PiezaGenerada>
      consumo = r.consumo
      modeloUsado = MODELO_CLAUDE
    } catch (e) {
      console.warn('[generarPieza] Claude falló, sigo con Groq:', (e as Error).message)
      usarGroq = true
    }
  }

  if (usarGroq) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        // 8.000 por minuto contando entrada y salida: con ~1.900 de prompt,
        // pedir más de ~6.000 devuelve 413 antes de generar nada.
        max_tokens: 5000,
        reasoning_effort: 'low',
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const detalle = await res.text()
      if (res.status === 413 || res.status === 429) {
        throw new Error(
          'Se acabó el cupo de este minuto (el plan gratis de Groq da 8.000 tokens por minuto). ' +
            'Esperá un minuto y volvé a intentar.'
        )
      }
      throw new Error(`Groq respondió ${res.status}: ${detalle.slice(0, 200)}`)
    }

    const data = await res.json()
    const crudo = data.choices?.[0]?.message?.content
    if (!crudo) throw new Error('El modelo no devolvió nada')
    try {
      out = JSON.parse(crudo)
    } catch {
      throw new Error('El modelo devolvió algo que no es JSON. Volvé a intentar.')
    }
    consumo = {
      entrada: data.usage?.prompt_tokens ?? 0,
      salida: data.usage?.completion_tokens ?? 0,
    }
    modeloUsado = MODELO
  }

  if (!out.titulo || !Array.isArray(out.escenas) || out.escenas.length === 0) {
    throw new Error('La respuesta vino incompleta (sin título o sin escenas). Volvé a intentar.')
  }

  const escenas = out.escenas as Escena[]
  const hooks = (Array.isArray(out.hooks) ? out.hooks.slice(0, 3) : []) as HookCompleto[]
  const guion = aMarkdown(out.titulo, escenas, out.cta ?? null, out.loop ?? '', out.portada ?? '')

  return {
    titulo: out.titulo,
    eje: out.eje ?? '',
    funcion: validar(out.funcion, FUNCIONES_VALIDAS) as Funcion | null,
    angulo: validar(out.angulo, ANGULOS_VALIDOS) as Angulo | null,
    rotacion: (validar(out.rotacion, ROTACIONES_VALIDAS) as Rotacion | null) ?? 'probado',
    duracion_objetivo: out.duracion_objetivo ?? '',
    portada: out.portada ?? '',
    brief: out.brief as Brief,
    hooks,
    escenas,
    cta: out.cta ?? null,
    loop: out.loop ?? '',
    guion,
    fuentes: { referentes: refs.n, posts: propios.n },
    // Se revisa el guion completo, no solo lo hablado: una cifra inventada
    // puede venir en el texto de pantalla igual que en la voz.
    porVerificar: numerosSinVerificar(guion),
    consumo,
    modelo: modeloUsado,
  }
}

const FUNCIONES_VALIDAS = ['adquisicion', 'autoridad', 'conversion']
const ANGULOS_VALIDOS = [
  'tutorial', 'comparacion', 'desmitificacion', 'correcto_incorrecto',
  'consejo', 'transformacion', 'reto', 'storytelling', 'review',
]
const ROTACIONES_VALIDAS = ['probado', 'prueba', 'experimental']

/**
 * El modelo a veces devuelve una etiqueta que no está en la lista ("educativo").
 * Guardar eso rompería el balance del calendario en silencio, así que lo que no
 * calza se descarta: mejor un campo vacío que una categoría inventada.
 */
function validar(valor: unknown, permitidos: string[]): string | null {
  return typeof valor === 'string' && permitidos.includes(valor) ? valor : null
}

/**
 * Las escenas a markdown, para leer de un tirón y copiar al celular.
 *
 * Cada escena muestra las cuatro capas juntas porque así se graba: en el
 * momento de rodar hace falta ver a la vez qué se ve, qué se dice, qué se lee
 * y qué se oye — no en cuatro listas separadas.
 */
function aMarkdown(
  titulo: string,
  escenas: Escena[],
  cta: { momento: string; que_pide: string } | null,
  loop: string,
  portada: string
): string {
  const partes = [`# ${titulo}`]
  if (portada) partes.push(`**Portada:** ${portada}`)

  for (const e of escenas) {
    partes.push(
      [
        `### ${e.segundos}`,
        e.se_dice ? `🗣️ **Dice:** ${e.se_dice}` : '',
        e.se_ve ? `👁️ **Se ve:** ${e.se_ve}` : '',
        e.texto_pantalla ? `🔤 **En pantalla:** ${e.texto_pantalla}` : '',
        e.sonido ? `🔊 **Suena:** ${e.sonido}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    )
  }

  if (cta) partes.push(`### CTA (${cta.momento})
${cta.que_pide}`)
  if (loop) partes.push(`### Loop
${loop}`)
  return partes.join('\n\n')
}
