import { NextRequest, NextResponse } from 'next/server'
import { listarPiezas, crearPieza, actualizarPieza, borrarPieza, FaltaMigracion } from '@/lib/piezas'
import { esMarca } from '@/lib/marcas'
import { COOKIE_USUARIO, esUsuario } from '@/lib/usuarios'

/** Una migración pendiente no es un error del servidor: es algo que falta hacer. */
function responder(e: unknown) {
  if (e instanceof FaltaMigracion) {
    return NextResponse.json({ error: e.message, faltaMigracion: true }, { status: 503 })
  }
  return NextResponse.json({ error: (e as Error).message }, { status: 400 })
}

/**
 * QUIÉN ESCRIBE, según el servidor.
 *
 * Se lee de la cookie del pedido y NUNCA del cuerpo. No es por seguridad —la
 * cookie se puede cambiar desde la propia pantalla y eso está aceptado—: es
 * porque si el autor viajara en el cuerpo, cualquier llamada que se olvidara
 * de mandarlo guardaría una idea sin firma, y una idea sin firma no sirve
 * para volver a preguntarle a quien la propuso.
 */
export function autorDelPedido(req: NextRequest): string | null {
  const v = req.cookies.get(COOKIE_USUARIO)?.value
  return esUsuario(v) ? v : null
}

export async function GET(req: NextRequest) {
  try {
    const m = req.nextUrl.searchParams.get('marca')
    return NextResponse.json({ piezas: await listarPiezas(esMarca(m) ? m : undefined) })
  } catch (e) {
    return responder(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const autor = autorDelPedido(req)
    if (!autor) {
      return NextResponse.json(
        { error: 'Elegí quién sos antes de anotar una idea', sinUsuario: true },
        { status: 401 }
      )
    }
    // El cuerpo no puede traer autor: se descarta y se pone el de la cookie.
    const { autor: _ignorado, ...cuerpo } = await req.json()
    return NextResponse.json({ pieza: await crearPieza({ ...cuerpo, autor }) }, { status: 201 })
  } catch (e) {
    return responder(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...cambios } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await actualizarPieza(id, cambios)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return responder(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await borrarPieza(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return responder(e)
  }
}
