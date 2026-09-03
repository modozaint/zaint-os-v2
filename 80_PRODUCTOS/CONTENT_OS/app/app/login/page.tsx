"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { USUARIOS, type UsuarioId } from "@/lib/usuarios"

/**
 * ENTRAR — en dos pasos, y el segundo NO es seguridad.
 *
 *   1. La clave del equipo  → ¿puede entrar?      (una sola, compartida)
 *   2. ¿Quién sos?          → ¿quién está escribiendo?
 *
 * El paso 1 se salta si ya hay sesión válida. Eso es lo que hace que las
 * cookies que ya están en los navegadores de Santiago y Víctor NO se
 * invaliden: llegan acá, la app ve que ya tienen permiso, y solo les pide
 * elegir quiénes son. Sin pantalla en blanco y sin volver a escribir la clave.
 */

type Paso = "cargando" | "clave" | "quien"

export default function LoginPage() {
  const [paso, setPaso] = useState<Paso>("cargando")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/usuario")
      .then((r) => r.json())
      .then((d) => setPaso(d.sesion ? "quien" : "clave"))
      // Si la consulta falla, se pide la clave: es el camino que siempre
      // funciona. Asumir que hay sesión sería dejar entrar sin comprobar.
      .catch(() => setPaso("clave"))
  }, [])

  async function enviarClave(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setPaso("quien")
        return
      }
      setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  async function elegir(usuario: UsuarioId) {
    if (loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      })
      if (res.ok) {
        // Recarga completa y no router.push: el proxy tiene que volver a
        // mirar las cookies para dejar pasar.
        window.location.href = "/dashboard"
        return
      }
      setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-6"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="flex w-full max-w-[380px] flex-col items-center">
        <Image
          src="/marcas/modozaint.svg"
          alt="MODOZAINT"
          width={96}
          height={96}
          priority
          className="mb-6 object-contain"
        />

        <h1
          className="font-display text-[34px] font-semibold leading-none"
          style={{ color: "var(--text-primary)" }}
        >
          MODOZAINT
        </h1>
        <p className="section-label mt-3 mb-10">
          {paso === "quien" ? "Content OS · ¿Quién sos?" : "Content OS · Acceso del equipo"}
        </p>

        {paso === "cargando" && (
          <p className="text-[13px]" style={{ color: "var(--text-faint)" }}>
            Un segundo…
          </p>
        )}

        {paso === "clave" && (
          <form onSubmit={enviarClave} className="flex w-full flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              placeholder="Contraseña del equipo"
              autoFocus
              className="w-full rounded-[12px] px-4 py-3.5 text-[15px] outline-none transition-shadow"
              style={{
                background: "var(--bg-surface)",
                border: error
                  ? "1px solid var(--color-negative)"
                  : "1px solid var(--border-medium)",
                color: "var(--text-primary)",
              }}
            />

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full cursor-pointer rounded-[100px] py-3.5 text-[12px] font-bold uppercase transition-all disabled:opacity-50"
              style={{ background: "#C49A52", color: "#070E0C", letterSpacing: "3px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#B8863E")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#C49A52")}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}

        {paso === "quien" && (
          <div className="flex w-full flex-col gap-3">
            {USUARIOS.map((u) => (
              <button
                key={u.id}
                onClick={() => elegir(u.id)}
                disabled={loading}
                className="flex w-full cursor-pointer items-center gap-3 rounded-[12px] px-4 py-3.5 text-left transition-colors disabled:opacity-50"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                  style={{ background: "#C49A52", color: "#070E0C" }}
                >
                  {u.inicial}
                </span>
                <span className="text-[15px]">{u.nombre}</span>
              </button>
            ))}
            <p className="mt-2 text-center text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
              Sirve para firmar las ideas que anotes, no para dar permisos.
              La contraseña del equipo es una sola.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-[13px]" style={{ color: "var(--color-negative)" }}>
            {paso === "clave"
              ? "Contraseña incorrecta — intentá de nuevo."
              : "No se pudo guardar quién sos — intentá de nuevo."}
          </p>
        )}
      </div>
    </div>
  )
}
