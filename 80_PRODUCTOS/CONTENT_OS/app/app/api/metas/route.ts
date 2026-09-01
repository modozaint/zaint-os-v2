import { NextRequest, NextResponse } from 'next/server'
import { leerMetas, guardarMeta, FaltaMigracion } from '@/lib/piezas'
import { esMarca } from '@/lib/marcas'

export async function GET() {
  try {
    return NextResponse.json({ metas: await leerMetas() })
  } catch (e) {
    if (e instanceof FaltaMigracion) {
      return NextResponse.json({ error: e.message, faltaMigracion: true }, { status: 503 })
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { marca_id, ...cambios } = await req.json()
    if (!esMarca(marca_id)) return NextResponse.json({ error: 'Marca inválida' }, { status: 400 })
    await guardarMeta(marca_id, cambios)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
