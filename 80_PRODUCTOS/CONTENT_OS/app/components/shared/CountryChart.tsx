"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface CountryData {
  country: string
  organic: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "var(--bg-floating)",
          border: "1px solid var(--border-medium)",
          borderRadius: "8px",
          padding: "8px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.40)",
          fontSize: 11,
        }}
      >
        <p style={{ marginBottom: 5, fontWeight: 600, color: "var(--text-primary)", fontSize: 11 }}>
          {label}
        </p>
        {payload.map((p) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "2px", backgroundColor: p.color, flexShrink: 0 }} />
            <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>{p.name}</span>
            <span style={{ fontWeight: 700, marginLeft: "auto", paddingLeft: 8, color: p.color, fontVariantNumeric: "tabular-nums" }}>
              {p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : p.value.toString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function CountryChart({ data }: { data: CountryData[] }) {
  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.035)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 9, fill: "var(--text-faint)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()}
        />
        <YAxis
          dataKey="country"
          type="category"
          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.025)" }} />
        <Bar dataKey="organic" name="Views" fill="var(--accent-instagram)" radius={[0, 3, 3, 0]} fillOpacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  )
}
