-- =============================================================
-- 003 · Multiusuario real + las cuentas de ZAINT en las tareas
--
-- Parte A: la app deja de ser de un solo usuario.
--   `avatar` y `config` tenian `check (id = 1)`, asi que un segundo usuario
--   NO PODIA EXISTIR: la restriccion prohibia cualquier otro id.
-- Parte B: siembra para cualquier cuenta nueva (sin esto, un usuario nuevo
--   entra a una app vacia).
-- Parte C: cada tarea pertenece a una cuenta, con los dos candados del
--   MODELO_OPERATIVO: maximo 2 activas, y las horas se declaran.
-- =============================================================

-- ---------- PARTE A · quitar el candado de fila unica ----------

do $$
declare c record;
begin
  for c in
    select conname, conrelid::regclass::text as tabla
    from pg_constraint
    where conrelid in ('avatar'::regclass, 'config'::regclass)
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%id = 1%'
  loop
    execute format('alter table %s drop constraint %I', c.tabla, c.conname);
  end loop;
end $$;

-- El id deja de ser fijo en 1 y pasa a ser una secuencia normal.
create sequence if not exists avatar_id_seq;
create sequence if not exists config_id_seq;
select setval('avatar_id_seq', coalesce((select max(id) from avatar), 0) + 1, false);
select setval('config_id_seq', coalesce((select max(id) from config), 0) + 1, false);
alter table avatar alter column id set default nextval('avatar_id_seq');
alter table config alter column id set default nextval('config_id_seq');
alter sequence avatar_id_seq owned by avatar.id;
alter sequence config_id_seq owned by config.id;

-- Lo que de verdad debe ser unico es UNA fila por usuario, no el id.
create unique index if not exists avatar_un_usuario on avatar(usuario_id);
create unique index if not exists config_un_usuario on config(usuario_id);

-- ---------- PARTE C · las cuentas ----------

create table if not exists cuentas (
  id          bigserial primary key,
  usuario_id  uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nombre      text not null,
  estado      text not null default 'mantenimiento'
              check (estado in ('activa', 'mantenimiento', 'dormida')),
  color       text not null default '#7A879B',
  horas_mes   int,
  gatillo     text,   -- que la despierta, si esta dormida
  nota        text,
  orden       int not null default 0,
  creada_en   timestamptz default now()
);

create index if not exists idx_cuentas_usuario on cuentas(usuario_id);

alter table tareas add column if not exists cuenta_id bigint
  references cuentas(id) on delete set null;

alter table cuentas enable row level security;
drop policy if exists "propias_select" on cuentas;
drop policy if exists "propias_insert" on cuentas;
drop policy if exists "propias_update" on cuentas;
drop policy if exists "propias_delete" on cuentas;
create policy "propias_select" on cuentas for select to authenticated
  using (usuario_id = auth.uid());
create policy "propias_insert" on cuentas for insert to authenticated
  with check (usuario_id = auth.uid());
create policy "propias_update" on cuentas for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "propias_delete" on cuentas for delete to authenticated
  using (usuario_id = auth.uid());

-- 🔒 EL CANDADO DE FOCO: maximo 2 cuentas activas.
-- Vive en la base y no en la pantalla a proposito: un candado que se puede
-- esquivar recargando la pagina no es un candado. Con ~35 h/mes, tres cuentas
-- activas es la aritmetica que ya fallo.
create or replace function limite_de_foco()
returns trigger
language plpgsql
as $$
declare n int;
begin
  if new.estado <> 'activa' then return new; end if;
  select count(*) into n from cuentas
  where usuario_id = new.usuario_id and estado = 'activa' and id is distinct from new.id;
  if n >= 2 then
    raise exception 'Ya hay 2 cuentas activas. Para activar esta, otra tiene que salir.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_limite_de_foco on cuentas;
create trigger trg_limite_de_foco
  before insert or update of estado on cuentas
  for each row execute function limite_de_foco();

-- ---------- PARTE B · siembra para cuentas nuevas ----------

/**
 * Un usuario nuevo entraba a una app completamente vacia: sin areas, sin
 * habitos, sin turnos y sin avatar. Esto le da un punto de partida generico
 * y editable — nada de aqui es especifico de Santiago.
 * Es idempotente: si ya tiene areas, no hace nada.
 */
