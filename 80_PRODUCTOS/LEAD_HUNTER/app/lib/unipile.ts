/**
 * Cliente real de Unipile (LinkedIn) — Capa 2.
 * Envía invitaciones y mensajes reales y lee respuestas. Ported de los scripts
 * ya validados en vivo (scripts/unipile-*.mjs).
 */
import { analizarTipoPerfil } from "./tipo-perfil";

const DSN = process.env.UNIPILE_DSN;
const TOKEN = process.env.UNIPILE_TOKEN;
const ACCOUNT_ID = process.env.UNIPILE_ACCOUNT_ID;
const base = DSN ? `https://${DSN}/api/v1` : "";

/** ¿Están las credenciales de Unipile listas? Si no, el sistema sigue en simulación. */
export function unipileConfigurado(): boolean {
  return Boolean(DSN && TOKEN && ACCOUNT_ID && !TOKEN.includes("PEGA_AQUI"));
}

function cab(extra?: Record<string, string>): Record<string, string> {
  return { "X-API-KEY": TOKEN as string, accept: "application/json", ...extra };
}

/** De una URL de perfil (…/in/xxxx) saca el identificador público; si no, lo usa tal cual. */
export function identificadorDe(perfilUrl: string): string {
  const m = perfilUrl.match(/\/in\/([^/?#]+)/);
  return m ? m[1] : perfilUrl.trim();
}

/** Un perfil de LinkedIn leído por Unipile (sin gastar créditos de Apify). */
export interface PerfilUnipile {
  providerId: string;
  identificador: string;
  nombre: string;
  headline: string;
  ubicacion: string;
  fotoUrl: string | null;
  /** true si ya son contactos: entonces se le puede escribir sin invitar. */
  yaConectados: boolean;
}

/** Trae el perfil completo. Es la misma llamada que resuelve el provider_id. */
/**
 * ¿La conexión con LinkedIn sigue en pie?
 *
 * Existe porque el sistema falla en silencio: cuando la cuenta se cae, un envío
 * rechazado se ve igual que un lead que no contestó, y el tablero sigue
 * mostrando actividad normal. Pasó dos veces la misma semana y en las dos nadie
 * se enteró hasta horas después.
 *
 * Es una pregunta barata (una llamada, sin efectos) que el vigilante hace en
 * cada ciclo. `null` = no se pudo determinar; no es lo mismo que "caído".
 */
export async function cuentaEnPie(): Promise<boolean | null> {
  if (!unipileConfigurado()) return null;
  try {
    const r = await fetch(`${base}/accounts/${ACCOUNT_ID}`, { headers: cab() });
    if (r.ok) {
      const d = (await r.json()) as { sources?: { status?: string }[] };
      const estados = d.sources?.map((s) => s.status) ?? [];
      // Sin `sources` no hay con qué juzgar, pero respondió: se da por viva.
      return estados.length === 0 || estados.some((e) => e === "OK");
    }
    // 401/403 (credenciales), 503 (sesión caída) → está caída de verdad.
    if ([401, 403, 429].includes(r.status) || r.status >= 500) return false;
    return null;
  } catch {
    return null; // red del servidor, no necesariamente la cuenta
  }
}

/**
 * ¿Ya aceptó la solicitud? Se pregunta SIN escribirle.
 *
 * Por qué existe: hasta ahora la aceptación se descubría intentando abrir el
 * chat — si el mensaje entraba, es que había aceptado. El problema es que para
 * enterarse había que escribir, así que el primer mensaje salía en el mismo
 * minuto en que la persona aceptaba. Nadie contesta así de rápido: el 05-08 un
 * lead aceptó 11:13 y le llegó el mensaje 11:14.
 *
 * Preguntando por el grado de conexión se puede saber que aceptó, esperar un
 * rato razonable y recién entonces escribir.
 *
 * Devuelve `null` si no se pudo averiguar (red caída, permisos): quien llama
 * decide, y el motor cae al método viejo en vez de quedarse trabado.
 */
export async function yaEsConexion(providerId: string): Promise<boolean | null> {
  if (!unipileConfigurado()) return null;
  try {
    const r = await fetch(
      `${base}/users/${encodeURIComponent(providerId)}?account_id=${ACCOUNT_ID}`,
      { headers: cab() },
    );
    if (!r.ok) return null;
    const p = (await r.json()) as {
      network_distance?: string;
      is_relationship?: boolean;
    };
    if (typeof p.is_relationship === "boolean") return p.is_relationship;
    if (p.network_distance) return p.network_distance === "DISTANCE_1";
    return null;
  } catch {
    return null;
  }
}

export async function traerPerfil(identificador: string): Promise<PerfilUnipile> {
  const r = await fetch(
    `${base}/users/${encodeURIComponent(identificador)}?account_id=${ACCOUNT_ID}`,
    { headers: cab() },
  );
  if (!r.ok) throw new Error(`Unipile perfil HTTP ${r.status}: ${await r.text()}`);
  const p = (await r.json()) as {
    provider_id?: string;
    id?: string;
    member_id?: string;
    public_identifier?: string;
    first_name?: string;
    last_name?: string;
    headline?: string;
    location?: string;
    profile_picture_url?: string;
    network_distance?: string;
    is_relationship?: boolean;
  };
  const providerId = p.provider_id ?? p.id ?? p.member_id;
  if (!providerId) throw new Error("El perfil no trajo provider_id.");

  // LinkedIn devuelve los nombres en minúscula: se capitalizan para que el
  // mensaje no empiece con "Hola pablo".
  const capitalizar = (s: string) =>
    s.replace(/\b\p{L}/gu, (c) => c.toUpperCase()).trim();

  return {
    providerId,
    identificador: p.public_identifier ?? identificador,
    nombre: capitalizar(`${p.first_name ?? ""} ${p.last_name ?? ""}`) || identificador,
    headline: p.headline?.trim() ?? "",
    ubicacion: p.location?.trim() ?? "",
    fotoUrl: p.profile_picture_url ?? null,
    yaConectados:
      Boolean(p.is_relationship) || p.network_distance === "FIRST_DEGREE",
  };
}

/** Resuelve el provider_id (id interno de LinkedIn) a partir de un perfil. */
export async function resolverProviderId(identificador: string): Promise<string> {
  return (await traerPerfil(identificador)).providerId;
}

/** Envía una invitación de conexión (con nota opcional). */
export async function enviarInvitacion(providerId: string, nota?: string): Promise<void> {
  const cuerpo: Record<string, string> = { account_id: ACCOUNT_ID as string, provider_id: providerId };
  if (nota) cuerpo.message = nota;
  const r = await fetch(`${base}/users/invite`, {
    method: "POST",
    headers: cab({ "content-type": "application/json" }),
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`Unipile invitar HTTP ${r.status}: ${await r.text()}`);
}

/** Envía el PRIMER mensaje (crea el chat). Devuelve el chat_id. */
export async function enviarMensajeNuevo(providerId: string, texto: string): Promise<string> {
  const form = new FormData();
  form.append("account_id", ACCOUNT_ID as string);
  form.append("attendees_ids", providerId);
  form.append("text", texto);
  form.append("linkedin[api]", "classic");
  const r = await fetch(`${base}/chats`, { method: "POST", headers: cab(), body: form });
  if (!r.ok) throw new Error(`Unipile chat HTTP ${r.status}: ${await r.text()}`);
  const d = (await r.json()) as { chat_id?: string };
  if (!d.chat_id) throw new Error("Unipile no devolvió chat_id.");
  return d.chat_id;
}

/** Envía un mensaje dentro de un chat existente. */
export async function enviarEnChat(chatId: string, texto: string): Promise<void> {
  const form = new FormData();
  form.append("text", texto);
  const r = await fetch(`${base}/chats/${chatId}/messages`, {
    method: "POST",
    headers: cab(),
    body: form,
  });
  if (!r.ok) throw new Error(`Unipile enviar HTTP ${r.status}: ${await r.text()}`);
}

/**
 * BÚSQUEDA DE PERSONAS EN LINKEDIN — vía Unipile, no vía Apify.
 *
 * Por qué existe: el actor de Apify que hacía esta búsqueda dejó de correr en
 * cuentas de plan gratuito (devuelve 0 resultados con la corrida en SUCCEEDED,
 * así que desde afuera parece "no hay nadie con esos filtros"). Unipile ya está
 * pagado, ya opera la cuenta de LinkedIn, y su búsqueda devuelve TODO lo que
 * necesitábamos —nombre, headline, ubicación, foto, url pública— más el
 * `provider_id`, que antes había que ir a buscar aparte para poder invitar.
 *
 * Lo único que se pierde frente a Apify son los últimos posts del perfil; el
 * generador de mensajes ya contempla ese caso y no inventa referencias.
 */

/**
 * CATÁLOGOS DE LINKEDIN — lo que se puede elegir de una lista en vez de escribir.
 *
 * LinkedIn tiene un vocabulario propio para ubicaciones, industrias y cargos, y
 * lo expone con autocompletado. Se usa para que en la app se SELECCIONE en vez
 * de escribir a mano: menos errores, y el texto es el que LinkedIn entiende.
 *
 * Verificado contra la API el 03-08 (qué sirve para qué):
 *  - LOCATION  → filtra de verdad, por ID.
 *  - INDUSTRY  → filtra de verdad, por ID. Es el filtro más cualificador que hay.
 *  - JOB_TITLE → el catálogo existe, pero **LinkedIn IGNORA el filtro de cargo**
 *    en la búsqueda normal (probado: pasar el id de "Jefe de comercio
 *    electrónico" devuelve una analista financiera y una gerente de RRHH). El
 *    filtro real vive en Sales Navigator, que esta cuenta no tiene (403
 *    feature_not_subscribed). Por eso el cargo se usa como PALABRA CLAVE: el
 *    título oficial de LinkedIn es mejor keyword que uno inventado.
 */
export type TipoCatalogo = "LOCATION" | "INDUSTRY" | "JOB_TITLE" | "COMPANY" | "SERVICE";

export interface OpcionCatalogo {
  id: string;
  title: string;
}

/** Autocompletado del catálogo de LinkedIn. Devuelve [] si falla: nunca rompe la búsqueda. */
export async function sugerencias(
  tipo: TipoCatalogo,
  texto: string,
): Promise<OpcionCatalogo[]> {
  const q = texto.trim();
  if (!q || !unipileConfigurado()) return [];
  try {
    const r = await fetch(
      `${base}/linkedin/search/parameters?account_id=${ACCOUNT_ID}&type=${tipo}&keywords=${encodeURIComponent(q)}`,
      { headers: cab() },
    );
    if (!r.ok) return [];
    const d = (await r.json()) as { items?: OpcionCatalogo[] };
    return (d.items ?? []).map((i) => ({ id: String(i.id), title: i.title }));
  } catch {
    return [];
  }
}

/** Resuelve el ID interno de LinkedIn de una ubicación ("Colombia" -> 100876405). */
export async function resolverUbicacion(nombre: string): Promise<string | null> {
  const t = nombre.trim();
  if (!t) return null;
  const r = await fetch(
    `${base}/linkedin/search/parameters?account_id=${ACCOUNT_ID}&type=LOCATION&keywords=${encodeURIComponent(t)}`,
    { headers: cab() },
  );
  if (!r.ok) return null;
  const d = (await r.json()) as { items?: { title: string; id: string }[] };
  const items = d.items ?? [];
  if (!items.length) return null;
  // Preferimos la coincidencia exacta de título; si no, la primera sugerencia.
  const exacta = items.find((i) => i.title.toLowerCase() === t.toLowerCase());
  return (exacta ?? items[0]).id;
}

export interface ParametrosBusquedaUnipile {
  keyword: string;
  titles: string[];
  country: string;
  regiones: string[];
  city: string;
  limit: number;
  /** IDs de industria de LinkedIn. Es el filtro que más sube la calidad del lead. */
  industrias?: string[];
  /** ID de ubicación ya resuelto desde la app (evita resolverlo por texto). */
  ubicacionId?: string;
}

/** Un perfil de la búsqueda, con la MISMA forma que devolvía Apify. */
export interface PersonaEncontrada {
  perfilUrl: string;
  nombre: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  fotoUrl: string | null;
  headline: string;
  /** id interno de LinkedIn: sirve para invitar sin tener que resolverlo después. */
  providerId: string;
  /** true si ya son contactos de primer grado (se les puede escribir directo). */
  yaConectados: boolean;
  /** true si el perfil es una cuenta de empresa y no una persona (ver `tipo-perfil.ts`). */
  esEmpresa: boolean;
  /** Por qué se lo clasificó así. Vacío si es una persona. */
  motivoEmpresa: string;
}

/**
 * Busca personas y pagina hasta juntar `limit`. La búsqueda de LinkedIn
 * devuelve de a ~10 por página, así que se pide con cursor hasta completar.
 */
export async function buscarPersonas(
  p: ParametrosBusquedaUnipile,
): Promise<PersonaEncontrada[]> {
  // Los cargos se suman a las palabras clave: la búsqueda clásica de LinkedIn
  // no tiene filtro de cargo propio, pero sí los pondera en el texto.
  const keywords = [p.keyword.trim(), ...p.titles.filter((t) => t.trim())]
    .join(" ")
    .trim();

  // La ubicación va por ID interno, no por nombre. Si la app ya la eligió de la
  // lista, viene resuelta; si no, se busca por texto: ciudad > departamento >
  // país. Sin resolver, se busca sin filtro geográfico (y se avisa en el log,
  // para no fallar en silencio).
  const nombreUbicacion = p.city?.trim() || p.regiones[0]?.trim() || p.country?.trim() || "";
  const idUbicacion =
    p.ubicacionId?.trim() ||
    (nombreUbicacion ? await resolverUbicacion(nombreUbicacion) : null);
  if (nombreUbicacion && !idUbicacion) {
    console.warn(`[unipile] no se pudo resolver la ubicación "${nombreUbicacion}"; se busca sin filtro geográfico`);
  }

  const out: PersonaEncontrada[] = [];
  let cursor: string | null = null;

  // Tope de páginas: evita quedarse dando vueltas si LinkedIn devuelve cursor
  // pero ya no trae nada nuevo.
  for (let pagina = 0; pagina < 20 && out.length < p.limit; pagina++) {
    const url =
      `${base}/linkedin/search?account_id=${ACCOUNT_ID}` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const cuerpo: Record<string, unknown> = {
      api: "classic",
      category: "people",
      keywords,
    };
    if (idUbicacion) cuerpo.location = [idUbicacion];
    // El filtro de industria SÍ lo aplica LinkedIn (a diferencia del de cargo).
    // Con "Comercio al por menor" los resultados pasan de una analista
    // financiera y una gerente de RRHH a gente de ecommerce y retail.
    if (p.industrias?.length) cuerpo.industry = p.industrias;

    const r = await fetch(url, {
      method: "POST",
      headers: cab({ "content-type": "application/json" }),
      body: JSON.stringify(cuerpo),
    });
    if (!r.ok) throw new Error(`Unipile búsqueda HTTP ${r.status}: ${await r.text()}`);

    const d = (await r.json()) as {
      items?: {
        id?: string;
        name?: string;
        headline?: string;
        location?: string;
        public_identifier?: string;
        public_profile_url?: string;
        profile_picture_url?: string;
        network_distance?: string;
      }[];
      cursor?: string | null;
    };

    const items = d.items ?? [];
    if (!items.length) break;

    for (const it of items) {
      if (out.length >= p.limit) break;
      const identificador = it.public_identifier ?? "";
      if (!it.id || !identificador) continue; // sin id no se puede invitar después
      const nombre = (it.name ?? identificador).trim();
      const headline = (it.headline ?? "").trim();
      // Buscando "agencia de marketing" en Colombia, 10 de 15 resultados son
      // cuentas de empresa. No se descartan (detrás hay una persona), pero el
      // mensaje tiene que saber a quién le está hablando.
      const tipo = analizarTipoPerfil(nombre, headline);
      out.push({
        providerId: it.id,
        nombre,
        // LinkedIn no separa cargo y empresa en la búsqueda: viene todo en el
        // headline. Se dejan vacíos a propósito en vez de adivinar partiendo
        // el texto — el generador de mensajes ya usa el headline completo.
        cargo: "",
        empresa: "",
        ubicacion: (it.location ?? "").trim(),
        fotoUrl: it.profile_picture_url ?? null,
        perfilUrl: `https://www.linkedin.com/in/${identificador}/`,
        headline,
        yaConectados: it.network_distance === "DISTANCE_1",
        esEmpresa: tipo.esEmpresa,
        motivoEmpresa: tipo.motivo,
      });
    }

    cursor = d.cursor ?? null;
    if (!cursor) break;
  }

  return out;
}

export interface MsgUnipile {
  id: string;
  de: "setter" | "lead";
  texto: string;
  ts: number;
  /** Id del adjunto de audio, si el mensaje fue una nota de voz. */
  audioId?: string;
  /** Duración de la nota de voz en milisegundos (la reporta LinkedIn). */
  audioMs?: number;
}

/** Trae los mensajes de un chat, normalizados y ordenados (viejo → nuevo). */
export async function traerMensajes(chatId: string): Promise<MsgUnipile[]> {
  const r = await fetch(`${base}/chats/${chatId}/messages`, { headers: cab() });
  if (!r.ok) throw new Error(`Unipile mensajes HTTP ${r.status}: ${await r.text()}`);
  const d = (await r.json()) as {
    items?: {
      id: string;
      is_sender: number;
      text?: string;
      timestamp: string;
      attachments?: { id: string; type?: string; voice_note?: boolean; duration?: number }[];
    }[];
  };
  return (d.items ?? [])
    .map((m) => {
      // Las notas de voz llegan con texto vacío y el audio en attachments.
      // Sin esto el mensaje parecía vacío y el agente no contestaba ese turno.
      const audio = m.attachments?.find((a) => a.voice_note || a.type === "audio");
      return {
        id: m.id,
        de: (m.is_sender ? "setter" : "lead") as "setter" | "lead",
        texto: m.text ?? "",
        ts: new Date(m.timestamp).getTime(),
        ...(audio ? { audioId: audio.id, audioMs: audio.duration } : {}),
      };
    })
    .sort((a, b) => a.ts - b.ts);
}

/** Descarga el binario de un adjunto (usado para las notas de voz). */
export async function traerAdjunto(mensajeId: string, adjuntoId: string): Promise<ArrayBuffer> {
  const r = await fetch(`${base}/messages/${mensajeId}/attachments/${adjuntoId}`, {
    headers: cab(),
  });
  if (!r.ok) throw new Error(`Unipile adjunto HTTP ${r.status}: ${await r.text()}`);
  return r.arrayBuffer();
}
