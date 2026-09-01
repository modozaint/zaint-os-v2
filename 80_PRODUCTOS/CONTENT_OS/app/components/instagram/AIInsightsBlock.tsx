import { Sparkles, Lightbulb } from "lucide-react"

interface AIInsightsBlockProps {
  insights: string[]
  improvements: string[]
  loading?: boolean
}

export function AIInsightsBlock({ insights, improvements, loading = false }: AIInsightsBlockProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles size={11} style={{ color: "var(--accent-instagram)" }} />
          <span className="section-label">Análisis IA</span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
            style={{
              background: "rgba(226,232,240,0.08)",
              color: "var(--accent-instagram)",
              border: "1px solid rgba(226,232,240,0.12)",
            }}
          >
            Groq
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg p-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", height: 44 }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={11} style={{ color: "var(--accent-instagram)" }} />
            <span className="section-label">Análisis IA</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{
                background: "rgba(226,232,240,0.08)",
                color: "var(--accent-instagram)",
                border: "1px solid rgba(226,232,240,0.12)",
              }}
            >
              Groq
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg p-3"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{
                    background: "rgba(226,232,240,0.08)",
                    color: "var(--accent-instagram)",
                    border: "1px solid rgba(226,232,240,0.12)",
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement points */}
      {improvements.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb size={11} style={{ color: "var(--color-positive)" }} />
            <span className="section-label">Puntos de mejora</span>
          </div>
          <div
            className="flex flex-col gap-0 rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            {improvements.map((point, i) => (
              <div
                key={i}
                className="flex gap-3 px-3 py-2.5"
                style={{
                  background: i % 2 === 0 ? "var(--bg-elevated)" : "transparent",
                  borderBottom: i < improvements.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <span
                  className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full"
                  style={{ background: "var(--color-positive)" }}
                />
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
