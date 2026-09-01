import Anthropic from "@anthropic-ai/sdk";
import type { Ajustes } from "./types";
import type { PerfilCrudo } from "./apify";
import type { NegocioCrudo } from "./gmaps";
import { analizarTipoPerfil } from "./tipo-perfil";

/** Cambiá esto si querés volver a otro Sonnet. */
export const MODELO = "claude-sonnet-5";

let cliente: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env.local");
  }
  cliente ??= new Anthropic();
  return cliente;
}

export interface AnalisisIA {
  resumen: string;
  porQueBuenLead: string;
  /** Mensaje de apertura del chat, cuando el lead YA aceptó la solicitud. */
  mensaje: string;
  /** Nota corta que viaja DENTRO de la solicitud de conexión (máx. 300). */
  notaInvitacion: string;
  /** Qué tan buen lead es para la oferta configurada. */
  encaje: Encaje;
  /** Por qué se le puso ese encaje, en una línea. */
  porQueEncaje: string;
}

/**
 * Qué tan bien encaja una persona con la oferta.
 *
 * Por qué existe: LinkedIn casi no tiene filtros reales — el de cargo lo
 * ignora, y solo aplica industria y ubicación. Buscando "ecommerce" en
 * Colombia entraron analistas junior, estudiantes y hasta alguien de talento
 * humano: ninguno decide una compra de este tipo. Filtrar mejor desde LinkedIn
 * no se puede, pero SÍ se puede juzgar cada perfil después de traerlo, que es
 * justo lo que la IA ya está haciendo al leerlo.
 */
export type Encaje = "alto" | "medio" | "bajo";

/**
 * Tope de la nota de invitación de LinkedIn. Se apunta a 280 para tener margen:
 * pasarse hace que Unipile rechace la invitación entera.
 */
export const MAX_NOTA = 280;

/**
 * Recorta la nota sin cortar una palabra por la mitad. Prefiere terminar en un
 * punto; si no hay, corta en el último espacio. Es la red de seguridad: el
 * prompt ya pide el largo, pero un mensaje de 305 caracteres tumbaría el envío.
 */
export function recortarNota(texto: string, max = MAX_NOTA): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  const cortado = t.slice(0, max);
  const punto = cortado.lastIndexOf(". ");
  if (punto > max * 0.6) return cortado.slice(0, punto + 1).trim();
  const espacio = cortado.lastIndexOf(" ");
  return (espacio > 0 ? cortado.slice(0, espacio) : cortado).trim();
}

const ESQUEMA = {
  type: "object",
  properties: {
    resumen: {
      type: "string",
      description: "1-2 lineas: a que se dedica esta persona",
    },
    porQueBuenLead: {
      type: "string",
      description: "1 linea: por que encaja como lead",
    },
    mensaje: {
      type: "string",
      description:
        "mensaje de apertura del chat, para cuando el lead YA aceptó la solicitud. Continúa la nota, no la repite",
    },
    notaInvitacion: {
      type: "string",
      description:
        "nota corta que viaja dentro de la solicitud de conexión. MÁXIMO 280 caracteres",
    },
    encaje: {
      type: "string",
      enum: ["alto", "medio", "bajo"],
      description: "qué tan buen lead es para ESTA oferta en concreto",
    },
    porQueEncaje: {
      type: "string",
      description: "1 linea: por que se le puso ese encaje. Concreto, sin rodeos",
    },
  },
  required: ["resumen", "porQueBuenLead", "mensaje", "notaInvitacion", "encaje", "porQueEncaje"],
  additionalProperties: false,
} as const;

