-- ============================================================
-- VIDEOJUEGO DE LA VIDA · esquema v1
-- Santiago Giraldo · 2026-08-14
-- Fuente de las areas: KNOWLEDGE_PACKS/FOUNDER/BRUJULA.md
-- Fuente de habitos y niveles: bitacora de Notion (migrada)
-- ============================================================

-- 1. LAS 5 AREAS -------------------------------------------------
create table areas (
  id          text primary key,
  nombre      text not null,
  definicion_ganar text not null,   -- su propia definicion, de la Brujula
  orden       int  not null,
  color       text
);

insert into areas (id, nombre, definicion_ganar, orden, color) values
 ('negocio',   'Negocio',   'Las metricas de cada objetivo avanzan consistentemente', 1, '#A3BE4C'),
 ('desarrollo','Desarrollo','Constante aprendiendo, lo convierte en habilidad y lo comparte', 2, '#4A9CE8'),
 ('salud',     'Salud',     'Constante, mejora fisica, mas energia', 3, '#E85D5D'),
 ('relaciones','Relaciones','Cercania real + gente que eleva su estandar', 4, '#E8A33D'),
 ('vida',      'Vida',      'Mas libertad sin sacrificar paz mental', 5, '#9B6BE8');

-- 2. LOS HABITOS -------------------------------------------------
create table habitos (
  id        text primary key,
  nombre    text not null,
  area_id   text not null references areas(id),
  minimo    text not null,
  normal    text not null,
  super     text not null,
  activo    boolean not null default true,
  orden     int not null
);

insert into habitos (id, nombre, area_id, minimo, normal, super, orden) values
 ('ejercicio','Ejercicio','salud',     '20 flexiones','60 flexiones','100 / salir a entrenar', 1),
 ('leer',     'Leer',     'desarrollo','10 paginas',  '25 paginas',  '30+ paginas',            2),
 ('dormir',   'Dormir',   'salud',     'siesta',      '7 horas',     '8 horas',                3),
 ('publicar', 'Publicar', 'negocio',   'una historia','1 pieza',     'pieza + responder',      4),
 ('aprender', 'Aprender', 'desarrollo','1 video',     '30 min',      '1 hora + aplicar',       5),
 ('bloque',   'Bloque',   'negocio',   '25 min',      '90 min',      '3 horas',                6);

-- ⚠️ RELACIONES y VIDA no tienen habito todavia. Sin ellos quedan en nivel 1
--    para siempre — que es justo lo que el sistema deberia estar gritando.

-- 3. TURNOS y la META DEL DIA ------------------------------------
-- Esta es LA regla que hace justo el sistema y que el video original NO tiene:
-- la exigencia depende del turno. En turno de 12h, cumplir el minimo ES cumplir.
create table turnos (
  id            text primary key,
  nombre        text not null,
  horas_clinica numeric not null,
  meta_nivel    text not null,   -- 'ninguno' | 'minimo' | 'normal'
  meta_habitos  int  not null,   -- cuantos habitos hay que cumplir ese dia
  descripcion   text
);

insert into turnos (id, nombre, horas_clinica, meta_nivel, meta_habitos, descripcion) values
 ('CF1',     'CF1 · 7am-7pm',       12, 'minimo',  1, 'Turno de 12h: ~10 min de movil'),
 ('U',       'U · 7am-7pm',         12, 'minimo',  1, 'Turno de 12h'),
 ('A',       'A · 7am-5pm',         10, 'minimo',  1, 'Turno de 10h'),
 ('QV',      'QV · 7am-5pm',        10, 'minimo',  1, 'Farmacia quirofano, 10h'),
 ('N',       'N · 7pm-7am',         12, 'minimo',  2, 'Noche: la MANANA queda libre'),
 ('POSTURNO','Posturno · sale 7am',  0, 'ninguno', 0, 'Dia protegido: nunca pierde vida'),
 ('LIBRE',   'Libre',                0, 'normal',  3, '60-90 min reales');

-- 4. EL DIA ------------------------------------------------------
create table dias (
  fecha         date primary key,
  turno_id      text references turnos(id),
  energia       int check (energia between 1 and 3),
  agradezco_por text,
  apunte        text,
  proyecto      text,
  meta_cumplida boolean,          -- se calcula al cerrar el dia
  vida_perdida  int default 0
);

-- 5. LOS REGISTROS ----------------------------------------------
create table registros (
  id          bigserial primary key,
  fecha       date not null references dias(fecha) on delete cascade,
  habito_id   text not null references habitos(id),
  nivel       text not null check (nivel in ('minimo','normal','super')),
  xp          int  not null,
  evidencia_url text,             -- Supabase Storage (fase 4)
  creado_en   timestamptz default now(),
  unique (fecha, habito_id)       -- un habito, una vez por dia
);

-- XP por nivel: minimo 10 · normal 25 · super 50
create or replace function xp_de_nivel(n text) returns int as $$
  select case n when 'minimo' then 10 when 'normal' then 25 when 'super' then 50 else 0 end;
$$ language sql immutable;

create or replace function set_xp() returns trigger as $$
begin
  new.xp := xp_de_nivel(new.nivel);
  return new;
end;
$$ language plpgsql;

create trigger trg_set_xp before insert or update on registros
  for each row execute function set_xp();

-- 6. ESTADO DEL AVATAR -------------------------------------------
create table avatar (
  id            int primary key default 1 check (id = 1),
  vida          int not null default 1000 check (vida between 0 and 1000),
  vida_maxima   int not null default 1000,
  creado_en     timestamptz default now(),
  constraint solo_un_avatar check (id = 1)
);
insert into avatar (id) values (1);

-- 7. NIVEL POR AREA (vista) --------------------------------------
-- 100 XP = 1 nivel. Es lo mejor del video: muestra donde esta flojo.
create view niveles_por_area as
select
  a.id, a.nombre, a.color, a.orden,
  coalesce(sum(r.xp), 0)                as xp_total,
  1 + (coalesce(sum(r.xp), 0) / 100)    as nivel,
  coalesce(sum(r.xp), 0) % 100          as xp_en_nivel
from areas a
left join habitos h on h.area_id = a.id
left join registros r on r.habito_id = h.id
group by a.id, a.nombre, a.color, a.orden
order by a.orden;

-- 8. ¿CUMPLIO LA META DEL DIA? -----------------------------------
create or replace function meta_del_dia(f date) returns boolean as $$
declare
  t record; cumplidos int;
begin
  select tu.* into t from dias d join turnos tu on tu.id = d.turno_id where d.fecha = f;
  if t is null then return null; end if;
  if t.meta_nivel = 'ninguno' then return true; end if;   -- posturno: protegido

  select count(*) into cumplidos from registros r
   where r.fecha = f
     and (t.meta_nivel = 'minimo' or r.nivel in ('normal','super'));

  return cumplidos >= t.meta_habitos;
end;
$$ language plpgsql;
