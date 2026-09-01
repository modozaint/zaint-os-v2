/**
 * TIPOS Y CONSTANTES DE PIEZAS — client-safe, y a propósito sin un solo import.
 *
 * Vive aparte de `lib/piezas.ts` porque ese archivo importa `supabaseClient`,
 * que LANZA un error si no encuentra SUPABASE_SERVICE_KEY. Esa variable es de
 * servidor y en el navegador nunca existe, así que cualquier componente de
 * cliente que importara un VALOR de `lib/piezas` (no solo un tipo) arrastraba
 * Supabase al bundle y tumbaba la página entera con "Application error".
 *
 * Es el mismo patrón que `lib/marcas.ts` frente a `instagramClient.ts`:
 * lo que el navegador necesita, sin nada de servidor detrás.
 */

export type TipoPieza = 'reel' | 'carrusel' | 'story' | 'foto'
export type EstadoPieza = 'idea' | 'guionizada' | 'grabada' | 'editada' | 'publicada'

/**
 * Los cinco estados, en orden. Es una lista cerrada a propósito: en cuanto
 * alguien agrega "casi lista", el tablero deja de decir dónde está atascado
 * el trabajo — que es lo único para lo que sirve.
 */
export const ESTADOS: { id: EstadoPieza; label: string; ayuda: string }[] = [
  { id: 'idea',       label: 'Idea',       ayuda: 'Escrita, sin guion' },
  { id: 'guionizada', label: 'Guionizada', ayuda: 'Tiene guion escena por escena' },
  { id: 'grabada',    label: 'Grabada',    ayuda: 'El material en crudo existe' },
  { id: 'editada',    label: 'Editada',    ayuda: 'Lista para salir' },
  { id: 'publicada',  label: 'Publicada',  ayuda: 'Afuera. Lo único que cuenta' },
]

export const TIPOS: { id: TipoPieza; label: string }[] = [
  { id: 'reel',     label: 'Reel' },
  { id: 'carrusel', label: 'Carrusel' },
  { id: 'story',    label: 'Story' },
  { id: 'foto',     label: 'Foto' },
]

export interface Pieza {
  id: string
  marca_id: string | null
  titulo: string
  idea: string | null
  tipo: TipoPieza
  eje: string | null
  /** Sistema Converzzo — ver el bloque del final de este archivo. */
  funcion: Funcion | null
  angulo: Angulo | null
  rotacion: Rotacion | null
  escenas: Escena[] | null
  estado: EstadoPieza
  orden: number
  fecha_objetivo: string | null
  /**
   * Quién la escribió — un id de `lib/usuarios.ts`, sellado por el servidor.
   * `null` en las 8 piezas anteriores al 2026-08-21, cuando no había usuarios:
   * ponerles un nombre ahora sería inventarlo.
   */
  autor: string | null
  brief: unknown | null
  hooks: unknown | null
  guion: string | null
  post_id: string | null
  publicada_url: string | null
  created_at: string
  updated_at: string
}

export interface Meta {
  marca_id: string
  piezas_por_semana: number
  tipo_principal: TipoPieza
  activa: boolean
  /** Cuántas por semana de cada formato. El curso las da por formato, no en bloque. */
  frecuencias: Record<TipoPieza, number> | null
  /** El balance objetivo entre funciones. Arranque del curso: 50/25/25. */
  mezcla: Record<Funcion, number> | null
  /** 70 probado / 20 en prueba / 10 experimental. */
  rotacion_objetivo: Record<Rotacion, number> | null
}

// ═══════════════════════════════════════════════════════════════════════════
// EL SISTEMA CONVERZZO
//
// Tres rejillas que se cruzan y convierten el calendario en algo que decide
// QUÉ pieza toca, no solo cuándo. Salen del curso, destilado en
// CONTENIDO/CURSO_CONVERZZO/ — no se inventan aquí.
// ═══════════════════════════════════════════════════════════════════════════

/** Para qué existe la pieza. La mezcla de arranque del curso es 50/25/25. */
export type Funcion = 'adquisicion' | 'autoridad' | 'conversion'

