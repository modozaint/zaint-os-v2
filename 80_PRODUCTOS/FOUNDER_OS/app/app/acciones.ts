'use server'

import { conectar, hoyBogota, type Nivel } from '@/lib/supabase'
import { quincenaActual, tocaEstaQuincena, type Ritmo } from '@/lib/plata'
import { sePuedeLlenar, VENTANA_LLENADO } from '@/lib/tiempo'
import { filasDelMes } from '@/lib/cuadros'
import { pedirRevision } from '@/lib/datos'
import { revalidatePath } from 'next/cache'

/**
 * REFRESCAR lo que cambió — y por qué esto importa más de lo que parece.
 *
 * `/` (el cuarto) y `/habitos` leen LOS MISMOS datos: `cargarTablero()` y
 * `cargarHoy()`. Vida, XP, hábitos marcados, el plan del día.
 *
 * ⚠️ EL BUG QUE ESTO ARREGLA: hasta hoy casi todas las acciones llamaban solo
 * a `revalidatePath('/')` — porque `/` ERA la pantalla de hábitos hasta que se
 * mudó a `/habitos` el 26-ago. Nadie actualizó las llamadas. Sin caché de
 * navegación no se notaba (el servidor volvía a renderizar igual), pero con
 * ella `/habitos` se quedaría mostrando la vida vieja después de marcar.
 *
 * 🔑 Y es lo que permite que la app guarde las pantallas en vez de recargarlas
 * desde cero: se puede cachear porque lo que cambia se invalida de verdad.
 */
function refrescar(...rutas: string[]) {
  for (const r of new Set(['/', '/habitos', ...rutas])) revalidatePath(r)
}

/** Marca (o desmarca) un hábito hoy. Crea el día si no existe. */
export async function marcarHabito(habitoId: string, nivel: Nivel | null) {
  const db = await conectar()
  const fecha = hoyBogota()

  // La fila del dia se crea aqui, y hasta el 18-ago no se miraba si el insert
  // fallaba: el habito quedaba guardado y el dia no, asi que el historial no
  // tenia que listar y el cierre no tenia que cerrar. La vida nunca se movia.
  const { data: dia } = await db.from('dias').select('fecha').eq('fecha', fecha).maybeSingle()
  if (!dia) {
    const { error } = await db.from('dias').insert({ fecha, turno_id: null })
    if (error) {
      // Segundo intento con el dueno escrito a mano: si la tabla no le pone
      // `auth.uid()` por defecto, RLS rechaza la fila sin decir por que.
      const { data: sesion } = await db.auth.getUser()
      if (sesion.user) {
        await db.from('dias').insert({ fecha, turno_id: null, usuario_id: sesion.user.id })
      }
    }
  }

  if (nivel === null) {
    await db.from('registros').delete().eq('fecha', fecha).eq('habito_id', habitoId)
  } else {
    await db.from('registros')
      .upsert({ fecha, habito_id: habitoId, nivel }, { onConflict: 'fecha,habito_id' })
  }

  await db.rpc('meta_del_dia', { f: fecha })
  // Aquí es donde un día puede quedar huérfano: que la próxima carga revise.
  pedirRevision()
  refrescar()
}

/** El turno decide la exigencia del día. Es la regla que hace justo el sistema. */
export async function fijarTurno(turnoId: string) {
  const db = await conectar()
  const fecha = hoyBogota()
  const { data: sesion } = await db.auth.getUser()
  await db.from('dias').upsert(
    { fecha, turno_id: turnoId, ...(sesion.user ? { usuario_id: sesion.user.id } : {}) },
    { onConflict: 'fecha' },
  )
  refrescar()
}

/**
 * El turno de CUALQUIER dia, no solo el de hoy.
 *
 * Existe porque el cuadro de la clinica cambia cada mes y ademas cambia sobre
 * la marcha (11-ago: "el cuadro decia LIBRE y le cambiaron el turno"). Si el
 * turno solo se puede marcar el mismo dia, el sistema se queda ciego cada vez
 * que Santiago no abre la app — y el turno es lo que decide la meta, la
 * capacidad y si el dia resta vida.
 */
export async function fijarTurnoEnFecha(fecha: string, turnoId: string | null) {
  const db = await conectar()
  const { data: sesion } = await db.auth.getUser()

  const { error } = await db.from('dias').upsert(
    { fecha, turno_id: turnoId, ...(sesion.user ? { usuario_id: sesion.user.id } : {}) },
    { onConflict: 'fecha' },
  )
  if (error) return { error: error.message }

  // El dia de hoy y el plan dependen del turno: las dos pantallas se refrescan.
  refrescar('/turnos')
  return { ok: true }
}

