import { listarLeads, obtenerCiclosMotor, obtenerEnvios } from "./store";
import type { EstadoLead } from "./types";

/**
 * Métricas del sistema, TODAS derivadas del estado real (leads + envíos).
 * Ningún número se inventa: el embudo es exactamente lo que hay en el tablero.
 * Esta es la foto que se muestra en la propuesta a Nexum.
 */
export interface Metricas {
  /** Embudo principal, de arriba (más ancho) a abajo (más angosto). */
  embudo: {
    encontrados: number;
    contactados: number;
    interesados: number; // respondieron + reunión + contactar después
    reuniones: number;
  };
  /** Tasas calculadas sobre el embudo (0-100, redondeadas). */
  tasas: {
    respuesta: number; // interesados / contactados
    agendamiento: number; // reuniones / contactados
  };
  /** Distribución por estado del kanban (para el desglose). */
  porEstado: Record<EstadoLead, number>;
  /** Actividad de envíos (en simulación). */
  actividad: {
    mensajesEnviados: number;
    primeros: number;
    seguimientos: number;
    escalados: number; // leads que pidieron intervención humana
  };
  /** Prospectos a futuro con fecha de re-contacto próxima. */
  proximosRecontactos: {
    id: string;
    nombre: string;
    empresa: string;
    cuando: number;
  }[];
  /**
   * Actividad real de cada agente especializado (todo derivado del estado,
   * nada inventado): cuánto ha trabajado cada uno hasta ahora.
   */
  agentes: {
    analista: number; // perfiles leídos y analizados
    setter: number; // conversaciones 1:1 activas o cerradas
    seguidor: number; // seguimientos escritos
    orquestador: number; // ciclos del piloto automático corridos
  };
}

function pct(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

export function calcularMetricas(): Metricas {
  const leads = listarLeads();
  const envios = obtenerEnvios();

  const porEstado: Record<EstadoLead, number> = {
    nuevos: 0,
    contactados: 0,
    respondieron: 0,
    reunion: 0,
    futuro: 0,
    frio: 0,
  };
  for (const l of leads) porEstado[l.estado] = (porEstado[l.estado] ?? 0) + 1;

  const encontrados = leads.length;
  // Contactado = ya recibió el primer mensaje (tiene fecha de contacto o salió
  // de "nuevos"). Cubre a todos los que avanzaron en el embudo.
  const contactados = leads.filter(
    (l) => l.contactadoEn || l.estado !== "nuevos",
  ).length;
  // Interesado = respondió con intención (respondieron / reunión / a futuro).
  const interesados =
    porEstado.respondieron + porEstado.reunion + porEstado.futuro;
  const reuniones = porEstado.reunion;

  const primeros = envios.filter((e) => e.tipo !== "seguimiento").length;
  const seguimientos = envios.filter((e) => e.tipo === "seguimiento").length;
  const escalados = leads.filter((l) => l.escalado).length;

  const proximosRecontactos = leads
    .filter((l) => l.estado === "futuro" && l.recontactarEn)
    .sort((a, b) => (a.recontactarEn ?? 0) - (b.recontactarEn ?? 0))
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      nombre: l.nombre,
      empresa: l.empresa,
      cuando: l.recontactarEn ?? 0,
    }));

  const analista = leads.filter((l) => l.resumen).length;
  const setter = leads.filter((l) => (l.conversacion?.length ?? 0) > 0).length;

  return {
    embudo: { encontrados, contactados, interesados, reuniones },
    tasas: {
      respuesta: pct(interesados, contactados),
      agendamiento: pct(reuniones, contactados),
    },
    porEstado,
    actividad: {
      mensajesEnviados: envios.length,
      primeros,
      seguimientos,
      escalados,
    },
    proximosRecontactos,
    agentes: {
      analista,
      setter,
      seguidor: seguimientos,
      orquestador: obtenerCiclosMotor(),
    },
  };
}
