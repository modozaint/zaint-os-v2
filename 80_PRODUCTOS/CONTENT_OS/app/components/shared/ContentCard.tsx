import Image from "next/image"
import { Eye, Heart, Bookmark, CheckCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContentCardMetrics {
  views: number
  reach: number
  likes: number
  saves: number
  engagement_rate: number
}

interface ContentCardProps {
  id: string
  thumbnail: string
  caption: string
  date: string
  metrics: ContentCardMetrics
  transcribed?: boolean
  platform?: "instagram" | "youtube"
  duration?: string
  onClick?: (id: string) => void
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return n.toString()
}

export function ContentCard({
  id,
  thumbnail,
  caption,
  date,
  metrics,
  transcribed = false,
  platform = "instagram",
  duration,
  onClick,
}: ContentCardProps) {
  const isYT = platform === "youtube"
  const aspectClass = isYT ? "aspect-video" : "aspect-[9/16]"

  return (
    <div
      className={cn("card-surface group cursor-pointer overflow-hidden")}
      onClick={() => onClick?.(id)}
    >
      {/* Thumbnail */}
      <div className={cn("relative w-full overflow-hidden", aspectClass)}>
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={caption}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="h-full w-full" style={{ background: "var(--bg-elevated)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />

        {duration && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white/90"
            style={{
              background: "rgba(0,0,0,0.70)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <Clock size={9} />
            {duration}
          </div>
        )}

        {transcribed && (
          <div
            className="absolute left-2 top-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: "rgba(34,197,94,0.12)",
              color: "var(--color-positive)",
              border: "1px solid rgba(34,197,94,0.22)",
              backdropFilter: "blur(10px)",
            }}
          >
            <CheckCircle size={9} />
            Transcripto
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4">
        <p
          className="line-clamp-2 text-[12px] leading-relaxed font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {caption}
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {date}
        </p>

        {/* Metrics */}
        <div
          className="flex items-center gap-3 pt-2.5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
            <Eye size={11} />
            {/* views = reproducciones totales (el número que muestra la app de IG); fallback a reach para cache viejo sin views */}
            <span className="tabular-nums">{fmt(metrics.views || metrics.reach)}</span>
          </div>
          <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
            <Heart size={11} />
            <span className="tabular-nums">{fmt(metrics.likes)}</span>
          </div>
          <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
            <Bookmark size={11} />
            <span className="tabular-nums">{fmt(metrics.saves)}</span>
          </div>
          <span
            className="ml-auto text-[12px] font-bold tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {(metrics.engagement_rate * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}