/** Edita los tres niveles de un hábito. Cada nivel admite varias opciones con ' · '. */
export async function guardarHabito(
  habitoId: string,
  niveles: { minimo: string; normal: string; super: string }
) {
  const db = await conectar()
  await db.from('habitos').update({
    minimo: niveles.minimo.trim(),
    normal: niveles.normal.trim(),
    super: niveles.super.trim(),
  }).eq('id', habitoId)

  refrescar('/ajustes')
}

/** Guarda la nota libre de un registro: lo que hizo exactamente ese día. */
export async function guardarNota(habitoId: string, nota: string) {
  const db = await conectar()
  const fecha = hoyBogota()
  await db.from('registros')
    .update({ nota: nota.trim() || null })
    .eq('fecha', fecha).eq('habito_id', habitoId)
  refrescar()
}

/**
 * Enlaza al registro de hoy una foto que YA subio el navegador.
 *
 * El archivo no pasa por aqui a proposito. Antes se mandaba dentro de la Server
 * Action y Next corta el cuerpo en 1 MB (y Vercel en 4,5 MB): cualquier foto de
 * celular lo superaba y la subida se quedaba colgada sin decir por que. Ahora el
 * navegador sube directo a Supabase Storage y el servidor solo guarda la ruta.
 */
export async function guardarEvidencia(habitoId: string, ruta: string) {
  const db = await conectar()
  const fecha = hoyBogota()

  const { data: sesion } = await db.auth.getUser()
  if (!sesion.user) return { error: 'Sesión vencida. Vuelve a entrar.' }

  // La carpeta es el id del usuario: es lo que revisa la política del bucket.
  if (!ruta.startsWith(sesion.user.id + '/')) return { error: 'Ruta que no es tuya' }

  // El bucket es privado: se guarda la ruta y se firma al mostrarla.
  const { data: filas, error } = await db.from('registros')
    .update({ evidencia_url: ruta })
    .eq('fecha', fecha).eq('habito_id', habitoId)
    .select('habito_id')
  if (error) return { error: error.message }

  // Sin registro no hay donde colgar la foto, y marcar un nivel por cuenta
  // propia falsearia el historico. Se dice y se deja que Santiago elija.
  if (!filas || filas.length === 0) {
    return { error: 'Elige primero el nivel del hábito y vuelve a poner la foto.' }
  }

  const { data: firma } = await db.storage.from('evidencia').createSignedUrl(ruta, 60 * 60 * 8)
  refrescar()
  return { url: firma?.signedUrl ?? null }
}

/** Onboarding: guarda la configuración base del usuario. */
export async function guardarConfig(datos: {
  nombre: string; norte: string; meta_12m: string; trabaja_por_turnos: boolean
}) {
  const db = await conectar()
  await db.from('config').upsert({ ...datos }, { onConflict: 'usuario_id' })
  refrescar('/inicio')
}

/** Cierra el onboarding. A partir de aquí la app arranca en Hoy. */
export async function terminarOnboarding() {
  const db = await conectar()
  await db.from('config').update({ onboarding_hecho: true }).not('id', 'is', null)
  refrescar('/inicio')
}

/** Crea un hábito nuevo. El onboarding lo usa; Ajustes también. */
export async function crearHabito(h: {
  id: string; nombre: string; area_id: string
  minimo: string; normal: string; super: string; porque?: string; icono?: string
}) {
  const db = await conectar()
  const { data: ultimo } = await db.from('habitos')
    .select('orden').order('orden', { ascending: false }).limit(1).maybeSingle()

  const { error } = await db.from('habitos').insert({
    ...h, orden: (ultimo?.orden ?? 0) + 1, activo: true,
  })
  if (error) return { error: error.message }

  refrescar('/ajustes')
  return { ok: true }
}

/** Desactiva un hábito sin borrar su histórico. */
export async function archivarHabito(habitoId: string) {
  const db = await conectar()
  await db.from('habitos').update({ activo: false }).eq('id', habitoId)
  refrescar('/ajustes')
}

/** Edita un área: su nombre y su definición de "ganar". */
export async function guardarArea(id: string, nombre: string, definicion: string) {
  const db = await conectar()
  await db.from('areas').update({ nombre, definicion_ganar: definicion }).eq('id', id)
  refrescar('/areas', '/inicio')
}

