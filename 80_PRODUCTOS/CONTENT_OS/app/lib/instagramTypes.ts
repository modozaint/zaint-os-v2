// Tipos de la Instagram Graph API
export interface IGInsights {
  views: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  avg_watch_time_ms?: number
  engagement_rate?: number
}

export interface IGMediaItem {
  id: string
  caption?: string
  media_type: 'VIDEO' | 'REEL' | 'IMAGE' | 'CAROUSEL_ALBUM'
  thumbnail_url?: string
  permalink: string
  timestamp: string
  video_duration?: number // en segundos
  insights?: IGInsights
}

export interface IGCacheEntry<T> {
  cached_at: string
  payload: T
}

// Tipo unificado para la UI del dashboard
export interface IGReelData {
  id: string
  thumbnail: string
  caption: string
  date: string
  permalink: string
  metrics: {
    views: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    avg_watch_time_s: number
    duration_s: number
    engagement_rate: number
  }
  avg_comparison: { metric: string; delta: number }[]
  transcription: string[]      // vacío hasta que se conecte Gemini
  ai_insights: string[]        // vacío hasta que se conecte Gemini
  improvement_points: string[] // vacío hasta que se conecte Gemini
  transcribed: boolean
}
