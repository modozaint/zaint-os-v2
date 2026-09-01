import { conectar } from '@/lib/supabase'
import { Volver } from '../volver'
import { EditorHabito } from './editor'


export default async function Ajustes() {
  const db = await conectar()
  const { data: sesion } = await db.auth.getUser()
  const correo = sesion.user?.email ?? null
  const [{ data: habitos }, { data: areas }] = await Promise.all([
    db.from('habitos').select('*').order('orden'),
    db.from('areas').select('id, nombre').order('orden'),
  ])
  const nombreArea = new Map((areas ?? []).map(a => [a.id, a.nombre]))

  return (
    <>
      <main className="wrap">
        <div className="head">
          <span className="titulo mono cursor">AJUSTES</span>
        </div>
        <p className="pista" style={{ marginBottom: 20 }}>
          Cada nivel admite <b>varias opciones válidas</b>, separadas por <code>·</code>.
          Ejemplo: <em>100 flexiones · salir a entrenar · sesión en el parque</em>.
          Cualquiera de las tres cuenta como Super.
        </p>

        {(habitos ?? []).map(h => (
          <EditorHabito key={h.id} h={h} area={nombreArea.get(h.area_id) ?? h.area_id} />
        ))}

        <div className="cuenta">
          <span className="mono">{correo ?? 'sin sesión'}</span>
          <form action="/salir" method="post">
            <button className="salir" type="submit">Cerrar sesión</button>
          </form>
        </div>
      </main>
      <Volver />
    </>
  )
}
