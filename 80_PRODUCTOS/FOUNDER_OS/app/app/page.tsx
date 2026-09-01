import { after } from 'next/server'
import { conectar, hoyBogota } from '@/lib/supabase'
import { cargarTablero, asegurarDatos } from '@/lib/datos'
import { cargarHoy } from '@/lib/hoy'
import { ventanaDeLlenado } from '@/lib/tiempo'
import { Hud } from './hud'
import { EscenaCasa } from './casa/escena'
import { BarraVoz } from './barra-voz'
import { GastoRapido, type BolsilloRapido } from './gasto-rapido'


/**
 * El cuarto: una capa encima de las pantallas que ya existen. Cada objeto
 * lleva a la ruta real (/, /historial, /turnos, /tareas, /areas, /dinero) —
 * nada se reimplementa aquí. La única excepción es el cuaderno del escritorio,
 * que sí vive en el cuarto porque antes no existía en ninguna parte.
 * Ver planes/cuarto-founderos-2026-08-23.md.
 */
export default async function Cuarto() {
  const db = await conectar()
  /**
   * 🔑 La reparación de días sale DEL CAMINO. Corre `after()`, o sea después
   * de que la pantalla ya salió — no antes.
   *
   * Medido hoy en caliente: esperarla costaba ~200 ms de los ~470 ms del
   * total. La pantalla no necesita nada de ella para pintarse; solo arregla
   * días huérfanos para la próxima vez.
   *
   * 🔒 La reparación del 16-18 de agosto NO se quitó — se dejó de esperar.
   * Sigue corriendo, con su freno de 10 minutos, y de inmediato cuando marcar
   * un hábito da motivo (`pedirRevision`).
   */
  after(() => asegurarDatos())
  const hoy = hoyBogota()
  const ventana = ventanaDeLlenado(hoy)

  const [t, h, registros, apuntes, bolsillos] = await Promise.all([
    cargarTablero(),
    cargarHoy(),
    // Solo fechas: alcanza para la racha y para contar los días en blanco.
    db.from('registros').select('fecha').order('fecha', { ascending: false }).limit(1500),
    // Las páginas del cuaderno. `apunte` existe desde el esquema inicial.
    db.from('dias').select('fecha, apunte')
      .not('apunte', 'is', null).order('fecha', { ascending: false }).limit(30),
    // Para anotar un gasto sin salir del cuarto. Va en el MISMO grupo: no
    // añade una espera, viaja con los demás.
    db.from('bolsillos_con_saldo').select('id,nombre,saldo').order('orden')
      .then(r => r, () => ({ data: [] })),
  ])

  const conMarca = new Set((registros.data ?? []).map((r: any) => r.fecha as string))

  // Racha: días seguidos hacia atrás desde hoy con al menos un hábito marcado.
  let racha = 0
  {
    const d = new Date(hoy + 'T12:00:00')
    while (conMarca.has(d.toISOString().slice(0, 10))) {
      racha++
      d.setDate(d.getDate() - 1)
    }
  }

  // Los días de la última semana que quedaron en blanco y todavía se pueden
  // llenar. Hoy no cuenta: está en curso, no está "sin llenar".
  const sinLlenar = ventana.filter(f => f < hoy && !conMarca.has(f)).length

  // El área más floja: la de menor xp_total. Con todas en cero no hay una
  // "más floja" real, así que no se resalta ninguna.
  const areaFloja = t.areas.length
    ? t.areas.reduce((min, a) => (Number(a.xp_total) < Number(min.xp_total) ? a : min))
    : null
  const hayFlojas = t.areas.some(a => Number(a.xp_total) > 0)

  const paginas = (apuntes.data ?? []) as { fecha: string; apunte: string | null }[]
  const apunteHoy = paginas.find(p => p.fecha === hoy)?.apunte ?? ''

  return (
    <>
      {/* Sin `.wrap`: el cuarto NO es contenido dentro de una pagina, es la
          pantalla. `.wrap` tiene `max-width: 560px` y padding, y con eso el
          cuarto no podia llenar nada. */}
      <main className="cuarto-pantalla">
        <EscenaCasa
          resumen={<span className="fecha mono">{t.marcadosHoy}/{t.habitos.length} hoy</span>}
          datos={{
            faltanHabitos: !t.metaCumplida,
            racha,
            protegido: t.protegido,
            pendientesTareas: h.caben.length,
            areaFloja: hayFlojas && areaFloja
              ? { nombre: areaFloja.nombre, color: areaFloja.color } : null,
            sinLlenar,
            apunteHoy,
          }}
          fecha={hoy}
          apuntes={paginas
            .filter(p => p.fecha !== hoy && p.apunte)
            .map(p => ({ fecha: p.fecha, texto: p.apunte as string }))}
        />
      </main>

      {/* Las dos acciones que se hacen de pie, sin abrir nada: dictar y anotar
          un gasto. Flotan sobre la escena, encima del HUD, al alcance del
          pulgar. El micrófono manda cada cosa a donde va — un hábito se marca
          aquí mismo, una tarea entra a tareas, un gasto al dinero. */}
      <div className="cuarto-acciones">
        <BarraVoz
          acepta="habito"
          habitos={t.habitos.map(x => ({
            id: x.id, nombre: x.nombre,
            minimo: x.minimo, normal: x.normal, super: x.super,
          }))}
          estado={{
            vida: t.vida,
            faltan: Math.max(0, t.metaHabitos - t.cumplidos),
            metaNivel: t.metaNivel,
            primera: h.caben[0]?.texto ?? null,
          }}
        />
        <GastoRapido
          bolsillos={((bolsillos.data ?? []) as any[]).map((b): BolsilloRapido => ({
            id: b.id, nombre: b.nombre, saldo: Number(b.saldo ?? 0),
          }))}
        />
      </div>

      <Hud
        vida={t.vida} vidaMaxima={t.vidaMaxima} xp={t.xpTotal} aviso={null}
        balance={t.balanceProyectado} cerrado={t.diaCerrado}
        horaDormir={t.horaDormir} protegido={t.protegido}
        marcados={t.marcadosHoy} total={t.habitos.length}
        porCumplido={t.porCumplido} porIncumplido={t.porIncumplido}
      />
    </>
  )
}
