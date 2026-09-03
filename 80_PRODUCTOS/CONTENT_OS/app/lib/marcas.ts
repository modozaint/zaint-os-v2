/**
 * LAS MARCAS — fuente única, y a propósito sin imports de Node.
 *
 * Vive aparte de `instagramClient.ts` porque ese archivo importa `fs` y por
 * eso no se puede usar desde un componente de cliente. Antes de esto la lista
 * estaba escrita dos veces (aquí y dentro de BancoReferentes), que es como se
 * llega a que dos sitios digan cosas distintas.
 *
 * Los colores son los de cada identidad de marca del vault.
 */

/**
 * Cada marca trae su identidad visual COMPLETA, no solo un color de punto.
 *
 * Los valores salen de la identidad escrita en el vault y no se inventan aquí:
 *   Dermatinta → BRANDS/DERMATINTA.md
 *   Kaizen     → KNOWLEDGE_PACKS/HOUSE_OF_KAIZEN/01_IDENTIDAD.md ("Taller Nocturno")
 *   MODOZAINT  → BRANDS/MODOZAINT.md ("Sistema en Construcción")
 *
 * `logo: null` significa que esa marca todavía NO tiene logo en el vault —
 * se pinta el nombre en su tipografía en vez de inventarle uno.
 */
export const MARCAS = [
  {
    id: 'dermatinta',
    nombre: 'Dermatinta',
    handle: 'dermatinta',
    color: '#C49A52',        // dorado
    profundo: '#0D3D34',     // verde bosque
    papel: '#F5F2EA',
    logo: '/marcas/dermatinta.svg',
    fuente: 'var(--font-serif)',
  },
  {
    id: 'kaizen',
    nombre: 'House of Kaizen',
    handle: 'houseofkaizen',
    color: '#FF4D00',        // naranja racing
    profundo: '#141210',     // negro taller
    papel: '#F2EDE4',        // crudo textil
    logo: null,              // 🔴 sin logo en el vault
    fuente: 'var(--font-sans)',
  },
  {
    id: 'modozaint',
    nombre: 'MODOZAINT',
    handle: 'modozaint',
    color: '#A3BE4C',        // oliva-ácido
    profundo: '#15254A',     // navy
    papel: '#EAF0F6',
    logo: '/marcas/modozaint.svg',
    fuente: 'var(--font-mono)',
  },
] as const

export type MarcaId = (typeof MARCAS)[number]['id']
export type Marca = (typeof MARCAS)[number]

/**
 * Marcas que el Content OS opera hoy. `MARCAS` conserva las identidades
 * históricas para poder leer piezas y métricas antiguas sin borrar nada.
 */
export const MARCAS_OPERATIVAS = [MARCAS[2]] as const

/** MODOZAINT es el único frente de contenido e integración activo. */
export const MARCA_DEFAULT: MarcaId = 'modozaint'

export const MARCA_IDS: readonly MarcaId[] = MARCAS.map((m) => m.id)
export const MARCA_IDS_OPERATIVAS: readonly MarcaId[] = MARCAS_OPERATIVAS.map((m) => m.id)

export function esMarca(valor: unknown): valor is MarcaId {
  return typeof valor === 'string' && (MARCA_IDS as readonly string[]).includes(valor)
}

/** Distingue una marca histórica de una que puede recibir trabajo nuevo. */
export function esMarcaOperativa(valor: unknown): valor is MarcaId {
  return typeof valor === 'string' && (MARCA_IDS_OPERATIVAS as readonly string[]).includes(valor)
}

/** Nunca devuelve undefined: si el id no existe, cae en la marca por defecto. */
export function marcaPorId(id: string | null | undefined): Marca {
  return MARCAS.find((m) => m.id === id) ?? MARCAS[0]
}

/**
 * De dónde sale la marca activa en una página de servidor.
 * El parámetro de URL es la fuente: así el enlace se puede compartir, abrir
 * en el celular y volver a la misma marca. El localStorage solo recuerda la
 * última elección para cuando se entra sin parámetro.
 */
export function marcaDesdeParam(param: string | string[] | undefined): MarcaId {
  const v = Array.isArray(param) ? param[0] : param
  return esMarca(v) ? v : MARCA_DEFAULT
}
