/**
 * LOS CUADROS DE TURNO YA LEÍDOS, mes por mes.
 *
 * ⚠️ ESTO NO SE DEDUCE NI SE ADIVINA. Cada mes se transcribe del archivo del
 * vault que ya lo leyó del PDF oficial y lo verificó contra los totales que el
 * propio cuadro calcula. Para septiembre:
 * `KNOWLEDGE_PACKS/FOUNDER/TURNOS/2026-09.md` §1.
 *
 * Por qué importa la diferencia: el cuadro de agosto se dictó de memoria el
 * 31-jul y **falló dos veces en una semana** (11 y 12 de agosto). Su propio
 * encabezado terminó diciendo que servía «como estimación del mes, no como dato
 * del día». El de septiembre se leyó del PDF con las columnas alineadas por
 * posición. Un turno mal cargado no es un detalle: el turno fija la meta del
 * día, la capacidad real y si el día resta vida.
 *
 * 🔑 LOS POSTURNOS NO SALEN DEL PDF, SE DEDUCEN. El cuadro solo marca el turno
 * que se entra, y el día siguiente a una noche aparece en blanco. Pero saliendo
 * a las 7am ese día no es libre: es recuperación, y en la app es día protegido
 * — nunca pierde vida. Van los días 6, 14, 22 y 30.
 */

export type Cuadro = {
  /** El archivo del vault del que se transcribió. Para poder auditarlo. */
  fuente: string
  /** Día del mes (1-31) → id de turno. Los ids ya existen en la tabla `turnos`. */
  dias: Record<number, string>
}

const SEPTIEMBRE_2026: Cuadro = {
  fuente: 'KNOWLEDGE_PACKS/FOUNDER/TURNOS/2026-09.md §1',
  dias: {
    1: 'LIBRE', 2: 'LIBRE', 3: 'LIBRE', 4: 'U', 5: 'N',
    6: 'POSTURNO',                       // sale 7am de la noche del 5
    7: 'LIBRE', 8: 'CF1', 9: 'U', 10: 'LIBRE', 11: 'LIBRE',
    12: 'U', 13: 'N',
    14: 'POSTURNO',                      // sale 7am de la noche del 13
    15: 'LIBRE', 16: 'CF1', 17: 'U', 18: 'LIBRE', 19: 'A',
    20: 'U', 21: 'N',
    22: 'POSTURNO',                      // sale 7am de la noche del 21
    23: 'LIBRE', 24: 'LIBRE', 25: 'CF1', 26: 'A', 27: 'LIBRE',
    28: 'U', 29: 'N',
    30: 'POSTURNO',                      // sale 7am de la noche del 29
  },
}

export const CUADROS: Record<string, Cuadro> = {
  '2026-09': SEPTIEMBRE_2026,
}

export function cuadroDe(mes: string): Cuadro | null {
  return CUADROS[mes] ?? null
}

/** '2026-09' → [{ fecha: '2026-09-01', turno: 'LIBRE' }, …] */
export function filasDelMes(mes: string): { fecha: string; turno: string }[] {
  const c = cuadroDe(mes)
  if (!c) return []
  return Object.entries(c.dias)
    .map(([d, turno]) => ({ fecha: `${mes}-${String(Number(d)).padStart(2, '0')}`, turno }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Cuántos días de cada turno tiene el mes. Sirve para comprobar la carga. */
export function conteoDelMes(mes: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const f of filasDelMes(mes)) out[f.turno] = (out[f.turno] ?? 0) + 1
  return out
}
