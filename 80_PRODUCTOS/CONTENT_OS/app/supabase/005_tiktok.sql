-- ================================================================
-- Content OS — Migración 005: TikTok entra al sistema
--
-- Es idempotente: se puede correr varias veces sin romper nada.
-- No borra ni modifica datos existentes.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. POSTS aprende de qué plataforma viene cada fila
--
--    Sin esto, "los 5 posts de más alcance" que alimentan al
--    generador de guiones mezclarían Instagram con TikTok — y un
--    `reach` de IG no significa lo mismo que un `view_count` de
--    TikTok. Comparar los dos produce un guion basado en un número
--    que no existe.
--
--    Todo lo que ya está cargado vino de Instagram: ese es el default.
-- ----------------------------------------------------------------
alter table posts add column if not exists plataforma text not null default 'instagram';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_plataforma_check'
  ) then
    alter table posts add constraint posts_plataforma_check
      check (plataforma in ('instagram', 'tiktok'));
  end if;
end $$;

create index if not exists posts_plataforma_idx on posts (plataforma);
create index if not exists posts_marca_plataforma_idx on posts (marca_id, plataforma);

-- ----------------------------------------------------------------
-- 2. METRICS gana `views` — un hueco que ya existía
--
--    getIGInsights() ya pide la métrica `views` a la Graph API y la
--    devuelve, pero upsertMetrics() no la guardaba porque la columna
--    no existía: se traía y se perdía en el camino.
--    Para TikTok es la métrica principal (view_count), así que sin
--    esta columna no habría dónde ponerla.
-- ----------------------------------------------------------------
alter table metrics add column if not exists views bigint default 0;

-- ----------------------------------------------------------------
-- 3. CONEXIONES — dónde viven los tokens de OAuth
--
--    El token de Instagram dura 60 días y por eso cabe en una
--    variable de entorno. El de TikTok dura 24 HORAS y se renueva
--    con un refresh_token: un valor que cambia todos los días no
--    puede vivir en la configuración de Vercel, porque nadie lo va
--    a estar pegando a mano cada mañana.
--
--    Una fila por (marca, plataforma).
-- ----------------------------------------------------------------
create table if not exists conexiones (
  marca_id          text not null references marcas(id) on delete cascade,
  plataforma        text not null,
  open_id           text,                  -- id del usuario en la plataforma
  handle            text,                  -- @ real, tal como lo devuelve la API
  display_name      text,
  access_token      text,
  refresh_token     text,
  expira_en         timestamptz,           -- del access_token (TikTok: 24 h)
  refresh_expira_en timestamptz,           -- del refresh_token (TikTok: 1 año)
  scope             text,
  actualizado       timestamptz default now(),
  primary key (marca_id, plataforma)
);

-- 🔒 RLS activo y CERO políticas, a propósito.
--    Aquí viven tokens de acceso: solo la service key (que salta RLS)
--    puede leerlos. Con la clave publicable esta tabla no existe.
alter table conexiones enable row level security;
