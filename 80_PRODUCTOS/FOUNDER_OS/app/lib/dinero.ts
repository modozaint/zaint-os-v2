import { conectar } from './supabase'
import { quincenaActual, tocaEstaQuincena, type Banco, type Bolsillo, type Movimiento, type Ritmo } from './plata'

export * from './plata'

/**
 * Dinero PERSONAL, por sobres. Reemplaza el uso diario de Parcero Financiero.
 *
 * ⚠️ No se cruza nunca con `cuentas` (las unidades de ZAINT, que miden horas).
 * Son dos mundos distintos y no comparten ni una llave: asi no se pueden sumar
 * por accidente el dia que se pregunte cuanto gano el negocio.
 */

export async function cargarDinero() {
  const db = await conectar()

  const [bancos, bolsillos, movimientos] = await Promise.all([
    db.from('bancos_con_disponible').select('*').order('orden').then(r => r, () => ({ data: [] })),
    db.from('bolsillos_con_saldo').select('*').order('orden').then(r => r, () => ({ data: [] })),
    db.from('movimientos').select('*').order('fecha', { ascending: false })
      .limit(60).then(r => r, () => ({ data: [] })),
  ])

  // `ritmo` y `cargado_quincena` llegan con la migracion 009. Si todavia no se
  // corrio, la app sigue funcionando como antes en vez de romperse.
  const lista = ((bolsillos.data ?? []) as any[]).map(b => ({
    ...b,
    saldo: Number(b.saldo ?? 0),
    asignacion_mes: Number(b.asignacion_mes ?? 0),
    meta: b.meta === null ? null : Number(b.meta),
    ritmo: (b.ritmo ?? 'mensual') as Ritmo,
    cargado_quincena: Number(b.cargado_quincena ?? 0),
  })) as Bolsillo[]

  const cuentas = ((bancos.data ?? []) as any[]).map(b => ({
    ...b,
    saldo_total: Number(b.saldo_total ?? 0),
    en_bolsillos: Number(b.en_bolsillos ?? 0),
    disponible: Number(b.disponible ?? 0),
  })) as Banco[]

  const movs = ((movimientos.data ?? []) as any[]).map(m => ({
    ...m, monto: Number(m.monto),
  })) as Movimiento[]

  // La quincena en curso: cuanto toca meter, cuanto lleva, cuanto falta.
  const q = quincenaActual()
  const tocaQuincena = lista.reduce(
    (s, b) => s + tocaEstaQuincena(b.ritmo, b.asignacion_mes, q.n), 0,
  )
  const cargadoQuincena = lista.reduce((s, b) => s + b.cargado_quincena, 0)

  return {
    bancos: cuentas,
    bolsillos: lista,
    movimientos: movs,
    total: cuentas.reduce((s, b) => s + b.saldo_total, 0),
    // Lo que deberia entrar cada mes si todos los bolsillos se llenan.
    asignadoMes: lista.reduce((s, b) => s + b.asignacion_mes, 0),
    quincena: q,
    tocaQuincena,
    cargadoQuincena,
    faltaQuincena: Math.max(0, tocaQuincena - cargadoQuincena),
    listo: cuentas.length > 0 || lista.length > 0,
  }
}

import { calcular, type Categoria, type Concepto, type Escenario, type Resumen } from './plata'

/** Carga los dos escenarios del presupuesto, ya calculados. */
export async function cargarPresupuesto(): Promise<{
  antes: Resumen | null; despues: Resumen | null; hay: boolean
}> {
  const db = await conectar()

  const [cabeceras, cats, lineas, conceptos] = await Promise.all([
    db.from('presupuesto').select('*').then(r => r, () => ({ data: [] })),
    db.from('categorias_gasto').select('*').order('orden').then(r => r, () => ({ data: [] })),
    db.from('presupuesto_lineas').select('*').then(r => r, () => ({ data: [] })),
    db.from('presupuesto_conceptos').select('*').order('orden').then(r => r, () => ({ data: [] })),
  ])

  const detalle = ((conceptos.data ?? []) as any[]).map(c => ({
    ...c, monto_mes: Number(c.monto_mes),
  })) as Concepto[]

  const categorias = ((cats.data ?? []) as any[]).map(c => ({
    ...c, ideal_pct: Number(c.ideal_pct),
  })) as Categoria[]

  if (categorias.length === 0) return { antes: null, despues: null, hay: false }

  const arma = (e: Escenario): Resumen | null => {
    const cab = ((cabeceras.data ?? []) as any[]).find(c => c.escenario === e)
    if (!cab) return null
    const montos = new Map<number, number>(
      ((lineas.data ?? []) as any[])
        .filter(l => l.escenario === e)
        .map(l => [l.categoria_id as number, Number(l.monto)])
    )
    return calcular(e, Number(cab.ingresos), Number(cab.ahorro), categorias, montos, detalle)
  }

  return { antes: arma('antes'), despues: arma('despues'), hay: true }
}

import type { Bloque, Diagnostico } from './plata'

/** El informe del asesor. No se calcula nada: se escribió una vez y se relee. */
export async function cargarDiagnostico(): Promise<Diagnostico | null> {
  const db = await conectar()

  const [cab, bloques] = await Promise.all([
    db.from('diagnostico').select('*').maybeSingle().then(r => r, () => ({ data: null })),
    db.from('diagnostico_bloques').select('*').order('orden').then(r => r, () => ({ data: [] })),
  ])

  const d = (cab as any).data
  if (!d) return null

  const lista = ((bloques as any).data ?? []) as Bloque[]
  return {
    ...d,
    te_entra: Number(d.te_entra ?? 0),
    te_sale: Number(d.te_sale ?? 0),
    diferencia: Number(d.diferencia ?? 0),
    nivel_endeudamiento: Number(d.nivel_endeudamiento ?? 0),
    gastos_fijos_pct: Number(d.gastos_fijos_pct ?? 0),
    capacidad_endeudamiento: Number(d.capacidad_endeudamiento ?? 0),
    perfil: lista.filter(b => b.tipo === 'perfil'),
    recomendaciones: lista.filter(b => b.tipo === 'recomendacion'),
  }
}
