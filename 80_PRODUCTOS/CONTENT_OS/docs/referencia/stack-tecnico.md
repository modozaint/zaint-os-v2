# Stack Técnico — Content OS

Arquitectura y patrones del sistema.

---

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Lenguaje | TypeScript | strict mode |
| Estilos | Tailwind CSS | v4 |
| Componentes | shadcn/ui | latest |
| IA — transcripciones | Gemini 2.5 Flash | — |
| IA — limpieza/chat | Groq LLaMA | 3.1 8B / 3.3 70B |
| Base de datos | Supabase | PostgreSQL + pgvector |
| Íconos | Lucide React | — |

---

## Estructura del Dashboard

```
dashboard/
├── app/
│   ├── layout.tsx               # Layout raíz con sidebar + splash
│   ├── page.tsx                 # Redirect a /dashboard
│   ├── globals.css              # Variables CSS — personalizar acá
│   ├── dashboard/page.tsx       # Overview: KPIs, gráficas, objetivos
│   ├── instagram/page.tsx       # Feed de reels con modal
│   ├── chat/page.tsx            # AI Chat con RAG
│   ├── settings/page.tsx        # Estado de conexión de módulos
│   └── api/
│       ├── instagram/
│       │   ├── media/route.ts       # GET — lista de Reels + insights
│       │   ├── transcribe/route.ts  # POST — transcribir + guardar en Supabase
│       │   └── video-url/route.ts   # GET — media_url fresca (no cachear)
│       ├── chat/route.ts            # POST — AI Chat con RAG
│       ├── sync/route.ts            # POST — sincronizar todo con Supabase
│       ├── alerts/route.ts          # GET — alertas del sistema
│       └── init/route.ts            # GET — estado inicial de módulos
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         # Wrapper con sidebar
│   │   ├── Sidebar.tsx          # Navegación lateral
│   │   ├── Header.tsx           # Header superior
│   │   └── GeminiAlert.tsx      # Banner de alertas
│   ├── shared/
│   │   ├── MetricCard.tsx       # Card de KPI
│   │   ├── ContentCard.tsx      # Card de contenido
│   │   ├── ProgressBar.tsx      # Barra de progreso
│   │   ├── CountryChart.tsx     # Gráfica de audiencia por país
│   │   ├── RetentionChart.tsx   # Curva de retención
│   │   └── SplashScreen.tsx     # Pantalla de carga inicial
│   ├── dashboard/
│   │   ├── ViewsChart.tsx       # Gráfica de reach mes a mes
│   │   ├── TopContent.tsx       # Lista de top contenidos
│   │   └── GoalsSectionClient.tsx # Objetivos con progress bars
│   ├── instagram/
│   │   ├── ReelsFeed.tsx        # Feed de reels
│   │   ├── ReelModal.tsx        # Modal con análisis completo
│   │   ├── AIInsightsBlock.tsx  # Insights de IA por reel
│   │   └── TranscriptionBlock.tsx # Transcripción formateada
│   └── chat/
│       ├── ChatInterface.tsx    # Interfaz del chat
│       └── AgentBadge.tsx       # Badge del agente activo
├── lib/
│   ├── instagramClient.ts       # IG Graph API + cache JSON
│   ├── instagramTypes.ts        # Types de Instagram
│   ├── instagramDashboard.ts    # Procesamiento de datos para dashboard
│   ├── instagramDemographics.ts # Datos de audiencia por país
│   ├── transcriptionCleaner.ts  # Limpieza de STT con Groq
│   ├── gemini.ts                # Cliente Gemini (transcripciones + embeddings)
│   ├── supabaseClient.ts        # Cliente Supabase
│   ├── goals.ts                 # Lógica de objetivos
│   ├── utils.ts                 # Utilidades generales
│   ├── db/
│   │   ├── posts.ts             # CRUD de posts en Supabase
│   │   ├── metrics.ts           # CRUD de métricas en Supabase
│   │   └── transcriptions.ts   # CRUD de transcripciones + búsqueda semántica
│   └── mock/
│       ├── instagram.ts         # Datos de ejemplo para Instagram
│       ├── youtube.ts           # Datos de ejemplo para YouTube
│       ├── ads.ts               # Datos de ejemplo para Ads
│       └── customer-voice.ts    # Datos de ejemplo para Customer Voice
├── public/
│   ├── logo.png                 # Tu logo — reemplazar este archivo
│   └── fonts/                   # Fuentes locales (NeueMachina)
└── supabase/
    └── schema.sql               # Schema completo — ejecutar en Supabase
```

---

## Pipeline de Transcripción

```
1. Usuario hace clic en "Transcribir" en un reel
2. GET /api/instagram/video-url → media_url fresca de la Graph API
3. POST /api/instagram/transcribe → Gemini 2.5 Flash transcribe el video
4. Groq LLaMA 3.1 8B limpia el texto (errores STT, puntuación)
5. Gemini text-embedding-004 genera embedding vectorial (768 dims)
6. Todo se guarda en Supabase (posts + metrics + transcriptions)
```

## Pipeline del AI Chat (RAG)

```
1. Usuario envía mensaje al chat
2. Gemini text-embedding-004 genera embedding del mensaje
3. search_transcriptions() busca los N reels más similares en pgvector
4. Groq LLaMA 3.3 70B genera respuesta con el contexto de esos reels
5. La respuesta menciona reels específicos con sus métricas
```

---

## Patrón de Cache

Las respuestas de la Instagram Graph API se cachean en archivos JSON en `/tmp/`:

```typescript
// Cache de 6h para la lista de media
const CACHE_HOURS_MEDIA = 6

// Cache de 24h para insights por video
const CACHE_HOURS_INSIGHTS = 24

// media_url NUNCA se cachea — expira en ~1h
```

---

## Personalización Visual

Todas las variables de color están en `dashboard/app/globals.css`. Pedile a Claude que cambie cualquier aspecto del diseño describiendo lo que querés. Claude modifica las CSS variables directamente.

Variables clave:
- `--bg-main` — fondo principal
- `--bg-card` — fondo de cards
- `--text-primary` — texto principal
- `--accent` — color de acento