/** Escribe (o reemplaza) la única cosa de hoy. */
export async function fijarTarea(texto: string, peldano: number, minutos: number | null) {
  const db = await conectar()
  const fecha = hoyBogota()
  await db.from('tareas').upsert(
    { fecha, texto: texto.trim(), peldano, minutos, hecha: false },
    { onConflict: 'fecha' }
  )
  refrescar()
}

/** Marca la tarea del día como hecha, o la desmarca. */
export async function marcarTarea(hecha: boolean) {
  const db = await conectar()
  const fecha = hoyBogota()
  await db.from('tareas')
    .update({ hecha, hecha_en: hecha ? new Date().toISOString() : null })
    .eq('fecha', fecha)
  refrescar()
}

/** Añade una tarea a la lista. No se asigna a un día: el día la toma si cabe. */
export async function crearTarea(datos: {
  texto: string; peldano: number; minutos: number | null
  area_id?: string | null; cuenta_id?: number | null
  origen?: 'mano' | 'voz'
}) {
  const db = await conectar()
  const { error } = await db.from('tareas').insert({
    texto: datos.texto.trim(),
    peldano: datos.peldano,
    minutos: datos.minutos,
    area_id: datos.area_id || null,
    cuenta_id: datos.cuenta_id ?? null,
    origen: datos.origen ?? 'mano',
    estado: 'pendiente',
  })
  if (error) return { error: error.message }
  refrescar('/tareas')
  return { ok: true }
}

/** Marca hecha o la devuelve a la lista. */
export async function cerrarTarea(id: number, hecha: boolean) {
  const db = await conectar()
  await db.from('tareas').update({
    estado: hecha ? 'hecha' : 'pendiente',
    hecha,
    hecha_en: hecha ? new Date().toISOString() : null,
    fecha: hecha ? hoyBogota() : null,
  }).eq('id', id)
  refrescar('/tareas')
}

export async function archivarTarea(id: number) {
  const db = await conectar()
  await db.from('tareas').update({ estado: 'archivada' }).eq('id', id)
  refrescar('/tareas')
}

export async function editarTarea(id: number, datos: {
  texto?: string; peldano?: number; minutos?: number | null
}) {
  const db = await conectar()
  await db.from('tareas').update(datos).eq('id', id)
  refrescar('/tareas')
}

/** Cambia el estado de una cuenta. El candado de máximo 2 activas vive en la BD. */
/**
 * El precio de la hora: lo que se quiere ganar dividido por las horas reales.
 * Se guarda para que la cuenta no haya que rehacerla de cabeza cada vez.
 */
export async function fijarPrecioHora(metaMes: number, horasMes: number) {
  const db = await conectar()
  const { error } = await db.from('config')
    .update({ meta_ingreso_mes: metaMes, horas_libres_mes: horasMes })
    .gte('vida_por_cumplido', 0)
  if (error) return { error: 'Falta correr la migración 013 en Supabase.' }
  refrescar('/tareas')
  return { ok: true }
}

/** Cuanto costaria que otro haga esta tarea, y quien. */
export async function fijarDelegacion(id: number, datos: {
  costo_delegar?: number | null; delegar_a?: string | null
}) {
  const db = await conectar()
  const { error } = await db.from('tareas').update(datos).eq('id', id)
  if (error) return { error: 'Falta correr la migración 013 en Supabase.' }
  refrescar('/tareas')
  return { ok: true }
}

/**
 * Marca que el pedido YA SE HIZO.
 *
 * Es el unico boton de esta pantalla que no cambia un numero sino un hecho. Lo
 * que quedo escrito en la sesion del 19-ago es que a Santiago no le falta saber
 * que delegar, le falta pedirlo — asi que decidir y pedir se cuentan aparte.
 */
export async function marcarPedido(id: number, enviado: boolean) {
  const db = await conectar()
  const { error } = await db.from('tareas').update({ pedido_enviado: enviado }).eq('id', id)
  if (error) return { error: 'Falta correr la migración 013 en Supabase.' }
  refrescar('/tareas')
  return { ok: true }
}

export async function cambiarEstadoCuenta(
  id: number,
  estado: 'activa' | 'mantenimiento' | 'dormida'
) {
  const db = await conectar()
  const { error } = await db.from('cuentas').update({ estado }).eq('id', id)
  if (error) return { error: error.message }
  refrescar('/tareas')
  return { ok: true }
}

