import { conectar } from '@/lib/supabase'
import { Voz } from './voz'
import { Confirmar } from './confirmar'
import type { BolsilloConocido, HabitoConocido } from '@/lib/dictado'
import type { Borrador } from './borrador'

type Estado = { vida: number; faltan: number; metaNivel: string; primera: string | null }

/**
 * El micrófono, en cualquier pantalla.
 *
 * Junta las dos mitades del dictado: el boton que oye (`Voz`) y la tarjeta que
 * espera tu visto bueno (`Confirmar`). Cada pantalla declara QUE confirma:
 * Inicio los habitos, Tareas las tareas, Dinero los movimientos. Si dictas un
 * gasto desde Inicio, la app te lleva a Dinero y alla aparece la tarjeta.
 *
 * Carga sus propios datos para poder montarse con una sola linea. Los habitos
 * se pueden pasar ya cargados (Inicio los tiene del tablero) y asi no se
 * consultan dos veces.
 */
export async function BarraVoz({
  acepta,
  habitos,
  estado,
}: {
  acepta: Borrador['tipo']
  habitos?: HabitoConocido[]
  estado?: Estado
}) {
  const db = await conectar()

  const [hab, bol] = await Promise.all([
    habitos
      ? Promise.resolve(null)
      : db.from('habitos').select('id,nombre,minimo,normal,super')
          .eq('activo', true).order('orden').then(r => r, () => ({ data: [] })),
    db.from('bolsillos_con_saldo').select('id,nombre,saldo')
      .order('orden').then(r => r, () => ({ data: [] })),
  ])

  const lista: HabitoConocido[] = habitos ?? ((hab?.data ?? []) as HabitoConocido[])

  const bolsillos: BolsilloConocido[] = ((bol.data ?? []) as any[]).map(b => ({
    id: b.id,
    nombre: b.nombre,
    saldo: Number(b.saldo ?? 0),
  }))

  return (
    <>
      <Confirmar acepta={acepta} bolsillos={bolsillos} />
      <Voz habitos={lista} bolsillos={bolsillos} estado={estado} />
    </>
  )
}
