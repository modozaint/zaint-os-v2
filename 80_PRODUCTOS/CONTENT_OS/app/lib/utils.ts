import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Modelo de decaimiento exponencial: retention(t) = 100 * 0.5^(t / avgWatchTime)
// Si no hay duración real, la estimamos como avgWatchTime / 0.38 (retención típica de Reels ~38%)
export function generateRetentionData(
  duration: number,
  avgWatchTime: number
): { second: number; retention: number }[] {
  if (avgWatchTime <= 0) return []
  const effectiveDuration = duration > 0 ? duration : Math.round(avgWatchTime / 0.38)
  const step = Math.max(1, Math.floor(effectiveDuration / 20))
  const pts = []
  for (let s = 0; s <= effectiveDuration; s += step) {
    const retention = Math.round(100 * Math.pow(0.5, s / avgWatchTime))
    pts.push({ second: s, retention: Math.max(1, retention) })
  }
  return pts
}
