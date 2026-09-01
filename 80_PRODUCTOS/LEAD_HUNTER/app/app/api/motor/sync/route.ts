import { NextResponse } from "next/server";
import { actualizarLead, ajustesDeLead, listarLeads } from "@/lib/store";
import { responderComoSetter } from "@/lib/setter";
import { camposEscalado } from "@/lib/escalado";
import {
  enviarEnChat,
  enviarMensajeNuevo,
  traerAdjunto,
  traerMensajes,
  unipileConfigurado,
  yaEsConexion,
  type MsgUnipile,
} from "@/lib/unipile";
import { transcribirAudio, transcripcionConfigurada } from "@/lib/transcribir";
import { esEnviable } from "@/lib/calidad-mensaje";
import { esperaCumplida } from "@/lib/espera-apertura";
import {
  calcomConfigurado,
  crearReserva,
  disponibilidad,
  type Disponibilidad,
} from "@/lib/calcom";
import type { EstadoLead, MensajeChat } from "@/lib/types";

export const maxDuration = 280;

/**
 * Cuánto "tarda en leer" el agente antes de contestar. Se sortea en cada ciclo
 * entre 2 y 6 minutos para que el ritmo no sea siempre el mismo: un humano no
 * responde exactamente a los 120 segundos todas las veces.
 * Ajustable con ESPERA_RESPUESTA_MIN (minutos) si un cliente la quiere distinta.
 */
/**
 * ¿El mensaje que va a salir a LinkedIn dice algo de verdad? La revisión vive
 * en `lib/calidad-mensaje.ts` — la usan los tres caminos que escriben a un lead
 * (este, el motor por pasos y los seguimientos), así que una sola puerta.
 */

function esperaMinimaMs(): number {
  const base = Number(process.env.ESPERA_RESPUESTA_MIN) || 2;
  const extra = Math.random() * 4; // hasta 4 minutos más, irregular
  // Piso duro: si alguien baja ESPERA_RESPUESTA_MIN a 0 para acelerar una
  // prueba, igual hay que dejarle un respiro a quien escribe varios mensajes
  // seguidos (rafaga) para que termine la idea antes de que se le responda.
  const PISO_MS = 20_000;
  return Math.max((base + extra) * 60_000, PISO_MS);
}

/**
 * Candado: solo un ciclo de sync a la vez.
 *
 * Por qué existe: un ciclo tarda lo suyo (Claude + Cal.com + Unipile por cada
 * lead). Si n8n dispara el siguiente antes de que termine el anterior —o si
 * alguien lo corre a mano en paralelo—, los dos leen el mismo mensaje sin
 * responder y el lead recibe la MISMA respuesta dos veces. Pasó en la prueba
 * real del 30-07 y se ve fatal.
 */
let cicloEnCurso = false;

