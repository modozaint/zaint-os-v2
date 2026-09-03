import type { Funcion } from "./piezasTipos"

/** Estrategia vigente de MODOZAINT, cerca del producto que la opera. */
export const PILARES_MODOZAINT = [
  { id: "construir-publico", nombre: "Construir en publico", detalle: "Avances, decisiones, errores y pruebas de proyectos reales." },
  { id: "ia-negocio", nombre: "IA para ecommerce y negocio", detalle: "Procesos concretos que una operacion puede mejorar." },
  { id: "agentes", nombre: "Agentes y automatizaciones", detalle: "Trabajo completo que un sistema toma con criterio humano." },
  { id: "stack-ia", nombre: "Claude, ChatGPT, Codex, skills y MCP", detalle: "El stack aplicado a una tarea, con pantalla y contexto." },
  { id: "vibe-coding", nombre: "Vibe coding y software util", detalle: "De idea a prototipo: iteraciones, limites y version funcional." },
  { id: "inteligencia-producto", nombre: "Inteligencia de producto", detalle: "Producto, catalogo, demanda y competidores con fuentes visibles." },
  { id: "sistemas-contenido", nombre: "Sistemas de contenido", detalle: "Como el trabajo real se vuelve pieza, aprendizaje y medicion." },
  { id: "aprendizajes-negocio", nombre: "Aprendizajes de negocio", detalle: "Lo que funciono, fallo o cambio una decision." },
] as const

export type PilarId = (typeof PILARES_MODOZAINT)[number]["id"]

export const NIVELES_CONTENIDO: Array<{
  funcion: Funcion
  nombre: string
  proporcion: number
  detalle: string
}> = [
  { funcion: "adquisicion", nombre: "Atraccion", proporcion: 50, detalle: "Alcance: tip, skill, demostracion o tension." },
  { funcion: "autoridad", nombre: "Nutricion", proporcion: 33, detalle: "Confianza: mini caso, criterio o paso a paso." },
  { funcion: "conversion", nombre: "Conversion", proporcion: 17, detalle: "Demanda: siguiente accion real y medible." },
]

export const MEZCLA_MODOZAINT: Record<Funcion, number> = {
  adquisicion: 50,
  autoridad: 33,
  conversion: 17,
}

export function pilarPorId(id: string | null | undefined) {
  return PILARES_MODOZAINT.find((p) => p.id === id) ?? null
}
