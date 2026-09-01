import { conectar, hoyBogota } from './supabase'
import { comoSeLlamaElDia, libreDeReloj, minutosEntre } from './tiempo'
import type { Cuenta, Encaje, Peldano, Tarea } from './tiempo'

export * from './tiempo'

/**
 * La lógica de /hoy, dentro de la app. Sin IA: es determinista.
 * turno → capacidad → qué cabe de la lista, ordenado por cercanía a la venta.
 */

export async function cargarHoy() {
  const db = await conectar()
  const fecha = hoyBogota()

  const [dia, peldanos, encaje, hechas, config] = await Promise.all([
    db.from('dias').select('*, turnos(*)').eq('fecha', fecha).maybeSingle(),
    db.from('peldanos').select('*').order('n'),
    db.rpc('tareas_que_caben', { f: fecha }),
    db.from('tareas').select('*').eq('estado', 'hecha').eq('fecha', fecha),
    db.from('config').select('hora_despertar, hora_dormir').maybeSingle(),
  ])

  const turno = (dia.data as any)?.turnos ?? null
  const capacidad: number = turno?.capacidad_min ?? 0
  const lista = (encaje.data ?? []) as Encaje[]
  const caben = lista.filter(t => t.cabe)
  const noCaben = lista.filter(t => !t.cabe)

  // Tiempo de reloj vs capacidad real: dos cosas distintas, ambas visibles
  const despierto = minutosEntre(config.data?.hora_despertar, config.data?.hora_dormir)
  const libreBruto = libreDeReloj(config.data, turno)

  return {
    fecha,
    turno,
    capacidad,
    tipoDeDia: comoSeLlamaElDia(capacidad),
    despierto,
    libreBruto,
    peldanos: (peldanos.data ?? []) as Peldano[],
    caben,
    noCaben,
    hechasHoy: (hechas.data ?? []) as Tarea[],
    minutosAsignados: caben.reduce((s, t) => s + t.minutos, 0),
  }
}




export async function cargarLista() {
  const db = await conectar()

  // Un usuario nuevo entraba a una app vacia. Esto le da un punto de partida
  // generico y se apaga solo en cuanto ya tiene areas.
  // Si la migracion todavia no corrio, la funcion no existe: no es motivo para
  // tumbar la pantalla entera.
  await db.rpc('sembrar_usuario_nuevo').then(() => {}, () => {})

  const [tareas, peldanos, areas, cuentas, cfg] = await Promise.all([
    db.from('tareas').select('*').neq('estado', 'archivada')
      .order('estado').order('peldano').order('id'),
    db.from('peldanos').select('*').order('n'),
    db.from('areas').select('id, nombre, color').order('orden'),
    // Idem: sin la tabla `cuentas` la app funciona, solo que sin cuentas.
    db.from('cuentas').select('*').order('orden').then(r => r, () => ({ data: [] })),
    // Si la 013 todavia no corrio, las columnas no existen: se usan los valores
    // con los que Santiago hizo la cuenta el 19-ago y la pantalla no se cae.
    db.from('config').select('meta_ingreso_mes, horas_libres_mes').maybeSingle()
      .then(r => r, () => ({ data: null })),
  ])

  const lista = (tareas.data ?? []) as Tarea[]

  const metaIngreso = Number((cfg as any)?.data?.meta_ingreso_mes ?? 2500000)
  const horasLibres = Number((cfg as any)?.data?.horas_libres_mes ?? 35)

  // Cada cuenta lleva su carga a cuestas: cuantas tareas y cuantos minutos
  // esperan por ella. Es lo que hace visible que las horas son finitas.
  const conCarga: Cuenta[] = ((cuentas.data ?? []) as Cuenta[]).map(c => {
    const suyas = lista.filter(t => (t as any).cuenta_id === c.id && t.estado !== 'hecha')
    return {
      ...c,
      pendientes: suyas.length,
      minutos: suyas.reduce((s, t) => s + (t.minutos ?? 0), 0),
    }
  })

  return {
    tareas: lista,
    peldanos: (peldanos.data ?? []) as Peldano[],
    areas: areas.data ?? [],
    cuentas: conCarga,
    sinCuenta: lista.filter(t => !(t as any).cuenta_id && t.estado !== 'hecha').length,
    metaIngreso,
    horasLibres,
  }
}
