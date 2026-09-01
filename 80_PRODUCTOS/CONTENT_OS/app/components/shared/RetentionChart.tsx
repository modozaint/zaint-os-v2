"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface RetentionPoint {
  second: number
  retention: number
}

interface RetentionChartProps {
  data: RetentionPoint[]
  avgWatchTime?: number
  duration?: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: RetentionPoint }> }) {
  if (active && payload?.length) {
    const d = payload[0].payload
    return (
      <div
        style={{
          background: "var(--bg-floating)",
          border: "1px solid var(--border-medium)",
          borderRadius: "8px",
          padding: "7px 11px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.40)",
          fontSize: 11,
        }}
      >
        <p style={{ color: "var(--text-faint)", fontSize: 10, marginBottom: 2 }}>Segundo {d.second}s</p>
        <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.retention}% audiencia</p>
      </div>
    )
  }
  return null
}

export function RetentionChart({ data, avgWatchTime, duration }: RetentionChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ height: 120, background: "var(--bg-elevated)", border: "1px dashed var(--border-medium)" }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          Duración no disponible — retención no calculable
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {(avgWatchTime || duration) && (
        <div className="flex items-center gap-4">
          {avgWatchTime && (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              Tiempo promedio:{" "}
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{avgWatchTime}s</span>
            </span>
          )}
          {duration && (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              Duración:{" "}
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{duration}s</span>
            </span>
          )}
          {avgWatchTime && duration && (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              Retención:{" "}
              <span style={{ fontWeight: 700, color: "var(--color-positive)" }}>
                {Math.round((avgWatchTime / duration) * 100)}%
              </span>
            </span>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(255,255,255,0.035)"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="second"
            tick={{ fontSize: 9, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}s`}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }} />
          {avgWatchTime && (
            <ReferenceLine
              x={avgWatchTime}
              stroke="var(--color-positive)"
              strokeDasharray="4 3"
              strokeWidth={1}
              strokeOpacity={0.6}
            />
          )}
          <Line
            type="monotone"
            dataKey="retention"
            stroke="var(--text-primary)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "var(--text-primary)", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
