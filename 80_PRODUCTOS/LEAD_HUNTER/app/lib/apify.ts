import type { ParametrosBusqueda } from "./types";
import { ubicacionParaApify } from "./us-states";

const BASE = "https://api.apify.com/v2";

const ACTOR_BUSQUEDA = "harvestapi~linkedin-profile-search";
const ACTOR_POSTS = "harvestapi~linkedin-profile-posts";

/** Tope duro de resultados por búsqueda, pase lo que pase con el slider. */
export const LIMITE_DURO = 50;

export class ApifyLimiteError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ApifyLimiteError";
  }
}

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("Falta APIFY_TOKEN en .env.local");
  return t;
}

/**
 * Arma el input del actor `harvestapi/linkedin-profile-search`.
 *
 * Schema verificado el 2026-07-19 contra el build vigente del actor, vía
 *   GET https://api.apify.com/v2/acts/harvestapi~linkedin-profile-search/builds
 * (el `inputSchema` del último build es la fuente de verdad, no la página
 * pública). Campos usados y confirmados ahí:
 *   searchQuery        string   — la palabra clave / rubro
 *   currentJobTitles   string[] — filtro de cargos actuales
 *   locations          string[] — filtro de ubicación
 *   maxItems           integer  — tope de perfiles (protección de gasto)
 *   profileScraperMode string   — "Full" trae el perfil completo
 */
export function buildSearchInput(p: ParametrosBusqueda) {
  const limite = Math.min(Math.max(p.limit, 1), LIMITE_DURO);
  return {
    searchQuery: p.keyword.trim(),
    currentJobTitles: p.titles.filter((t) => t.trim()),
    locations: ubicacionParaApify(p.country, p.regiones, p.city),
    maxItems: limite,
    profileScraperMode: "Full" as const,
  };
}

/** Cuántos posts recientes traemos por perfil (enriquece la personalización). */
export const POSTS_POR_PERFIL = 2;

/**
 * Input del actor `harvestapi/linkedin-profile-posts`.
 * Mismo método de verificación, misma fecha. `maxPosts` es la protección de
 * gasto: pocos posts por perfil. 2 posts dan más contexto para personalizar
 * sin disparar el costo. Reposts y quotes van en false para que sean propios.
 */
export function buildPostsInput(perfilUrls: string[]) {
  return {
    targetUrls: perfilUrls,
    maxPosts: POSTS_POR_PERFIL,
    includeReposts: false,
    includeQuotePosts: false,
  };
}

