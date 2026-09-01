'use client'

import { useState } from 'react'
import { Casa, type Datos } from './motor'
import { HABITACIONES, ENTRADA } from './habitaciones'
import { Cuaderno, type Apunte } from '../cuarto/cuaderno'

/**
 * La casa, con lo que la pantalla le añade encima.
 *
 * El motor no sabe qué es un cuaderno: solo sabe que hay un objeto de tipo
 * 'accion' y avisa. Quién abre qué lo decide aquí, que es donde están los
 * datos de la app.
 */
export function EscenaCasa({
  datos, fecha, apuntes, resumen,
}: {
  datos: Datos
  fecha: string
  apuntes: Apunte[]
  resumen?: React.ReactNode
}) {
  const [accion, setAccion] = useState<string | null>(null)

  return (
    <Casa
      habitaciones={HABITACIONES}
      inicial={ENTRADA}
      datos={datos}
      onAccion={setAccion}
      accionAbierta={accion}
      resumen={resumen}
      extra={
        accion === 'cuaderno' ? (
          <Cuaderno
            fecha={fecha}
            inicial={datos.apunteHoy}
            anteriores={apuntes}
            onCerrar={() => setAccion(null)}
          />
        ) : null
      }
    />
  )
}
