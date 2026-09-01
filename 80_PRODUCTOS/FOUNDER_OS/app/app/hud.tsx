import { Icono } from './iconos'
import { CuentaRegresiva } from './cuenta-regresiva'

type Props = {
  vida: number; vidaMaxima: number; xp: number; aviso: React.ReactNode
  balance: number; cerrado: boolean; horaDormir: string; protegido: boolean
  marcados: number; total: number; porCumplido: number; porIncumplido: number
}

/**
 * HUD fijo sobre la barra de navegación. Vida y XP siempre a la vista.
 * El balance del día se muestra EN VIVO: la consecuencia tiene que verse antes
 * del cierre, no aparecer al otro día sin explicación.
 */
export function Hud({
  vida, vidaMaxima, xp, aviso, balance, cerrado, horaDormir, protegido,
  marcados, total, porCumplido, porIncumplido,
}: Props) {
  const pct = Math.round((vida / vidaMaxima) * 100)
  const signo = balance > 0 ? '+' : ''
  // De donde sale el numero. La vida no mira la meta del turno: cuenta habito
  // por habito, y sin verlo escrito un -60 parece un castigo sin causa.
  const sinMarcar = total - marcados

  return (
    <div className="hud">
      <div className="hud-aviso">{aviso}</div>

      {!cerrado && (
        <div className={'hud-balance' + (balance < 0 ? ' mal' : balance > 0 ? ' bien' : '')}>
          {protegido ? (
            <span>Día protegido · <b>no resta vida</b></span>
          ) : (
            <span>
              Si el día cerrara ahora: <b>{signo}{balance}</b> de vida
              <CuentaRegresiva hora={horaDormir} />
            </span>
          )}
          {!protegido && sinMarcar > 0 && (
            <span className="hud-cuentas mono">
              +{marcados * porCumplido} por {marcados} marcado{marcados === 1 ? '' : 's'}
              {' · '}−{sinMarcar * porIncumplido} por {sinMarcar} sin marcar
            </span>
          )}
        </div>
      )}

      <div className="hud-barras">
        <div className="hud-lado">
          <span className="hud-ico"><Icono nombre="flame-kindling" tam={15} grosor={2} /></span>
          <div className="hud-barra vida">
            <i style={{ width: pct + '%' }} />
          </div>
          <span className="hud-num mono">{vida}</span>
        </div>
        <div className="hud-lado">
          <span className="hud-ico xp"><Icono nombre="zap" tam={15} grosor={2} /></span>
          <span className="hud-num mono">{xp} XP</span>
        </div>
      </div>
    </div>
  )
}
