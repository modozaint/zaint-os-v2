import { NextRequest, NextResponse } from 'next/server'
import {
  listarReferentes,
  crearReferente,
  borrarReferente,
  actualizarReferente,
} from '@/lib/referentes'
import type { MarcaId } from '@/lib/instagramClient'

export async function GET(req: NextRequest) {
  try {
    const marca = req.nextUrl.searchParams.get('marca') as MarcaId | null
    const referentes = await listarReferentes(marca ?? undefined)
    return NextResponse.json({ referentes })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const referente = await crearReferente(body)
    return NextResponse.json({ referente }, { status: 201 })
  } catch (e) {
    // 400 y no 500: los errores de validación son del que envía, no del servidor
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...cambios } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await actualizarReferente(id, cambios)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await borrarReferente(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
