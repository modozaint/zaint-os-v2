/**
 * EL ESQUELETO — lo que se ve mientras la pantalla real llega.
 *
 * 🔑 Por qué existe: la mitad de la sensación de lentitud no era la espera,
 * era que al tocar un objeto **no pasaba nada**. La pantalla anterior se
 * quedaba puesta hasta que el servidor contestaba, así que dos segundos se
 * sentían cinco.
 *
 * Esto no acelera nada. Hace que la app responda en el mismo instante del
 * toque, que es lo que se percibe. Es más barato y vale más que ahorrar 200 ms.
 *
 * No es una animación de carga girando: es la FORMA de la pantalla que viene,
 * para que al llegar los datos nada salte de sitio.
 */
export function Cargando({ titulo, filas = 4 }: { titulo: string; filas?: number }) {
  return (
    <main className="wrap">
      <div className="head">
        <span className="titulo mono cursor">{titulo}</span>
      </div>
      <div className="esqueleto">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="esq-fila" style={{ animationDelay: i * 0.08 + 's' }} />
        ))}
      </div>
    </main>
  )
}
