"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Settings } from "lucide-react"
import { NAV, conMarca } from "@/lib/navegacion"

export function MobileNav() {
  const pathname = usePathname()
  const marca = useSearchParams().get("marca")
  const items = [...NAV, { href: "/settings", label: "Ajustes", icon: Settings }]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch md:hidden"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--sidebar-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
        backdropFilter: "blur(12px)",
      }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={conMarca(href, marca)}
            className="relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors duration-150"
            style={{
              color: active ? "var(--sidebar-active-text)" : "var(--text-faint)",
            }}
          >
            {active && (
              <span
                className="absolute top-0 h-[2px] w-8 rounded-full"
                style={{
                  background: "linear-gradient(to right, var(--sidebar-active-border), color-mix(in srgb, var(--marca-acento) 35%, transparent))",
                  boxShadow: "0 0 8px color-mix(in srgb, var(--marca-acento) 35%, transparent)",
                }}
              />
            )}
            <Icon size={18} className={active ? "opacity-100" : "opacity-60"} />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
