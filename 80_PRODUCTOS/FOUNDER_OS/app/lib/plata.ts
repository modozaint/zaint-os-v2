/**
 * Tipos y formato de dinero. Puro, sin base de datos: lo puede importar una
 * pantalla del navegador. `lib/dinero.ts` trae `next/headers` y no puede.
 */

export type Banco = {
  id: number
  nombre: string
  saldo_total: number
  color: string
  orden: number
  en_bolsillos: number
  disponible: number
}

/**
 * Cuando se llena un bolsillo. La plata entra dos veces al mes, asi que el mes
 * solo no alcanza para decidir que hacer un 16.
 *   quincenal → mitad en cada quincena
 *   q1        → completo, con la primera (1-15)
 *   q2        → completo, con la segunda (16-fin)
 *   mensual   → el heredado; se comporta como q1
 */
export type Ritmo = 'mensual' | 'quincenal' | 'q1' | 'q2'

export type Bolsillo = {
  id: number
  banco_id: number
  nombre: string
  asignacion_mes: number
  meta: number | null
  color: string
  orden: number
  saldo: number
  n_movimientos: number
  ritmo: Ritmo
  /** Cuanto se ha cargado en la quincena en curso. */
  cargado_quincena: number
}

export type Movimiento = {
  id: number
  bolsillo_id: number
  tipo: 'cargar' | 'descargar'
  monto: number
  nota: string | null
  fecha: string
}

