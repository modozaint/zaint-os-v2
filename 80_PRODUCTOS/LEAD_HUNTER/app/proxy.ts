import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Puerta de entrada de la app en producción.
 *
 * En Next 16 esto ya NO se llama `middleware.ts`: la convención se renombró a
 * `proxy.ts` (ver node_modules/next/dist/docs/.../file-conventions/proxy.md).
 *
 * Hay UNA puerta con DOS llaves:
 *  1. Contraseña (Basic Auth) → para vos y el equipo, desde el navegador.
 *  2. Token secreto (CRON_SECRET) → para n8n, que dispara el motor sin humano.
 *
 * Si `APP_PASSWORD` no está definida, no pide nada: así el desarrollo local
 * sigue funcionando igual que siempre. La llave se activa sola al ponerle la
 * variable en el servidor.
 *
 * Por qué existe: el login de la app es un "¿quién sos?" sin contraseña. Sirve
 * puertas adentro, pero expuesto en internet dejaría a cualquiera ver los leads
 * y —peor— lanzar extracciones que se pagan con la tarjeta (Apify + Anthropic).
 */

/**
 * Compara dos strings en tiempo constante: el tiempo que tarda no depende de
 * en qué carácter difieren. Con un `===` normal, alguien midiendo la latencia
 * de miles de intentos podría adivinar la contraseña letra por letra. Es
 * lento de romper igual (hay una red de por medio), pero es gratis hacerlo
 * bien y es justo lo que un comprador técnico revisa.
 */
function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** ¿Trae el token del cron? (header Bearer o ?token= en la URL). */
function tieneTokenCron(req: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) return false;

  const cabecera = req.headers.get("authorization") ?? "";
  if (cabecera.startsWith("Bearer ")) {
    const dado = cabecera.slice(7).trim();
    if (igualesEnTiempoConstante(dado, secreto)) return true;
  }
  const porUrl = req.nextUrl.searchParams.get("token") ?? "";
  return igualesEnTiempoConstante(porUrl, secreto);
}

/** ¿Trae usuario y contraseña correctos por Basic Auth? */
function tieneContrasena(req: NextRequest): boolean {
  const clave = process.env.APP_PASSWORD?.trim();
  if (!clave) return true; // sin contraseña configurada = local, todo abierto

  const cabecera = req.headers.get("authorization") ?? "";
  if (!cabecera.startsWith("Basic ")) return false;

  try {
    // atob: en el runtime del proxy no hay Buffer de Node.
    const [usuario, ...resto] = atob(cabecera.slice(6)).split(":");
    const usuarioEsperado = process.env.APP_USER?.trim() || "zaint";
    return (
      igualesEnTiempoConstante(usuario, usuarioEsperado) &&
      igualesEnTiempoConstante(resto.join(":"), clave)
    );
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  // Sin contraseña configurada (desarrollo local): no se toca nada.
  if (!process.env.APP_PASSWORD?.trim()) return NextResponse.next();

  if (tieneTokenCron(req) || tieneContrasena(req)) return NextResponse.next();

  return new NextResponse("Acceso restringido.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="LeadHunter"' },
  });
}

export const config = {
  // Todo menos los estáticos: si el proxy los bloquea, la página carga sin CSS.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
