'use client'

import { useEffect, useState } from 'react'

/**
 * Cuanto falta para que el dia cierre y la vida se mueva.
 *
 * Antes decia "cierra 22:45", que obliga a hacer la resta de cabeza cada vez.
 * El numero que uno quiere a las 8 de la noche es cuanto le queda, no a que
 * hora es el corte.
 *
 * Se calcula en el navegador a proposito: el servidor corre en UTC y pintarlo
 * alli daria una hora distinta a la del celular, que ademas parpadearia al
 * hidratar. Por eso arranca vacio y aparece en el primer efecto.
 */
export function CuentaRegresiva({ hora }: { hora: string }) {
  const [faltan, setFaltan] = useState<number | null>(null)

  useEffect(() => {
    const medir = () => setFaltan(minutosHasta(hora))
    medir()
    const id = setInterval(medir, 20_000)
    return () => clearInterval(id)
  }, [hora])

  if (faltan === null) return null

  if (faltan <= 0) {
    return <em className="cierre ya"> · cerrando el día</em>
  }

  const h = Math.floor(faltan / 60)
  const m = faltan % 60
  const texto = h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`

  return (
    <em className={'cierre' + (faltan <= 60 ? ' pronto' : '')}>
      {' '}· cierra en <b>{texto}</b>
    </em>
  )
}

/** Minutos desde ahora hasta la hora de cierre, medido en Bogota. */
function minutosHasta(hhmm: string): number {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())

  const ahora = Number(partes.find(p => p.type === 'hour')!.value) * 60
    + Number(partes.find(p => p.type === 'minute')!.value)

  const [h, m] = hhmm.split(':').map(Number)
  const cierre = h * 60 + m

  // Entre el cierre y dos horas despues sigue siendo "hoy" y da negativo: es
  // justo la ventana en la que uno alcanza a marcar algo antes de dormir.
  return cierre - ahora
}