create or replace function sembrar_usuario_nuevo()
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then return 'sin sesion'; end if;
  if exists (select 1 from areas where usuario_id = yo) then return 'ya sembrado'; end if;

  insert into areas (id, nombre, color, orden, usuario_id) values
    ('negocio',     'Negocio',     '#A3BE4C', 1, yo),
    ('desarrollo',  'Desarrollo',  '#4A9CE8', 2, yo),
    ('salud',       'Salud',       '#E85D5D', 3, yo),
    ('relaciones',  'Relaciones',  '#E8A33D', 4, yo),
    ('vida',        'Vida',        '#9B6BE8', 5, yo);

  insert into habitos (id, nombre, area_id, minimo, normal, super, icono, orden, activo, usuario_id) values
    ('ejercicio',  'Ejercicio',  'salud',      'Moverte 10 min', 'Entrenar 30 min', 'Sesion completa', 'footprints',   1, true, yo),
    ('leer',       'Leer',       'desarrollo', '2 paginas',      '10 paginas',      'Un capitulo',     'book-open',    2, true, yo),
    ('dormir',     'Dormir',     'salud',      '6 horas',        '7 horas',         '8 horas',         'bed-double',   3, true, yo),
    ('publicar',   'Publicar',   'negocio',    'Una historia',   'Una pieza',       'Pieza + reparto', 'cloud-upload', 4, true, yo),
    ('aprender',   'Aprender',   'desarrollo', '10 min',         '30 min',          'Una hora',        'lightbulb',    5, true, yo),
    ('bloque',     'Bloque',     'negocio',    '15 min',         '45 min',          '90 min',          'timeline',     6, true, yo),
    ('gente',      'Ver gente',  'relaciones', 'Un mensaje',     'Una llamada',     'Verse en persona','heart-plus',   7, true, yo),
    ('desconectar','Desconectar','vida',       '30 min sin movil','2 h sin movil',  'Medio dia',       'unplug',       8, true, yo);

  insert into turnos (id, nombre, meta_nivel, meta_habitos, capacidad_min, horas_clinica,
                      transporte_min, hora_entrada, hora_salida, recuperacion_min, descripcion, usuario_id) values
    ('LIBRE',    'Dia libre',       'normal',  3, 90, 0,  0,  null,    null,    0,   'Sin trabajo: el bloque largo del dia', yo),
    ('CORTO',    'Media jornada',   'minimo',  2, 45, 6,  60, '08:00', '14:00', 0,   'Media jornada, queda tarde', yo),
    ('COMPLETO', 'Jornada completa','minimo',  1, 10, 10, 60, '07:00', '17:00', 0,   'Dia de trabajo: casi no queda nada', yo),
    ('DESCANSO', 'Dia protegido',   'ninguno', 0, 0,  0,  0,  null,    null,    0,   'Descansar es la tarea. Nunca resta vida', yo);

  insert into peldanos (n, nombre, descripcion, color, usuario_id) values
    (1, 'Levanta la mano', 'Alguien pide comprar o pregunta el precio',  '#A3BE4C', yo),
    (2, 'Quita el freno',  'Destraba algo que impide una compra',        '#4A9CE8', yo),
    (3, 'Gente nueva',     'Te pone delante de quien no te conoce',      '#E8A33D', yo),
    (4, 'Construye',       'Suma capacidad, pero no vende hoy',          '#7A879B', yo)
  on conflict do nothing;

  insert into config (usuario_id, hora_despertar, hora_dormir,
                      vida_por_cumplido, vida_por_incumplido, onboarding_hecho)
    values (yo, '06:30', '22:30', 10, 10, false)
    on conflict do nothing;

  insert into avatar (usuario_id, vida, vida_maxima) values (yo, 1000, 1000)
    on conflict do nothing;

  return 'sembrado';
end $$;

revoke all on function sembrar_usuario_nuevo() from public;
grant execute on function sembrar_usuario_nuevo() to authenticated;

-- ---------- PARTE D · fecha y origen de cada tarea, y la frase del encabezado ----------

-- Santiago pidió ver CUANDO se guardó cada tarea, y distinguir las que dictó.
alter table tareas add column if not exists creada_en timestamptz not null default now();
alter table tareas add column if not exists origen text not null default 'mano'
  check (origen in ('mano', 'voz'));

-- El encabezado deja de decir siempre "MI VIDA": es de quien usa la app.
alter table config add column if not exists frase text;
update config set frase = 'LA BRÚJULA DE TU MUNDO' where frase is null;
