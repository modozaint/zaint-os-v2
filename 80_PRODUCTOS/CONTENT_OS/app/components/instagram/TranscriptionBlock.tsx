"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface TranscriptionBlockProps {
  lines: string[]
  loading?: boolean
}

export function TranscriptionBlock({ lines, loading = false }: TranscriptionBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        <span className="section-label">Transcripción</span>
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded"
              style={{
                height: 10,
                width: `${60 + (i % 3) * 15}%`,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!lines.length) {
    return (
      <div
        className="rounded-lg p-5 text-center"
        style={{
          border: "1px dashed var(--border-medium)",
          background: "var(--bg-elevated)",
        }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Transcripción no disponible.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="section-label">Transcripción</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-150 cursor-pointer"
          style={{ color: copied ? "var(--color-positive)" : "var(--text-faint)" }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div
        className="rounded-lg p-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <p
              key={i}
              className="font-mono text-[11px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
