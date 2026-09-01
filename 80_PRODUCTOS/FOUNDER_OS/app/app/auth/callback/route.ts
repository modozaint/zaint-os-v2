import { NextResponse } from 'next/server'
import { conectar } from '@/lib/supabase'

/**
 * Donde aterriza Google despues de autenticar.
 * Supabase manda un `code` de un solo uso; aqui se cambia por la sesion y se
 * guarda en la cookie. A partir de ahi el middleware ya la reconoce.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const base = origenReal(req, url)
  const code = url.searchParams.get('code')
  const destino = url.searchParams.get('next') ?? '/'

  if (!code) {
    const err = url.searchParams.get('error_description') ?? 'No llego el codigo de Google'
    return NextResponse.redirect(new URL(`/entrar?error=${encodeURIComponent(err)}`, base))
  }

  const db = await conectar()
  const { error } = await db.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(`/entrar?error=${encodeURIComponent(error.message)}`, base)
    )
  }

  return NextResponse.redirect(new URL(destino, base))
}

/**
 * El origen al que hay que devolver al usuario.
 * `req.url` NO sirve: con `next start -H 0.0.0.0` devuelve "http://0.0.0.0:3131",
 * que en un celular no resuelve a nada. La cabecera Host si trae el nombre real
 * con el que el navegador pidio la pagina.
 */
function origenReal(req: Request, url: URL): string {
  const h = req.headers
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host) return url.origin
  const proto = h.get('x-forwarded-proto')
    ?? (host.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host) ? 'http' : 'https')
  return `${proto}://${host}`
}
