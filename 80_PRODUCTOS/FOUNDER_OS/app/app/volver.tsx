import Link from 'next/link'

/**
 * VOLVER AL CUARTO — la salida de cada pantalla interna.
 *
 * Reemplaza a la barra de siete pestañas, que se retiró el 2026-08-26 porque
 * Santiago pidió *«que no se vean abajo… como estar en un videojuego literal»*.
 *
 * ⚠️ EL COSTO QUE ESTO TIENE Y HAY QUE VIGILAR: antes ir a Dinero era UN toque
 * desde cualquier sitio. Ahora es volver al cuarto, caminar hasta la alcancía y
 * esperar. Toda la app depende de que él registre a diario, así que si el
 * registro diario baja, esto es lo primero que hay que aflojar (plan §8).
 *
 * Por eso este botón está SIEMPRE en el mismo lugar y en todas las pantallas:
 * salir del menú y volver al mundo tiene que ser un solo gesto que no haya que
 * buscar. Es un componente y no siete cabeceras copiadas justamente para que
 * nadie pueda moverlo en una pantalla y olvidarlo en las otras.
 */
export function Volver() {
  return (
    <Link href="/" className="volver-cuarto" aria-label="Volver al cuarto">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="mono">Cuarto</span>
    </Link>
  )
}
