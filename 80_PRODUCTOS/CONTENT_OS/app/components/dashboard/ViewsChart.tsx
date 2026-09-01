"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ViewsChartProps {
  data: { month: string; organic: number }[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "var(--bg-floating)",
        border: "1px solid var(--border-medium)",
        borderRadius: "10px",
        padding: "9px 13px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.06) inset",
        fontSize: 11,
        backdropFilter: "blur(16px)",
      }}
    >
      <p
        style={{
          marginBottom: 7,
          fontWeight: 600,
          color: "var(--text-faint)",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          fontSize: 9,
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: p.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>{p.name}</span>
          <span
            style={{
              fontWeight: 700,
              marginLeft: "auto",
              paddingLeft: 10,
              color: "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(p.value / 1000).toFixed(0)}k
          </span>
        </div>
      ))}
    </div>
  )
}

export function ViewsChart({ data }: ViewsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={188}>
      <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="organicAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-instagram)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--accent-instagram)" stopOpacity={0.00} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(255,255,255,0.028)"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "var(--text-faint)" }}
          axisLine={false}
          tickLine={false}
          dy={5}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-faint)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }}
        />

        <Area
          type="monotone"
          dataKey="organic"
          name="Views"
          stroke="var(--accent-instagram)"
          strokeWidth={1.5}
          fill="url(#organicAreaGrad)"
          dot={{ r: 2, fill: "var(--accent-instagram)", strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0, fill: "var(--accent-instagram)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
