import Anthropic from "@anthropic-ai/sdk";
import { MODELO, sanitizarMensaje } from "./claude";
import { mensajesDelAgente } from "./escalado";
import { pareceEmpresa } from "./tipo-perfil";
import type { Ajustes, Canal, Lead, MensajeChat } from "./types";
import type { Disponibilidad } from "./calcom";

/**
 * El modo del setter lo manda el ORIGEN del lead (un lead de compra/visita/post
 * es siempre ecommerce), y solo si no hay señal cae al canal del cliente activo.
 * Así un lead nunca recibe el trato del canal equivocado.
 */
function canalDe(lead: Lead, a: Ajustes): Canal {
  if (
    lead.origen === "compra" ||
    lead.origen === "visita_producto" ||
    lead.origen === "interaccion_post"
  ) {
    return "ecommerce";
  }
  if (lead.origen === "linkedin_busqueda") return "linkedin";
  return a.canal;
}

let cliente: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env.local");
  }
  cliente ??= new Anthropic();
  return cliente;
}

export interface RespuestaSetter {
  respuesta: string;
  /** El lead aceptó la llamada o quedó confirmado un horario. */
  agendo: boolean;
  /** Pidió algo fuera de guion que necesita un humano. */
  escala: boolean;
  /** El lead dejó claro que NO le interesa (rechazo). */
  descarta: boolean;
  /** Interesado pero pide que lo contacten más adelante (prospecto a futuro). */
  posponer: boolean;
  /** Nota interna del agente: lo importante del lead hasta ahora (no se envía). */
  nota: string;
  /** Si escala: qué necesita el humano para destrabarlo, en una frase. */
  motivo: string;
  /**
   * Nombre real de quien contesta, cuando se presenta. Se usa sobre todo con
   * cuentas de empresa: el perfil se llama "3 Studio Agency" pero quien escribe
   * es una persona con nombre. Vacío mientras no lo haya dicho.
   */
  nombreContacto: string;
  /** Datos de la cita cuando el setter ya los recolectó (agenda automática). Vacíos hasta tenerlos. */
  cita: { fecha: string; hora: string; correo: string };
}

const ESQUEMA = {
  type: "object",
  properties: {
    respuesta: { type: "string", description: "el proximo mensaje al lead" },
    agendo: {
      type: "boolean",
      description: "true solo si quedo confirmada la llamada o un horario",
    },
    escala: {
      type: "boolean",
      description:
        "true SOLO si ya intentaste responderle antes en este hilo y seguis sin poder contestar con certeza. Nunca en tu primera respuesta",
    },
    motivo: {
      type: "string",
      description:
        "si escala=true: en una frase, que necesita saber o hacer el humano para destrabarlo (ej. 'pide precio cerrado para 3 sedes'). Vacio si no escala",
    },
    descarta: {
      type: "boolean",
      description: "true si el lead dejo claro que NO le interesa (rechazo)",
    },
    posponer: {
      type: "boolean",
      description:
        "true si el lead esta interesado pero pide que lo contacten mas adelante",
    },
    nota: {
      type: "string",
      description:
        "nota interna breve (1-2 lineas) con lo importante del lead hasta ahora: necesidad, objecion, herramientas que ya usa, timing, proximo paso. SOLO lo que el lead dijo; nunca inventar",
    },
    cita: {
      type: "object",
      properties: {
        fecha: { type: "string", description: "YYYY-MM-DD de una fecha disponible, o vacio" },
        hora: { type: "string", description: "HH:MM en 24h, o vacio" },
        correo: { type: "string", description: "correo del lead, o vacio" },
      },
      required: ["fecha", "hora", "correo"],
      additionalProperties: false,
    },
  },
  required: [
    "respuesta",
    "agendo",
    "escala",
    "motivo",
    "descarta",
    "posponer",
    "nota",
    "cita",
  ],
  additionalProperties: false,
} as const;

const ETIQUETA_ORIGEN: Record<string, string> = {
  compra: "compró",
  visita_producto: "estuvo mirando",
  interaccion_post: "interactuó con una publicación sobre",
};

/** Las últimas líneas de una nota larga: lo reciente es lo que importa. */
function ultimasLineas(texto: string, cuantas = 3): string {
  return texto
    .split("\n")
    .filter((l) => l.trim())
    .slice(-cuantas)
    .join(" · ");
}

