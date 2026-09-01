-- ================================================================
-- Content OS — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ================================================================

-- Habilitar pgvector para búsqueda semántica
create extension if not exists vector;

-- ----------------------------------------------------------------
-- Posts (una fila por media_id de Instagram)
-- ----------------------------------------------------------------
create table if not exists posts (
  id            text primary key,
  caption       text,
  media_type    text,
  thumbnail_url text,
  permalink     text,
  published_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------
-- Métricas del post (último snapshot — upsert por post_id)
-- ----------------------------------------------------------------
create table if not exists metrics (
  post_id           text primary key references posts(id) on delete cascade,
  reach             integer default 0,
  likes             integer default 0,
  comments          integer default 0,
  shares            integer default 0,
  saves             integer default 0,
  avg_watch_time_ms integer default 0,
  engagement_rate   float default 0,
  captured_at       timestamptz default now()
);

-- ----------------------------------------------------------------
-- Transcripciones + embeddings semánticos
-- ----------------------------------------------------------------
create table if not exists transcriptions (
  id             uuid primary key default gen_random_uuid(),
  post_id        text unique references posts(id) on delete cascade,
  platform       text not null default 'ig',
  text           text not null,
  transcribed_at timestamptz default now(),
  embedding      vector(768)
);

-- Índice para búsqueda semántica con cosine similarity
create index if not exists transcriptions_embedding_idx
  on transcriptions using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ----------------------------------------------------------------
-- Función RPC: búsqueda semántica por similitud de coseno
-- ----------------------------------------------------------------
create or replace function search_transcriptions(
  query_embedding vector(768),
  match_count     int default 5
)
returns table (
  post_id    text,
  text       text,
  similarity float
)
language sql stable
as $$
  select
    post_id,
    text,
    1 - (embedding <=> query_embedding) as similarity
  from transcriptions
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
