import { ApifyLimiteError } from "./apify";

const BASE = "https://api.apify.com/v2";
const ACTOR = "apify~instagram-hashtag-scraper";

/** Tope duro de posts por búsqueda (protección de gasto). */
export const LIMITE_INSTAGRAM = 50;

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("Falta APIFY_TOKEN en .env.local");
  return t;
}

/** Normaliza un texto a un hashtag válido: minúsculas, sin tildes ni símbolos. */
export function aHashtag(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // solo letras/números
}

/**
 * Input del actor `apify/instagram-hashtag-scraper`.
 * Schema verificado en vivo el 2026-07-26:
 *   hashtags     string[]  — los hashtags (sin #)
 *   resultsType  string    — "posts"
 *   resultsLimit integer   — tope de posts
 */
export function buildInstagramInput(hashtags: string[], cantidad: number) {
  const limite = Math.min(Math.max(cantidad, 1), LIMITE_INSTAGRAM);
  return {
    hashtags: hashtags.map(aHashtag).filter(Boolean),
    resultsType: "posts",
    resultsLimit: limite,
  };
}

/** Una cuenta de Instagram que publicó sobre el tema (un lead). */
export interface PerfilInstagram {
  username: string;
  nombre: string;
  caption: string;
  url: string;
  likes: number | null;
  comentarios: number | null;
}

function str(v: unknown): string {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Mapeo verificado contra un item real (smoke test 2026-07-26):
 *   { ownerUsername, ownerFullName, caption, likesCount, commentsCount, url }
 * Cada post es de una cuenta; el lead es la CUENTA (quien publica del tema).
 */
export function mapearPost(raw: Record<string, unknown>): PerfilInstagram | null {
  const username = str(raw.ownerUsername);
  if (!username) return null;
  return {
    username,
    nombre: str(raw.ownerFullName) || username,
    caption: str(raw.caption).slice(0, 600),
    url: `https://www.instagram.com/${username}/`,
    likes: num(raw.likesCount),
    comentarios: num(raw.commentsCount),
  };
}

/**
 * Busca cuentas que publicaron sobre uno o más hashtags. Deduplica por cuenta
 * (un lead por autor, con su post de mayor engagement como contexto).
 */
export async function buscarInstagram(
  hashtags: string[],
  cantidad: number,
): Promise<PerfilInstagram[]> {
  const url =
    `${BASE}/acts/${ACTOR}/run-sync-get-dataset-items` +
    `?token=${token()}&timeout=180`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildInstagramInput(hashtags, cantidad)),
  });

  if (!res.ok) {
    const texto = await res.text();
    const pareceLimite =
      res.status === 402 ||
      res.status === 403 ||
      /usage|limit|credit|quota|exceed/i.test(texto);
    if (pareceLimite) {
      throw new ApifyLimiteError("Límite del plan de Apify alcanzado; se renueva el día 1.");
    }
    throw new Error(`Apify Instagram respondió ${res.status}: ${texto.slice(0, 300)}`);
  }

  const datos = await res.json();
  if (!Array.isArray(datos)) {
    const msg =
      (datos as { error?: { message?: string } })?.error?.message ??
      "Instagram no devolvió resultados (¿hashtag válido?).";
    throw new Error(msg);
  }

  // Dedup por cuenta, quedándonos con el post de más likes (más contexto).
  const porCuenta = new Map<string, PerfilInstagram>();
  for (const r of datos) {
    const p = mapearPost(r as Record<string, unknown>);
    if (!p) continue;
    const prev = porCuenta.get(p.username);
    if (!prev || (p.likes ?? 0) > (prev.likes ?? 0)) porCuenta.set(p.username, p);
  }
  return [...porCuenta.values()];
}
