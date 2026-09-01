// MOTOR DE CONVERSACIÓN + AGENDAMIENTO AUTOMÁTICO (Capa 2, test en vivo).
// El setter conversa, propone 2 fechas, pide hora + correo, y agenda SOLO en
// Cal.com (sin que el prospecto entre a ninguna página). Replica lib/setter.ts.
//
// Uso: node scripts/unipile-conversar.mjs <chat_id> "<nombre del lead>"
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
function cargarEnv() {
  const t = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const l of t.split(/\r?\n/)) {
    const s = l.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 0) continue;
    const k = s.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = s.slice(i + 1).trim();
  }
}
cargarEnv();

const { UNIPILE_DSN: DSN, UNIPILE_TOKEN: TOKEN } = process.env;
const CAL_KEY = process.env.CALCOM_API_KEY;
const CAL_EVENT = process.env.CALCOM_EVENT_TYPE_ID;
const TZ = process.env.CALCOM_TIMEZONE || "America/Bogota";
const base = `https://${DSN}/api/v1`;
const MODELO = "claude-sonnet-5";

const AJUSTES = {
  nombre: "Santiago",
  empresa:
    "Ayudo a agencias y consultores a automatizar su prospección y el seguimiento de leads con IA, para que no se les caiga ningún contacto y ahorren horas de trabajo manual.",
};

const [chatId, nombreLead] = process.argv.slice(2);
if (!chatId || !nombreLead) {
  console.error('Uso: node scripts/unipile-conversar.mjs <chat_id> "<nombre>"');
  process.exit(1);
}

// ── Fechas y horas REALES disponibles (consultadas en vivo a Cal.com) ──
async function disponibilidad() {
  const hoy = new Date();
  const start = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(hoy.getTime() + 86400000));
  const end = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(hoy.getTime() + 21 * 86400000));
  const r = await fetch(
    `https://api.cal.com/v2/slots?eventTypeId=${CAL_EVENT}&start=${start}&end=${end}&timeZone=${encodeURIComponent(TZ)}`,
    { headers: { Authorization: `Bearer ${CAL_KEY}`, "cal-api-version": "2024-09-04" } },
  );
  const data = (await r.json()).data ?? {};
  const dias = Object.keys(data).sort();
  const fechas = dias.slice(0, 5).map((iso) => {
    const d = new Date(`${iso}T12:00:00-05:00`);
    const legible = new Intl.DateTimeFormat("es-CO", {
      timeZone: TZ, weekday: "long", day: "numeric", month: "long",
    }).format(d);
    return { iso, legible };
  });
  // Ventana horaria (primer y último slot del primer día con cupos).
  const hhmm = (s) =>
    new Intl.DateTimeFormat("es-CO", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(s.start));
  const dia0 = dias[0] && data[dias[0]];
  const horaMin = dia0?.length ? hhmm(dia0[0]) : "09:00";
  const horaMax = dia0?.length ? hhmm(dia0[dia0.length - 1]) : "17:00";
  return { fechas, horaMin, horaMax };
}
const { fechas: FECHAS, horaMin: HORA_MIN, horaMax: HORA_MAX } = await disponibilidad();
const hoyLegible = new Intl.DateTimeFormat("es-CO", {
  timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
}).format(new Date());