export const FUNCIONES: { id: Funcion; label: string; ayuda: string }[] = [
  { id: 'adquisicion', label: 'Adquisición', ayuda: 'Trae gente nueva. Storytelling, proceso, aspiracional' },
  { id: 'autoridad',   label: 'Autoridad',   ayuda: 'Demuestra que sabés. Tutorial, criterio, desmitificar' },
  { id: 'conversion',  label: 'Conversión',  ayuda: 'Mueve a comprar. Producto, prueba, oferta' },
]

/**
 * Los 9 ángulos de comunicación. Lista cerrada a propósito.
 *
 * 🔑 La regla del curso: **no repetir el mismo ángulo dos días seguidos.**
 * Un mismo tema × distinto ángulo × distinto formato = variedad sin repetirse.
 */
export type Angulo =
  | 'tutorial' | 'comparacion' | 'desmitificacion' | 'correcto_incorrecto'
  | 'consejo' | 'transformacion' | 'reto' | 'storytelling' | 'review'

export const ANGULOS: { id: Angulo; label: string; ayuda: string }[] = [
  { id: 'tutorial',            label: 'Tutorial',           ayuda: 'Enseñar a hacer algo paso a paso' },
  { id: 'comparacion',         label: 'Comparación',        ayuda: 'A vs B — opciones, productos, métodos' },
  { id: 'desmitificacion',     label: 'Desmitificación',    ayuda: 'Derribar un mito o creencia falsa del nicho' },
  { id: 'correcto_incorrecto', label: 'Qué sí / qué no',    ayuda: 'Lo correcto contra lo incorrecto' },
  { id: 'consejo',             label: 'Consejo',            ayuda: 'Un tip rápido y accionable' },
  { id: 'transformacion',      label: 'Transformación',     ayuda: 'Antes → después' },
  { id: 'reto',                label: 'Reto',               ayuda: 'Ponerse (o poner al espectador) a prueba' },
  { id: 'storytelling',        label: 'Storytelling',       ayuda: 'Una historia con inicio, nudo y desenlace' },
  { id: 'review',              label: 'Review',             ayuda: 'Opinión honesta de algo' },
]

/** 70 % probado · 20 % en prueba · 10 % experimental. Da sostenibilidad. */
export type Rotacion = 'probado' | 'prueba' | 'experimental'

export const ROTACIONES: { id: Rotacion; label: string; ayuda: string }[] = [
  { id: 'probado',      label: 'Probado',      ayuda: 'Ya sabés que funciona' },
  { id: 'prueba',       label: 'En prueba',    ayuda: 'Variación de algo que funcionó' },
  { id: 'experimental', label: 'Experimental', ayuda: 'Distinto. Anti-hooks, formatos nuevos' },
]

/** Frecuencia semanal sugerida por el curso, por formato. */
export const FRECUENCIA_SUGERIDA: Record<TipoPieza, { min: number; max: number; nota?: string }> = {
  reel:     { min: 2, max: 3 },
  carrusel: { min: 1, max: 2 },
  foto:     { min: 0, max: 1, nota: 'máximo 1 por semana' },
  story:    { min: 5, max: 6, nota: 'días por semana, 1-10 al día' },
}

/** Duración objetivo según qué es la pieza (módulo 4). */
export const DURACIONES = [
  { tipo: 'Trend / con música', segundos: '0-20 s' },
  { tipo: 'Contenido útil',     segundos: '~30 s' },
  { tipo: 'Storytelling',       segundos: '60-90 s' },
] as const

/**
 * Una escena del guion, con sus CUATRO capas de hook.
 *
 * El módulo 4 pide **un hook cada ~3 segundos combinando tipos**, no una sola
 * frase al principio. Por eso cada escena lleva las cuatro capas: lo que se
 * VE, lo que se DICE, lo que se LEE en pantalla y lo que se OYE.
 *
 * La capa de texto no es decoración: buena parte del formato corto se ve en
 * mudo, así que un hook que vive solo en la voz se pierde para esa gente.
 */
export interface Escena {
  segundos: string
  se_ve: string
  se_dice: string
  texto_pantalla: string
  sonido: string
}

export interface HookCompleto {
  visual: string
  verbal: string
  textual: string
  auditivo: string
  arquetipo: string
}
