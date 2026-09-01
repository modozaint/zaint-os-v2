import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  accentColor?: string
  suffix?: string
  mono?: boolean
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  suffix,
  mono = false,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const isNeutral = delta !== undefined && delta === 0

  return (
    <div className="card-surface flex flex-col p-5 gap-0">
      {/* Top row — label + icon */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ color: "var(--text-faint)" }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="flex h-[28px] w-[28px] items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-medium)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset",
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5 mb-3.5">
        <span
          className={cn(
            "text-[34px] font-bold leading-none tracking-tight text-gradient",
            mono && "font-mono"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="mb-0.5 text-[16px] font-bold leading-none"
            style={{ color: "var(--text-secondary)" }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Micro separator */}
      <div className="separator-line mb-3" />

      {/* Delta */}
      {delta !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive && (
            <span className="delta-positive">
              <TrendingUp size={9} />
              +{delta}%
            </span>
          )}
          {isNegative && (
            <span className="delta-negative">
              <TrendingDown size={9} />
              {delta}%
            </span>
          )}
          {isNeutral && (
            <span className="delta-neutral">
              <Minus size={9} />
              0%
            </span>
          )}
          {deltaLabel && (
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