function sanitizar(texto) {
  return texto
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function systemPrompt() {
  const listaFechas = FECHAS.map((f) => `${f.legible} (${f.iso})`).join(" · ");
  return `Eres ${AJUSTES.nombre}, conversando por LinkedIn con un lead que respondió a tu primer mensaje. Objetivo: entender su situación y, cuando tenga sentido, AGENDAR una llamada corta de 15 minutos. No fuerces la llamada: te la ganas resolviendo dudas primero.

SOBRE TI / TU OFERTA:
${AJUSTES.empresa}

SOBRE EL LEAD:
Nombre: ${nombreLead}

CÓMO ESCRIBES (que no parezca robot):
- Ortografía impecable: tildes, ñ y signos de apertura (¿ ¡) SIEMPRE, aunque el hilo venga sin ellos.
- Humano, cálido y cercano, profesional, cero vendedor de manual. Mensajes cortos, una idea por mensaje.
- PROHIBIDO: emojis, guiones largos (raya "—"), inventar casos, clientes o números.

CÓMO LLEVAS LA CONVERSACIÓN:
- DESCUBRE antes de vender: preguntas adaptadas a su negocio (qué procesos se repiten, si le hacen seguimiento a cada lead, cuánto tiempo pierden en tareas manuales).
- Si pregunta CÓMO le ayudas: resuélvele la duda aterrizada a su caso (qué gana: tiempo, menos errores, seguimiento que hoy se pierde). Recién ahí invita a la llamada.
- Si NO le interesa: agradece, deja la puerta abierta, no insistas (DESCARTAR).
- Si le interesa pero para después: reconócelo, sin presionar (POSPONER).

AGENDAMIENTO (MUY IMPORTANTE, NO uses ningún link):
Hoy es ${hoyLegible}. SOLO puedes ofrecer estas fechas disponibles: ${listaFechas}. El horario disponible cada día es de ${HORA_MIN} a ${HORA_MAX} (hora de Colombia). NUNCA ofrezcas ni aceptes fechas u horas fuera de esto; si el lead pide algo fuera de rango, ofrécele lo más cercano que sí exista.
1. Cuando muestre interés claro en la llamada, PROPÓN DOS de esas fechas concretas. Ej: "¿Te queda mejor el ${FECHAS[0]?.legible} o el ${FECHAS[1]?.legible}?".
2. Cuando ELIJA una, en el MISMO mensaje pregúntale DOS cosas: qué HORA le queda bien ese día (entre ${HORA_MIN} y ${HORA_MAX}), y a qué CORREO le mandas la información y la confirmación.
3. Solo cuando tengas FECHA + HORA + CORREO, llena el objeto "cita": fecha en formato YYYY-MM-DD (de la lista de arriba), hora en formato HH:MM de 24 horas, y correo. Mientras falte alguno, deja esos campos vacíos ("") y sigue pidiéndolo con naturalidad.
4. Cuando la cita esté completa, tu "respuesta" debe CONFIRMAR con calidez el día y la hora y decir que le llega la confirmación al correo. Eso es agendar (agendo=true). No pidas datos sensibles.

Devuelves SOLO JSON válido, sin markdown:
{"respuesta":"...","agendo":false,"escala":false,"descarta":false,"posponer":false,"nota":"...","cita":{"fecha":"","hora":"","correo":""}}
- respuesta: tu próximo mensaje, máximo 75 palabras.
- cita: fecha (YYYY-MM-DD), hora (HH:MM 24h), correo. Vacíos hasta tenerlos los tres.
- nota: 1-2 líneas internas con lo importante del lead. Solo lo que dijo; nunca inventes.`;
}

const ESQUEMA = {
  type: "object",
  properties: {
    respuesta: { type: "string" },
    agendo: { type: "boolean" },
    escala: { type: "boolean" },
    descarta: { type: "boolean" },
    posponer: { type: "boolean" },
    nota: { type: "string" },
    cita: {
      type: "object",
      properties: {
        fecha: { type: "string" },
        hora: { type: "string" },
        correo: { type: "string" },
      },
      required: ["fecha", "hora", "correo"],
      additionalProperties: false,
    },
  },
  required: ["respuesta", "agendo", "escala", "descarta", "posponer", "nota", "cita"],
  additionalProperties: false,
};

const anthropic = new Anthropic();

function parsear(texto) {
  const limpio = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const d = limpio.indexOf("{"), h = limpio.lastIndexOf("}");
  const obj = JSON.parse(d >= 0 && h > d ? limpio.slice(d, h + 1) : limpio);
  const cita = obj.cita ?? {};
  return {
    respuesta: sanitizar(String(obj.respuesta ?? "")),
    agendo: Boolean(obj.agendo),
    escala: Boolean(obj.escala),
    descarta: Boolean(obj.descarta),
    posponer: Boolean(obj.posponer),
    nota: String(obj.nota ?? "").trim(),
    cita: {
      fecha: String(cita.fecha ?? "").trim(),
      hora: String(cita.hora ?? "").trim(),
      correo: String(cita.correo ?? "").trim(),
    },
  };
}

async function setter(historial) {
  const messages = [];
  for (const m of historial) {
    const role = m.de === "setter" ? "assistant" : "user";
    const ult = messages[messages.length - 1];
    if (ult && ult.role === role) ult.content += "\n" + m.texto;
    else messages.push({ role, content: m.texto });
  }
  const res = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 1500,
    thinking: { type: "disabled" },
    system: systemPrompt(),
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    messages,
  });
  const bloque = res.content.find((b) => b.type === "text");
  if (!bloque?.text) throw new Error("Respuesta sin texto del modelo.");
  return parsear(bloque.text);
}