/** Asigna (o quita) la cuenta de una tarea. */
export async function asignarCuenta(tareaId: number, cuentaId: number | null) {
  const db = await conectar()
  await db.from('tareas').update({ cuenta_id: cuentaId }).eq('id', tareaId)
  refrescar('/tareas')
}

/** Declara cuántas horas del mes se le asignan a una cuenta. */
export async function fijarHorasCuenta(id: number, horas: number | null) {
  const db = await conectar()
  await db.from('cuentas').update({ horas_mes: horas }).eq('id', id)
  refrescar('/tareas')
}

// ---------- DINERO PERSONAL (bolsillos) ----------
// Ojo: nada de aqui toca `cuentas`. Son dos mundos separados a proposito.

export async function crearBanco(nombre: string, saldo: number, color?: string) {
  const db = await conectar()
  const { error } = await db.from('bancos').insert({
    nombre: nombre.trim(), saldo_total: saldo, color: color ?? '#4A9CE8',
  })
  if (error) return { error: error.message }
  refrescar('/dinero')
  return { ok: true }
}

export async function fijarSaldoBanco(id: number, saldo: number) {
  const db = await conectar()
  await db.from('bancos').update({ saldo_total: saldo }).eq('id', id)
  refrescar('/dinero')
}

export async function borrarBanco(id: number) {
  const db = await conectar()
  await db.from('bancos').delete().eq('id', id)
  refrescar('/dinero')
}

export async function crearBolsillo(datos: {
  banco_id: number; nombre: string; asignacion_mes: number
  ritmo?: Ritmo; color?: string
}) {
  const db = await conectar()
  const { error } = await db.from('bolsillos').insert({
    banco_id: datos.banco_id,
    nombre: datos.nombre.trim(),
    asignacion_mes: datos.asignacion_mes,
    ritmo: datos.ritmo ?? 'quincenal',
    color: datos.color ?? '#E8A33D',
  })
  if (error) return { error: error.message }
  refrescar('/dinero')
  return { ok: true }
}

/** Cambia nombre, cuanto le entra al mes y cuando se llena. */
export async function editarBolsillo(id: number, datos: {
  nombre?: string; asignacion_mes?: number; ritmo?: Ritmo
}) {
  const db = await conectar()
  const cambios: Record<string, unknown> = {}
  if (datos.nombre !== undefined) cambios.nombre = datos.nombre.trim()
  if (datos.asignacion_mes !== undefined) cambios.asignacion_mes = datos.asignacion_mes
  if (datos.ritmo !== undefined) cambios.ritmo = datos.ritmo

  const { error } = await db.from('bolsillos').update(cambios).eq('id', id)
  if (error) {
    // La columna `ritmo` llega con la migracion 009. Sin ella el mensaje de
    // Postgres es criptico; este dice que hacer.
    if (/ritmo/.test(error.message)) {
      return { error: 'Falta correr la migración 009 en Supabase (009_quincenas.sql).' }
    }
    return { error: error.message }
  }
  refrescar('/dinero')
  return { ok: true }
}

/**
 * Llena de una todos los bolsillos que le toca esta quincena.
 * Es el ritual del dia de pago: en Parcero se hacia bolsillo por bolsillo.
 * Solo carga LO QUE FALTA — si ya metiste algo a mano, no lo duplica.
 */
export async function llenarQuincena() {
  const db = await conectar()
  const { data, error } = await db.from('bolsillos_con_saldo')
    .select('id,nombre,asignacion_mes,ritmo,cargado_quincena').order('orden')

  if (error) return { error: error.message }

  const q = quincenaActual()
  const filas = (data ?? []) as any[]

  if (filas.length > 0 && filas[0].ritmo === undefined) {
    return { error: 'Falta correr la migración 009 en Supabase (009_quincenas.sql).' }
  }

  const pendientes = filas
    .map(b => ({
      id: b.id as number,
      nombre: b.nombre as string,
      falta: Math.round(
        tocaEstaQuincena((b.ritmo ?? 'mensual') as Ritmo, Number(b.asignacion_mes ?? 0), q.n)
        - Number(b.cargado_quincena ?? 0),
      ),
    }))
    .filter(b => b.falta > 0)

  if (pendientes.length === 0) return { ok: true, cuantos: 0, total: 0 }

  const { error: fallo } = await db.from('movimientos').insert(
    pendientes.map(b => ({
      bolsillo_id: b.id,
      tipo: 'cargar' as const,
      monto: b.falta,
      nota: `Quincena ${q.n} · ${q.inicio.slice(8)}-${q.fin.slice(8)}`,
    })),
  )
  if (fallo) return { error: fallo.message }

  refrescar('/dinero')
  return { ok: true, cuantos: pendientes.length, total: pendientes.reduce((s, b) => s + b.falta, 0) }
}

