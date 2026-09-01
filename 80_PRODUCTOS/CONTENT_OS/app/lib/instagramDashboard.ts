import type { IGMediaItem } from './instagramTypes'

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export interface DashboardKPIs {
  total_reach: number
  total_saves: number
  avg_engagement_rate: number
  total_reels: number
}

export interface TopContentItem {
  id: string
  platform: 'instagram'
  thumbnail: string
  title: string
  reach: number
  date: string
  permalink: string
}

export interface DashboardData {
  kpis: DashboardKPIs
  viewsTimeSeries: { month: string; organic: number }[]
  topContent: TopContentItem[]
  currentMonthReach: number
}

function formatMonth(timestamp: string): string {
  const d = new Date(timestamp)
  return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp)
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`
}

export function getDashboardData(media: IGMediaItem[]): DashboardData {
  if (media.length === 0) {
    return {
      kpis: { total_reach: 0, total_saves: 0, avg_engagement_rate: 0, total_reels: 0 },
      viewsTimeSeries: [],
      topContent: [],
      currentMonthReach: 0,
    }
  }

  // KPIs
  const total_reach = media.reduce((sum, m) => sum + (m.insights?.reach ?? 0), 0)
  const total_saves = media.reduce((sum, m) => sum + (m.insights?.saves ?? 0), 0)
  const avg_engagement_rate =
    media.reduce((sum, m) => sum + (m.insights?.engagement_rate ?? 0), 0) / media.length

  // Views time series — agrupar por mes, últimos 6 meses
  const monthMap: Map<string, { label: string; date: Date; organic: number }> = new Map()
  for (const item of media) {
    const key = formatMonth(item.timestamp)
    const d = new Date(item.timestamp)
    const existing = monthMap.get(key)
    if (existing) {
      existing.organic += item.insights?.reach ?? 0
    } else {
      monthMap.set(key, { label: key, date: d, organic: item.insights?.reach ?? 0 })
    }
  }

  const viewsTimeSeries = Array.from(monthMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6)
    .map(({ label, organic }) => ({ month: label, organic }))

  const now = new Date()
  const currentMonthKey = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`
  const currentMonthReach = monthMap.get(currentMonthKey)?.organic ?? 0

  // Top 4 por reach
  const topContent: TopContentItem[] = [...media]
    .sort((a, b) => (b.insights?.reach ?? 0) - (a.insights?.reach ?? 0))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      platform: 'instagram' as const,
      thumbnail: item.thumbnail_url ?? '',
      title: item.caption?.split('\n')[0]?.slice(0, 80) ?? 'Sin caption',
      reach: item.insights?.reach ?? 0,
      date: formatDate(item.timestamp),
      permalink: item.permalink,
    }))

  return {
    kpis: {
      total_reach,
      total_saves,
      avg_engagement_rate,
      total_reels: media.length,
    },
    viewsTimeSeries,
    topContent,
    currentMonthReach,
  }
}
