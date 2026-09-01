import { NextResponse, type NextRequest } from "next/server"
import { COOKIE_SESION, tokenEsperado } from "@/lib/sesion"
import { COOKIE_USUARIO, esUsuario } from "@/lib/usuarios"

// Rutas accesibles sin sesión
// Terminos y privacidad TIENEN que ser publicos: TikTok los abre desde su
// panel de revision, sin sesion. Si el login los tapa, la app se rechaza.
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  // Quien-sos: el login la consulta ANTES de tener cookie de usuario, asi que
  // si la tapara el propio candado que ella destraba, no se podria entrar nunca.
  "/api/usuario",
  "/terminos.html",
  "/privacidad.html",
  // Verificacion de propiedad del dominio (TikTok, y cualquier otro que la pida).
  // El archivo de firma se pide SIN sesion desde el servidor de ellos: si el
  // login lo tapa, la verificacion falla sin decir por que.
  "/.well-known/",
]

// Firma que TikTok pide para comprobar que el dominio es nuestro.
//
// Vive en el codigo y no en un secreto porque NO es un secreto: se sirve en
// claro a cualquiera que pida el archivo — ese es literalmente su proposito.
// Estando aca, verificar no depende de que alguien acuerde poner una variable
// en Vercel ni de acertar el nombre exacto del archivo.
//
// TIKTOK_VERIFICATION_SIGNATURE la sigue pisando si algun dia hay que rotarla
// sin tocar codigo.
const PREFIJO_FIRMA = "tiktok-developers-site-verification="

// ✅ Dominio VERIFICADO en TikTok el 2026-08-20 con esta cadena.
// Ojo con el caracter 8: es una L minuscula, no un uno. Se transcribio mal
// una vez leyendola de una captura y la verificacion fallaba sin decir por que.
const FIRMA_TIKTOK = PREFIJO_FIRMA + "3byoxDHlgE3GvSfgj4B9MjCu2IjQTfpL"

/**
 * El archivo tiene que contener la LINEA COMPLETA, con prefijo:
 *   tiktok-developers-site-verification=<cadena>
 *
 * Al copiar es facil traerse solo la cadena —es la parte que "se ve" como el
 * codigo— y entonces TikTok responde "no pudimos encontrar su firma" sin decir
 * que lo que encontro estaba a medias. Paso exactamente eso.
 *
 * Asi que se acepta cualquiera de las dos formas y se emite siempre la completa.
 */
function firmaCompleta(valor: string): string {
  const limpio = valor.trim()
  return limpio.startsWith(PREFIJO_FIRMA) ? limpio : PREFIJO_FIRMA + limpio
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Archivos de verificacion sueltos en la raiz (ej. tiktokAbC123.txt).
  //
  // Se responde el patron completo, no un nombre concreto, porque TikTok genera
  // la cadena Y el nombre del archivo en el momento. Si hubiera que crear un
  // archivo y desplegar por cada intento, cada vuelta de verificacion costaria
  // un commit y dos minutos de build — y estas cosas se intentan varias veces.
  //
  // Con TIKTOK_VERIFICATION_SIGNATURE puesta en Vercel, la firma se sirve sola:
  // pegar la variable y darle "verificar" es todo. Sin la variable, se deja
  // pasar hacia public/ por si el archivo se subio a mano.
  if (/^\/tiktok[A-Za-z0-9._-]*\.txt$/.test(pathname)) {
    const firma = process.env.TIKTOK_VERIFICATION_SIGNATURE ?? FIRMA_TIKTOK
    if (firma) {
      return new NextResponse(firmaCompleta(firma), {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    }
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // Al login, sin pantalla en blanco y sin inventarle un nombre a nadie.
  const alLogin = () => {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return NextResponse.redirect(url)
  }

  // ---- 1. PERMISO: la clave compartida del equipo ----
  // Sin DASHBOARD_PASSWORD configurada (ej. desarrollo local) no se exige.
  const expected = await tokenEsperado()
  if (expected && req.cookies.get(COOKIE_SESION)?.value !== expected) return alLogin()

  // ---- 2. IDENTIDAD: quien esta escribiendo ----
  //
  // Se comprueba SIEMPRE, haya clave o no: en local tampoco queremos ideas
  // anonimas. Son dos preguntas distintas —quien puede entrar y quien esta
  // escribiendo— y por eso van en DOS COOKIES SEPARADAS.
  //
  // Lo fragil, dicho literal: `dt_session` ya esta en los navegadores de
  // Santiago y de Victor. Meter el usuario dentro de ella habria invalidado
  // esas dos sesiones y obligado a volver a escribir la clave. Con la cookie
  // aparte, quien llega con sesion valida y sin usuario NO pierde la sesion:
  // cae en /login, que detecta que ya tiene permiso y le muestra solo
  // "¿quien sos?".
  if (!esUsuario(req.cookies.get(COOKIE_USUARIO)?.value)) return alLogin()

  return NextResponse.next()
}

export const config = {
  // Todo excepto assets estáticos
  // El manifiesto y los iconos tienen que ser PUBLICOS: el celular los pide
  // ANTES de que exista sesion, para decidir si puede instalar la app. Si el
  // login los tapa, Chrome no encuentra manifiesto y la instalacion falla con
  // un error de APK invalido — que fue exactamente lo que paso.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|icon-192.png|icon-512.png|manifest.webmanifest|marcas/|fonts|.*\.svg$).*)",
  ],
}
