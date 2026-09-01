"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { NAV, conMarca } from "@/lib/navegacion"
import { MARCA_DEFAULT, esMarca, marcaPorId } from "@/lib/marcas"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const marca = useSearchParams().get("marca")
  const identidad = marcaPorId(esMarca(marca) ? marca : MARCA_DEFAULT)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored === "true") setCollapsed(true)
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  return (
    <aside
      className={cn(
        "relative hidden h-full flex-col flex-shrink-0 md:flex",
        "transition-all duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-[236px]"
      )}
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, var(--border-subtle) 15%, var(--border-subtle) 85%, transparent 100%)",
        }}
      />

      {/* Logo */}
      <div
        className={cn(
          "flex h-[58px] items-center px-4",
          collapsed ? "justify-center px-0" : "gap-3"
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center">
          {identidad.logo ? (
            <Image
              src={identidad.logo}
              alt={identidad.nombre}
              width={52}
              height={52}
              className="logo-adaptive object-contain"
              priority
            />
          ) : (
            // Sin logo en el vault se pinta la inicial en el color de la marca.
            // Inventarle un logo seria peor: quedaria una identidad falsa.
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[17px] font-bold"
              style={{ background: identidad.color + "26", color: identidad.color }}
              title={`${identidad.nombre} — sin logo en el vault todavia`}
            >
              {identidad.nombre[0]}
            </span>
          )}
        </div>
        {!collapsed && (
          <span
            className="truncate text-[19px] font-semibold"
            style={{ color: "var(--text-primary)", fontFamily: identidad.fuente }}
          >
            {identidad.nombre}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          const item = (
            <Link
              href={conMarca(href, marca)}
              className={cn(
                "group relative flex items-center rounded-[10px] font-medium",
                "transition-all duration-150 cursor-pointer",
                collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                "text-[14px]",
                active
                  ? "text-[var(--sidebar-active-text)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              style={
                active
                  ? {
                      background: "var(--sidebar-active-bg)",
                      boxShadow: "var(--sidebar-active-shadow)",
                    }
                  : undefined
              }
            >
              {active && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{
                    background: "linear-gradient(to bottom, var(--sidebar-active-border), color-mix(in srgb, var(--marca-acento) 35%, transparent))",
                    boxShadow: "0 0 8px color-mix(in srgb, var(--marca-acento) 35%, transparent), 0 0 16px color-mix(in srgb, var(--marca-acento) 15%, transparent)",
                  }}
                />
              )}

              <Icon
                size={16}
                className={cn(
                  "flex-shrink-0 transition-colors duration-150",
                  active ? "opacity-100" : "opacity-50 group-hover:opacity-75"
                )}
              />
              {!collapsed && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger render={<div />}>
                  {item}
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return <div key={href}>{item}</div>
        })}
      </nav>

      {/* Bottom — Settings */}
      <div
        className="p-2 pb-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Link
                href={conMarca("/settings", marca)}
                className={cn(
                  "group relative flex items-center justify-center rounded-[10px] p-3",
                  "transition-all duration-150 cursor-pointer",
                  pathname === "/settings"
                    ? "text-[var(--sidebar-active-text)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
                style={
                  pathname === "/settings"
                    ? {
                        background: "var(--sidebar-active-bg)",
                        boxShadow: "var(--sidebar-active-shadow)",
                      }
                    : undefined
                }
              >
                <Settings size={16} className="opacity-50 group-hover:opacity-75 transition-opacity" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Settings
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href={conMarca("/settings", marca)}
            className={cn(
              "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5",
              "text-[14px] font-medium transition-all duration-150 cursor-pointer",
              pathname === "/settings"
                ? "text-[var(--sidebar-active-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            style={
              pathname === "/settings"
                ? {
                    background: "var(--sidebar-active-bg)",
                    boxShadow: "var(--sidebar-active-shadow)",
                  }
                : undefined
            }
          >
            {pathname === "/settings" && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, var(--sidebar-active-border), color-mix(in srgb, var(--marca-acento) 35%, transparent))",
                  boxShadow: "0 0 8px color-mix(in srgb, var(--marca-acento) 35%, transparent)",
                }}
              />
            )}
            <Settings size={16} className="flex-shrink-0 opacity-50 group-hover:opacity-75 transition-opacity" />
            <span>Settings</span>
          </Link>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={toggle}
        className={cn(
          "absolute -right-3 top-[56px] z-10",
          "flex h-6 w-6 items-center justify-center rounded-full",
          "transition-all duration-150 cursor-pointer"
        )}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-medium)",
          color: "var(--text-faint)",
          boxShadow: "0 2px 8px rgba(10,42,35,0.18)",
        }}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  )
}