function systemPrompt(a: Ajustes): string {
  const idioma =
    a.idioma === "en"
      ? "inglés natural (los leads son de Estados Unidos)"
      : "español natural y correcto del país/región del lead (lo sabés por su ubicación). Suena local y cercano, como alguien de ahí mismo, nunca extranjero. Ortografía impecable: tildes y ñ siempre";

  return `Eres un fundador que prospecta en LinkedIn. Analizas un perfil y escribes un mensaje de contacto.

TU EMPRESA / OFERTA:
${a.empresa}

TU NOMBRE: ${a.nombre}

Devuelves SOLO JSON válido, sin markdown, sin bloques de código, con exactamente estas claves:
{"resumen": "...", "porQueBuenLead": "...", "encaje": "...", "porQueEncaje": "...", "notaInvitacion": "...", "mensaje": "..."}

- resumen: 1-2 líneas sobre a qué se dedica realmente esta persona, deducido del perfil.
- porQueBuenLead: 1 línea sobre por qué encaja como cliente para tu oferta. Concreto, no genérico.
- encaje y porQueEncaje: tu juicio honesto sobre si vale la pena escribirle. Ver abajo.
- notaInvitacion y mensaje: son DOS momentos distintos de la MISMA conversación. Ver abajo.

EL ENCAJE — sé exigente, esto ahorra plata y protege la cuenta

LinkedIn casi no tiene filtros: la búsqueda trae a cualquiera que mencione la palabra clave. Tu trabajo es decir la verdad sobre si esta persona es un cliente posible para la oferta de arriba. No para "alguna" oferta: para ESTA.

- **alto** — Es quien decide o quien sufre el problema todos los días: dueño, fundador, socio, director, gerente o responsable del área. Si le resolvés el problema, puede comprar o empujar la compra.
- **medio** — Trabaja en el rubro y entiende el problema, pero no está claro que decida: un coordinador, un especialista, alguien de un equipo grande. Vale escribirle, sin apurar el cierre.
- **bajo** — No es cliente de esta oferta. Por ejemplo: estudiantes o perfiles en formación · gente de otra área que no tiene nada que ver (recursos humanos, contabilidad, legal, cuando la oferta es de ventas) · puestos junior o asistentes sin decisión ni presupuesto · perfiles que buscan empleo · agencias o consultoras que VENDEN lo mismo que vos · perfiles tan vacíos que no se puede saber a qué se dedican.

Sé exigente de verdad. Un lead malo cuesta una solicitud de LinkedIn (que son limitadas), gasta la reputación de la cuenta y ensucia el embudo. Ante la duda entre medio y bajo, poné bajo. Nadie se enoja porque no le escribiste.

- porQueEncaje: una línea, concreta. "Dueño de una tienda online, sufre el problema directo" o "Estudiante de marketing, sin operación propia ni decisión de compra".

Aunque el encaje sea bajo, escribí igual la nota y el mensaje: quien opera decide si los usa o los descarta.

LOS DOS MOMENTOS (esto es lo más importante):

1. **notaInvitacion** — viaja DENTRO de la solicitud de conexión. Es lo primero que ve, cuando todavía no te conoce y solo decide si te acepta.
   - **MÁXIMO 280 CARACTERES, contando espacios.** Es un límite duro de LinkedIn: si te pasás, la solicitud no sale. Contá antes de responder.
   - Su único objetivo es que ACEPTE. No es el pitch.
   - Estructura: saludo + UNA línea concreta que demuestre que miraste su perfil + en una frase por qué le escribís. Nada más.
   - **NO pidas la llamada acá.** Nadie agenda con un desconocido que todavía no aceptó.
   - Sin firma, sin emojis.

2. **mensaje** — sale recién cuando ACEPTÓ la solicitud, ya como primer mensaje del chat.
   - **LinkedIn deja la nota visible arriba, en el mismo hilo.** El lead la tiene delante mientras lee esto. Así que nada de "como te comentaba", "te decía", "como mencioné": queda ridículo referirse a un texto que está ahí a la vista, y suena a que no te acordás de lo que escribiste hace un rato.
   - **Prohibido repetir la nota**: ni el saludo, ni la observación de su perfil, ni las mismas palabras. Esto no resume lo anterior: lo CONTINÚA.
   - Arrancá agradeciendo la conexión en corto y **entrá directo a algo NUEVO**: el problema concreto que suele tener alguien en su posición, o cómo se ve resuelto. Información que la nota no daba.
   - Cerrá con una pregunta abierta para una llamada.
   - Máximo 90 palabras.

Leídos uno detrás del otro —que es exactamente como los va a leer, uno debajo del otro en el mismo hilo— tienen que sonar a la misma persona que retoma y avanza, no a dos plantillas ni a alguien repitiéndose.

REGLAS PARA LOS DOS TEXTOS (obligatorias, sin excepción):
1. Idioma: ${idioma}.
2. Tono humano, cálido y directo, como si lo escribiera un fundador. Nunca como un bot ni como un vendedor.
3. Ortografía impecable en español: usa tildes, ñ y signos de apertura (¿ ¡) correctamente. Ejemplos: "más", "está", "mañana", "gustaría", "estratégico", "propósito", nunca sin tilde. Un mensaje con errores o sin tildes se ve robótico o extranjero, y eso arruina todo.
4. PROHIBIDO: emojis y guiones largos (el carácter raya "—").
4b. NUNCA firmes el mensaje ni lo cierres con "Saludos, <nombre>", "Atentamente" ni nada parecido: es un chat, no un correo, y la otra persona ya ve tu nombre y tu foto arriba. Firmar es lo que más delata a un bot.
5. PROHIBIDO abrir con fórmulas vacías tipo "Espero que este mensaje te encuentre bien".
6. El SALUDO va en la **notaInvitacion** (es el primer contacto), y depende de a QUÉ tipo de perfil le escribes (te lo indica el campo "Tipo de perfil"):
   - PERSONA: saluda por su nombre de pila, a secas ("Hola Daniel,").
   - CUENTA DE EMPRESA: el nombre del perfil es el de un negocio, NO el de una persona. Saludar "Hola 3 Studio Agency" o, peor, "Hola Agencia" delata al instante que es automático. Saluda al equipo o a la marca por su nombre tal como se llama, y pregunta con naturalidad con quién tienes el gusto ("Hola, les escribo por acá. ¿Con quién tengo el gusto?"). Nunca uses el nombre de la marca como si fuera un nombre de pila, y nunca inventes el nombre de quien la administra: todavía no lo sabes.
   En el **mensaje** NO vuelvas a saludar así: ya se saludaron. Entra directo, agradeciendo la conexión.
6b. La línea específica del perfil (el post reciente, su empresa, su rol) va en la **notaInvitacion**: es la que prueba que no es masivo y hace que te acepte. En el **mensaje** podés retomarla, pero con otras palabras y aportando algo nuevo, jamás copiada. Con una cuenta de empresa, háblale al negocio ("lo que están haciendo con...", "su trabajo en..."), no a un individuo.
7. Los dos textos los escribe ${a.nombre}, pero SIN firmarlos (regla 4b).
8. Largos: notaInvitacion ≤ 280 caracteres · mensaje ≤ 90 palabras.

Nunca inventes datos que no estén en el perfil. Si el perfil trae poca información, sé más general pero nunca falso.`;
}

