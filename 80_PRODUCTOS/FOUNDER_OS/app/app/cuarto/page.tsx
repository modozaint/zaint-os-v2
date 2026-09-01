import { redirect } from 'next/navigation'

/**
 * El cuarto se mudo a la raiz el 2026-08-26: es la pantalla de entrada.
 *
 * Esta ruta se queda como redireccion y no como archivo borrado porque
 * `/cuarto` ya esta guardado en el telefono de Santiago —fue la URL que se
 * publico el 23-ago— y un 404 ahi se veria como que la app se rompio.
 */
export default function CuartoViejo() {
  redirect('/')
}
