"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MARCA_DEFAULT, esMarca, marcaPorId } from "@/lib/marcas"

/**
 * PINTA LA APP CON LA IDENTIDAD DE LA MARCA ACTIVA.
 *
 * No pinta la app entera de otro color — eso volvería ilegible el tema y
 * borraría el trabajo de contraste que ya está hecho. Reemplaza **el acento**:
 * lo que hoy es dorado Dermatinta pasa a naranja racing en Kaizen y a
 * oliva-ácido en MODOZAINT, que es donde la identidad se reconoce.
 *
 * Se hace con variables CSS en el `<html>` en vez de recargar la página: el
 * cambio es instantáneo y no interrumpe lo que estabas mirando.
 */
export function TemaDeMarca() {
  const desdeUrl = useSearchParams().get("marca")
  const id = esMarca(desdeUrl) ? desdeUrl : MARCA_DEFAULT
  const marca = marcaPorId(id)

  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty("--marca-acento", marca.color)
    raiz.style.setProperty("--marca-profundo", marca.profundo)
    raiz.style.setProperty("--marca-papel", marca.papel)
    raiz.style.setProperty("--marca-fuente", marca.fuente)
    // Los resplandores del fondo también son de marca: sin esto, Kaizen se
    // seguiría viendo con el halo dorado de Dermatinta.
    raiz.style.setProperty("--glow-green", marca.color + "0d")
    raiz.style.setProperty("--glow-teal", marca.profundo + "0d")
    raiz.setAttribute("data-marca", marca.id)
  }, [marca])

  return null
}