/** $ 1.588.985 — pesos colombianos, sin decimales, que es como se leen. */
export function pesos(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

// ---------- Quincenas ----------
// La unidad real de la plata de Santiago: le entra dos veces al mes. Todo esto
// es puro y se calcula en Bogota, no en UTC — un 16 a la medianoche en UTC
// todavia es 15 aca, y eso cambiaria de quincena antes de tiempo.

export type Quincena = {
  n: 1 | 2
  /** '2026-08-16' — primer dia de la quincena. */
  inicio: string
  /** '2026-08-31' — ultimo dia. */
  fin: string
  etiqueta: string
  /** Dias que faltan para que termine, contando hoy. */
  diasRestantes: number
}

function partesBogota(d = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
  const [a, m, dia] = f.split('-').map(Number)
  return { a, m, dia }
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function quincenaActual(ahora = new Date()): Quincena {
  const { a, m, dia } = partesBogota(ahora)
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  const dd = (n: number) => String(n).padStart(2, '0')
  const n: 1 | 2 = dia <= 15 ? 1 : 2

  const desde = n === 1 ? 1 : 16
  const hasta = n === 1 ? 15 : ultimo

  return {
    n,
    inicio: `${a}-${dd(m)}-${dd(desde)}`,
    fin: `${a}-${dd(m)}-${dd(hasta)}`,
    etiqueta: `${n === 1 ? 'Primera' : 'Segunda'} quincena · ${desde}–${hasta} de ${MESES[m - 1]}`,
    diasRestantes: hasta - dia + 1,
  }
}

/** Cuanto le toca entrar a este bolsillo en la quincena que corre. */
export function tocaEstaQuincena(ritmo: Ritmo, asignacionMes: number, n: 1 | 2): number {
  if (asignacionMes <= 0) return 0
  switch (ritmo) {
    case 'quincenal': return Math.round(asignacionMes / 2)
    case 'q2': return n === 2 ? asignacionMes : 0
    case 'q1':
    case 'mensual':
    default: return n === 1 ? asignacionMes : 0
  }
}

export const RITMOS: { valor: Ritmo; texto: string; pista: string }[] = [
  { valor: 'quincenal', texto: 'Cada quincena', pista: 'mitad y mitad' },
  { valor: 'q1', texto: 'Con la primera', pista: 'todo el 1–15' },
  { valor: 'q2', texto: 'Con la segunda', pista: 'todo el 16–fin' },
]

export function nombreRitmo(r: Ritmo): string {
  if (r === 'quincenal') return 'cada quincena'
  if (r === 'q2') return 'con la 2ª quincena'
  return 'con la 1ª quincena'
}

// ---------- Presupuesto ----------

export type Escenario = 'antes' | 'despues'

export type Categoria = {
  id: number
  nombre: string
  ideal_pct: number
  color: string
  mas_es_mejor: boolean
  orden: number
}

export type Concepto = {
  id: number
  categoria_id: number
  grupo: string | null
  concepto: string
  detalle: string | null
  monto_mes: number
  activo: boolean
  orden: number
}

export type LineaPresupuesto = Categoria & {
  conceptos: Concepto[]
  monto: number
  /** Qué porcentaje de los ingresos se lleva de verdad. */
  pct: number
  /** Cuánto sobra o falta contra el ideal. Positivo = te queda margen. */
  diferencia: number
  /** true = está dentro de lo sano. */
  sano: boolean
}

export type Resumen = {
  escenario: Escenario
  ingresos: number
  gastos: number
  ahorro: number
  excedente: number
  /** Porcentaje de los ingresos que se va en gastos. */
  usadoPct: number
  /** Lo que queda para ahorrar e invertir. */
  capacidadPct: number
  lineas: LineaPresupuesto[]
  /** Hogar + necesidades, que se leen juntas. Lo ideal es 50-60%. */
  fijos: number
  fijosPct: number
}

/**
 * El cálculo del presupuesto, igual que lo muestra Parcero.
 * Los gastos NO incluyen el ahorro: ahorrar no es gastar, y meterlo dentro
 * haría ver un déficit donde hay disciplina.
 */
export function calcular(
  escenario: Escenario,
  ingresos: number,
  ahorro: number,
  cats: Categoria[],
  montos: Map<number, number>,
  conceptos: Concepto[] = [],
): Resumen {
  const lineas: LineaPresupuesto[] = cats.map(c => {
    const monto = montos.get(c.id) ?? 0
    const suyos = conceptos.filter(x => x.categoria_id === c.id)
    const pct = ingresos > 0 ? (monto / ingresos) * 100 : 0
    const ideal = (c.ideal_pct / 100) * ingresos
    const diferencia = c.mas_es_mejor ? monto - ideal : ideal - monto
    return { ...c, conceptos: suyos, monto, pct, diferencia, sano: diferencia >= 0 }
  })

  const gastos = lineas
    .filter(l => !l.mas_es_mejor)
    .reduce((s, l) => s + l.monto, 0)

  const fijos = lineas
    .filter(l => /hogar|necesidad/i.test(l.nombre))
    .reduce((s, l) => s + l.monto, 0)

  return {
    escenario,
    ingresos,
    gastos,
    ahorro,
    excedente: ingresos - gastos - ahorro,
    usadoPct: ingresos > 0 ? (gastos / ingresos) * 100 : 0,
    capacidadPct: ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0,
    lineas,
    fijos,
    fijosPct: ingresos > 0 ? (fijos / ingresos) * 100 : 0,
  }
}

/** 19,8 % — con coma decimal, como se lee en Colombia. */
export function pct(n: number): string {
  return n.toFixed(1).replace('.', ',') + ' %'
}

// ---------- Diagnóstico de la asesoría ----------

export type Bloque = {
  id: number
  tipo: 'perfil' | 'recomendacion'
  titulo: string
  cuerpo: string
  orden: number
}

export type Diagnostico = {
  fecha_asesoria: string | null
  te_entra: number
  te_sale: number
  diferencia: number
  capacidad_ahorro: string | null
  nivel_endeudamiento: number
  gastos_fijos_pct: number
  capacidad_endeudamiento: number
  creias: string | null
  mini_plan: string | null
  plan_fondo: string | null
  mensaje: string | null
  perfil: Bloque[]
  recomendaciones: Bloque[]
}
