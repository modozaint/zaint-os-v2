"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, X } from "lucide-react"
import type { GeminiAlert } from "@/lib/gemini"

export function GeminiAlertBanner() {
  const [alerts, setAlerts] = useState<GeminiAlert[]>([])

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts")
      const data = await res.json()
      if (data.alerts?.length > 0) {
        setAlerts((prev) => [...prev, ...data.alerts])
      }
    } catch { /* ignorar */ }
  }, [])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [poll])

  if (alerts.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative mx-4 flex max-w-lg flex-col gap-5 rounded-2xl p-8"
        style={{
          background: "#1a0a0a",
          border: "2px solid rgba(239,68,68,0.6)",
          boxShadow: "0 0 60px rgba(239,68,68,0.25), 0 0 120px rgba(239,68,68,0.1)",
        }}
      >
        <button
          onClick={() => setAlerts([])}
          className="absolute right-4 top-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "rgba(239,68,68,0.8)" }}
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <AlertTriangle size={20} style={{ color: "rgb(239,68,68)" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "rgb(239,68,68)" }}>
              ⚠ Gemini fue invocado
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(239,68,68,0.7)" }}>
              Se detectó un intento de usar la API de Google Gemini
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg px-3 py-2.5 font-mono text-[11px]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "rgba(239,68,68,0.9)",
              }}
            >
              <span style={{ color: "rgba(239,68,68,0.5)" }}>caller: </span>{alert.caller}
              <br />
              <span style={{ color: "rgba(239,68,68,0.5)" }}>time: </span>
              {new Date(alert.timestamp).toLocaleTimeString("es-AR")}
            </div>
          ))}
        </div>

        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Revisá el código que genera esta llamada y reemplazalo con Groq.
        </p>

        <button
          onClick={() => setAlerts([])}
          className="cursor-pointer rounded-lg px-4 py-2 text-[12px] font-semibold transition-all hover:opacity-80"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "rgb(239,68,68)",
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
