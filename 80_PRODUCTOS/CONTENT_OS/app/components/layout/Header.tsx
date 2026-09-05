"use client"

import { usePathname } from "next/navigation"
import { Sun, Moon, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/ThemeProvider"
import { useState, useEffect, Suspense } from "react"
import { MarcaSelector } from "./MarcaSelector"
import { NuevaPieza } from "@/components/plan/NuevaPieza"
import { UsuarioBadge } from "./UsuarioBadge"

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Overview", description: "Cómo va la marca este mes" },
  "/instagram": { title: "Analizar", description: "Qué publicaste, qué funcionó y qué mejorar" },
  "/estrategia": { title: "Brújula", description: "Pilares, referentes, ideas y medición para mover la marca" },
  "/plan": { title: "Plan", description: "Qué sigue, y dónde se está atascando" },
  "/referentes": { title: "Banco de referentes", description: "Perfiles que estudias, y qué tomar de cada uno" },
  "/chat": { title: "AI Chat", description: "Preguntale a tus propios datos" },
  "/settings": { title: "Ajustes", description: "Cadencia, objetivos y conexiones" },
}

export function Header() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const key = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"))

  const info = key ? pageTitles[key] : { title: "Dashboard", description: "" }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem("last_sync", Date.now().toString())
        setSyncMsg(`✓ ${data.synced} posts`)
      } else {
        setSyncMsg("Error")
      }
    } catch {
      setSyncMsg("Error")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 3000)
    }
  }

  // Auto-sync al abrir el app — máximo 1 vez por hora
  useEffect(() => {
    const lastSync = parseInt(localStorage.getItem("last_sync") ?? "0")
    const oneHour = 60 * 60 * 1000
    if (Date.now() - lastSync > oneHour) {
      void Promise.resolve().then(handleSync)
    }
  }, [])

  const iconBtn = cn(
    "flex h-8 w-8 items-center justify-center rounded-lg",
    "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
    "transition-all duration-150 cursor-pointer",
    "hover:bg-[var(--hover-bg)]"
  )

  return (
    <header
      className="relative flex h-[58px] flex-shrink-0 items-center justify-between px-4 md:px-5"
      style={{
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--sidebar-border)",
      }}
    >
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent 0%, var(--border-subtle) 12%, var(--border-subtle) 88%, transparent 100%)",
        }}
      />

      {/* Left */}
      <div className="flex flex-col gap-[4px]">
        <h1
          className="font-display text-[20px] font-semibold leading-none"
          style={{ color: "var(--text-primary)" }}
        >
          {info.title}
        </h1>
        {info.description && (
          <p className="text-[12px] leading-none" style={{ color: "var(--text-faint)" }}>
            {info.description}
          </p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* useSearchParams necesita un límite de Suspense para no forzar
            renderizado dinámico en las páginas que no lo son. */}
        <Suspense fallback={null}>
          <NuevaPieza />
        </Suspense>
        <Suspense fallback={null}>
          <MarcaSelector />
        </Suspense>
        <UsuarioBadge />
        <span
          className="mx-1 hidden h-4 w-px sm:block"
          style={{ background: "var(--border-subtle)" }}
        />
        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className={cn(iconBtn, "relative w-auto gap-1.5 px-2.5", syncing && "opacity-50")}
          aria-label="Sincronizar datos"
          title="Sincronizar datos con Instagram"
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncMsg ? (
            <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {syncMsg}
            </span>
          ) : (
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              Sync
            </span>
          )}
        </button>

        <button onClick={toggle} className={iconBtn} aria-label={theme === "dark" ? "Modo día" : "Modo noche"}>
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  )
}
