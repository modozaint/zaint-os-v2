"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
import { MARCAS_OPERATIVAS, MARCA_DEFAULT, esMarca, marcaPorId, type MarcaId } from "@/lib/marcas"
import { cn } from "@/lib/utils"

const CLAVE = "marca-activa"

/**
 * El selector de marca — lo que convierte el sistema en multi-marca de verdad.
 *
 * La marca activa vive en el PARÁMETRO DE URL, no en un estado de React. Así
 * las páginas de servidor (el Dashboard lo es) pueden leerla sin volverse de
 * cliente, y el enlace se puede abrir en el celular y caer en la misma marca.
 * El localStorage solo recuerda la última elección para cuando se entra sin
 * parámetro.
 */
export function MarcaSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [abierto, setAbierto] = useState(false)
  const [configuradas, setConfiguradas] = useState<MarcaId[] | null>(null)

  const desdeUrl = params.get("marca")
  const activa: MarcaId = esMarca(desdeUrl) ? desdeUrl : MARCA_DEFAULT

  // Si se entró sin parámetro, se recupera la última marca usada.
  useEffect(() => {
    if (desdeUrl) return
    const guardada = localStorage.getItem(CLAVE)
    if (esMarca(guardada) && guardada !== MARCA_DEFAULT) cambiar(guardada)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/marcas")
      .then((r) => r.json())
      .then((d) => setConfiguradas(d.configuradas ?? []))
      .catch(() => setConfiguradas([]))
  }, [])

  function cambiar(id: MarcaId) {
    localStorage.setItem(CLAVE, id)
    const siguientes = new URLSearchParams(params.toString())
    siguientes.set("marca", id)
    router.push(`${pathname}?${siguientes.toString()}`)
    setAbierto(false)
  }

  const marca = marcaPorId(activa)

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
          "transition-all duration-150 cursor-pointer hover:bg-[var(--hover-bg)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: marca.color }} />
        <span
          className="max-w-[130px] truncate text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {marca.nombre}
        </span>
        <ChevronDown size={13} style={{ color: "var(--text-faint)" }} />
      </button>

      {abierto && (
        <>
          {/* Capa para cerrar al hacer clic afuera */}
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <ul
            role="listbox"
            className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[210px] overflow-hidden rounded-xl py-1"
            style={{
              background: "var(--bg-sidebar)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            {MARCAS_OPERATIVAS.map((m) => {
              // null = todavía no se sabe. No se marca nada hasta saberlo:
              // decir "sin conectar" antes de tiempo es un dato falso.
              const sinConectar = configuradas !== null && !configuradas.includes(m.id)
              return (
                <li key={m.id}>
                  <button
                    role="option"
                    aria-selected={m.id === activa}
                    onClick={() => cambiar(m.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--hover-bg)] cursor-pointer"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: m.color, opacity: sinConectar ? 0.35 : 1 }}
                    />
                    <span
                      className="flex-1 text-[13px]"
                      style={{ color: sinConectar ? "var(--text-faint)" : "var(--text-primary)" }}
                    >
                      {m.nombre}
                    </span>
                    {sinConectar && (
                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                        sin token
                      </span>
                    )}
                    {m.id === activa && <Check size={13} style={{ color: "var(--text-secondary)" }} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