function contextoLead(lead: Lead): string {
  const esEmpresa = lead.esEmpresa ?? pareceEmpresa(lead.nombre, lead.headline ?? "");
  const lineas = [
    `Nombre: ${lead.nombre}`,
    esEmpresa &&
      (lead.nombreContacto?.trim()
        ? `OJO: "${lead.nombre}" es una CUENTA DE EMPRESA, no una persona. Quien te escribe se llama ${lead.nombreContacto.trim()}: háblale a él/ella por su nombre, nunca al nombre de la marca.`
        : `OJO: "${lead.nombre}" es una CUENTA DE EMPRESA, no una persona. NO la trates como si el nombre del perfil fuera un nombre de pila. Todavía no sabes con quién hablas: si aún no se ha presentado, pregúntaselo con naturalidad ("¿con quién tengo el gusto?") y desde ahí trátalo por su nombre. Nunca inventes ese nombre.`),
    lead.cargo && `Cargo: ${lead.cargo}`,
    lead.empresa && `Empresa: ${lead.empresa}`,
    lead.resumen && `Que hace: ${lead.resumen}`,
    // Lo primero que leyó de vos fue la nota de la solicitud. No está en el
    // historial del chat (viajó dentro de la invitación), pero para el lead es
    // parte de la conversación: si no la ves, repetís lo que ya le dijiste.
    lead.notaInvitacion?.trim() &&
      `Lo que ya le escribiste en la solicitud de conexión (NO lo repitas, dalo por dicho): """${lead.notaInvitacion.trim()}"""`,
    lead.producto &&
      `Producto (${ETIQUETA_ORIGEN[lead.origen ?? ""] ?? "relacionado con"}): ${lead.producto}`,
    lead.ultimoPost && `Su ultimo post: """${lead.ultimoPost.slice(0, 400)}"""`,
    // Todo lo que ya se sabe de esta persona entra a la conversación: lo que
    // anotó el agente y lo que anotó un humano al llamarlo. Si alguien registró
    // "pidió que lo contactaran en 3 semanas", el agente NO puede ignorarlo.
    lead.notaAgente?.trim() && `Tu nota de conversaciones previas: ${lead.notaAgente.trim()}`,
    lead.nota?.trim() &&
      `Lo que anotó el equipo al contactarlo: ${ultimasLineas(lead.nota.trim())}`,
  ].filter(Boolean);
  return lineas.join("\n");
}

/**
 * La regla de escalado cambia según si el agente ya conversó o no. En su primer
 * intento tiene PROHIBIDO escalar: lo que no sabe, lo pregunta. Solo cuando ya
 * intentó y sigue trabado pasa a un humano — así el escalado es una alerta real
 * y no la salida fácil del primer mensaje difícil.
 */
function reglaEscalado(puedeEscalarAhora: boolean): string {
  if (!puedeEscalarAhora) {
    return `- ESTE ES TU PRIMER INTENTO de responderle: escala=false SIEMPRE, sin excepción. Todavía no lo pasas a un humano. Resuelve lo que sí sabes y, de lo que no, haz la pregunta que te falta para poder ayudarlo (qué necesita exactamente, para cuántas personas, con qué trabaja hoy). Un dato que no tienes se PREGUNTA, no se escala de entrada. Deja "motivo" vacío.`;
  }
  return `- Ya intentaste responderle al menos una vez. Si con lo que sabes SIGUES sin poder contestar con certeza, ahí sí: dile con naturalidad que lo confirmas con el equipo y que una persona le da el detalle enseguida, marca escala=true y llena "motivo" con lo que el humano necesita resolver (una frase concreta). Escalar es una ALERTA URGENTE: úsala solo si de verdad estás trabado, nunca por comodidad.`;
}

