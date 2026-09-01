/**
 * El cuarto tiene su propio esqueleto: NO usa `.wrap` (es pantalla completa) y
 * lo que tiene que aparecer al instante es la habitación, no una lista.
 */
export default function Loading() {
  return (
    <main className="cuarto-pantalla">
      <div className="cuarto-titulo">
        <span className="titulo mono cursor">TU CUARTO</span>
      </div>
      <div className="cuarto">
        <div className="cuarto-caja">
          <div className="cuarto-esqueleto" />
        </div>
      </div>
    </main>
  )
}
