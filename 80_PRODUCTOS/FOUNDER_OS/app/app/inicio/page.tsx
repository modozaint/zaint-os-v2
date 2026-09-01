import { conectar } from '@/lib/supabase'
import { Onboarding } from './onboarding'


export default async function Inicio() {
  const db = await conectar()
  const [{ data: config }, { data: areas }, { data: habitos }] = await Promise.all([
    db.from('config').select('*').maybeSingle(),
    db.from('areas').select('*').order('orden'),
    db.from('habitos').select('*').eq('activo', true).order('orden'),
  ])

  return <Onboarding config={config} areas={areas ?? []} habitos={habitos ?? []} />
}
