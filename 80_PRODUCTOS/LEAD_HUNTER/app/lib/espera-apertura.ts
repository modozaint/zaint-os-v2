/**
 * CUÁNTO ESPERAR ENTRE QUE ACEPTAN Y ESCRIBIRLES.
 *
 * Por qué existe: el 05-08 un lead aceptó la solicitud a las 11:13 y el primer
 * mensaje le llegó a las 11:14. Un minuto. Nadie está mirando LinkedIn con tanta
 * atención como para saltar encima de una aceptación, y esa prisa delata a la
 * máquina igual que responder un chat en veinte segundos.
 *
 * La espera es distinta para cada persona pero SIEMPRE la misma para la misma
 * persona: se deriva de su id, no del azar. Si se sorteara en cada ciclo, un
 * lead podría quedar esperando indefinidamente porque cada 15 minutos le toca
 * un número distinto.
 */

const MINIMO_MIN = 12;
const MAXIMO_MIN = 55;

/** Número estable entre 0 y 1 a partir de un texto. Mismo id, mismo número. */
function semilla(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

/** Cuántos minutos le tocan a este lead (entre 12 y 55). */
export function minutosDeEspera(leadId: string): number {
  return Math.round(MINIMO_MIN + semilla(leadId) * (MAXIMO_MIN - MINIMO_MIN));
}

/** ¿Ya pasó su espera desde que aceptó? */
export function esperaCumplida(aceptadoEn: number, leadId: string): boolean {
  return Date.now() - aceptadoEn >= minutosDeEspera(leadId) * 60_000;
}
