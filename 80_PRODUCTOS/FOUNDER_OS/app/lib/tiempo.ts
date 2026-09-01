/**
 * Calculo puro de tiempo y capacidad. Sin base de datos y sin `next/headers`,
 * asi que lo puede usar tanto el servidor como una pantalla del navegador.
 */

export type Peldano = { n: number; nombre: string; descripcion: string; color: string }

export type Tarea = {
  id: number; texto: string; peldano: number; minutos: number | null
  estado: 'pendiente' | 'hoy' | 'hecha' | 'archivada'
  area_id: string | null; nota: string | null; fecha: string | null
  cuenta_id: number | null
  creada_en?: string | null
  origen?: 'mano' | 'voz'
  /** Cuanto costaria que otro la haga. Null = todavia no se ha preguntado. */
  costo_delegar?: number | null
  delegar_a?: string | null
  /** Decidir delegar y pedirlo son dos actos distintos. Este es el segundo. */
  pedido_enviado?: boolean
}

// ---------- El precio de la hora ----------
// De la sesion 2 con Pablo (19-ago) y del destilado de Freddy Vega: la hora se
// calcula con lo que uno QUIERE ganar dividido por las horas que de verdad
// tiene. Dividirlo por las 192 de un mes de oficina da un numero falso: las
// otras 178 se las lleva la clinica.

/** Lo que vale una hora suya. $2.500.000 / 35 h = $71.429. */
export function precioHora(metaMes: number, horasMes: number): number {
  if (!(horasMes > 0)) return 0
  return Math.round(metaMes / horasMes)
}

/** Lo que cuesta hacer una tarea con las propias manos. */
export function cuestaHacerla(minutos: number | null, precio: number): number {
  if (!minutos || minutos <= 0) return 0
  return Math.round((minutos / 60) * precio)
}

/**
 * El veredicto. Solo hay tres respuestas posibles y ninguna es "depende":
 *   'no-sabe'  → falta el dato de cuanto costaria que otro la haga
 *   'delegar'  → cuesta menos que hacerla uno
 *   'hacerla'  → sale mas caro delegarla que hacerla
 */
export function veredicto(propio: number, ajeno: number | null | undefined):
  { que: 'no-sabe' | 'delegar' | 'hacerla'; ahorro: number } {
  if (ajeno === null || ajeno === undefined) return { que: 'no-sabe', ahorro: 0 }
  const ahorro = propio - ajeno
  return { que: ahorro > 0 ? 'delegar' : 'hacerla', ahorro: Math.abs(ahorro) }
}

export type Encaje = {
  id: number; texto: string; peldano: number; minutos: number
  acumulado: number; cabe: boolean
}

export function comoSeLlamaElDia(capacidad: number): string {
  if (capacidad === 0) return 'Día protegido'
  if (capacidad <= 15) return 'Día de turno'
  if (capacidad <= 60) return 'Media mañana'
  return 'Bloque completo'
}

/** Minutos → "1 h 30" */
export function enHoras(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function minutosEntre(desde?: string | null, hasta?: string | null): number {
  if (!desde || !hasta) return 0
  return aMinutos(hasta) - aMinutos(desde)
}

/**
 * Cuántas horas de RELOJ quedan hoy fuera del trabajo.
 * No se puede deducir de las horas del turno: importa CUÁNDO ocurren.
 *
 * - Turno de día   → el trabajo cae entero hoy: se resta completo.
 * - Turno de noche → hoy solo se consume hasta que sale de casa; las 12 h
 *   caen mañana. (Antes se restaban hoy: la N salía 4 h 55 en vez de 13 h 40.)
 * - Posturno → la noche se trabajó AYER. Hoy llega a casa y duerme de día,
 *   así que el día no empieza al despertar sino al terminar esa recuperación.
 */
export function libreDeReloj(
  cfg: { hora_despertar?: string | null; hora_dormir?: string | null } | null,
  turno: any,
): number {
  const despertar = cfg?.hora_despertar ? aMinutos(cfg.hora_despertar) : 0
  const dormir = cfg?.hora_dormir ? aMinutos(cfg.hora_dormir) : 24 * 60
  const ventana = Math.max(0, dormir - despertar)
  if (!turno) return ventana

  const transporte = turno.transporte_min ?? 0

  // Posturno: el día arranca cuando se despierta de la recuperación.
  if ((turno.recuperacion_min ?? 0) > 0 && turno.hora_salida) {
    const enCasa = aMinutos(turno.hora_salida) + transporte
    return Math.max(0, dormir - (enCasa + turno.recuperacion_min))
  }

  if (!turno.hora_entrada || !turno.hora_salida) return ventana

  const entrada = aMinutos(turno.hora_entrada)
  const salida = aMinutos(turno.hora_salida)

  // Turno de noche (termina al día siguiente): hoy solo cuenta hasta salir de casa.
  if (salida <= entrada) {
    return Math.max(0, entrada - Math.round(transporte / 2) - despertar)
  }

  return Math.max(0, ventana - ((salida - entrada) + transporte))
}

/** Una cuenta = una marca o linea de negocio que compite por las mismas horas. */
export type Cuenta = {
  id: number
  nombre: string
  estado: 'activa' | 'mantenimiento' | 'dormida'
  color: string
  horas_mes: number | null
  gatillo: string | null
  nota: string | null
  orden: number
  pendientes?: number
  minutos?: number
}

export const ESTADO_CUENTA: Record<Cuenta['estado'], { etiqueta: string; punto: string }> = {
  activa:        { etiqueta: 'Activa',          punto: '🟢' },
  mantenimiento: { etiqueta: 'En mantenimiento', punto: '🟡' },
  dormida:       { etiqueta: 'Dormida',          punto: '⚪' },
}

/**
 * La fecha de HOY en Bogota, no en UTC. Un turno de noche cruza la medianoche.
 * Vive aqui, y no en `lib/supabase.ts`, porque la necesita tambien el navegador
 * (para nombrar la carpeta de la foto) y aquel importa `next/headers`.
 */
export function hoyBogota(): string {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return f.format(new Date())
}

// ---------- La ventana para llenar días hacia atrás ----------
// Santiago (23-ago): "llenar los días que no se llenaron, los recientes, pero
// se sabe que se hicieron — que solo se puedan llenar los de la última semana".
// El límite no es un capricho: más atrás ya no se recuerda, y un histórico que
// se puede reescribir entero deja de ser un histórico.

/** Cuántos días hacia atrás se pueden llenar, contando hoy. */
export const VENTANA_LLENADO = 7

/** '2026-08-23' menos n días, en el mismo formato. Sin zonas horarias: la
 *  fecha ya viene resuelta en Bogotá y aquí solo se resta calendario. */
export function restarDias(fecha: string, n: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  const x = new Date(Date.UTC(a, m - 1, d - n))
  const dd = (v: number) => String(v).padStart(2, '0')
  return `${x.getUTCFullYear()}-${dd(x.getUTCMonth() + 1)}-${dd(x.getUTCDate())}`
}

/** ¿Este día todavía se puede llenar? Ni el futuro ni más allá de la ventana. */
export function sePuedeLlenar(fecha: string, hoy: string): boolean {
  return fecha <= hoy && fecha >= restarDias(hoy, VENTANA_LLENADO - 1)
}

/** Las fechas de la ventana, de la más vieja a hoy. */
export function ventanaDeLlenado(hoy: string): string[] {
  return Array.from({ length: VENTANA_LLENADO }, (_, i) => restarDias(hoy, VENTANA_LLENADO - 1 - i))
}
