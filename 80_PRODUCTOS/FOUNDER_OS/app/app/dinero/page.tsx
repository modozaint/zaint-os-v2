import { cargarDinero, cargarPresupuesto, cargarDiagnostico } from '@/lib/dinero'
import { Volver } from '../volver'
import { BarraVoz } from '../barra-voz'
import { PantallaDinero } from './pantalla'


export default async function Page() {
  const [d, p, diag] = await Promise.all([cargarDinero(), cargarPresupuesto(), cargarDiagnostico()])
  return (
    <>
      <PantallaDinero
        bancos={d.bancos} bolsillos={d.bolsillos} movimientos={d.movimientos}
        total={d.total} asignadoMes={d.asignadoMes}
        quincena={d.quincena} tocaQuincena={d.tocaQuincena}
        cargadoQuincena={d.cargadoQuincena} faltaQuincena={d.faltaQuincena}
        antes={p.antes} despues={p.despues} diagnostico={diag}
      />
      <BarraVoz acepta="movimiento" />
      <Volver />
    </>
  )
}
