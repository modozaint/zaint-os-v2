/**
 * El ciclo del setter, partido en pasos que se pueden llamar por separado.
 *
 * Por qué existe: `/api/motor/sync` hace todo de una y desde n8n se ve como
 * una caja negra — un nodo que dice "responder" y adentro pasan cinco cosas.
 * Para poder mostrar (y vender) el proceso, cada paso es una función aparte
 * con su propio endpoint, y n8n los encadena viendo la entrada y la salida
 * de cada uno.
 *
 * Dos decisiones de diseño que importan:
 *
 * 1. NO se parte la llamada al modelo. El setter devuelve el análisis y el
 *    mensaje en una sola respuesta; separarlos en dos llamadas duplicaría el
 *    costo y la espera sin mejorar el resultado. Lo que se parte es el
 *    PIPELINE: analizar (sin enviar nada) → agendar → enviar.
 *
 * 2. Enviar va SIEMPRE al final. Si algo falla a mitad de camino, lo peor que
 *    pasa es que no sale el mensaje — nunca queda un lead con la mitad hecha.
 */
import {
  actualizarLead,
  ajustesDeLead,
  contactoAprobado,
  listarLeads,
  obtenerCadencia,
  registrarSeguimiento,
  seguimientosPendientes,
} from "./store";
import {
  generarSeguimiento,
  responderComoSetter,
  type RespuestaSetter,
} from "./setter";
import { camposEscalado } from "./escalado";
import {
  enviarEnChat,
  enviarMensajeNuevo,
  traerAdjunto,
  traerMensajes,
  yaEsConexion,
  type MsgUnipile,
} from "./unipile";
import { transcribirAudio, transcripcionConfigurada } from "./transcribir";
import { esEnviable } from "./calidad-mensaje";
import { esperaCumplida, minutosDeEspera } from "./espera-apertura";
import {
  calcomConfigurado,
  crearReserva,
  disponibilidad,
  type Disponibilidad,
} from "./calcom";
import type { ConfigCadencia, EstadoLead, Lead, MensajeChat } from "./types";

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Cuánto "tarda en leer" el agente antes de contestar. Responder al instante
 * es lo que más delata a un bot. Se sortea en cada ciclo para que el ritmo no
 * sea siempre el mismo. Piso duro de 20s aunque se baje a 0 para una prueba,
 * para no cortar a alguien que está escribiendo varios mensajes seguidos.
 */
export function esperaMinimaMs(): number {
  const base = Number(process.env.ESPERA_RESPUESTA_MIN) || 2;
  const extra = Math.random() * 4;
  return Math.max((base + extra) * 60_000, 20_000);
}

const aMensaje = (m: MsgUnipile): MensajeChat => ({ de: m.de, texto: m.texto, cuando: m.ts });
const segundos = (ms?: number) => Math.round((ms ?? 0) / 1000);

