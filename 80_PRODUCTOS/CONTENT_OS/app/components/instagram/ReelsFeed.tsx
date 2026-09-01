"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MARCA_DEFAULT, esMarca } from "@/lib/marcas"
import { MarcaSinConectar } from "@/components/shared/MarcaSinConectar"
import { RefreshCw } from "lucide-react"
import { ContentCard } from "@/components/shared/ContentCard"
import { ReelModal } from "./ReelModal"
import type { IGReelData } from "@/lib/instagramTypes"

export function ReelsFeed() {
  const params = useSearchParams()
  const desdeUrl = params.get("marca")
  const marca = esMarca(desdeUrl) ? desdeUrl : MARCA_DEFAULT

  const [reels, setReels] = useState<IGReelData[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReel, setSelectedReel] = useState<IGReelData | null>(null)
  const [sinConectar, setSinConectar] = useState(false)

  async function fetchReels(refresh = false) {
    if (refresh) setSyncing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/instagram/media?marca=${marca}${refresh ? "&refresh=1" : ""}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al cargar reels")
      setSinConectar(Boolean(data.sinConectar))
      setReels(data.reels)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchReels()
  }, [marca]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl"
            style={{
              height: 220,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        ))}
      </div>
    )
  }

  if (sinConectar) return <MarcaSinConectar marca={marca} />

  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl p-10 text-center"
        style={{ border: "1px dashed var(--border-medium)", background: "var(--bg-elevated)" }}
      >
        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
          No se pudieron cargar los reels
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{error}</p>
        <button
          onClick={() => fetchReels()}
          className="mt-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer"
          style={{
            background: "var(--sidebar-active-bg)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-primary)",
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
          Todos los reels
        </span>

      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-4">
        {reels.map((reel) => (
          <ContentCard
            key={reel.id}
            id={reel.id}
            thumbnail={reel.thumbnail}
            caption={reel.caption}
            date={reel.date}
            metrics={{
              views: reel.metrics.views,
              reach: reel.metrics.reach,
              likes: reel.metrics.likes,
              saves: reel.metrics.saves,
              engagement_rate: reel.metrics.engagement_rate,
            }}
            transcribed={reel.transcribed}
            platform="instagram"
            duration={reel.metrics.duration_s > 0 ? `${reel.metrics.duration_s}s` : undefined}
            onClick={() => setSelectedReel(reel)}
          />
        ))}
      </div>

      {/* Modal */}
      <ReelModal reel={selectedReel} onClose={() => setSelectedReel(null)} />
    </>
  )
}
