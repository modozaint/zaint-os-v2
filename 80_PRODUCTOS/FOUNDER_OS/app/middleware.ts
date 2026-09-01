import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? 'https://ubhdwijnqgzzpqiyinqc.supabase.co'
const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'sb_publishable_G5eddYGrFEaK-pX5hVucZQ_62IJjmkG'

const ABIERTAS = ['/entrar', '/auth']

/**
 * Refresca la sesion en cada peticion y manda a /entrar a quien no tenga.
 * Sin esto, el token vence y la app queda en blanco sin explicar por que.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const db = createServerClient(URL_SUPABASE, CLAVE_PUBLICA, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await db.auth.getUser()
  const ruta = req.nextUrl.pathname
  const esAbierta = ABIERTAS.some(a => ruta.startsWith(a))

  if (!user && !esAbierta) {
    const url = req.nextUrl.clone()
    url.pathname = '/entrar'
    return NextResponse.redirect(url)
  }
  if (user && ruta.startsWith('/entrar')) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icono.svg|.*\.png$).*)'],
}
