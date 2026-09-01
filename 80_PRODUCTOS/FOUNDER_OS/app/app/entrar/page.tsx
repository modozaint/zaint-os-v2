import { Suspense } from 'react'
import { Entrar } from './entrar'
import { URL_SUPABASE, CLAVE_PUBLICA } from '@/lib/config-supabase'


/**
 * Un boton que no funciona es peor que no tener boton.
 *
 * "Continuar con Google" llevaba semanas en la pantalla con el proveedor
 * APAGADO en Supabase: quien lo tocaba recibia "Unsupported provider". En vez
 * de borrarlo —y tener que acordarse de volver a ponerlo— se le pregunta a la
 * base que proveedores tiene encendidos. El dia que se habilite Google, el
 * boton aparece solo.
 */
async function googleEncendido(): Promise<boolean> {
  try {
    const r = await fetch(`${URL_SUPABASE}/auth/v1/settings`, {
      headers: { apikey: CLAVE_PUBLICA },
      next: { revalidate: 600 },
    })
    if (!r.ok) return false
    const cfg = await r.json()
    return cfg?.external?.google === true
  } catch {
    return false
  }
}

export default async function Page() {
  const conGoogle = await googleEncendido()
  return (
    <Suspense fallback={<main className="wrap entrar" />}>
      <Entrar conGoogle={conGoogle} />
    </Suspense>
  )
}
