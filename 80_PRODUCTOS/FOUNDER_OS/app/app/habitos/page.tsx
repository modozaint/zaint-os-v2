import Link from 'next/link'
import { cargarTablero, asegurarDatos } from '@/lib/datos'
import { after } from 'next/server'
import { conectar } from '@/lib/supabase'
import { TarjetaHabito } from '../habito'
import { SelectorTurno } from '../turno'
import { Volver } from '../volver'
import { Hud } from '../hud'
import { PlanDelDia } from '../tarea'
import { BarraVoz } from '../barra-voz'
import { cargarHoy } from '@/lib/hoy'


export default async function Page() {
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
  // Los tres salen JUNTOS. `turnos` iba en su propia línea después del
  // Promise.all: un viaje entero a Canadá (~200 ms) esperando a que los otros
  // dos terminaran, sin necesitar nada de ellos.
  const [t, h, { data: turnos }] = await Promise.all([
    cargarTablero(),
    cargarHoy(),
    db.from('turnos').select('*').order('horas_clinica', { ascending: false }),
  ])

  const fechaLarga = new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const marcados = t.habitos.filter(h => h.nivel_hoy).length
  const faltan = t.metaHabitos - t.cumplidos
  // Cada hábito pinta su icono con el color de su área: el tablero se lee sin leer.
  const colorDeArea = new Map(t.areas.map(a => [a.id, a.color]))

  const aviso = !t.turno
    ? <>Marca el turno para saber qué te exige el día</>
    : t.metaNivel === 'ninguno'
      ? <><b>Día protegido.</b> Descansar cuenta</>
      : t.metaCumplida
        ? <><b>Meta cumplida</b> · {t.cumplidos}/{t.metaHabitos}</>
        : <>Falta{faltan > 1 ? 'n' : ''} <b>{faltan}</b> en {t.metaNivel} · {t.cumplidos}/{t.metaHabitos}</>

  return (
    <>
      <main className="wrap con-hud">
        <div className="head">
          <span className="titulo mono cursor">{t.frase}</span>
          <Link href="/historial" className="fecha volver">{fechaLarga} ›</Link>
        </div>

        <SelectorTurno turnos={turnos ?? []} activo={t.turno?.id ?? null} />

        <BarraVoz
          acepta="habito"
          habitos={t.habitos.map(h => ({
            id: h.id, nombre: h.nombre,
            minimo: h.minimo, normal: h.normal, super: h.super,
          }))}
          estado={{
            vida: t.vida,
            faltan: Math.max(0, t.metaHabitos - t.cumplidos),
            metaNivel: t.metaNivel,
            primera: h.caben[0]?.texto ?? null,
          }}
        />

        <PlanDelDia
          caben={h.caben}
          noCaben={h.noCaben}
          hechasHoy={h.hechasHoy}
          peldanos={h.peldanos}
          capacidad={h.capacidad}
          minutosAsignados={h.minutosAsignados}
          tipoDeDia={h.tipoDeDia}
          libreBruto={h.libreBruto}
        />

        <div className="fila-seccion">
          <span className="seccion mono">Hábitos de hoy</span>
          <span className="contador mono">{marcados}/{t.habitos.length}</span>
        </div>

        <div className="grid-hab">
          {t.habitos.map(h => (
            <TarjetaHabito key={h.id} h={h} color={colorDeArea.get(h.area_id)} />
          ))}
        </div>
      </main>

      <Hud
        vida={t.vida} vidaMaxima={t.vidaMaxima} xp={t.xpTotal} aviso={aviso}
        balance={t.balanceProyectado} cerrado={t.diaCerrado}
        horaDormir={t.horaDormir} protegido={t.protegido}
        marcados={t.marcadosHoy} total={t.habitos.length}
        porCumplido={t.porCumplido} porIncumplido={t.porIncumplido}
      />
      <Volver />
    </>
  )
}
