import { NextResponse } from 'next/server'
import { tiktokConfigurado, redirectUri, urlDeAutorizacion, TIKTOK_SCOPES } from '@/lib/tiktokClient'
import { getConexion } from '@/lib/db/conexiones'
import { MARCA_IDS } from '@/lib/marcas'

/**
 * Estado de TikTok por marca: sirve para que la UI muestre "Conectar" o el @
 * real, en vez de un botón que no se sabe si hace algo.
 *
 * Nunca devuelve tokens.
 */
export async function GET() {
  const configurado = tiktokConfigurado()

  const marcas = await Promise.all(
    MARCA_IDS.map(async (marca) => {
      if (!configurado) return { marca, conectada: false }
      try {
        const c = await getConexion(marca, 'tiktok')
        return {
          marca,
          conectada: Boolean(c?.access_token),
          handle: c?.handle ?? null,
          display_name: c?.display_name ?? null,
          expira_en: c?.expira_en ?? null,
        }
      } catch {
        return { marca, conectada: false }
      }
    })
  )

  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? ""

  return NextResponse.json({
    configurado,
    // Se devuelve para poder copiarla tal cual al registrarla en TikTok: si no
    // coincide caracter por caracter, el login falla con "redirect_uri mismatch".
    redirect_uri: redirectUri(),

    // DIAGNOSTICO. TikTok, cuando la client_key no le sirve, responde una
    // pantalla que dice "corrige lo siguiente: client_key" y nada mas: no
    // distingue entre vacia, cortada, con un espacio pegado, o de otro entorno.
    // Sin esto solo queda adivinar cual de las cuatro es.
    //
    // La client_key NO es un secreto —viaja en la URL de autorizacion, a la
    // vista— asi que se muestra entera. El secret nunca: solo si esta.
    diagnostico: {
      client_key: clientKey || null,
      client_key_largo: clientKey.length,
      // Un espacio o un salto de linea pegados al copiar son invisibles en el
      // panel de Vercel y rompen la autorizacion sin dar ninguna pista.
      client_key_con_espacios: clientKey !== clientKey.trim(),
      // Las credenciales de Sandbox y las de Produccion son DISTINTAS. Las de
      // sandbox suelen empezar por "sb". Mezclarlas da este mismo error.
      parece_sandbox: clientKey.startsWith("sb"),
      client_secret_puesto: Boolean(process.env.TIKTOK_CLIENT_SECRET),
      redirect_uri_fijada_a_mano: Boolean(process.env.TIKTOK_REDIRECT_URI),
      scopes: TIKTOK_SCOPES,
      // La URL COMPLETA que se le manda a TikTok. Abrirla a mano es la unica
      // forma de separar "la app la arma mal" de "TikTok la rechaza": si
      // pegada en el navegador falla igual, el problema esta del lado de ellos
      // (sandbox sin aplicar cambios, redirect no registrada, scope no
      // habilitado) y no en este codigo.
      auth_url: configurado ? urlDeAutorizacion("diagnostico.manual") : null,
    },

    marcas,
  })
}
