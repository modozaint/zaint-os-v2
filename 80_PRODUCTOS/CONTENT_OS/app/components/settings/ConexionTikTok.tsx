"use client"

import { useCallback, useEffect, useState } from "react"
import { Music2, RefreshCw } from "lucide-react"
import { MARCAS_OPERATIVAS } from "@/lib/marcas"

interface EstadoMarca {
  marca: string
  conectada: boolean
  handle?: string | null
  display_name?: string | null
  expira_en?: string | null
}

interface Estado {
  configurado: boolean
  redirect_uri: string
  marcas: EstadoMarca[]
}

const tarjeta = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border)",
  boxShadow: "var(--glass-shadow)",
}

export function ConexionTikTok() {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/tiktok")
      setEstado(await res.json())
    } catch {
      setEstado(null)
    }
  }, [])

  useEffect(() => {
    cargar()

    // El callback de OAuth vuelve con el resultado en la URL. Se lee una vez y
    // se limpia, para que un F5 no repita un mensaje viejo como si fuera nuevo.
    const params = new URLSearchParams(window.location.search)
    const r = params.get("tiktok")
    if (r === "ok") {
      const handle = params.get("handle")
      setAviso({
        tipo: "ok",
        texto: handle ? `Conectada @${handle}` : "Cuenta conectada",
      })
    } else if (r === "error") {
      setAviso({ tipo: "error", texto: params.get("motivo") ?? "No se pudo conectar" })
    }
    if (r) window.history.replaceState({}, "", window.location.pathname)
  }, [cargar])

  async function sincronizar() {
    setSincronizando(true)
    try {
      const res = await fetch("/api/tiktok/sync", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        const detalle = Object.entries(data.porMarca ?? {})
          .map(([m, n]) => `${m}: ${n}`)
          .join(" · ")
        setAviso({
          tipo: "ok",
          texto: data.aviso ?? `${data.synced} videos sincronizados${detalle ? ` (${detalle})` : ""}`,
        })
      } else {
        setAviso({ tipo: "error", texto: data.error ?? "Falló la sincronización" })
      }
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : String(e) })
    } finally {
      setSincronizando(false)
      cargar()
    }
  }

  const hayAlguna = estado?.marcas.some((m) => m.conectada) ?? false

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Music2 size={15} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            TikTok
          </h2>
        </div>
        {hayAlguna && (
          <button
            onClick={sincronizar}
            disabled={sincronizando}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium disabled:opacity-50"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <RefreshCw size={12} className={sincronizando ? "animate-spin" : ""} />
            {sincronizando ? "Sincronizando…" : "Sincronizar"}
          </button>
        )}
      </div>

      {estado && !estado.configurado && (
        <div className="flex flex-col gap-2 rounded-xl p-4" style={tarjeta}>
          <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
            Falta crear la app en TikTok for Developers
          </span>
          <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Cuando exista, pegá <code className="font-mono">TIKTOK_CLIENT_KEY</code> y{" "}
            <code className="font-mono">TIKTOK_CLIENT_SECRET</code> en las variables de entorno.
            La URL de redirección que hay que registrar es exactamente esta:
          </span>
          <code
            className="rounded px-2 py-1.5 font-mono text-[10px] break-all"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            {estado.redirect_uri}
          </code>
        </div>
      )}

      {aviso && (
        <div
          className="rounded-xl px-4 py-3 text-[11px] leading-relaxed"
          style={{
            ...tarjeta,
            color: aviso.tipo === "ok" ? "var(--text-primary)" : "#ff6b6b",
          }}
        >
          {aviso.texto}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {MARCAS_OPERATIVAS.map((marca) => {
          const e = estado?.marcas.find((m) => m.marca === marca.id)
          return (
            <div key={marca.id} className="flex items-center justify-between rounded-xl p-4" style={tarjeta}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {marca.nombre}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  {e?.conectada
                    ? e.handle
                      ? `@${e.handle}`
                      : "conectada"
                    : "sin conectar"}
                </span>
              </div>
              <a
                href={`/api/tiktok/auth?marca=${marca.id}`}
                aria-disabled={!estado?.configurado}
                onClick={(ev) => {
                  if (!estado?.configurado) ev.preventDefault()
                }}
                className="rounded-lg px-3 py-1.5 text-[11px] font-medium"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: estado?.configurado ? "var(--text-secondary)" : "var(--text-faint)",
                  opacity: estado?.configurado ? 1 : 0.5,
                  pointerEvents: estado?.configurado ? "auto" : "none",
                }}
              >
                {e?.conectada ? "Reconectar" : "Conectar"}
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}
