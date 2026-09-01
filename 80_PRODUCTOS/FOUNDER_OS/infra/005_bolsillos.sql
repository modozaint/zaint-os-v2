-- =============================================================
-- 005 · BOLSILLOS — presupuesto por sobres (dinero PERSONAL)
--
-- Reemplaza el uso diario de Parcero Financiero. Alcance decidido por Santiago
-- el 2026-08-14: solo bolsillos. Metas y diagnostico por categoria, despues y
-- solo si esto se usa de verdad a los 15 dias.
--
-- ⚠️ SEPARACION. Estas tablas son de dinero PERSONAL y no se cruzan nunca con
--    `cuentas` (las unidades de ZAINT, que miden HORAS, no plata). Es la regla
--    de no mezclar dinero personal y de negocio, aplicada al esquema: no hay
--    ninguna llave entre los dos mundos, asi que no se pueden sumar por error.
-- =============================================================

create table if not exists bancos (
  id          bigserial primary key,
  usuario_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre      text not null,
  -- Lo que dice la app del banco. Se actualiza a mano, como en Parcero.
  saldo_total numeric(14,2) not null default 0,
  color       text not null default '#4A9CE8',
  orden       int not null default 0,
  creado_en   timestamptz default now()
);

create table if not exists bolsillos (
  id             bigserial primary key,
  usuario_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  banco_id       bigint not null references bancos(id) on delete cascade,
  nombre         text not null,
  asignacion_mes numeric(14,2) not null default 0,   -- cuanto deberia entrar cada mes
  meta           numeric(14,2),                      -- opcional: a cuanto quiere llegar
  color          text not null default '#E8A33D',
  orden          int not null default 0,
  creado_en      timestamptz default now()
);

create table if not exists movimientos (
  id          bigserial primary key,
  usuario_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bolsillo_id bigint not null references bolsillos(id) on delete cascade,
  tipo        text not null check (tipo in ('cargar', 'descargar')),
  monto       numeric(14,2) not null check (monto > 0),
  nota        text,
  fecha       date not null default (now() at time zone 'America/Bogota')::date,
  creado_en   timestamptz default now()
);

create index if not exists idx_bancos_usuario      on bancos(usuario_id);
create index if not exists idx_bolsillos_banco     on bolsillos(banco_id);
create index if not exists idx_movimientos_bolsillo on movimientos(bolsillo_id, fecha desc);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['bancos','bolsillos','movimientos']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "propias_select" on %I', t);
    execute format('drop policy if exists "propias_insert" on %I', t);
    execute format('drop policy if exists "propias_update" on %I', t);
    execute format('drop policy if exists "propias_delete" on %I', t);
    execute format('create policy "propias_select" on %I for select to authenticated using (usuario_id = auth.uid())', t);
    execute format('create policy "propias_insert" on %I for insert to authenticated with check (usuario_id = auth.uid())', t);
    execute format('create policy "propias_update" on %I for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid())', t);
    execute format('create policy "propias_delete" on %I for delete to authenticated using (usuario_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- Saldos ----------
-- El saldo de un bolsillo NO se guarda: se calcula de sus movimientos. Un saldo
-- guardado se desincroniza el primer dia que algo falle a medias.
create or replace view bolsillos_con_saldo
with (security_invoker = on) as
select
  b.*,
  coalesce(sum(case when m.tipo = 'cargar' then m.monto else -m.monto end), 0) as saldo,
  count(m.id) as n_movimientos
from bolsillos b
left join movimientos m on m.bolsillo_id = b.id
group by b.id;

-- Lo que hay en el banco pero todavia no esta repartido en ningun bolsillo.
create or replace view bancos_con_disponible
with (security_invoker = on) as
select
  ba.*,
  coalesce((
    select sum(case when m.tipo = 'cargar' then m.monto else -m.monto end)
    from bolsillos bo
    left join movimientos m on m.bolsillo_id = bo.id
    where bo.banco_id = ba.id
  ), 0) as en_bolsillos,
  ba.saldo_total - coalesce((
    select sum(case when m.tipo = 'cargar' then m.monto else -m.monto end)
    from bolsillos bo
    left join movimientos m on m.bolsillo_id = bo.id
    where bo.banco_id = ba.id
  ), 0) as disponible
from bancos ba;
