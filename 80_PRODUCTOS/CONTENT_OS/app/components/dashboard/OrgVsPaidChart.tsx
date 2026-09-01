"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface OrgVsPaidChartProps {
  data: { month: string; organic: number; paid: number }[]
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
              borderRadius: "2px",
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
              color: p.color,
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

export function OrgVsPaidChart({ data }: OrgVsPaidChartProps) {
  return (
    <ResponsiveContainer width="100%" height={168}>
      <BarChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: -18 }} barCategoryGap="34%">
        <defs>
          <linearGradient id="organicBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-instagram)" stopOpacity={0.92} />
            <stop offset="100%" stopColor="var(--accent-instagram)" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="paidBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-ads)" stopOpacity={0.90} />
            <stop offset="100%" stopColor="var(--accent-ads)" stopOpacity={0.50} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(255,255,255,0.028)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "var(--text-faint)", fontFamily: "var(--font-barlow)" }}
          axisLine={false}
          tickLine={false}
          dy={5}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-faint)", fontFamily: "var(--font-barlow)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.018)" }} />
        <Legend
          wrapperStyle={{ fontSize: 10, color: "var(--text-secondary)", paddingTop: 10 }}
          iconType="square"
          iconSize={5}
        />
        <Bar
          dataKey="organic"
          name="Orgánico"
          fill="url(#organicBarGrad)"
          stackId="a"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="paid"
          name="Paid"
          fill="url(#paidBarGrad)"
          stackId="a"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
