import Link from "next/link"
import { obtenerPieza } from "@/lib/piezas"
import { esMarca } from "@/lib/marcas"
import { HojaRodaje } from "@/components/plan/HojaRodaje"

// La pieza se edita desde el plan: cachearla mostraría el guion de antes.
export const dynamic = "force-dynamic"

/**
 * LA FICHA DE UNA PIEZA — su hoja de rodaje.
 *
 * Es una RUTA propia y no un modal a propósito: Santiago pidió *«una parte en
 * la cual se vayan a guardar todas las fichas de contenido»*, y una ficha con
 * URL propia se puede abrir en el celular apoyado mientras se graba, guardar
 * en favoritos y mandar por WhatsApp. Un modal no.
 *
 * `?desde=` dice a qué vista del plan volver. Sin eso, entrar desde el
 * calendario y volver te dejaba en el pipeline, que se siente como que la app
 * te movió de sitio.
 */
export default async function RodajePage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ desde?: string; marca?: string }>
}) {
  const { id } = await params
  const { desde, marca } = await searchParams

  const pieza = await obtenerPieza(id)

  if (!pieza) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>
          Esa pieza ya no existe.
        </p>
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Puede que la hayas borrado desde el plan, o que el enlace sea viejo.
        </p>
        <Link href="/plan" className="text-[13px] underline" style={{ color: "var(--text-secondary)" }}>
          Volver al plan
        </Link>
      </div>
    )
  }

  const vista = ["pipeline", "calendario", "tabla"].includes(desde ?? "") ? desde : null
  const marcaVuelta = esMarca(marca) ? marca : pieza.marca_id
  const volverA =
    `/plan?marca=${marcaVuelta ?? ""}` + (vista ? `&vista=${vista}` : "")

  return <HojaRodaje pieza={pieza} volverA={volverA} />
}
