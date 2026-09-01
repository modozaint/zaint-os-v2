import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { URL_SUPABASE, CLAVE_PUBLICA } from './config-supabase'

/**
 * Cliente de Supabase ligado a la SESION del usuario.
 *
 * La clave publicable esta disenada para ser publica: el candado real es RLS.
 * Cada consulta viaja con el token del usuario, asi que Postgres solo devuelve
 * SUS filas. Sin sesion no devuelve nada — eso es lo correcto.
 */

export async function conectar() {
  const galleta = await cookies()
  return createServerClient(URL_SUPABASE, CLAVE_PUBLICA, {
    cookies: {
      getAll: () => galleta.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => galleta.set(name, value, options))
        } catch {
          // Un Server Component no puede escribir cookies. El middleware ya
          // refresco la sesion, asi que esto es seguro de ignorar.
        }
      },
    },
  })
}

/** El usuario de la sesion, o null. */
export async function usuarioActual() {
  const db = await conectar()
  const { data } = await db.auth.getUser()
  return data.user
}

export * from './tipos'


// `hoyBogota` se mudo a `lib/tiempo.ts` para que el navegador tambien pueda
// usarla. Se reexporta para no tocar los archivos que ya la importan de aqui.
export { hoyBogota } from './tiempo'
