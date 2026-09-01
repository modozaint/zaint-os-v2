import { generarMensajeLead, responderComoSetter, type Disposicion } from "./setter";
import { calcomConfigurado, disponibilidad, type Disponibilidad } from "./calcom";
import type { Ajustes, EstadoLead, Lead, MensajeChat } from "./types";

/**
 * El "Orquestador": une los tres motores que hoy se disparan sueltos
 * (contactar, seguir, conversar-hasta-cerrar) en un solo ciclo. Esta es la
 * pieza compartida de la conversación autónoma: el botón manual (módulo 1) y
 * el piloto automático (módulo 2) llaman a la MISMA función, para no
 * duplicar la lógica de negocio en dos endpoints.
 */

export type ResultadoConversacion =
  | "agendo"
  | "posponer"
  | "descarta"
  | "escala"
  | "sin_cierre";

/** Ponderado: la mayoría de demos cierran o quedan a futuro; algunas se caen. */
const DISPOSICIONES: Disposicion[] = [
  "interesado",
  "interesado",
  "dudoso",
  "dudoso",
  "ocupado",
  "frio",
];

export function disposicionAleatoria(): Disposicion {
  return DISPOSICIONES[Math.floor(Math.random() * DISPOSICIONES.length)];
}

/**
 * Corre una conversación autónoma completa: un lead simulado por IA conversa
 * con el setter hasta un resultado o hasta agotar los turnos. NO toca el
 * store — el caller decide qué persistir (así sirve igual para una corrida
 * suelta que para un lote del piloto automático).
 */
export async function correrConversacionAutonoma(
  lead: Lead,
  ajustes: Ajustes,
  opts: { disposicion?: Disposicion; maxTurnos?: number } = {},
): Promise<{
  hilo: MensajeChat[];
  resultado: ResultadoConversacion;
  nota: string;
  /** Si terminó escalando: qué necesita resolver el humano. */
  motivo: string;
}> {
  const maxTurnos = Math.min(Math.max(opts.maxTurnos ?? 5, 2), 7);
  const disposicion = opts.disposicion ?? disposicionAleatoria();

  // Horarios reales de la agenda, para que el setter proponga días concretos en
  // vez de tirar un link. Se piden UNA vez por conversación, no por turno.
  let disp: Disponibilidad | undefined;
  if (calcomConfigurado()) {
    disp = await disponibilidad().catch(() => undefined);
  }

  const hilo: MensajeChat[] = [...(lead.conversacion ?? [])];
  if (hilo.length === 0 && lead.mensaje) {
    hilo.push({
      de: "setter",
      texto: lead.mensaje,
      cuando: lead.contactadoEn ?? Date.now(),
    });
  }

  let resultado: ResultadoConversacion = "sin_cierre";
  let nota = "";
  let motivo = "";
  for (let t = 0; t < maxTurnos; t++) {
    const msgLead = await generarMensajeLead(lead, ajustes, hilo, disposicion, t, maxTurnos);
    hilo.push({ de: "lead", texto: msgLead, cuando: Date.now() });

    const r = await responderComoSetter(lead, ajustes, hilo, disp);
    hilo.push({ de: "setter", texto: r.respuesta, cuando: Date.now() });
    if (r.nota) nota = r.nota; // la última nota es el resumen más completo

    if (r.agendo) { resultado = "agendo"; break; }
    if (r.descarta) { resultado = "descarta"; break; }
    if (r.posponer) { resultado = "posponer"; break; }
    if (r.escala) { resultado = "escala"; motivo = r.motivo; break; }
  }
  return { hilo, resultado, nota, motivo };
}

/** Traduce el resultado de la conversación al estado del kanban. */
export function resultadoAEstado(r: ResultadoConversacion): EstadoLead {
  if (r === "agendo") return "reunion";
  if (r === "descarta") return "frio";
  if (r === "posponer") return "futuro";
  return "respondieron"; // escala o sin_cierre: sigue activo (con flag si escaló)
}
