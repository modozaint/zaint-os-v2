import { NextRequest, NextResponse } from 'next/server'
import { getIGMediaUrl } from '@/lib/instagramClient'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })

  try {
    const url = await getIGMediaUrl(id)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