async function correrActor(
  actor: string,
  input: unknown,
  timeoutSegs: number,
): Promise<unknown[]> {
  const url =
    `${BASE}/acts/${actor}/run-sync-get-dataset-items` +
    `?token=${token()}&timeout=${timeoutSegs}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const texto = await res.text();
    // El free tier de Apify devuelve 402/403 cuando se acaban los créditos
    // del mes. Lo traducimos a algo que la UI pueda mostrar sin romperse.
    const pareceLimite =
      res.status === 402 ||
      res.status === 403 ||
      /usage|limit|credit|quota|exceed/i.test(texto);
    if (pareceLimite) {
      throw new ApifyLimiteError(
        "Límite del plan gratuito de Apify alcanzado; se renueva el día 1.",
      );
    }
    throw new Error(`Apify ${actor} respondió ${res.status}: ${texto.slice(0, 300)}`);
  }

  const datos = await res.json();
  return Array.isArray(datos) ? datos : [];
}

/** Lee un campo probando varios nombres posibles (el actor varía por versión). */
function campo(obj: Record<string, unknown>, ...claves: string[]): string {
  for (const k of claves) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object") {
      const anidado = v as Record<string, unknown>;
      for (const sub of ["name", "title", "text", "linkedinUrl", "url"]) {
        const s = anidado[sub];
        if (typeof s === "string" && s.trim()) return s.trim();
      }
    }
  }
  return "";
}

export interface PerfilCrudo {
  perfilUrl: string;
  nombre: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  fotoUrl: string | null;
  headline: string;
}

/**
 * Mapeo verificado contra un item real del dataset (smoke test 2026-07-19).
 * La forma que devuelve el actor es:
 *   { firstName, lastName, linkedinUrl, headline, about,
 *     location: { linkedinText, parsed: { text, city, state } },
 *     currentPosition: [ { position, companyName, ... } ],
 *     photo }
 */
export function mapearPerfil(raw: Record<string, unknown>): PerfilCrudo | null {
  const perfilUrl = campo(raw, "linkedinUrl", "profileUrl", "url", "publicUrl");
  const nombre =
    campo(raw, "name", "fullName") ||
    [campo(raw, "firstName"), campo(raw, "lastName")].filter(Boolean).join(" ");
  if (!perfilUrl && !nombre) return null;

  // El puesto actual viene como array; el primero es el vigente.
  const puesto = Array.isArray(raw.currentPosition)
    ? (raw.currentPosition[0] as Record<string, unknown> | undefined)
    : undefined;
  const experiencia = Array.isArray(raw.experience)
    ? (raw.experience[0] as Record<string, unknown> | undefined)
    : undefined;
  const fuentePuesto = puesto ?? experiencia;

  // location es un objeto: preferimos el texto tal cual lo muestra LinkedIn.
  const loc = raw.location as Record<string, unknown> | undefined;
  const locParsed = loc?.parsed as Record<string, unknown> | undefined;
  const ubicacion =
    (typeof loc?.linkedinText === "string" && loc.linkedinText.trim()) ||
    (typeof locParsed?.text === "string" && locParsed.text.trim()) ||
    (typeof raw.location === "string" && raw.location.trim()) ||
    campo(raw, "locationName", "geoRegion", "addressWithCountry");

  return {
    perfilUrl,
    nombre: nombre || "Sin nombre",
    cargo:
      (fuentePuesto ? campo(fuentePuesto, "position", "title") : "") ||
      campo(raw, "position", "jobTitle", "title"),
    empresa:
      (fuentePuesto ? campo(fuentePuesto, "companyName", "company") : "") ||
      campo(raw, "companyName", "company", "currentCompany"),
    ubicacion: ubicacion || "",
    fotoUrl:
      campo(raw, "photo", "photoUrl", "profilePicture", "pictureUrl", "avatar") ||
      null,
    headline: campo(raw, "headline", "subtitle", "about", "summary"),
  };
}

export async function buscarPerfiles(
  p: ParametrosBusqueda,
): Promise<PerfilCrudo[]> {
  const crudos = await correrActor(ACTOR_BUSQUEDA, buildSearchInput(p), 180);
  if (process.env.LEADHUNTER_DEBUG && crudos[0]) {
    console.log("[apify] item de ejemplo:", JSON.stringify(crudos[0], null, 2).slice(0, 4000));
  }
  return crudos
    .map((r) => mapearPerfil(r as Record<string, unknown>))
    .filter((x): x is PerfilCrudo => x !== null);
}

/**
 * Trae el último post de cada perfil en UNA sola corrida (el actor acepta
 * varias `targetUrls` y `maxPosts` aplica por input). Si falla, seguimos sin
 * post: el mensaje se adapta.
 */
export async function traerUltimosPosts(
  perfilUrls: string[],
): Promise<Map<string, string>> {
  const porPerfil = new Map<string, string>();
  if (!perfilUrls.length) return porPerfil;

  let crudos: unknown[];
  try {
    crudos = await correrActor(ACTOR_POSTS, buildPostsInput(perfilUrls), 180);
  } catch (e) {
    if (e instanceof ApifyLimiteError) throw e;
    console.warn("[apify] posts falló, sigo sin posts:", (e as Error).message);
    return porPerfil;
  }

  if (process.env.LEADHUNTER_DEBUG && crudos[0]) {
    console.log("[apify] post de ejemplo:", JSON.stringify(crudos[0], null, 2).slice(0, 2500));
  }

  // Acumulamos hasta POSTS_POR_PERFIL posts por perfil y los unimos: más
  // contexto de la MISMA persona (sin cruzar redes ni datos personales).
  const acumulado = new Map<string, string[]>();
  for (const c of crudos) {
    const raw = c as Record<string, unknown>;
    const texto = campo(raw, "content", "text", "postContent", "description");
    if (!texto) continue;

    // OJO: `raw.linkedinUrl` es la URL DEL POST (/posts/...), no la del
    // perfil. La identidad del autor sale de `author`, y el slug es la clave
    // más estable (las URLs traen ?miniProfileUrn=... y variantes).
    const autor = raw.author as Record<string, unknown> | undefined;
    const slug =
      (autor && campo(autor, "publicIdentifier")) ||
      (autor ? slugDePerfil(campo(autor, "linkedinUrl", "profileUrl", "url")) : "") ||
      slugDePerfil(campo(raw, "profileUrl", "targetUrl", "authorUrl"));

    if (!slug) continue;
    const arr = acumulado.get(slug) ?? [];
    if (arr.length < POSTS_POR_PERFIL) arr.push(texto.slice(0, 700));
    acumulado.set(slug, arr);
  }
  for (const [slug, arr] of acumulado) porPerfil.set(slug, arr.join("\n---\n"));
  return porPerfil;
}

/**
 * Devuelve el slug del perfil: de "https://www.linkedin.com/in/jane-doe?x=1"
 * saca "jane-doe". Es la única parte estable entre lo que devuelven los dos
 * actores.
 */
export function slugDePerfil(u: string): string {
  if (!u) return "";
  const m = u.match(/\/in\/([^/?#]+)/i);
  if (m) return decodeURIComponent(m[1]).toLowerCase();
  return u
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("?")[0];
}
