/**
 * Precios reales de los actores, leídos de `pricingInfos` en la API de Apify
 * el 2026-07-19:
 *   harvestapi/linkedin-profile-search  → PAY_PER_EVENT
 *       search-page   $0.10   (una página de resultados ~10 perfiles)
 *       full-profile  $0.004  (por perfil en modo Full)
 *   harvestapi/linkedin-profile-posts   → PRICE_PER_DATASET_ITEM
 *       post          $0.002  ($2 por cada 1.000 posts)
 */
export const PRECIO_PAGINA_BUSQUEDA = 0.1;
export const PRECIO_PERFIL_FULL = 0.004;
export const PRECIO_POST = 0.002;

const PERFILES_POR_PAGINA = 10;

export function estimarCosto(cantidad: number): number {
  const paginas = Math.ceil(cantidad / PERFILES_POR_PAGINA);
  return (
    paginas * PRECIO_PAGINA_BUSQUEDA +
    cantidad * PRECIO_PERFIL_FULL +
    cantidad * PRECIO_POST
  );
}

/**
 * Google Maps (compass/crawler-google-places): PAY_PER_EVENT. Medido en vivo
 * el 2026-07-24: una corrida de 2 lugares costó $0,0122 → ~$0,006 por negocio.
 * Redondeamos a $0,007 para que el estimado nunca se quede corto.
 */
export const PRECIO_NEGOCIO_MAPS = 0.007;

export function estimarCostoNegocios(cantidad: number): number {
  return Math.max(cantidad, 0) * PRECIO_NEGOCIO_MAPS;
}

/**
 * Instagram (apify/instagram-hashtag-scraper): PAY_PER_EVENT. Estimado
 * aproximado ~$0,003 por post; el gasto REAL se lee en vivo de Apify (Panel).
 */
export const PRECIO_POST_INSTAGRAM = 0.003;

export function estimarCostoInstagram(cantidad: number): number {
  return Math.max(cantidad, 0) * PRECIO_POST_INSTAGRAM;
}

export function formatearUsd(n: number): string {
  return `$${n.toFixed(2).replace(".", ",")}`;
}
