import { NextResponse, type NextRequest } from 'next/server'
import { canjearCodigo, getTikTokUser } from '@/lib/tiktokClient'
import { guardarConexion } from '@/lib/db/conexiones'
import { esMarca } from '@/lib/marcas'

/**
 * Paso 2 del OAuth: TikTok devuelve aquí el `code` y se cambia por tokens.
 *
 * Esta ruta NO es pública a propósito. El navegador llega con la cookie de
 * sesión del dashboard, así que el proxy la deja pasar; si alguien la abre sin
 * sesión, ve el login. No hay razón para exponerla.
 */
function volverA(req: NextRequest, params: Record<string, string>) {
  const url = req.nextUrl.clone()
  url.pathname = '/settings'
  url.search = new URLSearchParams(params).toString()
  const res = NextResponse.redirect(url)
  res.cookies.delete('tt_oauth')
  return res
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // TikTok avisa aquí mismo si el usuario canceló.
  const errorTikTok = searchParams.get('error')
  if (errorTikTok) {
    return volverA(req, {
      tiktok: 'error',
      motivo: searchParams.get('error_description') ?? errorTikTok,
    })
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const esperado = req.cookies.get('tt_oauth')?.value

  if (!code || !state || !esperado || state !== esperado) {
    return volverA(req, {
      tiktok: 'error',
      motivo: 'La autorización no coincide con la que se inició. Intentalo de nuevo.',
    })
  }

  const marca = state.split('.')[0]
  if (!esMarca(marca)) {
    return volverA(req, { tiktok: 'error', motivo: `Marca inválida: ${marca}` })
  }

  try {
    const tokens = await canjearCodigo(code)

    // Se pide el perfil en el mismo paso para guardar el @ real y el nombre.
    // Si esto falla, la conexión sigue sirviendo: el handle es informativo.
    let user
    try {
      user = await getTikTokUser(tokens.access_token)
    } catch {
      user = undefined
    }

    await guardarConexion(marca, 'tiktok', tokens, user)

    return volverA(req, {
      tiktok: 'ok',
      marca,
      ...(user?.username ? { handle: user.username } : {}),
    })
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    return volverA(req, { tiktok: 'error', motivo })
  }
}
