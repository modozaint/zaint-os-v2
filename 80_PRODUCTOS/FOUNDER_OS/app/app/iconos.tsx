/**
 * Iconos Lucide, elegidos por Santiago el 2026-08-14.
 * Se dibujan con `currentColor`: el color lo pone quien los usa
 * (cada habito toma el de su area). Sin dependencias: los paths van aqui.
 */

type Trazo = { d: string } | { circulo: [number, number, number] }

const ICONOS: Record<string, Trazo[]> = {
  // --- habitos ---
  footprints: [
    { d: 'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z' },
    { d: 'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z' },
    { d: 'M16 17h4' },
    { d: 'M4 13h4' },
  ],
  'book-open': [
    { d: 'M12 5v16' },
    { d: 'M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z' },
  ],
  'bed-double': [
    { d: 'M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8' },
    { d: 'M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4' },
    { d: 'M12 4v6' },
    { d: 'M2 18h20' },
  ],
  'cloud-upload': [
    { d: 'M12 13v8' },
    { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' },
    { d: 'm8 17 4-4 4 4' },
  ],
  lightbulb: [
    { d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5' },
    { d: 'M9 18h6' },
    { d: 'M10 22h4' },
  ],
  timeline: [
    { d: 'M4 12h.01' },
    { d: 'M4 16h.01' },
    { d: 'M4 20h.01' },
    { d: 'M4 4h.01' },
    { d: 'M4 8h.01' },
    { d: 'M9.414 13.414a2 2 0 0 0 1.414.586H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 12z' },
    { d: 'M9.414 21.414a2 2 0 0 0 1.414.586H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 20z' },
    { d: 'M9.414 5.414A2 2 0 0 0 10.828 6H19a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 4z' },
  ],
  'heart-plus': [
    { d: 'm14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49' },
    { d: 'M15 15h6' },
    { d: 'M18 12v6' },
  ],
  unplug: [
    { d: 'm19 5 3-3' },
    { d: 'm2 22 3-3' },
    { d: 'M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z' },
    { d: 'M7.5 13.5 10 11' },
    { d: 'M10.5 16.5 13 14' },
    { d: 'm12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z' },
  ],

  // --- sistema ---
  zap: [
    { d: 'M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z' },
  ],
  'flame-kindling': [
    { d: 'M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z' },
    { d: 'm5 22 14-4' },
    { d: 'm5 18 14 4' },
  ],
  target: [
    { circulo: [12, 12, 10] },
    { circulo: [12, 12, 6] },
    { circulo: [12, 12, 2] },
  ],
}

/** Que icono le toca a cada habito. El id manda; `icono` en la BD puede sobreescribirlo. */
export const ICONO_HABITO: Record<string, string> = {
  ejercicio: 'footprints',
  leer: 'book-open',
  dormir: 'bed-double',
  publicar: 'cloud-upload',
  aprender: 'lightbulb',
  bloque: 'timeline',
  novia: 'heart-plus',
  desconectar: 'unplug',
}

export function Icono({
  nombre, tam = 22, grosor = 1.8, className,
}: { nombre: string; tam?: number; grosor?: number; className?: string }) {
  const trazos = ICONOS[nombre]
  if (!trazos) return null
  return (
    <svg
      className={className}
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos.map((t, i) =>
        'd' in t
          ? <path key={i} d={t.d} />
          : <circle key={i} cx={t.circulo[0]} cy={t.circulo[1]} r={t.circulo[2]} />
      )}
    </svg>
  )
}
