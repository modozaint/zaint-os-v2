"use client";

/**
 * MARCA DE GRABACIÓN — el punto de color que ubica a quien graba.
 *
 * Por qué existe: grabar una demo de 8 minutos con seis pantallas distintas
 * obliga a recordar qué se dice en cada una. Perder el hilo en cámara se nota.
 *
 * Cada punto de color corresponde a una escena del guion. Quien graba mira el
 * color, sabe qué toca decir y sigue. Para cualquier otra persona es un detalle
 * decorativo: no dice nada, no estorba, no explica de más.
 *
 * Se apagan todos de una poniendo MARCAS_VIDEO en false, cuando la demo pase.
 */

const MARCAS_VIDEO = true;

/** Los colores del guion, en el orden en que se graban. */
export const ESCENAS = {
  1: { color: "#3b82f6", nombre: "azul" },      // Extracción
  2: { color: "#22c55e", nombre: "verde" },     // Leads / tablero
  3: { color: "#eab308", nombre: "amarillo" },  // Conversaciones (la prueba)
  4: { color: "#a855f7", nombre: "morado" },    // Piloto y cadencia
  5: { color: "#f97316", nombre: "naranja" },   // Análisis / números
  6: { color: "#ef4444", nombre: "rojo" },      // In the loop / escalado
  7: { color: "#14b8a6", nombre: "turquesa" },  // Ajustes / cómo se armó
} as const;

export type NumEscena = keyof typeof ESCENAS;

export function MarcaVideo({
  escena,
  className = "",
}: {
  escena: NumEscena;
  className?: string;
}) {
  if (!MARCAS_VIDEO) return null;
  const { color } = ESCENAS[escena];
  return (
    <span
      aria-hidden
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full align-middle ${className}`}
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}99` }}
    />
  );
}
