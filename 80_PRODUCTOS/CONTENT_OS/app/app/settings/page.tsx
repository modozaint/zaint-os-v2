"use client"

import { useState, useEffect } from "react"
import { Save, Target, Plug } from "lucide-react"
import { loadGoals, saveTargets, type Goal } from "@/lib/goals"
import { Cadencia } from "@/components/plan/Cadencia"
import { ConexionTikTok } from "@/components/settings/ConexionTikTok"

export default function SettingsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setGoals(loadGoals())
  }, [])

  function updateTarget(index: number, value: string) {
    const num = parseInt(value.replace(/\D/g, ""), 10)
    if (isNaN(num)) return
    setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, target: num } : g)))
  }

  function save() {
    const targets = Object.fromEntries(goals.map((g) => [g.label, g.target]))
    saveTargets(targets)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-2xl">
      {/* Objetivos mensuales */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Target size={15} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Objetivos del mes
          </h2>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Definí los targets. Los valores actuales se actualizan automáticamente desde la API de Instagram.
        </p>

        <div className="flex flex-col gap-2">
          {goals.map((goal, i) => (
            <div
              key={goal.label}
              className="flex items-center justify-between gap-4 rounded-xl p-4"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {goal.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  Actual: <span style={{ color: "var(--text-secondary)" }}>
                    {goal.current > 0 ? goal.current.toLocaleString() : "—"}
                  </span>
                  <span style={{ marginLeft: 6, opacity: 0.5 }}>vía API</span>
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  Objetivo:
                </span>
                <input
                  type="text"
                  value={goal.target.toLocaleString()}
                  onChange={(e) => updateTarget(i, e.target.value)}
                  className="w-28 rounded-lg px-3 py-1.5 text-right font-mono text-[12px] focus:outline-none transition-colors"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-all duration-150 cursor-pointer"
          style={{
            background: "var(--bg-floating)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-medium)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Save size={13} />
          {saved ? "Guardado ✓" : "Guardar cambios"}
        </button>
      </section>

      <Cadencia />

      <ConexionTikTok />

      {/* Integraciones */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Plug size={15} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Integraciones
          </h2>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Configurá las variables de entorno en{" "}
          <code
            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            .env.local
          </code>{" "}
          para activar cada módulo.
        </p>

        <div className="flex flex-col gap-2">
          {[
            { label: "Instagram Graph API", env: "INSTAGRAM_ACCESS_TOKEN", note: "Expira cada 60 días — renovar mensualmente" },
            { label: "Gemini API", env: "GEMINI_API_KEY", note: "Transcripciones + AI Chat" },
          ].map(({ label, env, note }) => (
            <div
              key={env}
              className="flex items-center justify-between rounded-xl p-4"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  {note}
                </span>
              </div>
              <code className="text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>
                {env}
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
