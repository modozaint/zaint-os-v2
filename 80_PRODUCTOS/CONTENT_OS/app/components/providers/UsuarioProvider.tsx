"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { COOKIE_USUARIO, esUsuario, usuarioPorId, type UsuarioId } from "@/lib/usuarios"

/**
 * QUIÉN ESTÁ ESCRIBIENDO, del lado del navegador.
 *
 * Lee la cookie directamente en vez de preguntarle al servidor en cada carga:
 * el nombre tiene que aparecer al instante, y esta cookie no es un secreto
 * (ver `app/api/usuario/route.ts`). El servidor NO confía en esto — cuando se
 * guarda una idea, el autor lo sella él leyendo la misma cookie del pedido.
 */

interface Contexto {
  usuario: UsuarioId | null
  nombre: string
  cambiar: (id: UsuarioId) => Promise<void>
}

const UsuarioCtx = createContext<Contexto>({
  usuario: null,
  nombre: "",
  cambiar: async () => {},
})

function leerCookie(): UsuarioId | null {
  if (typeof document === "undefined") return null
  const cruda = document.cookie
    .split("; ")
    .find((c) => c.startsWith(COOKIE_USUARIO + "="))
    ?.split("=")[1]
  const valor = cruda ? decodeURIComponent(cruda) : null
  return esUsuario(valor) ? valor : null
}

export function UsuarioProvider({ children }: { children: React.ReactNode }) {
  // Arranca en null y se lee en el efecto: el servidor no tiene document, y
  // leerla durante el render rompería la hidratación.
  const [usuario, setUsuario] = useState<UsuarioId | null>(null)

  useEffect(() => {
    setUsuario(leerCookie())
  }, [])

  const cambiar = useCallback(async (id: UsuarioId) => {
    const res = await fetch("/api/usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: id }),
    })
    // Solo se cambia en pantalla si el servidor lo aceptó. Si falla, la
    // interfaz sigue diciendo la verdad de lo que hay en la cookie.
    if (res.ok) setUsuario(id)
  }, [])

  return (
    <UsuarioCtx.Provider
      value={{ usuario, nombre: usuarioPorId(usuario)?.nombre ?? "", cambiar }}
    >
      {children}
    </UsuarioCtx.Provider>
  )
}

export function useUsuario() {
  return useContext(UsuarioCtx)
}
