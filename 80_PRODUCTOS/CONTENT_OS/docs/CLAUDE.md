# CLAUDE.md — Content OS

Este archivo le da contexto a Claude Code sobre este proyecto. Se carga automáticamente al inicio de cada sesión.

---

## Qué Es Esto

**Content OS** es un sistema de inteligencia de contenido para tu marca personal. Centraliza los datos de tus redes sociales (Instagram, YouTube) en un dashboard con análisis impulsado por IA.

El sistema:
- Se conecta a la API de Instagram y trae las métricas reales de cada video
- Transcribe y analiza el contenido de cada reel con IA (Gemini 2.5 Flash)
- Limpia las transcripciones con Groq LLaMA (gratis, ultrarápido)
- Guarda todo en Supabase con embeddings para búsqueda semántica
- Permite chatear con un agente que conoce todo tu historial de contenido

---

## Tu Rol y el Rol de Claude

Vos definís qué querés construir. Claude diseña, planifica e implementa.

No necesitás saber programar. Describile lo que querés en lenguaje natural y Claude lo construye paso a paso, pidiéndote confirmación antes de hacer cambios importantes.

---

## Estructura del Workspace

```
.
├── CLAUDE.md                  # Este archivo — siempre cargado
├── .claude/
│   └── commands/
│       ├── iniciar.md         # /iniciar — inicialización de sesión (wizard primera vez)
│       ├── crear-plan.md      # /crear-plan — planes de implementación
│       └── implementar.md     # /implementar — ejecutar planes
├── contexto/                  # Tu información: marca, negocio, métricas
├── planes/                    # Planes de implementación generados por Claude
├── salidas/                   # Entregables, notas, documentos
├── backups/                   # Snapshots antes de cambios importantes
├── referencia/                # Guías técnicas de APIs y herramientas
└── dashboard/                 # La app Next.js (tu dashboard real)
```

---

## Pipeline del Sistema

```
Instagram Graph API
     ↓ fetch paginado + cache local JSON (6h)
instagramClient.ts
     ↓
Gemini 2.5 Flash
     ↓ transcripción de video (audio → texto)
Groq LLaMA 3.1 8B Instant
     ↓ limpieza de transcripción (STT errors → texto limpio)
Supabase
     ↓ posts + metrics + transcriptions + embeddings (pgvector)
Dashboard (Next.js)
     ↓ visualización de métricas
AI Chat con RAG
     ↓ búsqueda semántica en pgvector → respuestas con data real
```

---