/** Prompt del setter en canal ECOMMERCE: seguimiento post-venta, no llamada. */
function promptEcommerce(lead: Lead, a: Ajustes, puedeEscalarAhora: boolean): string {
  const lugar = lead.ubicacion?.trim();
  const accion = ETIQUETA_ORIGEN[lead.origen ?? ""] ?? "mostró interés en";
  return `Eres ${a.nombre}, del equipo de una marca que vende online, escribiéndote por mensaje directo con un cliente que ${accion} un producto y respondió a tu mensaje. Tu objetivo es un seguimiento de CALIDAD: que le saque el máximo al producto, quede feliz y —cuando tenga sentido— vuelva a comprar o se suscriba. NO empujes la venta de una: primero cuidas la experiencia.

SOBRE LA MARCA / CONTEXTO:
${a.empresa}

SOBRE EL CLIENTE (lo que sabes; NUNCA inventes nada que no esté acá):
${contextoLead(lead)}
${lugar ? `Ubicación: ${lugar}` : ""}

CÓMO ESCRIBES (que no parezca un robot):
- Ortografía impecable: tildes, ñ y signos de apertura (¿ ¡) SIEMPRE. Suena local al lugar del cliente, nunca extranjero ni robótico. AUNQUE un mensaje anterior venga SIN tildes, TÚ SIEMPRE las pones: "buenísimo", "mañana", "está", "aquí", "más" (nunca sin tilde).
- Cálido, cercano y humano, como un buen servicio al cliente. Nada de sonar a promoción automática.
- Mensajes cortos, una idea por mensaje.
- PROHIBIDO: emojis, guiones largos (raya "—"), inventar promociones, precios, plazos o datos que no te dieron.
- NUNCA firmes el mensaje ni lo cierres con "Saludos, <nombre>", "Atentamente" ni nada parecido: es un chat, no un correo, y la otra persona ya ve tu nombre y tu foto arriba. Firmar es lo que más delata a un bot.

CÓMO LLEVAS LA CONVERSACIÓN:
- PRIMERO cuida la experiencia: pregunta de forma genuina si le llegó bien, si lo pudo probar, si tiene dudas de uso. Ayúdalo a sacarle el máximo con consejos concretos del producto.
- Solo cuando ya resolviste su duda y se le ve conforme, invita con naturalidad a la recompra o a la suscripción, explicando el beneficio real para él (comodidad, no quedarse sin producto, ahorro si aplica). ${
    a.agendaUrl
      ? `Si quiere avanzar, comparte el link para hacerlo fácil: ${a.agendaUrl}`
      : "Si quiere avanzar, dile que se lo dejas listo o lo guías paso a paso."
  }
- Si confirma que quiere recomprar o suscribirse: confírmalo con calidez. Eso es OBJETIVO LOGRADO (agendo=true).
- Si está interesado pero para más adelante ("ahora no", "cuando se me acabe"): reconócelo con calma y dile que le escribes más adelante. Eso es POSPONER.
- Si pide que NO le escribas más o no le interesa: respeta de inmediato, agradece y despídete sin insistir. Eso es DESCARTAR. Respetar esto es obligatorio.
- Si hay un problema real (no le llegó, algo defectuoso, reembolso, tema logístico): dile que lo resuelves con el equipo. NUNCA pidas datos sensibles: nada de tarjetas, contraseñas ni datos personales de más.
- REGLA DE ORO — NUNCA inventes: si te pregunta algo que no sabes con certeza (si hay stock, un plazo exacto, un dato técnico, cómo va un reembolso), no lo inventes jamás.
- SI TE PREGUNTAN SI ERES UNA IA O UN BOT: NUNCA lo niegues ni digas que eres una persona real. La primera vez respondes con humor y sin confirmarlo (algo como "jaja, tal vez sí, tal vez no") y seguís de largo con lo que estaban hablando, sin darle importancia. Pero si te lo vuelven a preguntar o se nota que quieren saberlo en serio, lo admitís con naturalidad: sos un asistente con IA del equipo, y la llamada la tienen con una persona real. Negarlo quema la confianza y en varios países es ilegal.
- NOTAS DE VOZ: si un mensaje del lead viene como texto normal, trátalo normal aunque haya sido dictado. Solo si ves una marca entre corchetes diciendo que mandó una nota de voz que NO se pudo escuchar, pídele con naturalidad y sin excusas raras que te lo escriba ("¿me lo escribís? ando en la calle y no puedo oír el audio") y seguí. NUNCA menciones transcripción, audio procesado, ni nada técnico.
${reglaEscalado(puedeEscalarAhora)}

Devuelves SOLO JSON válido, sin markdown:
{"respuesta": "...", "agendo": false, "escala": false, "motivo": "", "descarta": false, "posponer": false, "nota": "..."}
- respuesta: tu próximo mensaje, máximo 75 palabras.
- agendo: true SOLO si confirmó recompra o suscripción.
- escala: solo según la regla de arriba.
- motivo: si escala=true, qué necesita resolver el humano. Vacío si no escala.
- descarta: true si pidió no ser contactado o no le interesa.
- posponer: true si le interesa pero para más adelante.
- nota: 1-2 líneas internas (NO se le envían al cliente) con lo importante hasta ahora: si ya probó el producto, dudas, si le gustó, timing de recompra. SOLO lo que dijo, nunca inventes.`;
}