function perfilComoTexto(p: PerfilCrudo, ultimoPost: string | null): string {
  // El tipo de perfil se recalcula acá (y no se confía en un campo previo) para
  // que valga igual venga de donde venga el perfil: búsqueda nueva, lead
  // reanalizado o mensaje regenerado a mano.
  const tipo = analizarTipoPerfil(p.nombre, p.headline);
  const lineas = [
    `Nombre: ${p.nombre}`,
    `Tipo de perfil: ${
      tipo.esEmpresa
        ? `CUENTA DE EMPRESA (señales: ${tipo.motivo}). "${p.nombre}" es el nombre del negocio, no de una persona. Detrás lo administra alguien cuyo nombre NO sabes todavía.`
        : "PERSONA (tiene nombre y apellido propios)."
    }`,
    p.cargo && `Cargo: ${p.cargo}`,
    p.empresa && `Empresa: ${p.empresa}`,
    p.ubicacion && `Ubicacion: ${p.ubicacion}`,
    p.headline && `Headline: ${p.headline}`,
    ultimoPost
      ? `Publicaciones recientes (de esta MISMA persona): """${ultimoPost}"""`
      : "Publicaciones recientes: no disponibles (no referencies ningun post)",
  ].filter(Boolean);
  return lineas.join("\n");
}

/**
 * Red de seguridad determinística. El prompt ya prohíbe todo esto, pero el
 * mensaje es lo que se ve en cámara: no lo dejamos librado al modelo.
 */
export function sanitizarMensaje(texto: string): string {
  return texto
    // emojis y pictogramas (señal de bot)
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
      "",
    )
    // guiones largos y medios -> coma (el "—" es una señal típica de IA)
    .replace(/\s*[—–]\s*/g, ", ")
    // OJO: ya NO quitamos tildes, ñ ni signos de apertura (¿ ¡): son
    // ortografía correcta del español y su ausencia se ve robótica/extranjera.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parsearJson(texto: string): AnalisisIA {
  // Aunque pedimos structured output, quitamos fences por las dudas.
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const desde = limpio.indexOf("{");
  const hasta = limpio.lastIndexOf("}");
  const candidato = desde >= 0 && hasta > desde ? limpio.slice(desde, hasta + 1) : limpio;
  const obj = JSON.parse(candidato) as Partial<AnalisisIA>;
  const nota = sanitizarMensaje(String(obj.notaInvitacion ?? ""));
  if (nota.length > MAX_NOTA) {
    console.warn(
      `[claude] la nota vino con ${nota.length} caracteres (tope ${MAX_NOTA}); se recorta`,
    );
  }
  return {
    resumen: String(obj.resumen ?? "").trim(),
    porQueBuenLead: String(obj.porQueBuenLead ?? "").trim(),
    mensaje: sanitizarMensaje(String(obj.mensaje ?? "")),
    notaInvitacion: recortarNota(nota),
    encaje: normalizarEncaje(obj.encaje),
    porQueEncaje: String(obj.porQueEncaje ?? "").trim(),
  };
}

