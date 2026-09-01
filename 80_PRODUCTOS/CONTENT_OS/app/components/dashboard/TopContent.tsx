import Image from "next/image"
import Link from "next/link"
import { Eye, Instagram, Youtube } from "lucide-react"

interface TopItem {
  id: string
  platform: "instagram" | "youtube"
  thumbnail: string
  title: string
  reach: number
  date: string
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k"
  return n.toString()
}

export function TopContent({ items }: { items: TopItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        const href = item.platform === "instagram" ? "/instagram" : "/youtube"
        const PlatformIcon = item.platform === "instagram" ? Instagram : Youtube
        const accentColor = item.platform === "instagram" ? "var(--accent-instagram)" : "var(--accent-youtube)"

        return (
          <Link
            key={item.id}
            href={href}
            className="group flex items-center gap-3 rounded-lg p-2.5 transition-all duration-150 cursor-pointer hover:bg-[rgba(255,255,255,0.03)]"
            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
          >
            <span
              className="w-5 text-[12px] font-bold font-mono text-right flex-shrink-0 tabular-nums"
              style={{ color: "var(--text-faint)" }}
            >
              {i + 1}
            </span>
            <div
              className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg"
              style={{ border: "1px solid var(--border-subtle)" }}
            >
              <Image src={item.thumbnail} alt={item.title} fill className="object-cover" sizes="40px" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-semibold transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PlatformIcon size={10} style={{ color: accentColor }} />
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {item.date}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Eye size={12} />
              <span className="font-mono font-semibold text-[12px] tabular-nums">{fmt(item.reach)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
