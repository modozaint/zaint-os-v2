import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_USUARIO, esUsuario } from '@/lib/usuarios'
import { COOKIE_SESION, DIAS_DE_SESION, tokenEsperado } from '@/lib/sesion'

/**
 * QUIÉN ESTÁ ESCRIBIENDO — no quién tiene permiso.
 *
 * El permiso lo sigue dando `dt_session` (la clave del equipo). Esto solo
 * firma las ideas. Ver el encabezado de `lib/usuarios.ts` para la limitación
 * que se aceptó a sabiendas.
 */

/** Estado de entrada: lo usa el login para saber qué paso mostrar. */
export async function GET(req: NextRequest) {
  const esperado = await tokenEsperado()
  const sesion = esperado === null || req.cookies.get(COOKIE_SESION)?.value === esperado
  const usuario = req.cookies.get(COOKIE_USUARIO)?.value

  return NextResponse.json({
    // false en local sin DASHBOARD_PASSWORD: ahí no hay clave que pedir.
    requiereClave: esperado !== null,
    sesion,
    usuario: esUsuario(usuario) ? usuario : null,
  })
}

export async function POST(req: NextRequest) {
  let usuario = ''
  try {
    const body = await req.json()
    usuario = typeof body?.usuario === 'string' ? body.usuario : ''
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!esUsuario(usuario)) {
    return NextResponse.json({ ok: false, error: 'Ese usuario no existe' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, usuario })

  // ⚠️ httpOnly: false A PROPÓSITO.
  //
  // La interfaz tiene que poder mostrar quién sos sin ir al servidor en cada
  // carga. Esconder esta cookie no protegería nada: quien tenga la clave del
  // equipo ya puede elegir ser el otro desde la propia pantalla — es la
  // limitación que se aceptó. Lo que sí sigue siendo httpOnly es `dt_session`,
  // que es la que da acceso.
  res.cookies.set(COOKIE_USUARIO, usuario, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * DIAS_DE_SESION,
    path: '/',
  })
  return res
}