## Módulos del Dashboard

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/dashboard` | Overview: KPIs, gráfica de reach mes a mes, top contenidos, objetivos |
| Instagram Intelligence | `/instagram` | Feed de reels con métricas, transcripciones e insights IA |
| **Plan** | `/plan` | **Banco de ideas + tres vistas de la MISMA tabla `piezas`: Pipeline, Calendario y Tabla** |
| Referentes | `/referentes` | Perfiles que se estudian y qué tomar de cada uno |
| AI Chat | `/chat` | Chat con agente que tiene contexto de todo tu contenido |
| Settings | `/settings` | Estado de conexión de cada módulo |

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| IA — transcripciones | Gemini 2.5 Flash |
| IA — limpieza STT | Groq LLaMA 3.1 8B Instant (gratis) |
| IA — chat | Groq LLaMA 3.3 70B (gratis) |
| Base de datos | Supabase (PostgreSQL + pgvector) |
| APIs externas | Instagram Graph API |
| Cache | Archivos JSON locales en `/tmp/` |

---

## Modelos de IA por Tarea

| Tarea | Modelo | Costo |
|-------|--------|-------|
| Transcribir videos | Gemini 2.5 Flash | Gratis (1M tokens/mes) |
| Limpiar transcripciones | Groq LLaMA 3.1 8B Instant | Gratis |
| Chat con datos | Groq LLaMA 3.3 70B | Gratis |
| Embeddings semánticos | Gemini text-embedding-004 | Gratis |
| Ideas de contenido | Claude Sonnet 4.6 (opcional) | ~$3/1M tokens |

Ver tabla completa con instrucciones en `referencia/modelos-ia.md`.

---

## Variables de Entorno

Se guardan en `dashboard/.env.local`. Ver `dashboard/.env.local.example` para el formato completo.

| Variable | Para qué | Gratis/Pago |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Transcripciones + embeddings | Gratis |
| `GROQ_API_KEY` | Limpieza STT + chat | Gratis |
| `INSTAGRAM_ACCESS_TOKEN` | Pull de reels y métricas | Gratis |
| `INSTAGRAM_USER_ID` | ID de tu cuenta de IG | Gratis |
| `SUPABASE_URL` | Base de datos | Gratis (tier generoso) |
| `SUPABASE_SERVICE_KEY` | Autenticación Supabase (sb_secret, server-side) | Gratis |
| `DASHBOARD_PASSWORD` | Login del equipo en producción (vacía = sin login, para dev local) | Gratis |

**Nunca compartir `.env.local`. Está excluido del control de versiones.**

---

## Personalización Visual

Claude lee `contexto/mi-marca.md` para conocer tu marca. Al definir tu identidad visual (colores, logo, nombre), Claude aplica los cambios directamente en `dashboard/app/globals.css` y los componentes de layout.

El tema base es oscuro/premium. Podés pedirle a Claude que lo cambie a claro, que aplique tu color de acento, o que ajuste cualquier aspecto visual.

**Móvil (2026-07-19):** la app es responsive. En pantallas < `md` la sidebar se oculta y la navegación pasa a una barra inferior (`components/layout/MobileNav.tsx`, montada en `AppShell`). El shell usa `h-dvh` (no `100vh`) y el `main` reserva espacio inferior para la barra + safe-area de iPhone (`viewportFit: "cover"` en `app/layout.tsx`). El panel de reel (`ReelModal`) va a ancho completo en móvil con el modificador `!` de Tailwind (las clases `data-[side]` del Sheet base ganan por especificidad a clases normales — usar `clase!` para sobreescribirlas).

**Métricas (2026-07-19):** además de reach, se trae `views` (reproducciones totales — incluye repeticiones de la misma persona; siempre mayor que reach). Se muestra en el ojo de las tarjetas y como pill en el ReelModal. El ER se sigue calculando sobre reach. `views` aún NO se guarda en Supabase (la tabla `metrics` no tiene la columna) — agregar columna + `upsertMetrics` si el chat lo necesita. ⚠️ Si el reel se comparte también en Facebook (crossposting activo), las estadísticas de la app de IG muestran views COMBINADAS de Instagram+Facebook; la Graph API por media solo devuelve las de Instagram — por eso la app puede mostrar bastante más que el dashboard (verificado 2026-07-19: reel con 1.934 en API vs ~3k en la app). Las métricas `plays`/`ig_reels_aggregated_all_plays_count`/`clips_replays_count` ya están deprecadas — `views` es la única métrica de reproducciones disponible.

**Plan: banco de ideas y tres vistas (2026-08-21).** Una idea **ES** una fila de `piezas` en estado
`idea` — **no existe tabla `ideas`** y no debe crearse: dos tablas para lo mismo son dos títulos que
dejan de coincidir en cuanto alguien edita uno. El ciclo es `anotar → analizar → agendar`, y
«analizar» es el mismo `NuevaPieza` de siempre disparado sobre una idea guardada: se le pasa
`analizar={id, idea, tipo, marca_id}` y `POST /api/piezas/generar` con `piezaId` **actualiza esa
fila** en vez de crear otra (verificado: 10 piezas antes, 10 después). El `autor` original NO se
pisa al analizar — la idea es de quien la pensó, no de quien apretó el botón.
`PlanTablero` carga **todas** las marcas y filtra en cliente: el banco es compartido, Pipeline y
Calendario siguen viendo solo la marca activa.

**Usuarios: quién escribe ≠ quién puede entrar (2026-08-21).** El login quedó en **dos pasos** y en
**dos cookies separadas**: `dt_session` (httpOnly, la clave compartida del equipo, sin cambios) y
`dt_usuario` (legible por JS, solo firma las ideas). Van aparte a propósito — meter el usuario dentro
de `dt_session` habría invalidado las sesiones que ya estaban en los navegadores de Santiago y
Víctor. Quien llega con sesión válida y sin usuario **no pierde la sesión**: cae en `/login`, que
detecta el permiso y le muestra solo «¿quién sos?». `proxy.ts` comprueba identidad **siempre**, haya
`DASHBOARD_PASSWORD` o no (en local tampoco queremos ideas anónimas), y `/api/usuario` es pública
porque el login la consulta antes de tener cookie.
⚠️ **Limitación aceptada a sabiendas por Santiago:** con una sola contraseña, cualquiera puede
elegir ser el otro y no se le puede revocar el acceso a uno solo. **El gatillo para pasar a Supabase
Auth es que entre una tercera persona**, no una fecha. Los usuarios viven en `lib/usuarios.ts` —
agregar a alguien es una línea, sin migración, porque `piezas.autor` es texto libre en base.

**Migraciones de Supabase.** Se corren en orden en el SQL Editor: `002` → `003` → `004` → `005` →
`006_autor_y_ideas.sql`. La 006 (aplicada el 2026-08-21) solo agrega `piezas.autor text` + su índice.
Las 8 piezas anteriores quedan con `autor NULL` a propósito: ponerles un nombre sería inventarlo.

---

## Producción

- **Repo:** github.com/modozaint/dermatinta-content-os (privado) — solo la carpeta `dashboard/`
- **Hosting:** Vercel (cuenta modozaint, plan gratuito) — deploy automático con cada push a `main`
- **Login:** contraseña compartida del equipo via `DASHBOARD_PASSWORD` (env var en Vercel; en local no se pide)
- ⚠️ Los commits deben ir firmados como modozaint (`297497107+modozaint@users.noreply.github.com`, ya configurado en el repo local) — Vercel Hobby bloquea deploys de otros autores
- ⚠️ Al renovar el token de Instagram (vence 2026-09-15): actualizar `INSTAGRAM_ACCESS_TOKEN` también en Vercel + Redeploy

## Comandos Disponibles

| Comando | Qué hace |
|---------|----------|
| `/iniciar` | Inicializa la sesión — wizard de primera vez o resumen para sesiones posteriores |
| `/crear-plan [pedido]` | Crea un plan detallado antes de implementar algo |
| `/implementar [ruta-plan]` | Ejecuta un plan paso a paso |

---

## Instrucción Importante

Cada vez que se agregue un módulo nuevo o cambie la estructura del proyecto, actualizar las secciones relevantes de este archivo para mantenerlo al día.
