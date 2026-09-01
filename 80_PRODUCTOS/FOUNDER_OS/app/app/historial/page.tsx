import Link from 'next/link'
import { conectar, hoyBogota } from '@/lib/supabase'
import { ventanaDeLlenado } from '@/lib/tiempo'
import { Volver } from '../volver'
import { Historia, type DiaHistorico } from './lista'


/**
 * El historial.
 *
 * ⚠️ SE ARMA DESDE `registros`, NO DESDE `dias`. Esa es la correccion del
 * 18-ago: la version anterior listaba `dias`, y si esa fila no existia el dia
 * desaparecia entero aunque tuviera siete habitos marcados. Y no existia:
 * `marcarHabito` la inserta sin mirar si el insert fallo.
 *
 * La regla que queda: **si hay un habito marcado, ese dia existio**. `dias`
 * solo aporta lo de encima (turno, apunte, energia) y puede faltar sin que la
 * pantalla se caiga.
 */
export default async function Historial() {
  const db = await conectar()
  const hoy = hoyBogota()

  const [{ data: dias }, { data: registros }, { data: habitos }, { data: areas }] =
    await Promise.all([
      db.from('dias').select('*, turnos(*)').order('fecha', { ascending: false }).limit(120),
      db.from('registros').select('fecha, habito_id, nivel, xp, nota')
        .order('fecha', { ascending: false }).limit(2000),
      db.from('habitos').select('id, nombre, area_id, activo, orden, minimo, normal, super').order('orden'),
      db.from('areas').select('id, color'),
    ])

  const nombreHabito = new Map((habitos ?? []).map((h: any) => [h.id, h.nombre]))
  const colorArea = new Map((areas ?? []).map((a: any) => [a.id, a.color]))
  const colorHabito = new Map<string, string>()
  for (const h of habitos ?? []) colorHabito.set(h.id, colorArea.get(h.area_id) ?? '#A3BE4C')

  // Que nivel tiene cada habito cada dia. Lo usa el editor de dias pasados:
  // sin esto abriria siempre en blanco y borraria de vista lo ya marcado.
  const nivelPorDia = new Map<string, Record<string, string>>()
  for (const r of registros ?? []) {
    const fila = nivelPorDia.get(r.fecha) ?? {}
    fila[r.habito_id] = r.nivel
    nivelPorDia.set(r.fecha, fila)
  }

  const porDia = new Map<string, DiaHistorico['habitos']>()
  for (const r of registros ?? []) {
    const lista = porDia.get(r.fecha) ?? []
    lista.push({
      nombre: nombreHabito.get(r.habito_id) ?? r.habito_id,
      nivel: r.nivel,
      xp: Number(r.xp ?? 0),
      nota: r.nota,
      color: colorHabito.get(r.habito_id) ?? '#A3BE4C',
    })
    porDia.set(r.fecha, lista)
  }

  const metaDe = new Map((dias ?? []).map((d: any) => [d.fecha, d]))

  // La union: los dias que tienen fila + los que solo tienen habitos marcados
  // + los siete de la ventana editable, existan o no.
  //
  // ⚠️ Esa tercera parte es la que hace posible llenar hacia atras (23-ago). Un
  // dia en el que Santiago no abrio la app no tiene fila en `dias` NI registros:
  // no estaba en ninguna de las dos listas, asi que el dia que queria llenar era
  // justo el unico que la pantalla no dibujaba.
  const fechas = [...new Set([...metaDe.keys(), ...porDia.keys(), ...ventanaDeLlenado(hoy)])]
    .sort().reverse()

  const lista: DiaHistorico[] = fechas.map(fecha => {
    const d: any = metaDe.get(fecha)
    return {
      fecha,
      turno: d?.turno_id ?? null,
      // Cuantos habitos pedia ESE dia. Sin esto, un turno de 12 h se leeria
      // como un dia flojo, y es justo al reves.
      metaHabitos: d?.turnos?.meta_habitos ?? 0,
      metaNivel: d?.turnos?.meta_nivel ?? 'ninguno',
      // El veredicto lo guarda `cerrar_dia` en `minimos_ok`; `meta_cumplida` solo
      // lo tienen los dias que vinieron de Notion. Si no hay ninguno de los dos
      // —el dia todavia esta abierto— se calcula aqui con lo que hay.
      metaCumplida: d?.minimos_ok ?? d?.meta_cumplida
        ?? ((d?.turnos?.meta_nivel ?? 'ninguno') === 'ninguno'
            || (porDia.get(fecha)?.length ?? 0) >= (d?.turnos?.meta_habitos ?? 0)),
      balance: d?.balance ?? null,
      // Un dia cerrado ya cobro su vida: lo que se marque tarde suma XP pero
      // no vuelve a mover la vida. El editor lo dice en voz alta.
      cerrado: Boolean(d?.cerrado),
      marcados: nivelPorDia.get(fecha) ?? {},
      energia: d?.energia ?? null,
      apunte: d?.apunte ?? null,
      agradezco: d?.agradezco_por ?? null,
      // El dia tiene habitos pero no quedo guardado como dia: se avisa abajo.
      sinFila: !d,
      habitos: (porDia.get(fecha) ?? []).sort((a, b) => b.xp - a.xp),
    }
  })

  const huerfanos = lista.filter(d => d.sinFila && d.habitos.length > 0).length

  return (
    <>
      <main className="wrap">
        <div className="head">
          <span className="titulo mono cursor">LO QUE LLEVAS</span>
          <Link href="/habitos" className="fecha volver">← Hoy</Link>
        </div>

        {/* La lista ya nunca viene vacia —los siete dias de la ventana siempre
            estan— asi que el aviso de "nada registrado" se decide por los
            registros reales, no por el largo de la lista. */}
        {(registros ?? []).length === 0 && (
          <div className="aviso">
            Todavía no hay nada registrado. Marca un hábito en Hoy, o llena aquí abajo
            uno de los días de esta semana.
          </div>
        )}

        <Historia
          dias={lista}
          hoy={hoy}
          huerfanos={huerfanos}
          habitos={(habitos ?? []).filter((h: any) => h.activo !== false).map((h: any) => ({
            id: h.id, nombre: h.nombre, color: colorHabito.get(h.id) ?? '#A3BE4C',
            minimo: h.minimo, normal: h.normal, super: h.super,
          }))}
          registros={(registros ?? []).map((r: any) => ({
            fecha: r.fecha, habito_id: r.habito_id, nivel: r.nivel,
          }))}
        />
      </main>
      <Volver />
    </>
  )
}