/** Los slots de la agenda van de 15 en 15: la hora válida más cercana a la pedida. */
export function horaCercana(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const total = Math.round((h * 60 + m) / 15) * 15;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * "a las 3:45" en horario de oficina son las 15:45, no las 3:45 de la
 * madrugada. Si la hora cae por debajo del horario de atención y sumarle 12 la
 * deja dentro, era PM.
 */
export function normalizarHora(hora: string, disp?: Disponibilidad): string {
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
 * El modelo escribe la fecha de memoria y a veces le erra al año (mandó
 * "2025-08-04" para el martes 4 de agosto de 2026, y Cal.com respondió
 * "reserva en el pasado"). Como la lista de fechas disponibles la sabemos de
 * verdad, se compara contra ella y se usa el ISO real.
 */
export function normalizarFecha(fecha: string, disp?: Disponibilidad): string {
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
export function enPalabras(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`;
}

// ── Paso 1: ¿a quién le toca? ────────────────────────────────────────────────

export interface Pendiente {
  leadId: string;
  nombre: string;
  empresa: string;
  /** "apertura" = aceptó la invitación y aún no le escribimos. */
  motivo: "apertura" | "respondio";
}

/**
 * Quiénes están listos para que el agente actúe. No toca nada: es una lectura,
 * así que se puede correr las veces que sea sin efecto.
 */
export function pendientes(): Pendiente[] {
  const salida: Pendiente[] = [];
  for (const l of listarLeads()) {
    // Aceptó la invitación y todavía no tiene hilo: le toca la apertura.
    // El candado de conversación vacía evita re-mandarle el pitch a alguien
    // que ya viene conversando (pasó el 30-07 con un lead a 16 mensajes).
    if (
      l.providerId &&
      !l.chatId &&
      (l.conversacion?.length ?? 0) === 0 &&
      l.estado === "contactados" &&
      l.mensaje?.trim()
    ) {
      salida.push({ leadId: l.id, nombre: l.nombre, empresa: l.empresa, motivo: "apertura" });
      continue;
    }
    if (l.chatId && (l.estado === "contactados" || l.estado === "respondieron")) {
      salida.push({ leadId: l.id, nombre: l.nombre, empresa: l.empresa, motivo: "respondio" });
    }
  }
  return salida;
}

// ── Paso 2: analizar (NO envía nada) ─────────────────────────────────────────

export interface Analisis {
  leadId: string;
  nombre: string;
  /** Qué corresponde hacer: abrir el chat, responder, o esperar. */
  accion: "abrir" | "responder" | "esperar" | "sin-novedad";
  /** Por qué se decidió eso, en palabras. Para que se lea en el nodo de n8n. */
  porQue: string;
  /** El mensaje propuesto. Todavía NO se envió. */
  borrador: string;
  /** Lo que el agente entendió del lead (no se le envía a nadie). */
  lectura?: {
    nota: string;
    quiereAgendar: boolean;
    seEnfrio: boolean;
    pidePostergar: boolean;
    necesitaHumano: boolean;
    motivoEscalado: string;
  };
  /** Fecha/hora/correo si el lead ya los dio. Vacíos hasta tenerlos. */
  cita?: { fecha: string; hora: string; correo: string };
  /** El hilo completo ya normalizado (con las notas de voz transcritas). */
  historial: MensajeChat[];
  /** Id del último mensaje del lead, para no responder dos veces lo mismo. */
  ultimoMsgId?: string;
}

/**
 * Convierte las notas de voz del lead en texto. Sin `OPENAI_API_KEY` no falla:
 * deja una marca para que el agente sepa que hubo un audio que no pudo oír y
 * lo pida por escrito, en vez de contestar como si no hubieran dicho nada.
 */
async function conAudiosTranscritos(msgs: MsgUnipile[]): Promise<MsgUnipile[]> {
  const salida: MsgUnipile[] = [];
  for (const m of msgs) {
    if (!m.audioId || m.de !== "lead" || m.texto.trim()) {
      salida.push(m);
      continue;
    }
    const noEscuchado = `[el lead mandó una nota de voz de ${segundos(m.audioMs)} segundos que no puedo escuchar]`;
    if (!transcripcionConfigurada()) {
      salida.push({ ...m, texto: noEscuchado });
      continue;
    }
    try {
      const audio = await traerAdjunto(m.id, m.audioId);
      const texto = await transcribirAudio(audio);
      console.log(`[pasos] nota de voz ${segundos(m.audioMs)}s -> ${texto ? "transcrita" : "sin texto"}`);
      salida.push({ ...m, texto: texto || noEscuchado });
    } catch (e) {
      console.log(`[pasos] nota de voz: no se pudo bajar: ${e instanceof Error ? e.message : e}`);
      salida.push({ ...m, texto: noEscuchado });
    }
  }
  return salida;
}

/**
 * Lee la conversación y decide qué contestar — SIN enviar nada. Es el paso que
 * se puede revisar antes de que salga el mensaje.
 */
export async function analizar(leadId: string): Promise<Analisis> {
  const lead = listarLeads().find((l) => l.id === leadId);
  if (!lead) throw new Error(`No existe el lead ${leadId}`);

  // Caso A: aceptó la invitación y todavía no le escribimos.
  if (!lead.chatId) {
    return {
      leadId,
      nombre: lead.nombre,
      accion: "abrir",
      porQue: "Aceptó la invitación y todavía no tiene conversación abierta.",
      borrador: lead.mensaje,
      historial: [],
    };
  }

  const crudos = await traerMensajes(lead.chatId);
  if (crudos.length === 0) {
    return { leadId, nombre: lead.nombre, accion: "sin-novedad", porQue: "El chat está vacío.", borrador: "", historial: [] };
  }

  const ultimo = crudos[crudos.length - 1];

  // El último mensaje es nuestro, o ya lo respondimos: no hay nada que hacer.
  if (ultimo.de !== "lead" || ultimo.id === lead.ultimoMsgUnipile) {
    actualizarLead(leadId, { conversacion: crudos.map(aMensaje) });
    return {
      leadId,
      nombre: lead.nombre,
      accion: "sin-novedad",
      porQue: "No hay mensajes nuevos del lead desde la última respuesta.",
      borrador: "",
      historial: crudos.map(aMensaje),
    };
  }

  // Escribió hace muy poco: se deja para el próximo ciclo para no responder
  // en 20 segundos y delatar que es automático.
  const espera = esperaMinimaMs();
  if (Date.now() - ultimo.ts < espera) {
    actualizarLead(leadId, { conversacion: crudos.map(aMensaje) });
    return {
      leadId,
      nombre: lead.nombre,
      accion: "esperar",
      porQue: `Escribió hace ${Math.round((Date.now() - ultimo.ts) / 1000)}s. Se espera para que la respuesta se sienta humana.`,
      borrador: "",
      historial: crudos.map(aMensaje),
    };
  }

  // Recién acá se transcribe: no gastamos en Whisper con mensajes que todavía
  // están en su tiempo de espera.
  const historial = (await conAudiosTranscritos(crudos)).map(aMensaje);

  let disp: Disponibilidad | undefined;
  if (calcomConfigurado()) {
    try {
      disp = await disponibilidad();
    } catch {
      disp = undefined;
    }
  }

  const r: RespuestaSetter = await responderComoSetter(lead, ajustesDeLead(lead), historial, disp);

  return {
    leadId,
    nombre: lead.nombre,
    accion: "responder",
    porQue: "El lead escribió y toca contestarle.",
    borrador: r.respuesta,
    lectura: {
      nota: r.nota,
      quiereAgendar: r.agendo,
      seEnfrio: r.descarta,
      pidePostergar: r.posponer,
      necesitaHumano: r.escala,
      motivoEscalado: r.motivo,
    },
    cita: r.cita,
    historial,
    ultimoMsgId: ultimo.id,
  };
}

// ── Paso 3: agendar (solo si corresponde) ────────────────────────────────────

export interface ResultadoAgenda {
  intentado: boolean;
  agendado: boolean;
  citaUid?: string;
  /** Inicio de la reunión en ms, para que el recordatorio sepa cuándo salir. */
  citaEn?: number | null;
  /** Si falló, el aviso que hay que agregarle al mensaje. */
  aviso?: string;
  detalle?: string;
}

/**
 * Reserva en Cal.com si el lead ya dio fecha, hora y correo. Si no los dio,
 * no hace nada y lo dice — no es un error.
 */
export async function agendar(leadId: string, cita?: Analisis["cita"]): Promise<ResultadoAgenda> {
  if (!cita?.fecha || !cita.hora || !cita.correo) {
    return { intentado: false, agendado: false, detalle: "Todavía falta fecha, hora o correo." };
  }
  if (!calcomConfigurado()) {
    return { intentado: false, agendado: false, detalle: "Cal.com no está configurado." };
  }
  const lead = listarLeads().find((l) => l.id === leadId);
  if (!lead) throw new Error(`No existe el lead ${leadId}`);

  let disp: Disponibilidad | undefined;
  try {
    disp = await disponibilidad();
  } catch {
    disp = undefined;
  }

  const hora = normalizarHora(cita.hora, disp);
  const fecha = normalizarFecha(cita.fecha, disp);
  const reserva = await crearReserva({ ...cita, fecha, hora, nombre: lead.nombre });

  if (reserva.ok) {
    return {
      intentado: true,
      agendado: true,
      citaUid: reserva.uid,
      citaEn: Date.parse(reserva.startUtc) || null,
      detalle: `${fecha} ${hora}`,
    };
  }

  console.log(
    `[pasos] reserva fallo -> ${lead.nombre} pedida=${cita.fecha} ${cita.hora} normalizada=${fecha} ${hora} status=${reserva.status} error=${reserva.error}`,
  );
  const sugerida = horaCercana(cita.hora);
  const aviso =
    sugerida && sugerida !== cita.hora
      ? `a las ${enPalabras(cita.hora)} justo no la tengo libre. ¿Te sirve a las ${enPalabras(sugerida)}? Si prefieres otra hora me dices y la reviso.`
      : "esa hora justo no me quedó libre. ¿Te sirve otra hora ese mismo día, o prefieres otro de los días?";
  return { intentado: true, agendado: false, aviso, detalle: reserva.error };
}

// ── Paso 4: enviar (lo último, lo irreversible) ──────────────────────────────

export interface ResultadoEnvio {
  enviado: boolean;
  estado: EstadoLead;
  detalle: string;
}

/**
 * Manda el mensaje por LinkedIn y mueve el tablero. Es el único paso que sale
 * hacia afuera, y va al final a propósito: si algo falló antes, acá no se
 * envía nada y el lead queda como estaba.
 */
export async function enviar(
  leadId: string,
  analisis: Analisis,
  agenda: ResultadoAgenda,
): Promise<ResultadoEnvio> {
  const lead = listarLeads().find((l) => l.id === leadId);
  if (!lead) throw new Error(`No existe el lead ${leadId}`);

  // Apertura: crea el chat con el mensaje que preparó el analista.
  if (analisis.accion === "abrir") {
    // Igual que en /motor/sync: primero se confirma que aceptó SIN escribirle,
    // y después se deja pasar un rato. Escribir en el mismo minuto en que te
    // aceptan es de las cosas que más delatan que del otro lado hay un robot.
    if (!lead.aceptadoEn) {
      const acepto = await yaEsConexion(lead.providerId as string);
      if (acepto === false) {
        return { enviado: false, estado: lead.estado, detalle: "Todavía no aceptó la solicitud." };
      }
      if (acepto === true) {
        actualizarLead(leadId, { aceptadoEn: Date.now() });
        return {
          enviado: false,
          estado: lead.estado,
          detalle: `Aceptó. Se le escribe en ~${minutosDeEspera(leadId)} min, para no saltarle encima.`,
        };
      }
      // null: no se pudo averiguar. Se sigue con el método viejo.
    }
    if (lead.aceptadoEn && !esperaCumplida(lead.aceptadoEn, leadId)) {
      return {
        enviado: false,
        estado: lead.estado,
        detalle: "Esperando el momento de escribirle.",
      };
    }

    console.log(`[pasos] apertura -> ${lead.nombre} (${leadId})`);
    const chatId = await enviarMensajeNuevo(lead.providerId as string, analisis.borrador);
    actualizarLead(leadId, {
      chatId,
      conversacion: [{ de: "setter", texto: analisis.borrador, cuando: Date.now() }],
      // El reloj del seguimiento arranca cuando de verdad le escribimos. Sin
      // esto, un lead que llega a la apertura sin pasar por /motor/contactar
      // queda sin fecha, el cálculo la lee como 1970 y le dispara el
      // seguimiento a los segundos de haberle escrito.
      ...(lead.contactadoEn ? {} : { contactadoEn: Date.now() }),
    });
    return { enviado: true, estado: "contactados", detalle: "Primer mensaje enviado." };
  }

  if (analisis.accion !== "responder" || !analisis.borrador.trim()) {
    return { enviado: false, estado: lead.estado, detalle: "No había nada que enviar." };
  }

  // Si el agendamiento falló, el aviso se AGREGA a la respuesta en vez de
  // reemplazarla: el lead suele haber preguntado otra cosa en el mismo
  // mensaje, y esa respuesta no se puede perder.
  const texto = agenda.aviso
    ? `${analisis.borrador}\n\nPerdón, me corrijo: ${agenda.aviso}`
    : analisis.borrador;

  // Última puerta antes de LinkedIn: un mensaje roto quema la conversación y no
  // hay forma de recuperarla. Si no pasa, se escala en vez de enviar.
  const veredicto = await esEnviable(texto);
  if (!veredicto.apto) {
    console.log(`[pasos] mensaje no enviable -> ${lead.nombre} (${lead.id}): ${veredicto.motivo}`);
    actualizarLead(lead.id, {
      escalado: true,
      escaladoEn: lead.escaladoEn ?? Date.now(),
      motivoEscalado:
        lead.motivoEscalado || `no se envió nada porque ${veredicto.motivo}; revisar el hilo`,
    });
    return {
      enviado: false,
      estado: lead.estado,
      detalle: `No se envió: ${veredicto.motivo}. Escalado a un humano.`,
    };
  }

  await enviarEnChat(lead.chatId as string, texto);

  const conv: MensajeChat[] = [...analisis.historial, { de: "setter", texto, cuando: Date.now() }];
  const l = analisis.lectura;
  const estado: EstadoLead = agenda.agendado
    ? "reunion"
    : l?.seEnfrio
      ? "frio"
      : l?.pidePostergar
        ? "futuro"
        : "respondieron";

  actualizarLead(leadId, {
    conversacion: conv,
    estado,
    notaAgente: l?.nota || lead.notaAgente,
    ...camposEscalado(lead, conv, l?.necesitaHumano ?? false, l?.motivoEscalado ?? ""),
    ...(analisis.ultimoMsgId ? { ultimoMsgUnipile: analisis.ultimoMsgId } : {}),
    ...(agenda.citaUid ? { citaUid: agenda.citaUid } : {}),
    ...(agenda.citaEn ? { citaEn: agenda.citaEn } : {}),
  });

  return {
    enviado: true,
    estado,
    detalle: agenda.agendado ? "Respondido y cita agendada." : "Respondido.",
  };
}

/** El lead completo, para que los endpoints puedan devolverlo sin re-buscarlo. */
export function buscarLead(leadId: string): Lead | undefined {
  return listarLeads().find((l) => l.id === leadId);
}

// ── Seguimiento: al que nunca contestó ───────────────────────────────────────
//
// Es un flujo distinto al de arriba. Arriba se responde a quien ESCRIBIÓ; acá
// se le vuelve a escribir a quien se quedó callado, a los días que diga la
// cadencia. Hasta el 31-07 este flujo existía pero era SIMULADO: generaba el
// mensaje y lo guardaba en el tablero sin mandarlo nunca a LinkedIn.

export interface SeguimientoPendiente {
  leadId: string;
  nombre: string;
  empresa: string;
  /** Cuál seguimiento es (1º, 2º…). */
  numero: number;
  /** true si es el último de la cadencia: después queda frío. */
  esUltimo: boolean;
  /** Días que llevan sin contestar. */
  diasEnSilencio: number;
}

/** ¿Estamos dentro de la ventana horaria y los días que configuró el usuario? */
export function enHorarioDeEnvio(cfg: ConfigCadencia, cuando = new Date()): boolean {
  return cfg.diasSemana.includes(cuando.getDay()) &&
    cuando.getHours() >= cfg.horaInicio &&
    cuando.getHours() < cfg.horaFin;
}

/**
 * A quién le toca seguimiento. `adelantar` ignora el reloj de días para poder
 * probarlo sin esperar tres días — pero NO se salta los candados de seguridad.
 */
export function seguimientosParaEnviar(adelantar = false, cuantos = 3): SeguimientoPendiente[] {
  const cfg = obtenerCadencia();
  const cola = seguimientosPendientes(adelantar, cuantos);
  return cola
    // Solo los que tienen conexión real de LinkedIn: sin providerId no hay a
    // quién escribirle.
    .filter((l) => l.providerId || l.chatId)
    // Sin fecha de contacto no se puede saber cuántos días lleva callado, y
    // el cálculo de vencimiento la leería como 1970 (= vencido siempre). Se
    // deja fuera en vez de arriesgar un seguimiento a los segundos de haberle
    // escrito. `adelantar` es para pruebas y sí puede saltárselo.
    .filter((l) => adelantar || l.contactadoEn)
    .map((l) => {
      const numero = (l.seguimientos ?? 0) + 1;
      return {
        leadId: l.id,
        nombre: l.nombre,
        empresa: l.empresa,
        numero,
        esUltimo: numero >= cfg.diasSeguimiento.length,
        diasEnSilencio: Math.floor((Date.now() - (l.contactadoEn ?? Date.now())) / MS_DIA),
      };
    });
}

export interface SeguimientoRedactado {
  leadId: string;
  nombre: string;
  numero: number;
  esUltimo: boolean;
  /** El mensaje propuesto. Todavía NO se envió. */
  borrador: string;
  /** Si es false, NO hay que enviar: el motivo dice por qué. */
  procede: boolean;
  motivo: string;
}

/**
 * Redacta el seguimiento — sin enviarlo.
 *
 * Antes de redactar hace el candado más importante: **relee el hilo real de
 * LinkedIn**. Si el lead contestó y todavía no lo procesamos, el seguimiento
 * NO sale — mandarle un "¿seguís ahí?" a alguien que acaba de escribir es la
 * peor cara que puede dar el sistema.
 */
export async function redactarSeguimiento(leadId: string): Promise<SeguimientoRedactado> {
  const lead = listarLeads().find((l) => l.id === leadId);
  if (!lead) throw new Error(`No existe el lead ${leadId}`);

  const cfg = obtenerCadencia();
  const numero = (lead.seguimientos ?? 0) + 1;
  const esUltimo = numero >= cfg.diasSeguimiento.length;
  const base = { leadId, nombre: lead.nombre, numero, esUltimo, borrador: "" };

  if (numero > cfg.diasSeguimiento.length) {
    return { ...base, procede: false, motivo: "Ya se le hicieron todos los seguimientos de la cadencia." };
  }

  // Candado: ¿contestó y no nos dimos cuenta?
  if (lead.chatId) {
    try {
      const msgs = await traerMensajes(lead.chatId);
      const ultimo = msgs[msgs.length - 1];
      if (ultimo && ultimo.de === "lead") {
        actualizarLead(leadId, { conversacion: msgs.map(aMensaje), estado: "respondieron" });
        return {
          ...base,
          procede: false,
          motivo: "El lead SÍ contestó. Se cancela el seguimiento y pasa a la cola de respuestas.",
        };
      }
    } catch (e) {
      // Si no podemos leer el hilo, no arriesgamos: mejor no mandar nada.
      return {
        ...base,
        procede: false,
        motivo: `No se pudo leer el hilo para verificar (${e instanceof Error ? e.message : "error"}). No se envía por precaución.`,
      };
    }
  }

  const borrador = await generarSeguimiento(lead, ajustesDeLead(lead), numero, esUltimo);
  return {
    ...base,
    borrador,
    procede: true,
    motivo: esUltimo
      ? "Último intento de la cadencia: si no contesta, queda frío."
      : `Seguimiento ${numero} de ${cfg.diasSeguimiento.length}.`,
  };
}

/**
 * Manda el seguimiento por LinkedIn de verdad y actualiza el tablero.
 * Respeta el mismo freno de mano que el contacto inicial.
 */
export async function enviarSeguimiento(
  leadId: string,
  borrador: string,
): Promise<{ enviado: boolean; motivo: string; estado?: EstadoLead }> {
  const lead = listarLeads().find((l) => l.id === leadId);
  if (!lead) throw new Error(`No existe el lead ${leadId}`);
  if (!borrador.trim()) return { enviado: false, motivo: "Sin mensaje que enviar." };

  if (!contactoAprobado()) {
    return { enviado: false, motivo: "El freno de mano está puesto: no sale nada hacia LinkedIn." };
  }

  // Un seguimiento roto es peor que uno tardío: es el segundo mensaje sin
  // respuesta, y ahí la paciencia del lead ya es corta.
  const veredicto = await esEnviable(borrador);
  if (!veredicto.apto) {
    console.log(`[seguimiento] no enviable -> ${lead.nombre} (${lead.id}): ${veredicto.motivo}`);
    return { enviado: false, motivo: `No se envió: ${veredicto.motivo}` };
  }

  try {
    if (lead.chatId) {
      await enviarEnChat(lead.chatId, borrador);
    } else if (lead.providerId) {
      const chatId = await enviarMensajeNuevo(lead.providerId, borrador);
      actualizarLead(leadId, { chatId });
    } else {
      return { enviado: false, motivo: "El lead no tiene conexión de LinkedIn." };
    }
  } catch (e) {
    return { enviado: false, motivo: `LinkedIn rechazó el envío: ${e instanceof Error ? e.message : "error"}` };
  }

  // registrarSeguimiento sube el contador, lo agrega al hilo y marca frío si
  // se agotaron los intentos.
  registrarSeguimiento(leadId, borrador);
  const actualizado = listarLeads().find((l) => l.id === leadId);
  console.log(`[pasos] seguimiento ${(lead.seguimientos ?? 0) + 1} -> ${lead.nombre} (${leadId})`);

  return {
    enviado: true,
    motivo: "Seguimiento enviado por LinkedIn.",
    estado: actualizado?.estado,
  };
}

// ── Paso 5: recordatorio de la reunión ───────────────────────────────────────

/**
 * Cuántas horas antes de la reunión sale el recordatorio por LinkedIn.
 *
 * Por qué 2 y no 24: el recordatorio nativo de Cal.com ya avisa por correo con
 * un día. Este sale por el MISMO hilo donde el lead conversó con el setter, y
 * ahí lo que sirve es el aviso corto — el que evita el "se me pasó". Además,
 * cuando alguien acepta una llamada para el día siguiente, un recordatorio a
 * 24 h nunca llegaría a dispararse.
 */
const HORAS_ANTES_RECORDATORIO = 2;

export interface RecordatorioPendiente {
  leadId: string;
  nombre: string;
  empresa: string;
  /** Inicio de la reunión (ms). */
  citaEn: number;
  /** Cuántos minutos faltan para la reunión. */
  minutosParaLaCita: number;
}

/** La hora de la cita en palabras, en hora de Colombia ("3:30 p. m."). */
function horaDeLaCita(ms: number): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

/** "hoy" o "mañana" según el día de la cita, en hora de Colombia. */
function diaDeLaCita(ms: number): string {
  const dia = (t: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(t));
  const hoy = dia(Date.now());
  const cita = dia(ms);
  if (cita === hoy) return "hoy";
  if (cita === dia(Date.now() + MS_DIA)) return "mañana";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(ms));
}

/**
 * A quién le toca recordatorio ahora mismo.
 *
 * `adelantar` ignora la ventana de horas (para probar sin esperar), pero NO se
 * salta los candados: cita pasada, recordatorio ya enviado o lead sin LinkedIn
 * quedan fuera igual.
 */
export function recordatoriosParaEnviar(adelantar = false, cuantos = 5): RecordatorioPendiente[] {
  const ahora = Date.now();
  const ventana = HORAS_ANTES_RECORDATORIO * 60 * 60 * 1000;

  return listarLeads()
    .filter((l) => l.estado === "reunion")
    // Sin fecha de cita no hay cuándo recordar. Los leads que agendaron antes
    // del 04-08 no tienen `citaEn`: quedan fuera en vez de recibir un
    // recordatorio con hora inventada.
    .filter((l) => typeof l.citaEn === "number" && l.citaEn! > 0)
    // Una sola vez por lead.
    .filter((l) => !l.recordatorioEn)
    // Nunca recordar una reunión que ya empezó.
    .filter((l) => l.citaEn! > ahora)
    // Dentro de la ventana (o todas, si se está probando).
    .filter((l) => adelantar || l.citaEn! - ahora <= ventana)
    // Sin conexión de LinkedIn no hay por dónde escribir.
    .filter((l) => l.chatId || l.providerId)
    .sort((a, b) => a.citaEn! - b.citaEn!)
    .slice(0, cuantos)
    .map((l) => ({
      leadId: l.id,
      nombre: l.nombre,
      empresa: l.empresa,
      citaEn: l.citaEn!,
      minutosParaLaCita: Math.round((l.citaEn! - ahora) / 60000),
    }));
}

/**
 * El texto del recordatorio.
 *
 * A propósito NO lo escribe el modelo: un recordatorio es una sola frase con
 * un dato duro (la hora). Pedirle eso a un LLM agrega costo, latencia y el
 * riesgo de que invente una hora distinta a la agendada — que es justo el
 * error que arruinaría la reunión.
 */
export function textoRecordatorio(nombre: string, citaEn: number): string {
  const pila = nombre.trim().split(/\s+/)[0] || nombre.trim();
  const texto =
    `Hola ${pila}, te recuerdo nuestra llamada de ${diaDeLaCita(citaEn)} ` +
    `a las ${horaDeLaCita(citaEn)}. El enlace te llegó al correo con la invitación. ` +
    `Si se te complicó a esa hora, dime y la movemos sin problema.`;
  // "1:48 p. m." ya termina en punto: sin esto queda "p. m.." y se ve a
  // kilómetros que lo escribió una máquina.
  return texto.replace(/\.{2,}/g, ".");
}

/**
 * Manda el recordatorio por LinkedIn y deja la marca para no repetirlo.
 *
 * El orden importa: primero se envía, después se marca. Si se marcara antes y
 * el envío fallara, el lead se quedaría sin recordatorio y sin posibilidad de
 * reintento.
 */
export async function enviarRecordatorio(
  leadId: string,
): Promise<{ enviado: boolean; motivo: string; texto?: string }> {
  const lead = listarLeads().find((l) => l.id === leadId);
  if (!lead) throw new Error(`No existe el lead ${leadId}`);
  if (!lead.citaEn) return { enviado: false, motivo: "El lead no tiene fecha de reunión guardada." };
  if (lead.recordatorioEn) return { enviado: false, motivo: "Ya se le había recordado." };
  if (lead.citaEn <= Date.now()) return { enviado: false, motivo: "La reunión ya empezó." };

  if (!contactoAprobado()) {
    return { enviado: false, motivo: "El freno de mano está puesto: no sale nada hacia LinkedIn." };
  }

  const texto = textoRecordatorio(lead.nombre, lead.citaEn);

  try {
    if (lead.chatId) {
      await enviarEnChat(lead.chatId, texto);
    } else if (lead.providerId) {
      const chatId = await enviarMensajeNuevo(lead.providerId, texto);
      actualizarLead(leadId, { chatId });
    } else {
      return { enviado: false, motivo: "El lead no tiene conexión de LinkedIn." };
    }
  } catch (e) {
    return {
      enviado: false,
      motivo: `LinkedIn rechazó el envío: ${e instanceof Error ? e.message : "error"}`,
    };
  }

  const conv = [...(lead.conversacion ?? []), { de: "setter" as const, texto, cuando: Date.now() }];
  actualizarLead(leadId, { recordatorioEn: Date.now(), conversacion: conv });
  console.log(`[pasos] recordatorio -> ${lead.nombre} (${leadId}) cita=${new Date(lead.citaEn).toISOString()}`);

  return { enviado: true, motivo: "Recordatorio enviado por LinkedIn.", texto };
}
