import Link from 'next/link'
import { conectar, hoyBogota } from '@/lib/supabase'
import { Volver } from '../volver'
import { Cuadro, type TurnoDef } from './cuadro'


/**
 * El cuadro de turnos del mes.
 *
 * Por que existe (Santiago, 20-ago): "poder ver en mi cuadro de turno ahi y
 * cambiar las modificaciones que vayan surgiendo". El cuadro lo arma su jefa en
 * Excel, CAMBIA CADA MES y ademas cambia sobre la marcha — en la bitacora del
 * 11-ago quedo escrito: "el cuadro decia LIBRE y le cambiaron el turno".
 *
 * No es una pantalla de consulta: es la que decide todo lo demas. El turno fija
 * la meta del dia, la capacidad real y si el dia resta vida. Tenerlo solo en el
 * Excel de otra persona es tener el sistema apagado la mitad del mes.
 */
export default async function Turnos() {
  const db = await conectar()
  const hoy = hoyBogota()

  const [{ data: turnos }, { data: dias }] = await Promise.all([
    db.from('turnos').select('*').order('horas_clinica', { ascending: false }),
    db.from('dias').select('fecha, turno_id').order('fecha', { ascending: false }).limit(400),
  ])

  return (
    <>
      <main className="wrap">
        <div className="head">
          <span className="titulo mono cursor">CUADRO DE TURNOS</span>
          <Link href="/habitos" className="fecha volver">← Hoy</Link>
        </div>

        <Cuadro
          hoy={hoy}
          turnos={(turnos ?? []) as TurnoDef[]}
          puestos={Object.fromEntries(
            (dias ?? [])
              .filter((d: any) => d.turno_id)
              .map((d: any) => [d.fecha, d.turno_id as string]),
          )}
        />
      </main>
      <Volver />
    </>
  )
}
