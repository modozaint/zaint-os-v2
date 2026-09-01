import type { ParametrosNegocios } from "./types";
import { ApifyLimiteError } from "./apify";

const BASE = "https://api.apify.com/v2";
const ACTOR = "compass~crawler-google-places";

/** Tope duro de negocios por búsqueda (protección de gasto). */
export const LIMITE_NEGOCIOS = 50;

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("Falta APIFY_TOKEN en .env.local");
  return t;
}

/**
 * Input del actor `compass/crawler-google-places`.
 *
 * Schema verificado en vivo el 2026-07-24 contra el build vigente:
 *   searchStringsArray        string[] — el/los términos de búsqueda
 *   locationQuery             string   — ubicación (una por corrida)
 *   maxCrawledPlacesPerSearch integer  — tope de lugares
 *   skipClosedPlaces          boolean  — omitir cerrados
 *   website  enum: allPlaces | withWebsite | withoutWebsite
 *   placeMinimumStars         string   — rating mínimo ("", "two"..., o número)
 *   language                  string
 */
export function buildNegociosInput(p: ParametrosNegocios) {
  const limite = Math.min(Math.max(p.cantidad, 1), LIMITE_NEGOCIOS);
  const input: Record<string, unknown> = {
    searchStringsArray: [p.keyword.trim()],
    locationQuery: p.ubicacion.trim(),
    maxCrawledPlacesPerSearch: limite,
    skipClosedPlaces: p.omitirCerrados,
    website: p.soloConWeb ? "withWebsite" : "allPlaces",
    language: "es",
  };
  // placeMinimumStars acepta el número como string ("4"); "" o ausente = sin filtro.
  if (p.minEstrellas && p.minEstrellas > 0) {
    input.placeMinimumStars = String(p.minEstrellas);
  }
  return input;
}

/** Un negocio ya normalizado desde la salida del actor. */
export interface NegocioCrudo {
  nombre: string;
  categoria: string;
  telefono: string;
  web: string;
  direccion: string;
  ciudad: string;
  rating: number | null;
  reseñas: number | null;
  mapsUrl: string;
  cerrado: boolean;
}

function str(v: unknown): string {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Mapeo verificado contra un item real (smoke test 2026-07-24):
 *   { title, categoryName, phone, phoneUnformatted, website, address, city,
 *     totalScore, reviewsCount, url, permanentlyClosed }
 */
export function mapearNegocio(raw: Record<string, unknown>): NegocioCrudo | null {
  const nombre = str(raw.title);
  if (!nombre) return null;
  return {
    nombre,
    categoria: str(raw.categoryName),
    telefono: str(raw.phoneUnformatted) || str(raw.phone),
    web: str(raw.website),
    direccion: str(raw.address),
    ciudad: str(raw.city) || str(raw.address),
    rating: num(raw.totalScore),
    reseñas: num(raw.reviewsCount),
    mapsUrl: str(raw.url),
    cerrado: raw.permanentlyClosed === true,
  };
}

export async function buscarNegocios(
  p: ParametrosNegocios,
): Promise<NegocioCrudo[]> {
  const url =
    `${BASE}/acts/${ACTOR}/run-sync-get-dataset-items` +
    `?token=${token()}&timeout=180`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(buildNegociosInput(p)),
  });

  if (!res.ok) {
    const texto = await res.text();
    const pareceLimite =
      res.status === 402 ||
      res.status === 403 ||
      /usage|limit|credit|quota|exceed/i.test(texto);
    if (pareceLimite) {
      throw new ApifyLimiteError(
        "Límite del plan de Apify alcanzado; se renueva el día 1.",
      );
    }
    throw new Error(`Apify Google Maps respondió ${res.status}: ${texto.slice(0, 300)}`);
  }

  const datos = await res.json();
  if (!Array.isArray(datos)) {
    // El actor devuelve { error } cuando la ubicación no existe, etc.
    const msg =
      (datos as { error?: { message?: string } })?.error?.message ??
      "Google Maps no devolvió resultados (¿ubicación válida?).";
    throw new Error(msg);
  }

  return datos
    .map((r) => mapearNegocio(r as Record<string, unknown>))
    .filter((x): x is NegocioCrudo => x !== null);
}