export async function borrarBolsillo(id: number) {
  const db = await conectar()
  await db.from('bolsillos').delete().eq('id', id)
  refrescar('/dinero')
}

/** Cargar mete plata al bolsillo; descargar la saca. El saldo sale de aqui. */
export async function moverPlata(datos: {
  bolsillo_id: number; tipo: 'cargar' | 'descargar'; monto: number; nota?: string
}) {
  const db = await conectar()
  if (!(datos.monto > 0)) return { error: 'El monto tiene que ser mayor que cero' }
  const { error } = await db.from('movimientos').insert({
    bolsillo_id: datos.bolsillo_id,
    tipo: datos.tipo,
    monto: datos.monto,
    nota: datos.nota?.trim() || null,
  })
  if (error) return { error: error.message }
  refrescar('/dinero')
  return { ok: true }
}

export async function borrarMovimiento(id: number) {
  const db = await conectar()
  await db.from('movimientos').delete().eq('id', id)
  refrescar('/dinero')
}

// ============================================================
// LLENAR DÍAS HACIA ATRÁS  ·  Santiago, 2026-08-23
//
// El caso real: hizo los hábitos y no abrió la app (turno de 12 h, o el día
// que se acostó derecho). El día quedó vacío aunque no lo estuvo. Hasta hoy
// solo se podía marcar el día en curso, así que esos días se perdían.
//
// El límite de una semana es suyo y es el que hace que esto siga siendo un
// histórico: se llena lo que todavía se recuerda, no se reescribe el pasado.
//
// ⚠️ LO QUE ESTO NO HACE, Y ES A PROPÓSITO: no vuelve a mover la vida de un
// día ya cerrado. `cerrar_dia` cobra UNA vez (ese candado es lo que permite
// llamarla de más), y descerrar un día para recobrarlo duplicaría el balance
// que ya se aplicó. Lo que se marca tarde suma XP, sube el área y queda en el
// historial; la vida de ese día quedó como quedó. La pantalla lo dice.
// ============================================================

/** Marca (o quita) un hábito en CUALQUIER día de la última semana. */
export async function marcarHabitoEnFecha(
  fecha: string, habitoId: string, nivel: Nivel | null,
) {
  const db = await conectar()
  const hoy = hoyBogota()

  if (!sePuedeLlenar(fecha, hoy)) {
    return { error: `Solo se pueden llenar los últimos ${VENTANA_LLENADO} días.` }
  }

  // `registros.fecha` apunta a `dias.fecha`: sin la fila del día, el insert
  // del hábito lo rechaza la llave foránea. Mismo doble intento que
  // `marcarHabito` — si la tabla no pone `auth.uid()` sola, RLS tumba la fila
  // sin decir por qué.
  const { data: dia } = await db.from('dias')
    .select('fecha, cerrado').eq('fecha', fecha).maybeSingle()

  if (!dia) {
    const { error } = await db.from('dias').insert({ fecha, turno_id: null })
    if (error) {
      const { data: sesion } = await db.auth.getUser()
      if (!sesion.user) return { error: 'Sesión vencida. Vuelve a entrar.' }
      const { error: segundo } = await db.from('dias')
        .insert({ fecha, turno_id: null, usuario_id: sesion.user.id })
      if (segundo) return { error: segundo.message }
    }
  }

  if (nivel === null) {
    const { error } = await db.from('registros')
      .delete().eq('fecha', fecha).eq('habito_id', habitoId)
    if (error) return { error: error.message }
  } else {
    const { error } = await db.from('registros')
      .upsert({ fecha, habito_id: habitoId, nivel }, { onConflict: 'fecha,habito_id' })
    if (error) return { error: error.message }
  }

  await db.rpc('meta_del_dia', { f: fecha })
  refrescar('/historial')
  return { ok: true, cerrado: Boolean((dia as any)?.cerrado) }
}

/** La nota de un hábito marcado tarde: qué hizo exactamente ese día. */
export async function guardarNotaEnFecha(fecha: string, habitoId: string, nota: string) {
  const db = await conectar()
  if (!sePuedeLlenar(fecha, hoyBogota())) return { error: 'Fuera de la semana editable.' }
  const { error } = await db.from('registros')
    .update({ nota: nota.trim() || null })
    .eq('fecha', fecha).eq('habito_id', habitoId)
  if (error) return { error: error.message }
  refrescar('/historial')
  return { ok: true }
}

