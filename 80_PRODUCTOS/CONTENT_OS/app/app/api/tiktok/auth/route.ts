import { NextResponse, type NextRequest } from 'next/server'
import { urlDeAutorizacion, tiktokConfigurado } from '@/lib/tiktokClient'
import { esMarca } from '@/lib/marcas'

/**
 * Paso 1 del OAuth: manda el navegador a TikTok para que autorice UNA cuenta.
 *
 * Se conecta una marca a la vez, entrando con la cuenta de TikTok de esa marca.
 * No hace falta saber el @ de antemano: TikTok lo devuelve al terminar, y se
 * guarda tal como él lo escribe. Escribirlo a mano es cómo se cuelan los typos
 * que después nadie encuentra.
 */
export async function GET(req: NextRequest) {
  if (!tiktokConfigurado()) {
    return NextResponse.json(
      { error: 'Falta TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET en las variables de entorno' },
      { status: 503 }
    )
  }

  const marca = req.nextUrl.searchParams.get('marca')
  if (!esMarca(marca)) {
    return NextResponse.json({ error: `Marca inválida: ${marca}` }, { status: 400 })
  }

  // El `state` protege contra CSRF y de paso lleva a qué marca pertenece la
  // autorización. Se compara contra una cookie: sin esto, cualquiera podría
  // hacer que el callback guarde una cuenta ajena en tu sistema.
  const nonce = crypto.randomUUID()
  const state = `${marca}.${nonce}`

  const res = NextResponse.redirect(urlDeAutorizacion(state))
  res.cookies.set('tt_oauth', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 min: lo que dura autorizar, no más
    path: '/',
  })
  return res
}
