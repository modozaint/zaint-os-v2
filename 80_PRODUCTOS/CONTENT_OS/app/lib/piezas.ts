import { supabase } from './supabaseClient'
import type { MarcaId } from './marcas'
import {
  ESTADOS, TIPOS,
  type Angulo, type EstadoPieza, type Funcion, type Meta, type Pieza, type Rotacion, type TipoPieza,
} from './piezasTipos'

// Se re-exportan para el código de servidor que ya los importaba de aquí.
export { ESTADOS, TIPOS }
export type { Angulo, EstadoPieza, Funcion, Meta, Pieza, Rotacion, TipoPieza }

/**
 * LAS PIEZAS — la capa de planificación que no existía.
 *
 * Una pieza nace como IDEA (una línea escrita a mano) y muere PUBLICADA,
 * enlazada al post real. Ese enlace es lo que cierra el ciclo: sin él esto
 * sería una lista de tareas bonita y no un sistema de contenido.
 */

export interface PiezaNueva {
  titulo: string
  marca_id: MarcaId
  tipo?: TipoPieza
  idea?: string
  eje?: string
  estado?: EstadoPieza
  fecha_objetivo?: string | null
  funcion?: Funcion | null
  angulo?: Angulo | null
  rotacion?: Rotacion | null
  /** Lo sella el servidor desde la cookie. Nunca se toma del cuerpo del pedido. */
  autor?: string | null
}

/**
 * Un error de "la tabla no existe" es muy distinto de "no hay piezas", y en
 * pantalla se ven igual. Este marcador deja que la UI diga cuál de los dos es.
 */
export class FaltaMigracion extends Error {
  constructor(tabla: string) {
    super(`La tabla "${tabla}" todavía no existe: falta correr las migraciones en Supabase.`)
    this.name = 'FaltaMigracion'
  }
}

function revisar(error: { code?: string; message: string } | null, tabla: string) {
  if (!error) return
  if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
    throw new FaltaMigracion(tabla)
  }
  throw new Error(error.message)
}

export async function listarPiezas(marca?: MarcaId): Promise<Pieza[]> {
  let q = supabase.from('piezas').select('*').order('orden').order('created_at')
  if (marca) q = q.eq('marca_id', marca)
  const { data, error } = await q
  revisar(error, 'piezas')
  return (data ?? []) as Pieza[]
}

export async function crearPieza(p: PiezaNueva): Promise<Pieza> {
  if (!p.titulo?.trim()) throw new Error('La pieza necesita un título')

  // Entra al final de su columna. Si entrara arriba, cada idea nueva
  // desordenaría lo que ya estaba priorizado.
  const { data: ultimas } = await supabase
    .from('piezas')
    .select('orden')
    .eq('marca_id', p.marca_id)
    .eq('estado', p.estado ?? 'idea')
    .order('orden', { ascending: false })
    .limit(1)

  const fila = {
    titulo: p.titulo.trim(),
    marca_id: p.marca_id,
    tipo: p.tipo ?? 'reel',
    idea: p.idea?.trim() || null,
    eje: p.eje?.trim() || null,
    estado: p.estado ?? 'idea',
    fecha_objetivo: p.fecha_objetivo || null,
    funcion: p.funcion ?? null,
    angulo: p.angulo ?? null,
    rotacion: p.rotacion ?? 'probado',
    autor: p.autor ?? null,
    orden: ((ultimas?.[0]?.orden as number) ?? 0) + 1,
  }

  const { data, error } = await supabase.from('piezas').insert(fila).select().single()
  revisar(error, 'piezas')
  return data as Pieza
}

/**
 * Una sola pieza. Hace falta para devolver la fila DESPUÉS de convertir una
 * idea en guion: ahí no se crea nada nuevo, así que no hay `insert` que
 * devuelva la fila resultante.
 */
export async function obtenerPieza(id: string): Promise<Pieza | null> {
  const { data, error } = await supabase.from('piezas').select('*').eq('id', id).maybeSingle()
  revisar(error, 'piezas')
  return (data as Pieza) ?? null
}

export async function actualizarPieza(id: string, cambios: Partial<Pieza>): Promise<void> {
  const { error } = await supabase.from('piezas').update(cambios).eq('id', id)
  revisar(error, 'piezas')
}

export async function borrarPieza(id: string): Promise<void> {
  const { error } = await supabase.from('piezas').delete().eq('id', id)
  revisar(error, 'piezas')
}

// --- METAS: la cadencia, editable desde Ajustes ---

export async function leerMetas(): Promise<Meta[]> {
  const { data, error } = await supabase.from('metas').select('*')
  revisar(error, 'metas')
  return (data ?? []) as Meta[]
}

export async function guardarMeta(marca: MarcaId, cambios: Partial<Meta>): Promise<void> {
  const { error } = await supabase
    .from('metas')
    .upsert({ marca_id: marca, ...cambios }, { onConflict: 'marca_id' })
  revisar(error, 'metas')
}
