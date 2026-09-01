-- ================================================================
-- Content OS — Migración 002: multi-marca + banco de referentes
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
-- Es idempotente: se puede correr varias veces sin romper nada.
-- No borra ni modifica datos existentes.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. MARCAS — el cimiento. Todo lo demás pregunta "¿de cuál marca?"
-- ----------------------------------------------------------------
create table if not exists marcas (
  id            text primary key,          -- slug: 'dermatinta', 'kaizen', 'modozaint'
  nombre        text not null,
  handle_ig     text,
  handle_tiktok text,
  color         text,                      -- para distinguirlas de un vistazo en la UI
  activa        boolean default true,
  orden         integer default 0,         -- en qué orden salen en el selector
  created_at    timestamptz default now()
);

-- Las tres marcas. ON CONFLICT para poder re-ejecutar sin duplicar.
insert into marcas (id, nombre, handle_ig, handle_tiktok, color, orden) values
  ('dermatinta', 'Dermatinta',      'dermatinta',    null, '#C49A52', 1),
  ('kaizen',     'House of Kaizen', 'houseofkaizen', null, '#FF4D00', 2),
  ('modozaint',  'MODOZAINT',       'modozaint',     null, '#A3BE4C', 3)
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- 2. POSTS pasa a ser multi-marca
-- ----------------------------------------------------------------
alter table posts add column if not exists marca_id text references marcas(id);
create index if not exists posts_marca_idx on posts (marca_id);

-- Lo ya cargado es de Dermatinta (era la única cuenta conectada).
-- Solo toca las filas huérfanas: no pisa nada que ya tenga marca.
update posts set marca_id = 'dermatinta' where marca_id is null;

-- ----------------------------------------------------------------
-- 3. REFERENTES — PERFILES que se estudian, no videos sueltos
--
--    Los videos de inspiración NO van aquí: viven en VIDEOTECA/ del
--    vault. Un perfil se sigue en el tiempo; un video se destila una
--    vez. Ciclos de vida distintos, tablas distintas.
-- ----------------------------------------------------------------
create table if not exists referentes (
  id              uuid primary key default gen_random_uuid(),
  handle          text not null,                       -- '@feelink.tatuajes'
  plataforma      text not null default 'ig',          -- ig | tiktok | yt
  marca_id        text references marcas(id),          -- a qué marca nuestra sirve
  que_tomar       text not null,                       -- ← EL CAMPO QUE VALE
  por_que         text,                                -- por qué lo sigo
  categoria       text,                                -- hook|edicion|formato|posicionamiento|arte
  url             text,
  seguidores      integer,                             -- foto del día que se anotó
  ultima_revision timestamptz,
  created_at      timestamptz default now(),
  unique (handle, plataforma, marca_id)
);

create index if not exists referentes_marca_idx on referentes (marca_id);

-- ----------------------------------------------------------------
-- 4. Qué pieza nuestra salió de qué referente — cierra el ciclo.
--    Sin esto el banco se vuelve un cementerio de favoritos.
-- ----------------------------------------------------------------
create table if not exists referente_usos (
  id           uuid primary key default gen_random_uuid(),
  referente_id uuid references referentes(id) on delete cascade,
  post_id      text references posts(id) on delete set null,
  nota         text,                                   -- qué se tomó exactamente
  created_at   timestamptz default now()
);

-- ----------------------------------------------------------------
-- 5. Búsqueda semántica, ahora filtrable por marca
--    Se deja la función vieja intacta (hay código llamándola).
-- ----------------------------------------------------------------
create or replace function search_transcriptions_by_marca(
  query_embedding vector(768),
  p_marca_id      text default null,
  match_count     int default 5
)
returns table (
  post_id    text,
  text       text,
  similarity float,
  marca_id   text
)
language sql stable
as $$
  select
    t.post_id,
    t.text,
    1 - (t.embedding <=> query_embedding) as similarity,
    p.marca_id
  from transcriptions t
  join posts p on p.id = t.post_id
  where t.embedding is not null
    and (p_marca_id is null or p.marca_id = p_marca_id)
  order by t.embedding <=> query_embedding
  limit match_count;
$$;