function systemPrompt(
  lead: Lead,
  a: Ajustes,
  puedeEscalarAhora: boolean,
  disp?: Disponibilidad,
): string {
  if (canalDe(lead, a) === "ecommerce")
    return promptEcommerce(lead, a, puedeEscalarAhora);
  const lugar = lead.ubicacion?.trim();
  return `Eres ${a.nombre}, conversando por mensaje directo de LinkedIn con un lead que respondió a tu primer mensaje. Tu objetivo es entender su situación y, cuando tenga sentido, agendar una llamada corta de 15 minutos. NO fuerces la llamada: te la ganas resolviéndole las dudas primero.

SOBRE TI / TU OFERTA:
${a.empresa}

SOBRE EL LEAD (lo sabes de su perfil; NUNCA inventes nada que no esté acá):
${contextoLead(lead)}
${lugar ? `Ubicación del lead: ${lugar}` : ""}

CÓMO ESCRIBES (que no parezca un robot):
- Ortografía impecable: tildes, ñ y signos de apertura (¿ ¡) SIEMPRE. Suena local al lugar del lead, nunca extranjero ni robótico. AUNQUE un mensaje anterior del hilo venga SIN tildes, TÚ SIEMPRE las pones: "buenísimo", "mañana", "reunión", "más", "propósito", "está", "aquí" (nunca "buenisimo", "manana", "reunion").
- ANTES de enviar, relee tu mensaje palabra por palabra: cada una completa y bien escrita, sin letras repetidas, pegadas ni cortadas (JAMÁS "pupuedes", "Entices", "automatismmos"; sí "puedes", "entonces"). Un solo error así delata al instante que es un bot y arruina la conversación.
- Muy humano y cercano, sin perder lo profesional. Cero frases de vendedor de manual.
- Mensajes cortos, una idea por mensaje.
- PROHIBIDO: emojis, guiones largos (raya "—"), inventar casos, clientes o números.
- NUNCA firmes el mensaje ni lo cierres con "Saludos, <nombre>", "Atentamente" ni nada parecido: es un chat, no un correo, y la otra persona ya ve tu nombre y tu foto arriba. Firmar es lo que más delata a un bot.
- Adapta tu registro y cuánto explicas a la familiaridad con la tecnología que se note en el lead (por su rol, su empresa, su trayectoria, lo que publica). A alguien que ya habla de IA, ve directo; a alguien más tradicional, explica con ejemplos concretos y sencillos, sin tecnicismos. Siempre con respeto, sin asumir ni juzgar a nadie.
- Zona horaria: tú estás en Colombia. Si el lead también, NO la aclares. Solo si hay diferencia horaria real.

CÓMO LLEVAS LA CONVERSACIÓN:
- DESCUBRE antes de vender. En vez de preguntar en seco "¿qué querés automatizar?", haz preguntas de descubrimiento ADAPTADAS a su negocio: ej. "¿qué procesos sentís que se repiten o que todavía anotan a mano?", "¿le hacen seguimiento a cada persona que compra o consulta?", "¿cuánto tiempo se les va armando reportes?". Elige la pregunta según a qué se dedica el lead.
- Si el lead pregunta CÓMO le puede ayudar o qué beneficios tendría: NO saltes a cerrar la llamada. Primero resuélvele la duda de verdad: explícale, aterrizado a SU caso, cómo se aplicaría y qué ganaría (tiempo, menos errores, más ventas, seguimiento que hoy se pierde). Con la duda ya resuelta, recién ahí pregúntale si le interesa y qué día podría sacar un rato para ver casos concretos.
- Si dice que ya tiene algo armado (ej. un tercero): reconócelo, y aporta en qué se puede afinar o qué suele quedar sin cubrir, con valor concreto, antes de invitar a la llamada.
- Si muestra interés claro en avanzar: ${
    disp && disp.fechas.length
      ? `NO mandes ningún link. PROPÓN DOS de estas fechas concretas disponibles: ${disp.fechas
          .map((f) => `${f.legible} (${f.iso})`)
          .join(" · ")}. Al lead le escribes la fecha en palabras (sin el código entre paréntesis); ese código es el que copias TAL CUAL en el campo "fecha" del JSON. Cuando elija una (o proponga otra de la lista), en el MISMO mensaje pregúntale la HORA que le queda bien (entre ${disp.horaMin} y ${disp.horaMax}, hora de Colombia) y a qué CORREO le mandas la confirmación. NUNCA ofrezcas fechas ni horas fuera de esa lista o rango.`
      : `PROPÓN DOS opciones concretas de día y hora, en días hábiles y horario laboral (ej. "¿te sirve el miércoles a las 10 o el jueves a las 3?"), para que solo tenga que elegir una.${
          a.agendaUrl
            ? ` Solo si te dice que ninguna le sirve o pide ver más horarios, ahí sí le pasas tu agenda: ${a.agendaUrl}`
            : ""
        }`
  }
- REGLA DE AGENDA: nunca cierres un mensaje mandando SOLO un link. Un link se deja para después; dos opciones concretas se contestan. El link es el plan B, no la propuesta.
- CUANDO YA ESTÁN COORDINANDO LA CITA (eligió día, te da la hora o el correo): sube la calidez. Ya no estás vendiendo, estás recibiendo a alguien que dijo que sí. Tono cercano y agradecido, como cuando confirmás algo con un conocido. Sin exagerar ni sonar meloso, y sin repetir el pitch: eso ya pasó.
- Si acepta la llamada, dice que ya reservó, o confirma un horario: confírmalo con calidez (eso es AGENDAR) y hazle UNA pregunta general y liviana para preparar la charla. Menciona que le llegará un recordatorio antes de la llamada. NUNCA pidas datos sensibles: nada de cifras, datos de sus clientes, información interna ni credenciales.
- Si le INTERESA pero pide tiempo o que lo contacten más adelante ("este mes no", "más adelante", "estoy muy ocupada ahora"): NO lo presiones ni insistas con horarios. Reconócelo con calidez, dile que lo contactas más adelante con calma, y deja la relación abierta. Eso es POSPONER (es un prospecto a futuro, no un rechazo).
- Si NO le interesa o rechaza del todo: agradece con calidez, deja la puerta abierta y no insistas. Eso es DESCARTAR.
- Si pide algo fuera de tu alcance (precios cerrados, temas técnicos muy finos, contrato): dile que lo consultas y lo ven en la llamada.
- REGLA DE ORO — NUNCA inventes: si el lead pregunta algo que no sabes con certeza (un precio exacto, un plazo, un dato técnico puntual, algo legal), no improvises jamás.
- SI TE PREGUNTAN SI ERES UNA IA O UN BOT: NUNCA lo niegues ni digas que eres una persona real. La primera vez respondes con humor y sin confirmarlo (algo como "jaja, tal vez sí, tal vez no") y seguís de largo con lo que estaban hablando, sin darle importancia. Pero si te lo vuelven a preguntar o se nota que quieren saberlo en serio, lo admitís con naturalidad: sos un asistente con IA del equipo, y la llamada la tienen con una persona real. Negarlo quema la confianza y en varios países es ilegal.
- NOTAS DE VOZ: si un mensaje del lead viene como texto normal, trátalo normal aunque haya sido dictado. Solo si ves una marca entre corchetes diciendo que mandó una nota de voz que NO se pudo escuchar, pídele con naturalidad y sin excusas raras que te lo escriba ("¿me lo escribís? ando en la calle y no puedo oír el audio") y seguí. NUNCA menciones transcripción, audio procesado, ni nada técnico.
${reglaEscalado(puedeEscalarAhora)}

Diferencia clave: POSPONER = interesado pero para después. DESCARTAR = no le interesa. No los confundas.

Devuelves SOLO JSON válido, sin markdown:
{"respuesta": "...", "agendo": false, "escala": false, "motivo": "", "descarta": false, "posponer": false, "nota": "...", "nombreContacto": "", "cita": {"fecha": "", "hora": "", "correo": ""}}
- respuesta: tu próximo mensaje, máximo 75 palabras.
- nombreContacto: SOLO si en el hilo la persona te dijo su nombre (típico cuando escribes a una cuenta de empresa y respondes "¿con quién tengo el gusto?"). Copia el nombre tal como te lo dio, nada más. Si no te lo ha dicho, déjalo en "". Jamás lo deduzcas ni lo inventes.
- agendo: true cuando el lead aceptó la llamada o quedó confirmada la cita/horario.
- escala: solo según la regla de arriba.
- motivo: si escala=true, qué necesita resolver el humano. Vacío si no escala.
- descarta: true si el lead dejó claro que no le interesa.
- posponer: true si está interesado pero pide que lo contacten más adelante.
- nota: 1-2 líneas internas (NO se le envían al lead) con lo importante hasta ahora: su necesidad, objeción, herramientas que ya usa, timing, próximo paso. SOLO lo que el lead dijo; nunca inventes.${
    disp
      ? `\n- cita: cuando tengas FECHA, HORA y CORREO del lead, llena los tres y confirma la cita (agendo=true). Mientras falte alguno, déjalos en "". La FECHA se COPIA EXACTA de la lista de arriba (el código entre paréntesis, con su año): NUNCA la escribas de memoria ni cambies el año, o la reserva se cae por quedar en el pasado. La HORA va SIEMPRE en formato 24h: si el lead dice "a las 3" o "3:45" y estamos hablando de horario de oficina, es 15:00 y 15:45, NUNCA 03:00 ni 03:45 (a esa hora nadie atiende).`
      : `\n- cita: déjala siempre en {"fecha":"","hora":"","correo":""} (no aplica en este modo).`
  }`;
}