/** Techo de salida. Con thinking apagado, la respuesta entra sobrada. */
const MAX_TOKENS = 2000;

/** Un encaje que no venga de la lista se trata como "medio": ni se descarta ni se prioriza. */
function normalizarEncaje(v: unknown): Encaje {
  return v === "alto" || v === "bajo" ? v : "medio";
}

type RespuestaMensajes = Awaited<
  ReturnType<Anthropic["messages"]["create"]>
> & { content: { type: string; text?: string }[]; stop_reason: string | null };

/** Centraliza la lectura: refusal, truncado y parseo, en ese orden. */
function leerRespuesta(res: unknown): AnalisisIA {
  const r = res as RespuestaMensajes;

  if (r.stop_reason === "refusal") {
    throw new Error("El modelo declinó analizar este perfil.");
  }
  if (r.stop_reason === "max_tokens") {
    // Sin esto, el JSON truncado explota más abajo con un error críptico.
    throw new Error(
      "La respuesta se truncó por max_tokens; subí MAX_TOKENS en lib/claude.ts.",
    );
  }

  const bloque = r.content.find((b) => b.type === "text");
  if (!bloque?.text) throw new Error("Respuesta sin texto del modelo.");
  return parsearJson(bloque.text);
}

export async function analizarPerfil(
  perfil: PerfilCrudo,
  ultimoPost: string | null,
  ajustes: Ajustes,
): Promise<AnalisisIA> {
  const res = await anthropic().messages.create({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    // Sonnet 5 corre thinking adaptativo si se omite este campo, y el
    // razonamiento consume el mismo presupuesto que la respuesta: eso truncaba
    // el JSON a mitad de camino. Esta tarea es extracción estructurada y no
    // necesita thinking, así que lo apagamos (también baja mucho la latencia).
    thinking: { type: "disabled" },
    system: systemPrompt(ajustes),
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    messages: [
      {
        role: "user",
        content: `Analiza este perfil y escribi el mensaje:\n\n${perfilComoTexto(perfil, ultimoPost)}`,
      },
    ],
  });

  return leerRespuesta(res);
}

/** Regenera solo el mensaje, pidiendo explícitamente otro ángulo. */
export async function regenerarMensaje(
  perfil: PerfilCrudo,
  ultimoPost: string | null,
  ajustes: Ajustes,
  mensajeAnterior: string,
): Promise<string> {
  const res = await anthropic().messages.create({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    thinking: { type: "disabled" },
    system: systemPrompt(ajustes),
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    messages: [
      {
        role: "user",
        content: `Analiza este perfil y escribi el mensaje:\n\n${perfilComoTexto(perfil, ultimoPost)}

Ya escribiste antes este mensaje:
"""${mensajeAnterior}"""

Escribi uno NUEVO y claramente distinto: otro angulo de entrada, otra frase de apertura, otra forma de cerrar. Mismas reglas de siempre.`,
      },
    ],
  });

  return leerRespuesta(res).mensaje;
}

// ─── Análisis de NEGOCIOS locales (Google Maps) ─────────────────────────────

function systemPromptNegocio(a: Ajustes): string {
  return `Eres ${a.nombre}, prospectando NEGOCIOS locales para ofrecerles un servicio. Analizas la ficha de un negocio (de Google Maps) y escribes un primer mensaje de contacto.

TU EMPRESA / OFERTA:
${a.empresa}

Devuelves SOLO JSON válido, sin markdown, con estas claves:
{"resumen": "...", "porQueBuenLead": "...", "mensaje": "..."}

- resumen: 1-2 líneas sobre qué es este negocio (rubro, tamaño aparente por reseñas/rating).
- porQueBuenLead: 1 línea concreta de por qué encaja para TU oferta (ej. tiene web pero seguro pierde consultas fuera de horario; muchas reseñas = mucho volumen que atender).
- mensaje: el mensaje de contacto para el dueño/encargado.

REGLAS DEL MENSAJE (obligatorias):
1. Español natural y local de la ciudad del negocio. Ortografía impecable: tildes, ñ y signos (¿ ¡) SIEMPRE ("más", "está", "atención", nunca sin tilde).
2. Tono humano y directo, de alguien que de verdad miró el negocio. Nada de bot ni de vendedor de manual.
3. PROHIBIDO: emojis, guiones largos (raya "—"), e inventar datos (reseñas, cifras, premios) que no estén en la ficha.
3b. NUNCA firmes el mensaje ni lo cierres con "Saludos, <nombre>", "Atentamente" ni nada parecido: es un chat, no un correo, y la otra persona ya ve tu nombre y tu foto arriba. Firmar es lo que más delata a un bot.
4. Estructura: saludo al negocio por su nombre; UNA línea específica que demuestre que lo miraste (su rubro, su zona, que tiene muchas reseñas); UNA línea de cómo tu oferta le ayuda a un negocio así; cierre con pregunta abierta.
5. Máximo 80 palabras. Firmado por ${a.nombre}.

Si la ficha trae poca info, sé más general pero nunca falso.`;
}

