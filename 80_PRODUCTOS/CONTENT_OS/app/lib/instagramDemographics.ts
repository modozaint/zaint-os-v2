import fs from 'fs'
import os from 'os'
import path from 'path'
import type { IGCacheEntry } from './instagramTypes'

// El único directorio escribible en serverless (Vercel) es el tmp del sistema
const CACHE_DIR = path.join(os.tmpdir(), 'instagram-cache')
const CACHE_HOURS = 24

export interface CountryData {
  country: string
  organic: number
}

function cachePath(): string | null {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    return path.join(CACHE_DIR, 'demographics.json')
  } catch {
    return null
  }
}

function loadCache(): CountryData[] | null {
  const p = cachePath()
  if (!p) return null
  try {
    if (!fs.existsSync(p)) return null
    const entry: IGCacheEntry<CountryData[]> = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const ageH = (Date.now() - new Date(entry.cached_at).getTime()) / 3_600_000
    return ageH > CACHE_HOURS ? null : entry.payload
  } catch {
    return null
  }
}

function saveCache(data: CountryData[]): void {
  const p = cachePath()
  if (!p) return
  try {
    fs.writeFileSync(p, JSON.stringify({ cached_at: new Date().toISOString(), payload: data }, null, 2))
  } catch {
    // sin caché — seguimos con datos en vivo
  }
}

export async function getFollowerDemographics(): Promise<CountryData[]> {
  const cached = loadCache()
  if (cached) return cached

  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID
  if (!token || !userId) return []

  try {
    const url =
      `https://graph.facebook.com/v21.0/${userId}/insights` +
      `?metric=follower_demographics` +
      `&period=lifetime` +
      `&metric_type=total_value` +
      `&breakdown=country` +
      `&access_token=${token}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.error || !data.data?.[0]?.total_value?.breakdowns?.[0]?.results) {
      return []
    }

    const results: { dimension_values: string[]; value: number }[] =
      data.data[0].total_value.breakdowns[0].results

    const sorted = results
      .map((r) => ({ country: r.dimension_values[0], organic: r.value }))
      .sort((a, b) => b.organic - a.organic)

    const top5 = sorted.slice(0, 5)
    const othersTotal = sorted.slice(5).reduce((sum, c) => sum + c.organic, 0)
    if (othersTotal > 0) top5.push({ country: 'Otros', organic: othersTotal })

    saveCache(top5)
    return top5
  } catch {
    return []
  }
}