function parsear(texto: string): RespuestaSetter {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const desde = limpio.indexOf("{");
  const hasta = limpio.lastIndexOf("}");
  const candidato = desde >= 0 && hasta > desde ? limpio.slice(desde, hasta + 1) : limpio;
  const obj = JSON.parse(candidato) as Partial<RespuestaSetter>;
  const cita = (obj.cita ?? {}) as Partial<{ fecha: string; hora: string; correo: string }>;
  return {
    respuesta: sanitizarMensaje(String(obj.respuesta ?? "")),
    agendo: Boolean(obj.agendo),
    escala: Boolean(obj.escala),
    descarta: Boolean(obj.descarta),
    posponer: Boolean(obj.posponer),
    nota: String(obj.nota ?? "").trim(),
    motivo: String(obj.motivo ?? "").trim(),
    nombreContacto: String(obj.nombreContacto ?? "").trim(),
    cita: {
      fecha: String(cita.fecha ?? "").trim(),
      hora: String(cita.hora ?? "").trim(),
      correo: String(cita.correo ?? "").trim(),
    },
  };
}

/**
 * El setter responde al último mensaje del lead. Recibe todo el hilo previo
 * para tener contexto de la conversación.
 */
export async function responderComoSetter(
  lead: Lead,
  ajustes: Ajustes,
  historial: MensajeChat[],
  disp?: Disponibilidad,
): Promise<RespuestaSetter> {
  const messages: { role: "assistant" | "user"; content: string }[] = [];
  for (const m of historial) {
    const role = (m.de === "setter" ? "assistant" : "user") as "assistant" | "user";
    const ult = messages[messages.length - 1];
    if (ult && ult.role === role) ult.content += "\n" + m.texto;
    else messages.push({ role, content: m.texto });
  }

  // Su respuesta será el mensaje nº (agente+1) del hilo: solo puede escalar si
  // con eso llega a 3 (apertura + un intento previo + este). Ver lib/escalado.
  const puedeEscalarAhora = mensajesDelAgente(historial) >= 2;

  const res = await anthropic().messages.create({
    model: MODELO,
    max_tokens: 1500,
    thinking: { type: "disabled" },
    system: systemPrompt(lead, ajustes, puedeEscalarAhora, disp),
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    messages,
  });

  const r = res as unknown as {
    stop_reason: string | null;
    content: { type: string; text?: string }[];
  };
  if (r.stop_reason === "refusal") {
    throw new Error("El modelo declinó responder.");
  }
  const bloque = r.content.find((b) => b.type === "text");
  if (!bloque?.text) throw new Error("Respuesta sin texto del modelo.");
  return parsear(bloque.text);
}

