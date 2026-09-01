import { conectar, hoyBogota } from './supabase'

export type Area = {
  id: string; nombre: string; color: string; orden: number
  xp_total: number; nivel: number; xp_en_nivel: number
}
export type Habito = {
  id: string; nombre: string; area_id: string
  minimo: string; normal: string; super: string; orden: number
  porque: string | null
  icono: string | null
  nivel_hoy: string | null
  nota_hoy: string | null
  evidencia_hoy: string | null
}
export type Turno = {
  id: string; nombre: string; meta_nivel: string; meta_habitos: number; descripcion: string
}

/**
 * Los datos que existían antes del auth no tenían dueño. La primera vez que
 * Santiago entra, se los queda. La función de la BD solo responde a su correo,
 * así que un desconocido que cree cuenta no puede reclamarlos.
 * Cuesta una consulta de conteo y se apaga sola en cuanto hay áreas.
 */
/**
 * Cuándo se revisó por última vez, en ESTA instancia del servidor.
 *
 * ⚠️ La reparación NO se quita —el bug del 16-18 de agosto costó dos días y
 * dejó la vida congelada en 1000— pero preguntar por él en CADA carga es pagar
 * el arreglo entero cada vez que se abre una pantalla: son 3 viajes a Canadá,
 * ~600 ms, y en el 99 % de las veces no repara nada.
 *
 * Ahora corre cada 10 minutos, y **de inmediato cuando hay motivo**: marcar un
 * hábito llama a `pedirRevision()`, que es justo el momento en que un día
 * puede quedar huérfano. Repara cuando puede haber algo roto, no por si acaso.
 */
let ultimaRevision = 0
const CADA = 10 * 60 * 1000

/** Marca que hay motivo para revisar en la próxima carga. La llama `marcarHabito`. */
export function pedirRevision() {
  ultimaRevision = 0
}

export async function asegurarDatos() {
  if (Date.now() - ultimaRevision < CADA) return null
  ultimaRevision = Date.now()

  const db = await conectar()
  const { count } = await db.from('areas').select('id', { count: 'exact', head: true })
  if (!count || count === 0) {
    const { data } = await db.rpc('reclamar_datos_iniciales')
    return data as string | null
  }
  await repararDias(db)
  return null
}

/**
 * Repara los dias que faltan. Corre sola al abrir la app.
 *
 * EL BUG QUE ARREGLA (16-18 ago): el historial no mostraba los dias anteriores
 * y la vida no bajaba de 1000. Las dos cosas son el mismo hueco — no habia
 * fila en `dias`, y sin fila no hay dia que listar ni que cerrar.
 *
 * Dos causas, las dos cubiertas aqui:
 *   a) `marcarHabito` insertaba la fila sin mirar si fallaba.
 *   b) Los dias migrados de Notion quedaron sin dueno y RLS se los esconde a
 *      su propio dueno. `reclamar_datos_iniciales` existe para adoptarlos,
 *      pero solo se llamaba cuando no habia NI UN area — o sea, una sola vez
 *      en la vida de la cuenta. Lo huerfano que llegara despues se quedaba asi
 *      para siempre.
 *
 * El perdon retroactivo de los dias huerfanos ya se aplico una vez (20-ago):
 * los del 8 al 18 quedaron cerrados sin cobrar. De aqui en adelante los dias
 * que falten nacen abiertos y se cobran normal.
 *
 * Cuesta dos consultas de una sola columna y no hace nada mas si esta todo en
 * orden, que es el caso normal.
 */
async function repararDias(db: Awaited<ReturnType<typeof conectar>>) {
  const [regs, dias] = await Promise.all([
    db.from('registros').select('fecha'),
    db.from('dias').select('fecha'),
  ])

  const conHabitos = [...new Set((regs.data ?? []).map((r: any) => r.fecha as string))]
  if (conHabitos.length === 0) return

  const yaEstan = new Set((dias.data ?? []).map((d: any) => d.fecha as string))
  if (conHabitos.every(f => yaEstan.has(f))) return

  // Primero se intenta adoptar: puede que las filas existan y no se vean.
  await db.rpc('reclamar_datos_iniciales')

  const { data: despues } = await db.from('dias').select('fecha')
  const visibles = new Set((despues ?? []).map((d: any) => d.fecha as string))
  const faltan = conHabitos.filter(f => !visibles.has(f))
  if (faltan.length === 0) return

  const { data: sesion } = await db.auth.getUser()
  // Nacen ABIERTOS para que `cerrar_dia` los cobre con su cuenta completa
  // (cumplidos, incumplidos, balance) en vez de aparecer ya cerrados y sin
  // estadisticas. El 20-ago quedo a la vista: los dias que se crearon cerrados
  // no pasaron nunca por el cierre, y un dia que no se cobra es un dia que
  // premia no abrir la app.
  const filas = faltan.map(fecha => ({ fecha, usuario_id: sesion.user?.id }))

  const { error } = await db.from('dias').insert(filas)
  if (error) {
    // Sin esas columnas en la tabla: se crea lo minimo, que ya destapa el dia.
    await db.from('dias').insert(faltan.map(fecha => ({ fecha })))
  }
}

