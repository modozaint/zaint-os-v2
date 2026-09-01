import Anthropic from "@anthropic-ai/sdk";

/**
 * ¿ESTO SE PUEDE MANDAR A UN LEAD REAL?
 *
 * Por qué existe: el 31-07 se puso un freno para no enviar mensajes vacíos, pero
 * solo miraba que hubiera 12 caracteres y 8 letras. El 03-08, revisando un chat
 * real, aparecieron dos cosas que ese freno deja pasar:
 *
 *   "como fireso? Con conversmos ya que había las de gesticular, vamos a verlas junta"
 *   ","
 *
 * La coma la atrapa el largo mínimo. La primera no: tiene letras de sobra y
 * estructura de frase. Está compuesta de palabras que no existen ("fireso",
 * "conversmos") y termina cortada. Para el lead es evidente que del otro lado
 * hay un robot roto, y ahí se acabó la conversación.
 *
 * Dos capas, a propósito:
 *  1. Determinista: gratis e instantánea, atrapa lo estructural (vacío, corto,
 *     letras repetidas, grupos de consonantes imposibles en español).
 *  2. El modelo como segundo par de ojos: lo único que detecta una palabra
 *     inventada pero pronunciable, o una frase que no significa nada.
 *
 * Cuando algo no pasa, NO se envía: se escala a un humano. Es preferible que
 * una persona espere una hora a que reciba un mensaje que parece de un bot roto.
 */

export interface Veredicto {
  apto: boolean;
  /** Qué falló, en una frase. Va al motivo de escalado, así que se lee. */
  motivo: string;
}

const MINIMO_CARACTERES = 12;
const MINIMO_LETRAS = 8;

/**
 * Grupos de 3+ consonantes seguidas que el español no forma dentro de una
 * palabra. Se excluyen los dígrafos y los grupos legítimos (br, cl, tr, ns, bs,
 * st...) mirando solo secuencias que no terminan en l/r y no son conocidas.
 * "conversmos" cae acá por "rsm".
 */
function tieneGrupoConsonanticoImposible(palabra: string): boolean {
  const p = palabra
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ch|ll|rr|qu|gu/g, "_"); // dígrafos: cuentan como una sola pieza
  const grupos = p.match(/[bcdfghjklmnpqrstvwxyz]{3,}/g) ?? [];
  const validos = new Set([
    "nstr", "str", "ntr", "mbr", "ndr", "nfl", "ngl", "scr", "spl", "spr",
    "mpl", "mpr", "nqu", "bstr", "nsc", "nsf", "nst", "bst", "xpl", "xtr",
    "nch", "rch", "lch", "nfr", "ngr", "ndj",
  ]);
  return grupos.some((g) => !validos.has(g));
}

/**
 * ¿Es un correo, una URL, un dominio o algo con números? No es una palabra del
 * idioma y no se puede juzgar con reglas de ortografía: hay que dejarlo pasar
 * tal cual. Un correo sin la arroba y sin los puntos parece texto corrupto.
 */
function esTecnico(token: string): boolean {
  return (
    /[@/\\_]/.test(token) || // correo, ruta, URL
    /\p{L}\.\p{L}/u.test(token) || // dominio: algo.algo
    /\d/.test(token) // horas, fechas, cifras, nombres con número
  );
}

/** Letra repetida tres veces ("aaa") o sílaba inicial duplicada ("pupuedes"). */
function tieneRepeticionRara(palabra: string): boolean {
  if (/(.)\1{2,}/i.test(palabra)) return true;
  const p = palabra.toLowerCase();
  if (p.length >= 6) {
    const silaba = p.slice(0, 2);
    if (p.slice(2, 4) === silaba) return true;
  }
  return false;
}

/**
 * Capa 1: lo estructural. No juzga el sentido, solo que el texto tenga forma de
 * mensaje escrito por una persona.
 */