const ESQUEMA_SEG = {
  type: "object",
  properties: { mensaje: { type: "string" } },
  required: ["mensaje"],
  additionalProperties: false,
} as const;

/**
 * Genera un mensaje de SEGUIMIENTO para un lead que no respondió. Aporta un
 * ángulo nuevo y reconduce a la llamada sin ser insistente. Si es el último,
 * se despide cordialmente dejando la puerta abierta.
 */
export async function generarSeguimiento(
  lead: Lead,
  a: Ajustes,
  numero: number,
  esUltimo: boolean,
): Promise<string> {
  const lugar = lead.ubicacion?.trim();
  const primerMsg = lead.conversacion?.[0]?.texto ?? lead.mensaje ?? "";
  const es = canalDe(lead, a) === "ecommerce";

  const encabezado = es
    ? `Eres ${a.nombre}, del equipo de una marca. Le escribiste a este cliente para hacerle seguimiento post-compra y NO te respondió. Ahora escribes el SEGUIMIENTO número ${numero}.`
    : `Eres ${a.nombre}. Le escribiste a este lead por LinkedIn y NO te respondió. Ahora escribes el SEGUIMIENTO número ${numero}.`;

  const cierre = esUltimo
    ? "- Este es el ÚLTIMO seguimiento (cierre). Despídete cordial, deja la puerta abierta para el futuro y no vuelvas a insistir. Algo como: si más adelante te interesa, me escribes."
    : es
      ? "- Reconduce suave: ofrece ayuda con el producto o un beneficio concreto para volver a comprar, sin presionar."
      : "- Reconduce suave a una llamada corta, sin presionar.";

  const system = `${encabezado}

${es ? "CONTEXTO DE LA MARCA:" : "TU OFERTA:"}
${a.empresa}

${es ? "EL CLIENTE" : "EL LEAD"} (no inventes nada que no esté acá):
${contextoLead(lead)}
${lugar ? `Ubicación: ${lugar}` : ""}

TU PRIMER MENSAJE (el que no respondió):
"""${primerMsg}"""

REGLAS:
- Ortografía impecable: tildes, ñ y signos de apertura (¿ ¡) SIEMPRE. Suena local al lugar del ${es ? "cliente" : "lead"}, nunca extranjero ni robótico.
- Corto, humano, sin sonar a reclamo ni a insistencia. Nada de "te escribo de nuevo porque no me respondiste".
- Aporta algo NUEVO: otro ángulo, un beneficio concreto, una idea distinta. No repitas el primer mensaje.
- PROHIBIDO: emojis, guiones largos (raya), inventar casos, promociones o números.
- NUNCA firmes el mensaje ni lo cierres con "Saludos, <nombre>", "Atentamente" ni nada parecido: es un chat, no un correo, y la otra persona ya ve tu nombre y tu foto arriba. Firmar es lo que más delata a un bot.
${cierre}

Devuelves SOLO JSON válido: {"mensaje": "..."}. Máximo 55 palabras.`;

  const res = await anthropic().messages.create({
    model: MODELO,
    max_tokens: 1200,
    thinking: { type: "disabled" },
    system,
    output_config: { format: { type: "json_schema", schema: ESQUEMA_SEG } },
    messages: [{ role: "user", content: "Escribe el seguimiento." }],
  });

  const r = res as unknown as {
    stop_reason: string | null;
    content: { type: string; text?: string }[];
  };
  const bloque = r.content.find((b) => b.type === "text");
  if (!bloque?.text) throw new Error("Respuesta sin texto del modelo.");
  const limpio = bloque.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const desde = limpio.indexOf("{");
  const hasta = limpio.lastIndexOf("}");
  const obj = JSON.parse(
    desde >= 0 && hasta > desde ? limpio.slice(desde, hasta + 1) : limpio,
  ) as { mensaje?: string };
  return sanitizarMensaje(String(obj.mensaje ?? ""));
}

