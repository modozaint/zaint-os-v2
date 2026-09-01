import { NextResponse } from "next/server";
import {
  actualizarLead,
  ajustesDeLead,
  leadsParaAutoConversar,
  listarLeads,
  obtenerCadencia,
  obtenerEnvios,
  procesarContacto,
  programarContacto,
  registrarCicloMotor,
  registrarSeguimiento,
  seguimientosPendientes,
} from "@/lib/store";
import { generarSeguimiento } from "@/lib/setter";
import { correrConversacionAutonoma, resultadoAEstado } from "@/lib/motor";
import { camposEscalado } from "@/lib/escalado";

export const maxDuration = 280;

/** Tope duro por ciclo: protege créditos aunque alguien pida un número absurdo. */
const TOPE_POR_CICLO = 20;

interface Body {
  acelerarContacto?: boolean;
  cuantosContacto?: number;
  acelerarSeguimientos?: boolean;
  cuantosSeguimientos?: number;
  avanzarConversaciones?: boolean;
  cuantasConversaciones?: number;
}

function tope(n: unknown, fallback: number): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(Math.floor(v), TOPE_POR_CICLO);
}

/**
 * El Orquestador ("Piloto automático"): un solo ciclo que corre los tres
 * motores en cadena — primeros mensajes que ya tocan, seguimientos que ya
 * tocan, y conversaciones que el setter cierra solo (simulación) — con topes
 * configurables. El front lo llama a intervalos (o a demanda con "Correr
 * ciclo ahora"). Nunca envía nada real a LinkedIn: sigue en Capa 1.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body;
  const cfg = obtenerCadencia();
  registrarCicloMotor();

  // 1. Primeros mensajes que ya tocan (o acelerados, para demo).
  //    El orquestador programa solo los nuevos sin programar del cliente activo,
  //    así el piloto/demo corre 100% autónomo sin un paso manual previo.
  const cuantosContacto = tope(b.cuantosContacto, 3);
  if (cuantosContacto > 0) programarContacto();
  const hechosContacto = procesarContacto({
    acelerar: Boolean(b.acelerarContacto),
    cuantos: cuantosContacto,
  });

  // 2. Seguimientos que ya tocan (o acelerados).
  const cuantosSeguimientos = tope(b.cuantosSeguimientos, 3);
  const colaSeg = seguimientosPendientes(Boolean(b.acelerarSeguimientos), cuantosSeguimientos);
  let seguimientosHechos = 0;
  for (const lead of colaSeg) {
    const n = (lead.seguimientos ?? 0) + 1;
    const esUltimo = n >= cfg.diasSeguimiento.length;
    try {
      const mensaje = await generarSeguimiento(lead, ajustesDeLead(lead), n, esUltimo);
      registrarSeguimiento(lead.id, mensaje);
      seguimientosHechos++;
    } catch {
      // Si uno falla, seguimos con el resto — un ciclo no se cae por un lead.
    }
  }

  // 3. El setter sigue la conversación hasta agendar o la negativa total
  //    (simulado: el lead responde por IA). Es lo que más automatiza el flujo.
  const cerradas: { leadId: string; nombre: string; resultado: string }[] = [];
  if (b.avanzarConversaciones) {
    const cuantasConversaciones = tope(b.cuantasConversaciones, 2);
    const candidatos = leadsParaAutoConversar(cuantasConversaciones);
    for (const lead of candidatos) {
      try {
        const { hilo, resultado, nota, motivo } = await correrConversacionAutonoma(
          lead,
          ajustesDeLead(lead),
        );
        const estado = resultadoAEstado(resultado);
        const cambios: Parameters<typeof actualizarLead>[1] = {
          conversacion: hilo,
          estado,
          ...camposEscalado(lead, hilo, resultado === "escala", motivo),
        };
        if (nota) cambios.notaAgente = nota;
        if (resultado === "posponer") {
          cambios.recontactarEn = Date.now() + cfg.diasReContacto * 24 * 60 * 60 * 1000;
        }
        actualizarLead(lead.id, cambios);
        cerradas.push({ leadId: lead.id, nombre: lead.nombre, resultado });
      } catch {
        // Un lead que falla no frena el resto del ciclo.
      }
    }
  }

  return NextResponse.json({
    contactados: hechosContacto.length,
    seguimientos: seguimientosHechos,
    cerradas,
    envios: obtenerEnvios(),
    leads: listarLeads(),
  });
}
