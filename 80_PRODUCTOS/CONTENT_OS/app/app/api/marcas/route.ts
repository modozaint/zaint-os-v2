import { NextResponse } from 'next/server'
import { marcasConfiguradas } from '@/lib/instagramClient'

/**
 * Qué marcas tienen credenciales de verdad.
 *
 * El selector las pinta TODAS igual, pero marca las que no están conectadas.
 * Mostrar solo las conectadas escondería el problema: si falta un token, lo
 * que hay que ver es que falta, no que la marca desaparezca del menú.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ configuradas: marcasConfiguradas() })
}
