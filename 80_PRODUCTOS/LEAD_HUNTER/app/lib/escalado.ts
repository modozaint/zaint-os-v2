import type { Lead, MensajeChat } from "./types";

/**
 * Cuántos mensajes ya escribió el agente en el hilo. El primero es el mensaje
 * de apertura (no cuenta como "intentar resolver": todavía nadie le preguntó
 * nada).
 */
export function mensajesDelAgente(hilo: MensajeChat[] = []): number {
  return hilo.filter((m) => m.de === "setter").length;
}

/**
 * ¿Este hilo da para escalar? Regla del producto: un escalado es una ALERTA
 * URGENTE — hay una persona esperando una respuesta que el agente no supo dar.
 * Para que lo sea de verdad, el agente tiene que haber conversado antes:
 * apertura + al menos una respuesta suya + la respuesta en la que se traba.
 *
 * Es decir, en el primer intercambio NO se escala: el agente intenta resolver.
 * Si en el siguiente sigue sin poder, ahí sí entra un humano.
 *
 * @param hilo conversación COMPLETA, con la última respuesta del agente ya dentro.
 */
export function puedeEscalar(hilo: MensajeChat[] = []): boolean {
  return mensajesDelAgente(hilo) >= 3;
}

/**
 * Campos de escalado que hay que guardar en el lead. Centraliza la regla para
 * que los cuatro caminos que corren al setter (manual, autónomo, motor y sync)
 * escalen exactamente igual.
 *
 * - Solo marca escalado si el agente pidió ayuda Y ya conversó lo suficiente.
 * - Nunca "desescala" solo: una vez escalado, sigue escalado hasta que un
 *   humano lo resuelva (ver `resolverEscalado` en el store).
 * - Guarda el momento (para ordenar por urgencia) y el motivo (para que el
 *   humano sepa qué le falta sin leer todo el hilo).
 */
export function camposEscalado(
  lead: Lead,
  hilo: MensajeChat[],
  pidioAyuda: boolean,
  motivo?: string,
): Pick<Lead, "escalado" | "escaladoEn" | "motivoEscalado"> {
  const escalaAhora = pidioAyuda && puedeEscalar(hilo);

  if (!escalaAhora) {
    // Se respeta un escalado anterior que siga abierto.
    return {
      escalado: lead.escalado ?? false,
      escaladoEn: lead.escaladoEn ?? null,
      motivoEscalado: lead.motivoEscalado ?? "",
    };
  }

  return {
    escalado: true,
    // Si ya estaba escalado, conserva la hora original: lo que importa es
    // cuánto lleva esperando, no la última vez que el agente insistió.
    escaladoEn: lead.escaladoEn ?? Date.now(),
    motivoEscalado: motivo?.trim() || lead.motivoEscalado || "",
  };
}