function negocioComoTexto(n: NegocioCrudo): string {
  const lineas = [
    `Negocio: ${n.nombre}`,
    n.categoria && `Rubro: ${n.categoria}`,
    n.ciudad && `Zona: ${n.ciudad}`,
    n.rating != null && `Rating: ${n.rating} (${n.reseñas ?? 0} reseñas)`,
    n.web ? `Tiene web: ${n.web}` : "No figura web",
    n.telefono && `Teléfono: ${n.telefono}`,
  ].filter(Boolean);
  return lineas.join("\n");
}

export async function analizarNegocio(
  negocio: NegocioCrudo,
  ajustes: Ajustes,
): Promise<AnalisisIA> {
  const res = await anthropic().messages.create({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    thinking: { type: "disabled" },
    system: systemPromptNegocio(ajustes),
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    messages: [
      {
        role: "user",
        content: `Analiza este negocio y escribe el mensaje:\n\n${negocioComoTexto(negocio)}`,
      },
    ],
  });
  return leerRespuesta(res);
}

function systemPromptInstagram(a: Ajustes): string {
  return `Eres ${a.nombre}, prospectando por Instagram. Analizas una CUENTA que publicó sobre un tema y escribes un primer mensaje directo (DM) de contacto.

TU EMPRESA / OFERTA:
${a.empresa}

Devuelves SOLO JSON válido, sin markdown, con estas claves:
{"resumen": "...", "porQueBuenLead": "...", "mensaje": "..."}

- resumen: 1-2 líneas sobre qué es esta cuenta (marca, creador, negocio) deducido de su nombre y su post.
- porQueBuenLead: 1 línea concreta de por qué encaja para TU oferta, según lo que publica.
- mensaje: el DM de contacto.

REGLAS DEL MENSAJE (obligatorias):
1. Es un DM de Instagram: cálido, breve y natural, como una persona real. Español local, ortografía impecable (tildes, ñ, ¿ ¡ SIEMPRE).
2. Referencia algo CONCRETO de lo que publicó (su post/tema), para que se note que lo miraste.
3. PROHIBIDO: emojis, guiones largos (raya "—"), e inventar datos que no estén en su info.
3b. NUNCA firmes el mensaje ni lo cierres con "Saludos, <nombre>", "Atentamente" ni nada parecido: es un chat, no un correo, y la otra persona ya ve tu nombre y tu foto arriba. Firmar es lo que más delata a un bot.
4. Estructura: saludo por su nombre o cuenta; una línea sobre su contenido/tema; una línea de cómo tu oferta le ayuda; cierre con pregunta abierta.
5. Máximo 70 palabras. Firmado por ${a.nombre}.

Si trae poca info, sé más general pero nunca falso.`;
}

export async function analizarInstagram(
  perfil: { nombre: string; username: string; caption: string },
  ajustes: Ajustes,
): Promise<AnalisisIA> {
  const texto = [
    `Cuenta: @${perfil.username}`,
    perfil.nombre && `Nombre: ${perfil.nombre}`,
    perfil.caption ? `Publicó: """${perfil.caption}"""` : "Sin texto en el post",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await anthropic().messages.create({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    thinking: { type: "disabled" },
    system: systemPromptInstagram(ajustes),
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    messages: [
      { role: "user", content: `Analiza esta cuenta y escribe el DM:\n\n${texto}` },
    ],
  });
  return leerRespuesta(res);
}

/** Corre el análisis en paralelo con un tope de concurrencia. */
export async function analizarEnLote<T>(
  items: T[],
  concurrencia: number,
  fn: (item: T, indice: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const trabajadores = Array.from(
    { length: Math.min(concurrencia, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        await fn(items[i], i);
      }
    },
  );
  await Promise.all(trabajadores);
}
