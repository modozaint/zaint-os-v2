import { NextRequest, NextResponse } from 'next/server'
import { proponerPublicos } from '@/lib/proponerPublicos'
import { esMarca } from '@/lib/marcas'
import type { TipoPieza } from '@/lib/piezas'

// Llama al modelo: nunca prerenderizar ni cachear.
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { marca, tipo, idea } = await req.json()
    if (!esMarca(marca)) return NextResponse.json({ error: 'Marca inválida' }, { status: 400 })

    const publicos = await proponerPublicos(marca, (tipo ?? 'reel') as TipoPieza, idea ?? '')
    return NextResponse.json({ publicos }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
