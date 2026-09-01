# Supabase — Setup Completo

Guía para crear el proyecto Supabase y configurar la base de datos del Content OS.

---

## Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta (gratis)
3. "New project" → elegir nombre, región y contraseña
4. Esperar ~2 minutos mientras se inicializa

---

## Paso 2 — Obtener las credenciales

1. Ir a **Settings → API**
2. Copiar:
   - **Project URL** → guardar como `SUPABASE_URL=`
   - **anon public** key → guardar como `SUPABASE_ANON_KEY=`

Guardar ambas en `dashboard/.env.local`.

---

## Paso 3 — Ejecutar el schema SQL

1. Ir a **SQL Editor** en el dashboard de Supabase
2. Hacer clic en "New query"
3. Copiar y pegar todo el contenido de `dashboard/supabase/schema.sql`
4. Ejecutar con "Run"

El schema crea:
- Tabla `posts` — un registro por reel/video de Instagram
- Tabla `metrics` — métricas del post (reach, likes, saves, etc.)
- Tabla `transcriptions` — texto transcripto + embedding vectorial
- Índice `ivfflat` para búsqueda semántica por similitud de coseno
- Función RPC `search_transcriptions` para el AI Chat

---

## Schema SQL Completo

El archivo está en `dashboard/supabase/schema.sql`. Contenido:

```sql
-- Habilitar pgvector para búsqueda semántica
create extension if not exists vector;

-- Posts (una fila por reel/video de Instagram)
create table if not exists posts (
  id           text primary key,
  caption      text,
  media_type   text,
  thumbnail_url text,
  permalink    text,
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Métricas del post (último snapshot — upsert por post_id)
create table if not exists metrics (
  post_id          text primary key references posts(id) on delete cascade,
  reach            integer default 0,
  likes            integer default 0,
  comments         integer default 0,
  shares           integer default 0,
  saves            integer default 0,
  avg_watch_time_ms integer default 0,
  engagement_rate  float default 0,
  captured_at      timestamptz default now()
);

-- Transcripciones + embeddings para búsqueda semántica
create table if not exists transcriptions (
  id             uuid primary key default gen_random_uuid(),
  post_id        text unique references posts(id) on delete cascade,
  platform       text not null default 'ig',
  text           text not null,
  transcribed_at timestamptz default now(),
  embedding      vector(768)
);

-- Índice para búsqueda semántica (ivfflat, similitud coseno)
create index if not exists transcriptions_embedding_idx
  on transcriptions using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- Función RPC para búsqueda semántica desde JavaScript
create or replace function search_transcriptions(
  query_embedding vector(768),
  match_count     int default 5
)
returns table (post_id text, text text, similarity float)
language sql stable as $$
  select
    post_id,
    text,
    1 - (embedding <=> query_embedding) as similarity
  from transcriptions
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## Verificación

Una vez ejecutado el schema, ir a **Table Editor** y confirmar que existen las tablas `posts`, `metrics` y `transcriptions`.

Para verificar que pgvector está activo:
```sql
select * from pg_extension where extname = 'vector';
```

---

## Resetear la base de datos (si necesitás empezar de cero)

```sql
drop table if exists transcriptions cascade;
drop table if exists metrics cascade;
drop table if exists posts cascade;
drop extension if exists vector;
```

Luego volver a ejecutar el schema completo.
