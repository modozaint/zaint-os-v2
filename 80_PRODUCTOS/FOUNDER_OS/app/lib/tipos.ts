/** Tipos compartidos entre servidor y navegador. Sin dependencias. */
export const NIVELES = ['minimo', 'normal', 'super'] as const
export type Nivel = (typeof NIVELES)[number]
export const XP: Record<Nivel, number> = { minimo: 10, normal: 25, super: 50 }