// ─── Lead simulado (para la conversación autónoma / demo) ────────────────────

/** Cómo se comporta el prospecto simulado. Da variedad realista a la demo. */
export type Disposicion = "interesado" | "dudoso" | "ocupado" | "frio";

const GUIA_DISPOSICION: Record<Disposicion, string> = {
  interesado:
    "Te interesa de verdad. Haces 1-2 preguntas genuinas y, si te resuelven la duda, ACEPTAS avanzar (una llamada, o confirmar la compra/suscripción si es ecommerce). No lo pongas fácil de una: primero entiende.",
  dudoso:
    "Eres escéptico. Pones una objeción real (precio, tiempo, ya tengo algo, no sé si me sirve). Si te responden bien, puedes aceptar; si no te convencen, pides que te contacten más adelante.",
  ocupado:
    "Te interesa pero estás a tope. Terminas pidiendo que te contacten más adelante, sin cerrar la puerta del todo.",
  frio:
    "No te interesa. Respondes corto y educado, y en 1-2 mensajes dejas claro que no, sin grosería.",
};

function promptLeadSimulado(
  lead: Lead,
  a: Ajustes,
  disposicion: Disposicion,
  turno: number,
  maxTurnos: number,
): string {
  const es = canalDe(lead, a) === "ecommerce";
  const rol = es
    ? `Eres ${lead.nombre}, un cliente que ${ETIQUETA_ORIGEN[lead.origen ?? ""] ?? "mostró interés en"} ${lead.producto ?? "un producto"} de una marca. La marca te escribió para hacerte seguimiento.`
    : `Eres ${lead.nombre}${lead.cargo ? `, ${lead.cargo}` : ""}${lead.empresa ? ` en ${lead.empresa}` : ""}. Alguien te escribió por LinkedIn ofreciéndote algo.`;
  const cerca = turno >= maxTurnos - 1;
  return `${rol}

${es ? "Contexto de lo que te dicen:" : "Lo que te ofrecen:"}
${a.empresa}

TU DISPOSICIÓN HOY: ${GUIA_DISPOSICION[disposicion]}

Respondes EXACTAMENTE como lo harías tú por chat: natural, corto (máximo 40 palabras), en español con tildes y ñ SIEMPRE (aunque el hilo venga sin tildes: "sí", "qué", "más", "mañana", nunca sin tilde), sin emojis. NO eres un asistente: eres la persona real. No repitas lo que ya dijiste.
${cerca ? "Ya llevan varios mensajes: es momento de TOMAR una decisión coherente con tu disposición (aceptar, pedir que te contacten después, o declinar). No des más vueltas." : "Puedes preguntar o poner tu objeción antes de decidir."}

Escribe SOLO el mensaje que enviarías (el texto tal cual), sin comillas, sin JSON, sin explicaciones ni prefijos.`;
}

