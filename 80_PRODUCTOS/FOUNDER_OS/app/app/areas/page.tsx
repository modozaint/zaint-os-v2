import { conectar } from '@/lib/supabase'
import { Volver } from '../volver'
import { Radar } from '../radar'


export default async function Areas() {
  const db = await conectar()
  const [{ data: areas }, { data: habitos }] = await Promise.all([
    db.from('niveles_por_area').select('*').order('orden'),
    db.from('habitos').select('id, nombre, area_id').eq('activo', true).order('orden'),
  ])

  const porArea = new Map<string, string[]>()
  for (const h of habitos ?? []) {
    const lista = porArea.get(h.area_id) ?? []
    lista.push(h.nombre)
    porArea.set(h.area_id, lista)
  }

  const vacias = (areas ?? []).filter((a: any) => Number(a.xp_total) === 0)

  return (
    <>
      <main className="wrap">
        <div className="head">
          <span className="titulo mono cursor">NIVEL POR ÁREA</span>
        </div>

        <div className="radar-caja">
          <Radar datos={(areas ?? []).map((a: any) => ({
            nombre: a.nombre,
            valor: Number(a.xp_total),
            color: a.color,
          }))} max={Math.max(100, ...(areas ?? []).map((a: any) => Number(a.xp_total)))} />
        </div>

        {vacias.length > 0 && (
          <div className="aviso">
            <b>{vacias.length} de 5 áreas en cero.</b> No es que no las vivas: es que sus hábitos
            no se están registrando. Un área sin hábito nunca sube de nivel.
          </div>
        )}

        {(areas ?? []).map((a: any) => {
          const xp = Number(a.xp_total)
          const pct = xp === 0 ? 0 : Number(a.xp_en_nivel)
          return (
            <div key={a.id} className="area-card">
              <div className="area-card-top">
                <i className="punto" style={{ background: a.color, width: 10, height: 10 }} />
                <span className="area-card-nom">{a.nombre}</span>
                <span className="area-card-niv mono" style={{ color: xp === 0 ? '#E85D5D' : a.color }}>
                  {xp === 0 ? '—' : a.nivel}
                </span>
              </div>
              <div className="area-def">{a.definicion_ganar ?? ''}</div>
              <div className="barra-xp">
                <i style={{ width: pct + '%', background: a.color }} />
              </div>
              <div className="area-pie mono">
                <span>{xp === 0 ? 'sin registrar' : `nivel ${a.nivel}`}</span>
                <span>{xp} XP</span>
              </div>
              <div className="area-habs">
                {porArea.get(a.id)?.join(' · ') ?? 'Sin hábitos asignados'}
              </div>
            </div>
          )
        })}
      </main>
      <Volver />
    </>
  )
}