export function revisarEstructura(texto: string): Veredicto {
  const t = (texto ?? "").trim();

  if (!t) return { apto: false, motivo: "el agente no devolvió ningún texto" };
  if (t.length < MINIMO_CARACTERES) {
    return { apto: false, motivo: `el mensaje tiene ${t.length} caracteres, demasiado corto para enviarlo` };
  }

  const letras = (t.match(/\p{L}/gu) ?? []).length;
  if (letras < MINIMO_LETRAS) {
    return { apto: false, motivo: "el mensaje es casi todo signos, no texto" };
  }

  const palabras = t.split(/\s+/).filter((p) => /\p{L}/u.test(p));
  if (palabras.length < 4) {
    return { apto: false, motivo: "el mensaje tiene menos de 4 palabras" };
  }

  const sospechosas = palabras
    // Correos, URLs y dominios NO son palabras: al quitarles la arroba y los
    // puntos quedan como un churro de consonantes y el detector los toma por
    // texto roto. El 04-08 eso bloqueó la confirmación de una cita real, con el
    // lead esperando: "wellnessbarber360@gmail.com" se leyó como palabra mal
    // escrita y el mensaje no salió.
    .filter((p) => !esTecnico(p))
    .map((p) => p.replace(/[^\p{L}]/gu, ""))
    .filter((p) => p.length >= 5)
    .filter((p) => tieneRepeticionRara(p) || tieneGrupoConsonanticoImposible(p));

  if (sospechosas.length) {
    return {
      apto: false,
      motivo: `el mensaje trae palabras mal escritas (${sospechosas.slice(0, 3).join(", ")})`,
    };
  }

  return { apto: true, motivo: "" };
}

/**
 * Capa 2: el modelo como corrector. Se usa un modelo chico a propósito — es un
 * juicio simple y va en el camino crítico de cada respuesta.
 */
const MODELO_REVISOR = "claude-haiku-4-5-20251001";

let cliente: Anthropic | null = null;
function anthropic(): Anthropic {
  cliente ??= new Anthropic();
  return cliente;
}

export async function revisarConModelo(texto: string): Promise<Veredicto> {
  if (!process.env.ANTHROPIC_API_KEY) return { apto: true, motivo: "" };

  try {
    const res = await anthropic().messages.create({
      model: MODELO_REVISOR,
      max_tokens: 150,
      system: `Revisas mensajes antes de que se envíen por LinkedIn a un cliente potencial real. Tu único trabajo es detectar si el texto está ROTO.

Marca apto=false SOLO si pasa alguna de estas cosas:
- Tiene palabras que no existen en español o están mal escritas ("fireso", "conversmos", "pupuedes").
- La frase no significa nada o mezcla ideas sin sentido.
- Queda cortada a mitad de una idea.
- Es solo signos, una sola palabra suelta o un fragmento.

NO lo marques por estilo, por tono, por ser corto, informal o directo, ni porque falte contexto de la conversación: solo por estar ROTO.
Los correos, enlaces, horas y fechas NO son errores de ortografía: déjalos pasar tal cual, aunque se vean raros.

Devuelves SOLO JSON: {"apto": true/false, "motivo": "..."}
El motivo va vacío si apto=true, y si es false explica en una frase qué está mal.`,
      messages: [{ role: "user", content: `Mensaje a revisar:\n"""${texto}"""` }],
    });

    const bloque = (res.content as { type: string; text?: string }[]).find(
      (b) => b.type === "text",
    );
    const crudo = (bloque?.text ?? "").trim();
    const desde = crudo.indexOf("{");
    const hasta = crudo.lastIndexOf("}");
    if (desde < 0 || hasta <= desde) return { apto: true, motivo: "" };

    const obj = JSON.parse(crudo.slice(desde, hasta + 1)) as Partial<Veredicto>;
    return {
      apto: obj.apto !== false,
      motivo: String(obj.motivo ?? "").trim(),
    };
  } catch (e) {
    // Si el revisor falla (red, cuota), NO se bloquea la conversación por eso:
    // la capa 1 ya filtró lo estructural. Se deja constancia y sigue.
    console.warn("[calidad] el revisor no pudo opinar:", (e as Error).message);
    return { apto: true, motivo: "" };
  }
}

/** Las dos capas. La barata primero: si ya falla, no se gasta una llamada. */
export async function esEnviable(texto: string): Promise<Veredicto> {
  const estructura = revisarEstructura(texto);
  if (!estructura.apto) return estructura;
  return revisarConModelo(texto);
}