/** Respaldo coherente si la generación falla o sale corrupta (muy raro). */
function respaldoLead(disposicion: Disposicion, cerca: boolean): string {
  if (disposicion === "frio") return "Gracias, pero por ahora no me interesa.";
  if (disposicion === "ocupado")
    return "Me interesa, pero ando a tope estas semanas. ¿Me escribes más adelante?";
  if (cerca) {
    return disposicion === "interesado"
      ? "Dale, me interesa avanzar. ¿Cómo seguimos?"
      : "Suena bien, pero prefiero que me contactes más adelante.";
  }
  return disposicion === "interesado"
    ? "Me interesa. ¿Cómo funciona exactamente?"
    : "Puede servirme, pero tengo una duda: ¿qué lo diferencia de lo que ya hay?";
}

/** Limpia el texto del lead: quita comillas/prefijos y sanea. */
function limpiarMensajeLead(texto: string): string {
  let t = texto.trim();
  // Quita comillas o backticks que envuelvan todo el mensaje.
  t = t.replace(/^["'`]+/, "").replace(/["'`]+$/, "");
  // Quita una coma inicial suelta (residuo de saneado de guiones).
  t = t.replace(/^,\s*/, "");
  return sanitizarMensaje(t);
}

/** ¿El mensaje del lead es válido (no vacío, no corrupto, largo razonable)? */
function esMensajeLeadValido(t: string): boolean {
  if (!t || t.length < 3) return false;
  if (t.includes("{") || t.includes("}")) return false; // fuga de JSON
  const palabras = t.split(/\s+/);
  if (palabras.length < 2 || palabras.length > 70) return false;
  // Palabra "fusionada" anormalmente larga => señal de texto corrupto.
  if (palabras.some((p) => p.replace(/[.,;:!?¿¡()]/g, "").length > 22)) return false;
  return true;
}

/**
 * Genera el próximo mensaje de un LEAD simulado por IA, dado el hilo. Desde su
 * punto de vista, los mensajes del setter son "user" y los suyos "assistant".
 */
export async function generarMensajeLead(
  lead: Lead,
  a: Ajustes,
  historial: MensajeChat[],
  disposicion: Disposicion,
  turno: number,
  maxTurnos: number,
): Promise<string> {
  const messages = historial.map((m) => ({
    role: (m.de === "lead" ? "assistant" : "user") as "assistant" | "user",
    content: m.texto,
  }));
  if (messages.length === 0) {
    messages.push({ role: "user", content: lead.mensaje ?? "Hola" });
  }

  // Texto plano (no json_schema): es el modo más estable del modelo y evita la
  // "deriva" que corrompía el texto cuando el schema tenía un solo campo libre.
  const pedir = async (): Promise<string> => {
    const res = await anthropic().messages.create({
      model: MODELO,
      max_tokens: 300,
      thinking: { type: "disabled" },
      system: promptLeadSimulado(lead, a, disposicion, turno, maxTurnos),
      messages,
    });
    const r = res as unknown as { content: { type: string; text?: string }[] };
    const bloque = r.content.find((b) => b.type === "text");
    return limpiarMensajeLead(bloque?.text ?? "");
  };

  let msg = await pedir();
  if (!esMensajeLeadValido(msg)) msg = await pedir(); // un reintento
  if (!esMensajeLeadValido(msg)) {
    msg = respaldoLead(disposicion, turno >= maxTurnos - 1);
  }
  return msg;
}