async function traerMensajes() {
  const r = await fetch(`${base}/chats/${chatId}/messages`, {
    headers: { "X-API-KEY": TOKEN, accept: "application/json" },
  });
  if (!r.ok) throw new Error(`GET messages HTTP ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const items = (data.items ?? []).slice().sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );
  return items.map((m) => ({ id: m.id, de: m.is_sender ? "setter" : "lead", texto: m.text ?? "" }));
}

async function enviar(texto) {
  const form = new FormData();
  form.append("text", texto);
  const r = await fetch(`${base}/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "X-API-KEY": TOKEN },
    body: form,
  });
  if (!r.ok) throw new Error(`POST message HTTP ${r.status}: ${await r.text()}`);
}

// Crea la reserva en Cal.com. fecha=YYYY-MM-DD, hora=HH:MM (hora local Bogotá).
async function crearReserva({ fecha, hora, correo }) {
  const startUtc = new Date(`${fecha}T${hora}:00-05:00`).toISOString(); // Bogotá = UTC-5 fijo
  const cuerpo = {
    start: startUtc,
    eventTypeId: Number(CAL_EVENT),
    attendee: { name: nombreLead, email: correo, timeZone: TZ, language: "es" },
  };
  const r = await fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CAL_KEY}`,
      "cal-api-version": "2024-08-13",
      "content-type": "application/json",
    },
    body: JSON.stringify(cuerpo),
  });
  const txt = await r.text();
  return { ok: r.ok, status: r.status, txt, startUtc };
}

// ── Bucle principal ──
console.log(`\n🤖 Motor MODOZAINT + agenda escuchando el chat con ${nombreLead} (${chatId})`);
console.log(`   Fechas que ofrecerá: ${FECHAS.map((f) => f.legible).join(", ")}`);
console.log("   Responde y agenda solo. Ctrl+C para detener.\n");

let ultimoRespondido = null;
let yaAgendado = false;
const finEn = Date.now() + 15 * 60 * 1000;

while (Date.now() < finEn) {
  try {
    const hist = await traerMensajes();
    const ultimo = hist[hist.length - 1];
    if (ultimo && ultimo.de === "lead" && ultimo.id !== ultimoRespondido) {
      console.log(`💬 ${nombreLead}: ${ultimo.texto}`);
      const r = await setter(hist);
      const citaCompleta = r.cita.fecha && r.cita.hora && r.cita.correo;

      let mensajeFinal = r.respuesta;
      let cerrar = null;

      if (citaCompleta && !yaAgendado) {
        console.log(`   📅 Intentando agendar: ${r.cita.fecha} ${r.cita.hora} → ${r.cita.correo}`);
        const reserva = await crearReserva(r.cita);
        if (reserva.ok) {
          yaAgendado = true;
          cerrar = `✅ AGENDÓ y se creó la cita en Cal.com (${reserva.startUtc})`;
          console.log(`   🎉 Reserva creada en Cal.com.`);
        } else {
          console.log(`   ⚠️ Cal.com rechazó (HTTP ${reserva.status}): ${reserva.txt}`);
          mensajeFinal =
            "Uy, parece que esa hora ya no quedó libre. ¿Te sirve otra hora ese mismo día, o prefieres otro de los dos días?";
        }
      }

      await enviar(mensajeFinal);
      ultimoRespondido = ultimo.id;
      console.log(`🤖 Setter: ${mensajeFinal}`);
      if (r.nota) console.log(`   (nota: ${r.nota})`);

      if (!cerrar && (r.descarta || r.escala || r.posponer)) {
        cerrar = r.descarta
          ? "🚫 DESCARTÓ (no le interesa)"
          : r.escala
          ? "🙋 ESCALÓ (necesita humano)"
          : "🕓 POSPUSO (interesado a futuro)";
      }
      if (cerrar) {
        console.log(`\n🏁 Fin de la conversación → ${cerrar}\n`);
        break;
      }
    }
  } catch (e) {
    console.error("⚠️ ", e.message);
  }
  await new Promise((res) => setTimeout(res, 10000));
}
console.log("Motor detenido.");
