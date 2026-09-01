-- ================================================================
-- Content OS — Migración 003: piezas (el Plan) + metas de cadencia
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
-- Requiere que 002 ya esté corrida (necesita la tabla `marcas`).
-- Es idempotente: se puede correr varias veces sin romper nada.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. PIEZAS — la capa que no existía: planificación.
--
--    Una pieza nace como IDEA (una línea escrita a mano o dictada) y
--    muere PUBLICADA, enlazada al post real para poder comparar lo
--    que se planeó contra lo que rindió. Ese enlace es lo que cierra
--    el ciclo: sin él esto es una lista de tareas bonita.
-- ----------------------------------------------------------------
create table if not exists piezas (
  id             uuid primary key default gen_random_uuid(),
  marca_id       text references marcas(id),

  -- Qué es
  titulo         text not null,
  idea           text,                    -- lo que se escribió en "Idea o tema", tal cual
  tipo           text not null default 'reel',   -- reel | carrusel | story | foto
  eje            text,                    -- el ángulo (Dermatinta: origen|prueba|criterio|formato)

  -- Dónde va en el tablero
  estado         text not null default 'idea',   -- idea|guionizada|grabada|editada|publicada
  orden          integer default 0,       -- posición dentro de su columna del kanban
  fecha_objetivo date,                    -- para qué día está agendada en el calendario

  -- Lo que genera la IA. jsonb y no texto porque el brief y los hooks
  -- son estructurados: se muestran en tarjetas, no en un párrafo.
  brief          jsonb,                   -- {que_es, para_que_cuenta, horas, como_sabremos}
  hooks          jsonb,                   -- [{texto, arquetipo}] — las 3 opciones
  guion          text,                    -- escena por escena, en markdown

  -- El cierre del ciclo
  post_id        text references posts(id) on delete set null,
  publicada_url  text,

  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists piezas_marca_idx  on piezas (marca_id);
create index if not exists piezas_estado_idx on piezas (estado);
create index if not exists piezas_fecha_idx  on piezas (fecha_objetivo);

-- Los estados son una lista cerrada a propósito: si mañana alguien
-- inventa "casi lista", el tablero deja de significar algo.
alter table piezas drop constraint if exists piezas_estado_valido;
alter table piezas add constraint piezas_estado_valido
  check (estado in ('idea','guionizada','grabada','editada','publicada'));

alter table piezas drop constraint if exists piezas_tipo_valido;
alter table piezas add constraint piezas_tipo_valido
  check (tipo in ('reel','carrusel','story','foto'));

-- `updated_at` se mantiene solo. Sin esto hay que acordarse de tocarlo
-- en cada update, y es exactamente lo que no se hace.
create or replace function tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists piezas_updated_at on piezas;
create trigger piezas_updated_at before update on piezas
  for each row execute function tocar_updated_at();

-- ----------------------------------------------------------------
-- 2. QUÉ REFERENTE ALIMENTÓ QUÉ PIEZA
--    `referente_usos` (002) enlaza referente↔post publicado. Esto
--    enlaza referente↔pieza EN PROCESO, que es cuando de verdad se
--    usa: al escribir el guion, no después de publicar.
-- ----------------------------------------------------------------
create table if not exists pieza_referentes (
  pieza_id     uuid references piezas(id)     on delete cascade,
  referente_id uuid references referentes(id) on delete cascade,
  primary key (pieza_id, referente_id)
);

-- ----------------------------------------------------------------
-- 3. METAS — la cadencia, editable desde Ajustes.
--
--    Decisión de Santiago (2026-08-16): 3 reels por semana = 12 al
--    mes. Va en tabla y no en el código justamente porque tiene que
--    poder cambiarse sin tocar el código cuando el turno no dé.
-- ----------------------------------------------------------------
create table if not exists metas (
  marca_id          text primary key references marcas(id),
  piezas_por_semana integer not null default 3,
  tipo_principal    text    not null default 'reel',
  activa            boolean not null default true,  -- false = marca en mantenimiento, no pinta huecos
  updated_at        timestamptz default now()
);

-- Solo Dermatinta arranca con meta activa: es la única con estrategia
-- de contenido escrita. Kaizen y MODOZAINT quedan en 0 hasta que se
-- decida, para que el calendario no muestre huecos que nadie va a llenar.
insert into metas (marca_id, piezas_por_semana, tipo_principal, activa) values
  ('dermatinta', 3, 'reel', true),
  ('kaizen',     0, 'reel', false),
  ('modozaint',  0, 'reel', false)
on conflict (marca_id) do nothing;

drop trigger if exists metas_updated_at on metas;
create trigger metas_updated_at before update on metas
  for each row execute function tocar_updated_at();
