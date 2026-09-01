"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TranscriptionBlock } from "./TranscriptionBlock"
import { AIInsightsBlock } from "./AIInsightsBlock"
import type { IGReelData } from "@/lib/instagramTypes"

interface ReelModalProps {
  reel: IGReelData | null
  onClose: () => void
}

interface TranscriptionData {
  lines: string[]
  ai_insights: string[]
  improvement_points: string[]
  visual_analysis: string
  duration_s: number
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return n.toString()
}

function DeltaCard({ metric, delta }: { metric: string; delta: number }) {
  const isPos = delta > 0
  const isNeg = delta < 0
  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg p-3"
      style={{
        background: isPos
          ? "rgba(34,197,94,0.04)"
          : isNeg
          ? "rgba(239,68,68,0.04)"
          : "var(--bg-elevated)",
        border: `1px solid ${isPos ? "rgba(34,197,94,0.10)" : isNeg ? "rgba(239,68,68,0.10)" : "var(--border-subtle)"}`,
      }}
    >
      <span
        className="text-[10px] font-medium whitespace-nowrap truncate"
        style={{ color: "var(--text-secondary)" }}
      >
        {metric}
      </span>
      <div className="flex items-center gap-1">
        {isPos && <TrendingUp size={11} style={{ color: "#22c55e" }} />}
        {isNeg && <TrendingDown size={11} style={{ color: "#ef4444" }} />}
        <span
          className="text-[13px] font-bold"
          style={{
            color: isPos ? "#22c55e" : isNeg ? "#ef4444" : "var(--text-secondary)",
          }}
        >
          {isPos ? "+" : ""}{delta}%
        </span>
      </div>
    </div>
  )
}

export function ReelModal({ reel, onClose }: ReelModalProps) {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)

  useEffect(() => {
    if (!reel) {
      setTranscription(null)
      setTranscribing(false)
      setTranscriptionError(null)
      return
    }

    async function fetchTranscription() {
      setTranscribing(true)
      setTranscriptionError(null)
      try {
        const metricsParam = encodeURIComponent(JSON.stringify({
          reach: reel!.metrics.reach,
          likes: reel!.metrics.likes,
          saves: reel!.metrics.saves,
          comments: reel!.metrics.comments,
          shares: reel!.metrics.shares,
          engagement_rate: reel!.metrics.engagement_rate,
          avg_comparison: reel!.avg_comparison,
        }))
        const res = await fetch(`/api/instagram/transcribe?id=${reel!.id}&metrics=${metricsParam}`)
        const data = await res.json()
        if (!res.ok) {
          setTranscriptionError(
            data.error === "GROQ_NOT_CONFIGURED"
              ? "Configurá GROQ_API_KEY para habilitar las transcripciones."
              : (data.error ?? "Error al transcribir")
          )
          return
        }
        setTranscription(data)
      } catch {
        setTranscriptionError("No se pudo conectar con el servicio de transcripción.")
      } finally {
        setTranscribing(false)
      }
    }

    fetchTranscription()
  }, [reel?.id])

  return (
    <Sheet open={!!reel} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full! max-w-full! sm:w-[65vw]! sm:max-w-[800px]! p-0"
        style={{
          background: "var(--bg-base)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        {reel && (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 p-6">

              {/* Header — thumbnail + metrics */}
              <div className="flex flex-col gap-5 sm:flex-row">
                <div
                  className="relative h-52 w-[117px] flex-shrink-0 overflow-hidden rounded-xl"
                  style={{ border: "1px solid var(--border-subtle)" }}
                >
                  {reel.thumbnail ? (
                    <Image
                      src={reel.thumbnail}
                      alt={reel.caption}
                      fill
                      className="object-cover"
                      sizes="117px"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: "var(--bg-elevated)" }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                <div className="flex flex-1 flex-col gap-3 min-w-0">
                  <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {reel.caption || "Sin caption"}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{reel.date}</p>

                  {/* Metric pills */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Views", value: fmt(reel.metrics.views || reel.metrics.reach) },
                      { label: "Reach", value: fmt(reel.metrics.reach) },
                      { label: "Likes", value: fmt(reel.metrics.likes) },
                      { label: "Saves", value: fmt(reel.metrics.saves) },
                      { label: "Comments", value: fmt(reel.metrics.comments) },
                      { label: "Shares", value: fmt(reel.metrics.shares) },
                      { label: "ER%", value: (reel.metrics.engagement_rate * 100).toFixed(1) + "%" },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span
                          className="text-[9px] font-semibold uppercase tracking-[0.05em] truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {label}
                        </span>
                        <span
                          className="font-mono text-[15px] font-bold leading-none"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={reel.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-1.5 transition-colors hover:opacity-80"
                    style={{ fontSize: 10, color: "var(--text-faint)" }}
                  >
                    <ExternalLink size={10} />
                    Ver en Instagram
                  </a>
                </div>
              </div>

              <div className="separator-line" />

              {/* Comparación vs promedio */}
              <div className="flex flex-col gap-3">
                <span className="section-label">Comparación vs. promedio</span>
                <div className="grid grid-cols-4 gap-2">
                  {reel.avg_comparison.map(({ metric, delta }) => (
                    <DeltaCard key={metric} metric={metric} delta={delta} />
                  ))}
                </div>
              </div>

              {/* Contexto visual */}
              {(transcription?.visual_analysis || transcribing) && (
                <div className="flex flex-col gap-3">
                  <span className="section-label">Contexto visual</span>
                  {transcribing ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse h-4 rounded"
                          style={{ background: "var(--bg-elevated)", width: `${70 + i * 8}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="rounded-lg p-4"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      {transcription!.visual_analysis.split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Insights */}
              <AIInsightsBlock
                insights={transcription?.ai_insights ?? []}
                improvements={transcription?.improvement_points ?? []}
                loading={transcribing}
              />

              {/* Transcription */}
              {transcriptionError ? (
                <div
                  className="rounded-lg p-4 text-center"
                  style={{ border: "1px dashed var(--border-medium)", background: "var(--bg-elevated)" }}
                >
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{transcriptionError}</p>
                </div>
              ) : (
                <TranscriptionBlock lines={transcription?.lines ?? []} loading={transcribing} />
              )}

            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}
