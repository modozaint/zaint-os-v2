/**
 * Gasto REAL de Apify, leído en vivo (no estimado). Fuente:
 *   GET /v2/users/me/limits  →  data.current.monthlyUsageUsd  (gastado el ciclo)
 *                               data.limits.maxMonthlyUsageUsd (tope del plan)
 * Verificado en vivo el 2026-07-24.
 */

import { obtenerPresupuestoTope } from "./store";

const BASE = "https://api.apify.com/v2";

export interface UsoApify {
  /** USD gastados en el ciclo mensual actual. */
  usadoUsd: number;
  /** Tope del plan (free tier = 5). */
  planUsd: number;
}

/** Lee el uso en vivo. Devuelve null si no se puede (sin token o falla la red). */
export async function obtenerUsoApify(): Promise<UsoApify | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/users/me/limits?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = ((await res.json()) as { data?: Record<string, unknown> })?.data ?? {};
    const current = (d.current ?? {}) as Record<string, unknown>;
    const limits = (d.limits ?? {}) as Record<string, unknown>;
    return {
      usadoUsd: Number(current.monthlyUsageUsd) || 0,
      planUsd: Number(limits.maxMonthlyUsageUsd) || 0,
    };
  } catch {
    return null;
  }
}

export interface ChequeoPresupuesto {
  ok: boolean;
  usadoUsd: number;
  topeUsd: number;
  estimadoUsd: number;
  mensaje?: string;
}

/**
 * ¿Esta búsqueda (de costo ~estimadoUsd) cabe en el presupuesto tope propio?
 * Fail-open: si no se puede leer el uso (red/token), NO bloquea — un fallo de
 * infra no debe frenar el trabajo. tope 0 = sin límite propio (solo el del plan).
 */
export async function verificarPresupuesto(
  estimadoUsd: number,
): Promise<ChequeoPresupuesto> {
  const topeUsd = obtenerPresupuestoTope();
  const uso = await obtenerUsoApify();
  if (!uso) return { ok: true, usadoUsd: 0, topeUsd, estimadoUsd };
  const usadoUsd = uso.usadoUsd;
  if (topeUsd <= 0) return { ok: true, usadoUsd, topeUsd, estimadoUsd };
  if (usadoUsd + estimadoUsd > topeUsd) {
    return {
      ok: false,
      usadoUsd,
      topeUsd,
      estimadoUsd,
      mensaje: `Esta búsqueda (~$${estimadoUsd.toFixed(2)}) superaría tu presupuesto tope de $${topeUsd.toFixed(2)} (ya llevás $${usadoUsd.toFixed(2)} este mes). Subí el tope en el Panel o reducí la cantidad.`,
    };
  }
  return { ok: true, usadoUsd, topeUsd, estimadoUsd };
}