/** Los slots de la agenda van de 15 en 15: la hora válida más cercana a la pedida. */
function horaCercana(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const total = Math.round((h * 60 + m) / 15) * 15;
  const hh = Math.floor(total / 60) % 24;
  return `${String(hh).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * La gente dice "a las 3:45" y quiere decir las 15:45, pero el modelo lo pasa
 * tal cual y Cal.com rechaza la reserva porque a las 3:45 de la MADRUGADA nadie
 * atiende. Si la hora cae por debajo del horario de atención y sumarle 12 la
 * deja dentro, era PM.
 *
 * Pasó en la prueba real del 30-07: el lead dijo "3:45", el sistema pidió
 * 03:45 y contestó "esa hora no quedó libre", que además despistaba.
 */
function normalizarHora(hora: string, disp?: Disponibilidad): string {
  if (!disp) return hora;
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hora;
  const min = Number(disp.horaMin.split(":")[0]);
  const max = Number(disp.horaMax.split(":")[0]);
  if (h < min && h + 12 <= max) {
    return `${String(h + 12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return hora;
}

/**
 * El modelo escribe la fecha de memoria y le pone el año que le parece: el
 * 31-07 mandó "2025-08-04" para el martes 4 de agosto de 2026 y Cal.com
 * respondió "Attempting to book a meeting in the past" (400). El lead veía un
 * "esa hora no me quedó libre" que no tenía nada que ver.
 *
 * Como la lista de fechas disponibles la sabemos de verdad, la fecha del
 * modelo se compara contra ella: si el día y el mes coinciden con un cupo
 * real, se usa el ISO REAL (con su año correcto) en vez del inventado.
 */
function normalizarFecha(fecha: string, disp?: Disponibilidad): string {
  if (!disp?.fechas.length) return fecha;
  if (disp.fechas.some((f) => f.iso === fecha)) return fecha;
  const [, mes, dia] = fecha.split("-");
  const real = disp.fechas.find((f) => {
    const [, m, d] = f.iso.split("-");
    return m === mes && d === dia;
  });
  return real?.iso ?? fecha;
}

/** "15:45" → "3:45 p. m.", para escribirlo como lo diría una persona. */
function enPalabras(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`;
}

const aMensaje = (m: MsgUnipile): MensajeChat => ({ de: m.de, texto: m.texto, cuando: m.ts });

/** Cuántos segundos duró la nota, para escribirlo como lo diría una persona. */
const segundos = (ms?: number) => Math.round((ms ?? 0) / 1000);

/**
 * Convierte las notas de voz del lead en texto para que el setter las entienda.
 *
 * Sin `OPENAI_API_KEY` no falla: deja una marca para que el agente sepa que
 * hubo un audio que no pudo oír y lo pida por escrito, en vez de contestar
 * como si el lead no hubiera dicho nada.
 *
 * Solo transcribe los audios del LEAD y solo los últimos: los viejos ya
 * quedaron guardados en la conversación y volver a bajarlos gastaría plata en
 * cada ciclo.
 */
async function conAudiosTranscritos(msgs: MsgUnipile[]): Promise<MsgUnipile[]> {
  const salida: MsgUnipile[] = [];
  for (const m of msgs) {
    if (!m.audioId || m.de !== "lead" || m.texto.trim()) {
      salida.push(m);
      continue;
    }
    if (!transcripcionConfigurada()) {
      salida.push({ ...m, texto: `[el lead mandó una nota de voz de ${segundos(m.audioMs)} segundos que no puedo escuchar]` });
      continue;
    }
    try {
      const audio = await traerAdjunto(m.id, m.audioId);
      const texto = await transcribirAudio(audio);
      console.log(`[sync] nota de voz ${segundos(m.audioMs)}s -> ${texto ? "transcrita" : "sin texto"}`);
      salida.push({
        ...m,
        texto: texto || `[nota de voz de ${segundos(m.audioMs)} segundos que no se pudo transcribir]`,
      });
    } catch (e) {
      console.log(`[sync] nota de voz: fallo al bajar el audio: ${e instanceof Error ? e.message : e}`);
      salida.push({ ...m, texto: `[el lead mandó una nota de voz de ${segundos(m.audioMs)} segundos que no puedo escuchar]` });
    }
  }
  return salida;
}

/**
 * Sync REAL de LinkedIn (Capa 2). En cada tick:
 *  A) A los leads invitados que ya ACEPTARON, les envía el mensaje de apertura
 *     (intentar iniciar el chat solo funciona si ya son conexión → así detectamos
 *     la aceptación sin webhooks).
 *  B) A los leads con chat activo que respondieron, corre el setter, agenda en
 *     Cal.com si el lead dio fecha+hora+correo, responde por LinkedIn y mueve el kanban.
 * El front lo llama a intervalos: por eso el tablero se mueve solo.
 */
export async function POST() {
  if (!unipileConfigurado()) {
    return NextResponse.json({ ok: false, motivo: "unipile-no-configurado", leads: listarLeads() });
  }
  if (cicloEnCurso) {
    return NextResponse.json({
      ok: true,
      motivo: "ciclo-en-curso",
      eventos: [],
      leads: listarLeads(),
    });
  }
  cicloEnCurso = true;
  try {
    return await correrCiclo();
  } finally {
    cicloEnCurso = false;
  }
}

async function correrCiclo() {
  const eventos: { leadId: string; nombre: string; accion: string }[] = [];

  // ── Fase A: invitados que ya aceptaron → enviar la apertura ──
  const porAbrir = listarLeads().filter(
    (l) =>
      l.providerId &&
      !l.chatId &&
      // Candado de seguridad: si ya hay hilo con esta persona, NUNCA se le
      // manda el mensaje de apertura otra vez. El 30-07 un lead que llevaba 16
      // mensajes negociando la hora recibió el pitch inicial de nuevo: para el
      // lead es evidente que habla con un robot y la reunión se cae.
      (l.conversacion?.length ?? 0) === 0 &&
      l.estado === "contactados" &&
      l.mensaje?.trim(),
  );
  const hayChats = listarLeads().some(
    (l) => l.chatId && (l.estado === "contactados" || l.estado === "respondieron"),
  );
  // Nada real que hacer: no gastamos llamadas a Unipile/Cal.com en cada tick.
  if (porAbrir.length === 0 && !hayChats) {
    return NextResponse.json({ ok: true, eventos, leads: listarLeads() });
  }
  for (const lead of porAbrir) {
    try {
      // 1. ¿Aceptó? Se pregunta por el grado de conexión, sin escribirle. Antes
      //    la única forma de enterarse era intentar mandar el mensaje, así que
      //    el primer mensaje salía en el mismo minuto de la aceptación.
      if (!lead.aceptadoEn) {
        const acepto = await yaEsConexion(lead.providerId as string);
        if (acepto === false) continue; // todavía no; se reintenta en el próximo ciclo
        if (acepto === true) {
          actualizarLead(lead.id, { aceptadoEn: Date.now() });
          console.log(`[sync] aceptó -> ${lead.nombre} (${lead.id}), esperando para escribir`);
          continue; // recién en un próximo ciclo, ya con la espera cumplida
        }
        // acepto === null: no se pudo averiguar (API caída o sin permiso). Se
        // sigue con el método viejo para no dejar leads trabados.
      }

      // 2. Dejar pasar un rato desde la aceptación. Saltar encima en el mismo
      //    minuto en que alguien te acepta es tan delator como responder un
      //    mensaje en 20 segundos.
      if (lead.aceptadoEn && !esperaCumplida(lead.aceptadoEn, lead.id)) continue;

      // Traza: si alguna vez vuelve a salir una apertura de mas, queda registrado
      // quien y cuando (docker logs leadhunter).
      console.log(`[sync] apertura -> ${lead.nombre} (${lead.id})`);
      const chatId = await enviarMensajeNuevo(lead.providerId as string, lead.mensaje);
      actualizarLead(lead.id, {
        chatId,
        conversacion: [{ de: "setter", texto: lead.mensaje, cuando: Date.now() }],
      });
      eventos.push({ leadId: lead.id, nombre: lead.nombre, accion: "apertura-enviada" });
    } catch {
      // Todavía no acepta la conexión: se reintenta en el próximo tick.
    }
  }

  // ── Fase B: chats activos → responder y agendar ──
  const enConversacion = listarLeads().filter(
    (l) => l.chatId && (l.estado === "contactados" || l.estado === "respondieron"),
  );
  let disp: Disponibilidad | undefined;
  if (enConversacion.length && calcomConfigurado()) {
    try {
      disp = await disponibilidad();
    } catch {
      disp = undefined;
    }
  }
  for (const lead of enConversacion) {
    try {
      const msgs = await traerMensajes(lead.chatId as string);
      if (msgs.length === 0) continue;
      const ultimo = msgs[msgs.length - 1];

      // Sin respuesta nueva del lead: solo sincronizamos el hilo para el tablero.
      if (ultimo.de !== "lead" || ultimo.id === lead.ultimoMsgUnipile) {
        actualizarLead(lead.id, { conversacion: msgs.map(aMensaje) });
        continue;
      }

      // Tiempo de lectura: nadie contesta un mensaje en 20 segundos. Responder
      // al instante es lo que más delata a un bot, así que si el mensaje del
      // lead es muy reciente se deja para el próximo ciclo. Combinado con el
      // intervalo de n8n, las respuestas caen de forma irregular (minutos),
      // que es como escribe una persona ocupada.
      if (Date.now() - ultimo.ts < esperaMinimaMs()) {
        actualizarLead(lead.id, { conversacion: msgs.map(aMensaje) });
        eventos.push({ leadId: lead.id, nombre: lead.nombre, accion: "esperando-para-responder" });
        continue;
      }

      // Se transcribe recién acá (no antes) para no gastar en Whisper con
      // mensajes que todavía están en su tiempo de espera.
      const historial = (await conAudiosTranscritos(msgs)).map(aMensaje);
      const r = await responderComoSetter(lead, ajustesDeLead(lead), historial, disp);

      let respuesta = r.respuesta;
      let citaUid: string | undefined;
      let citaEn: number | undefined;
      if (disp && r.cita.fecha && r.cita.hora && r.cita.correo) {
        const hora = normalizarHora(r.cita.hora, disp);
        const fecha = normalizarFecha(r.cita.fecha, disp);
        const reserva = await crearReserva({ ...r.cita, fecha, hora, nombre: lead.nombre });
        if (reserva.ok) {
          citaUid = reserva.uid;
          citaEn = Date.parse(reserva.startUtc) || undefined;
        }
        else {
          // Traza para diagnosticar reservas que fallan pese a que el slot
          // se ve libre en el panel de Cal.com (pasó el 31-07: el mismo
          // fecha/hora sí reservaba a mano por API, así que el desface está
          // en lo que el modelo mandó, no en Cal.com).
          console.log(
            `[sync] reserva fallo -> ${lead.nombre} fechaPedida=${r.cita.fecha} fechaNormalizada=${fecha} horaPedida=${r.cita.hora} horaNormalizada=${hora} status=${reserva.status} error=${reserva.error}`,
          );
          // No dejarlo con un "no se pudo" a secas: la agenda va de 15 en 15,
          // así que se le ofrece la hora válida más cercana a la que pidió.
          // Y NUNCA se descarta lo que el modelo ya había respondido: si el
          // lead preguntó otra cosa en el mismo mensaje, esa respuesta no se
          // pierde solo porque el agendamiento falló (pasó el 31-07: el lead
          // preguntó si se pierde la info de sus clientes y la respuesta real
          // desapareció, reemplazada por el aviso de la hora).
          const sugerida = horaCercana(r.cita.hora);
          const avisoHora =
            sugerida && sugerida !== r.cita.hora
              ? `a las ${enPalabras(r.cita.hora)} justo no la tengo libre. ¿Te sirve a las ${enPalabras(sugerida)}? Si prefieres otra hora me dices y la reviso.`
              : "esa hora justo no me quedó libre. ¿Te sirve otra hora ese mismo día, o prefieres otro de los días?";
          // El modelo ya escribió su respuesta dando la cita por confirmada, así
          // que el aviso se enmarca como una corrección ("me corrijo") en vez de
          // contradecirse en el mismo mensaje.
          respuesta = r.respuesta
            ? `${r.respuesta}\n\nPerdón, me corrijo: ${avisoHora}`
            : `Uy, ${avisoHora}`;
        }
      }

      // FRENO ANTI-MENSAJE-VACÍO. Pasó el 02-08: a un lead real le llegó un
      // mensaje que era solo un punto. El modelo puede devolver `respuesta`
      // vacía o con puro emoji/puntuación, y `sanitizarMensaje` quita los
      // emojis — así que lo que sobrevive puede ser "." o "". Antes esto se
      // enviaba tal cual. Ahora: NO se manda nada.
      // Se deja el hilo sin marcar como procesado a propósito, para que el
      // próximo ciclo lo reintente (el modelo no es determinista y casi siempre
      // acierta en el reintento), y se escala a humano para que quede visible.
      // Dos capas: la estructural (vacío, muy corto, palabras rotas) y el
      // modelo revisor, que es el único que detecta una frase sin sentido. El
      // 03-08 salió a un chat real un "como fireso? Con conversmos..." que el
      // freno anterior dejaba pasar porque tenía letras de sobra.
      const veredicto = await esEnviable(respuesta);
      if (!veredicto.apto) {
        console.log(
          `[sync] mensaje no enviable -> ${lead.nombre} (${lead.id}): ${veredicto.motivo}. crudo=${JSON.stringify(r.respuesta)}`,
        );
        // Se escala DIRECTO, sin pasar por camposEscalado: esa función exige
        // que el agente ya lleve 3 mensajes en el hilo (regla pensada para
        // "no supe responder"). Un mensaje vacío es un defecto, no una duda:
        // tiene que verse siempre, incluso en el primer intercambio.
        actualizarLead(lead.id, {
          escalado: true,
          escaladoEn: lead.escaladoEn ?? Date.now(),
          motivoEscalado:
            lead.motivoEscalado ||
            `no se envió nada porque ${veredicto.motivo}; revisar el hilo`,
        });
        continue;
      }

      await enviarEnChat(lead.chatId as string, respuesta);
      const conv: MensajeChat[] = [
        ...historial,
        { de: "setter", texto: respuesta, cuando: Date.now() },
      ];

      const estado: EstadoLead = citaUid
        ? "reunion"
        : r.descarta
          ? "frio"
          : r.posponer
            ? "futuro"
            : "respondieron";

      actualizarLead(lead.id, {
        conversacion: conv,
        estado,
        notaAgente: r.nota || lead.notaAgente,
        // Cuando el perfil es una cuenta de empresa, el setter pregunta con
        // quién habla. Si ya se presentó, se guarda una sola vez para que los
        // ciclos siguientes lo traten por su nombre.
        ...(r.nombreContacto && !lead.nombreContacto
          ? { nombreContacto: r.nombreContacto }
          : {}),
        ...camposEscalado(lead, conv, r.escala, r.motivo),
        ultimoMsgUnipile: ultimo.id,
        ...(citaUid ? { citaUid } : {}),
        ...(citaEn ? { citaEn } : {}),
      });
      eventos.push({ leadId: lead.id, nombre: lead.nombre, accion: citaUid ? "agendo" : estado });
    } catch {
      eventos.push({ leadId: lead.id, nombre: lead.nombre, accion: "error" });
    }
  }

  return NextResponse.json({ ok: true, eventos, leads: listarLeads() });
}
