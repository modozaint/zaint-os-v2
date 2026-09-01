import { cargarLista } from '@/lib/hoy'
import { Volver } from '../volver'
import { BarraVoz } from '../barra-voz'
import { ListaTareas } from './lista'


export default async function Tareas() {
  const { tareas, peldanos, areas, cuentas, sinCuenta, metaIngreso, horasLibres } = await cargarLista()
  return (
    <>
      <ListaTareas
        tareas={tareas} peldanos={peldanos} areas={areas}
        cuentas={cuentas} sinCuenta={sinCuenta}
        metaIngreso={metaIngreso} horasLibres={horasLibres}
      />
      <BarraVoz acepta="tarea" />
      <Volver />
    </>
  )
}