// ---------- LA BITÁCORA (el cuaderno del escritorio) ----------
// Una entrada por día, en `dias.apunte` — la columna existe desde el esquema
// inicial y el historial ya la muestra. No hace falta tabla nueva ni migración
// que alguien tenga que acordarse de correr en Supabase.

/** Escribe (o borra) la entrada del cuaderno de un día. */
export async function guardarApunte(fecha: string, texto: string) {
  const db = await conectar()
  const hoy = hoyBogota()
  if (!sePuedeLlenar(fecha, hoy)) {
    return { error: `El cuaderno se escribe dentro de los últimos ${VENTANA_LLENADO} días.` }
  }

  const limpio = texto.trim() || null
  const { data: dia } = await db.from('dias').select('fecha').eq('fecha', fecha).maybeSingle()

  if (dia) {
    const { error } = await db.from('dias').update({ apunte: limpio }).eq('fecha', fecha)
    if (error) return { error: error.message }
  } else {
    const { data: sesion } = await db.auth.getUser()
    const { error } = await db.from('dias').insert({
      fecha, turno_id: null, apunte: limpio,
      ...(sesion.user ? { usuario_id: sesion.user.id } : {}),
    })
    if (error) return { error: error.message }
  }

  refrescar('/historial')
  return { ok: true }
}

// ============================================================
// CARGAR EL CUADRO DE UN MES  ·  §4.5 del plan del 2026-08-26
//
// El cuadro llega en PDF, lo lee el vault y de ahí se transcribe a
// `lib/cuadros.ts`. Esta acción lo baja a la tabla `dias`.
//
// ⚠️ CORRE CON LA SESIÓN DE SANTIAGO A PROPÓSITO, y no desde un script: la
// base tiene RLS y la app solo lleva la clave PÚBLICA. Un script de fuera no
// puede escribir estas filas — y está bien que no pueda.
//
// 🔒 NO PISA LO YA VIVIDO. Si un día del mes ya está cerrado o ya tiene
// hábitos marcados, se respeta y se cuenta aparte. Un cuadro se recarga
// cuando cambia, y recargar no puede significar borrar lo que pasó.
// ============================================================

export async function cargarCuadroDelMes(mes: string) {
  const db = await conectar()
  const filas = filasDelMes(mes)
  if (filas.length === 0) return { error: `No hay cuadro leído para ${mes}.` }

  const { data: sesion } = await db.auth.getUser()
  if (!sesion.user) return { error: 'Sesión vencida. Vuelve a entrar.' }

  const desde = filas[0].fecha, hasta = filas[filas.length - 1].fecha

  // Lo que ya existe del mes, en UNA sola ida: los días y sus registros.
  const [dias, registros] = await Promise.all([
    db.from('dias').select('fecha, turno_id, cerrado').gte('fecha', desde).lte('fecha', hasta),
    db.from('registros').select('fecha').gte('fecha', desde).lte('fecha', hasta),
  ])

  const yaEsta = new Map((dias.data ?? []).map((d: any) => [d.fecha as string, d]))
  const conHabitos = new Set((registros.data ?? []).map((r: any) => r.fecha as string))

  const nuevas: { fecha: string; turno_id: string; usuario_id: string }[] = []
  let corregidas = 0, respetadas = 0, iguales = 0

  for (const f of filas) {
    const d: any = yaEsta.get(f.fecha)

    if (!d) { nuevas.push({ fecha: f.fecha, turno_id: f.turno, usuario_id: sesion.user.id }); continue }
    if (d.cerrado || conHabitos.has(f.fecha)) { respetadas++; continue }
    if (d.turno_id === f.turno) { iguales++; continue }

    const { error } = await db.from('dias').update({ turno_id: f.turno }).eq('fecha', f.fecha)
    if (!error) corregidas++
  }

  if (nuevas.length > 0) {
    const { error } = await db.from('dias').insert(nuevas)
    if (error) {
      // Sin la columna del dueño: se crea lo mínimo, que ya sirve.
      const { error: segundo } = await db.from('dias')
        .insert(nuevas.map(({ fecha, turno_id }) => ({ fecha, turno_id })))
      if (segundo) return { error: segundo.message }
    }
  }

  refrescar('/turnos')
  return {
    ok: true,
    creadas: nuevas.length,
    corregidas,
    iguales,
    respetadas,
    total: filas.length,
  }
}