export async function cargarTablero() {
  const db = await conectar()
  const fecha = hoyBogota()

  // No hay servidor de tareas programadas: el cierre es perezoso. Al abrir la
  // app se cierran los días que ya pasaron de la hora de dormir, y ahí se
  // mueve la vida. Es idempotente, así que llamarlo de más no hace daño.
  await db.rpc('cerrar_dias_pendientes')

  const [areas, habitos, registros, avatar, dia, cfg] = await Promise.all([
    db.from('niveles_por_area').select('*').order('orden'),
    db.from('habitos').select('*').eq('activo', true).order('orden'),
    db.from('registros').select('habito_id, nivel, nota, evidencia_url').eq('fecha', fecha),
    db.from('avatar').select('vida, vida_maxima').maybeSingle(),
    db.from('dias').select('*, turnos(*)').eq('fecha', fecha).maybeSingle(),
    db.from('config').select('vida_por_cumplido, vida_por_incumplido, hora_dormir, frase').maybeSingle(),
  ])

  const marcados = new Map((registros.data ?? []).map(r => [r.habito_id, r]))

  // El bucket es privado: lo guardado es la ruta, así que hay que firmarla.
  const rutasFoto = (registros.data ?? [])
    .map(r => r.evidencia_url).filter(Boolean) as string[]
  const firmadas = new Map<string, string>()
  if (rutasFoto.length) {
    const { data: firmas } = await db.storage.from('evidencia')
      .createSignedUrls(rutasFoto, 60 * 60 * 8)
    for (const f of firmas ?? []) {
      if (f.path && f.signedUrl) firmadas.set(f.path, f.signedUrl)
    }
  }

  const lista: Habito[] = (habitos.data ?? []).map(h => {
    const r = marcados.get(h.id)
    const ruta = r?.evidencia_url ?? null
    return {
      ...h,
      nivel_hoy: r?.nivel ?? null,
      nota_hoy: r?.nota ?? null,
      // Compatibilidad: los registros viejos guardaron una URL completa.
      evidencia_hoy: ruta ? (ruta.startsWith('http') ? ruta : firmadas.get(ruta) ?? null) : null,
    }
  })

  const turno = (dia.data as any)?.turnos as Turno | undefined
  const metaHabitos = turno?.meta_habitos ?? 0
  const metaNivel = turno?.meta_nivel ?? 'ninguno'

  const cumplidos = lista.filter(h =>
    h.nivel_hoy && (metaNivel === 'minimo' || h.nivel_hoy === 'normal' || h.nivel_hoy === 'super')
  ).length

  // Lo que le pasaría a la vida si el día cerrara ahora mismo. Se muestra en
  // vivo para que la consecuencia se vea ANTES del cierre, no después.
  const marcadosHoy = lista.filter(h => h.nivel_hoy).length
  const porCumplido = cfg.data?.vida_por_cumplido ?? 10
  const porIncumplido = cfg.data?.vida_por_incumplido ?? 10
  const protegido = metaNivel === 'ninguno'
  const balanceProyectado = marcadosHoy * porCumplido
    - (protegido ? 0 : (lista.length - marcadosHoy) * porIncumplido)

  return {
    fecha,
    areas: (areas.data ?? []) as Area[],
    habitos: lista,
    vida: avatar.data?.vida ?? 1000,
    vidaMaxima: avatar.data?.vida_maxima ?? 1000,
    turno: turno ?? null,
    metaHabitos,
    metaNivel,
    cumplidos,
    balanceProyectado,
    marcadosHoy,
    porCumplido,
    porIncumplido,
    diaCerrado: (dia.data as any)?.cerrado ?? false,
    horaDormir: (cfg.data?.hora_dormir ?? '22:45').slice(0, 5),
    frase: (cfg.data as any)?.frase ?? 'LA BRÚJULA DE TU MUNDO',
    protegido,
    metaCumplida: metaNivel === 'ninguno' || cumplidos >= metaHabitos,
    xpTotal: (areas.data ?? []).reduce((s: number, a: any) => s + Number(a.xp_total), 0),
  }
}
