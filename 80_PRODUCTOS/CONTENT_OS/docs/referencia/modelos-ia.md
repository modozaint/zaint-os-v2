# Modelos de IA — Guía de Recomendaciones

Qué modelo usar para cada tarea, por qué, y cómo obtener la key.

---

## Tabla de Modelos

| Tarea | Modelo recomendado | Por qué | Costo | Cómo obtener |
|-------|-------------------|---------|-------|--------------|
| Transcribir videos (IG/YT) | **Gemini 2.5 Flash** | Acepta video directo, preciso en español, tier gratis generoso | Gratis (1M tokens/mes) | [aistudio.google.com](https://aistudio.google.com) |
| Limpiar transcripciones | **Groq LLaMA 3.1 8B Instant** | Ultrarápido, corrección de texto, 100% gratis | Gratis | [console.groq.com](https://console.groq.com) |
| Chat con datos de contenido | **Groq LLaMA 3.3 70B** | Contexto largo, razonamiento sólido, gratis | Gratis | [console.groq.com](https://console.groq.com) |
| Embeddings semánticos | **Gemini text-embedding-004** | 768 dims, gratis, compatible con Supabase pgvector | Gratis | (misma key de Gemini) |
| Ideas de contenido | **Claude Sonnet 4.6** | Mayor creatividad, ideas accionables y bien fundamentadas | ~$3/1M tokens | [console.anthropic.com](https://console.anthropic.com) |
| Análisis estratégico | **Claude Sonnet 4.6** | Mejor razonamiento para decisiones de largo plazo | ~$3/1M tokens | [console.anthropic.com](https://console.anthropic.com) |

---

## Regla de oro

> Lo automático y repetitivo (transcribir, limpiar, embeddings) → **modelos gratuitos**.
> Lo que el usuario va a leer y actuar (ideas, análisis) → **modelos de pago**.

---

## Cómo obtener cada key

### Gemini API Key (Google AI Studio)
1. Ir a [aistudio.google.com](https://aistudio.google.com)
2. Iniciar sesión con cuenta de Google
3. Hacer clic en "Get API key" → "Create API key"
4. Copiar la key y guardarla en `dashboard/.env.local` como `GEMINI_API_KEY=`

### Groq API Key
1. Ir a [console.groq.com](https://console.groq.com)
2. Crear cuenta (gratis)
3. Ir a "API Keys" → "Create API Key"
4. Copiar y guardar como `GROQ_API_KEY=`

### Anthropic API Key (Claude)
1. Ir a [console.anthropic.com](https://console.anthropic.com)
2. Crear cuenta y cargar créditos ($5 mínimo)
3. Ir a "API Keys" → "Create Key"
4. Copiar y guardar como `ANTHROPIC_API_KEY=`

### Instagram Graph API Token
Ver guía completa en `referencia/ig-api-guide.md`.

### Supabase
Ver guía completa en `referencia/supabase-setup.md`.

---

## Variables de entorno resultantes

```env
# Requeridas
GEMINI_API_KEY=
GROQ_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Opcionales
ANTHROPIC_API_KEY=
```

Guardar en `dashboard/.env.local`.
