"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { USUARIOS, type UsuarioId } from "@/lib/usuarios"
import { useUsuario } from "@/components/providers/UsuarioProvider"

/**
 * QUIÉN SOS, siempre a la vista.
 *
 * Se puede cambiar sin cerrar sesión: la clave del equipo es una sola, así que
 * pedirla otra vez para pasar de Santiago a Víctor sería teatro. Lo que
 * importa es que quede claro a nombre de quién se está anotando ANTES de
 * anotar — por eso está en el encabezado y no escondido en Ajustes.
 */
export function UsuarioBadge() {
  const { usuario, cambiar } = useUsuario()
  const [abierto, setAbierto] = useState(false)

  const activo = USUARIOS.find((u) => u.id === usuario)

  async function elegir(id: UsuarioId) {
    await cambiar(id)
    setAbierto(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[var(--hover-bg)]"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        title={activo ? `Estás anotando como ${activo.nombre}` : "Elegí quién sos"}
      >
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{
            background: activo ? "var(--marca-acento, #C49A52)" : "var(--bg-elevated)",
            color: activo ? "#0A0A0A" : "var(--text-faint)",
          }}
        >
          {activo?.inicial ?? "?"}
        </span>
        <span
          className="hidden text-[12px] font-medium sm:inline"
          style={{ color: activo ? "var(--text-primary)" : "var(--text-faint)" }}
        >
          {activo?.nombre ?? "¿Quién sos?"}
        </span>
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <ul
            role="listbox"
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[190px] overflow-hidden rounded-xl py-1"
            style={{
              background: "var(--bg-sidebar)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            {USUARIOS.map((u) => (
              <li key={u.id}>
                <button
                  role="option"
                  aria-selected={u.id === usuario}
                  onClick={() => elegir(u.id)}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--hover-bg)]"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                  >
                    {u.inicial}
                  </span>
                  <span className="flex-1 text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {u.nombre}
                  </span>
                  {u.id === usuario && <Check size={13} style={{ color: "var(--text-secondary)" }} />}
                </button>
              </li>
            ))}
            <li
              className="mt-1 border-t px-3 pb-1 pt-2 text-[10.5px] leading-snug"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-faint)" }}
            >
              Firma tus ideas. No da ni quita permisos.
            </li>
          </ul>
        </>
      )}
    </div>
  )
}
