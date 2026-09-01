-- =============================================================
-- 006 · TU PRESUPUESTO — antes y despues de la asesoria
--
-- La segunda mitad de lo que hace falta para dejar Parcero Financiero.
-- 🔑 Lo central: hay DOS escenarios y confundirlos invierte cualquier
--    conclusion. Antes: deficit de -$78.050. Despues: superavit de +$265.167.
--    Por eso el escenario es parte de la llave, no un campo suelto.
-- =============================================================

create table if not exists presupuesto (
  id         bigserial primary key,
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  escenario  text not null check (escenario in ('antes', 'despues')),
  ingresos   numeric(14,2) not null default 0,
  ahorro     numeric(14,2) not null default 0,
  nota       text,
  unique (usuario_id, escenario)
);

/**
 * Las categorias son del usuario y llevan su porcentaje ideal. `mas_es_mejor`
 * cambia como se lee el semaforo: pasarse en Diversion es malo, pasarse en
 * Ahorro es bueno. Sin esa bandera el ahorro saldria en rojo por ir bien.
 */
create table if not exists categorias_gasto (
  id           bigserial primary key,
  usuario_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre       text not null,
  ideal_pct    numeric(5,2) not null default 0,
  color        text not null default '#7A879B',
  mas_es_mejor boolean not null default false,
  orden        int not null default 0
);

create table if not exists presupuesto_lineas (
  id           bigserial primary key,
  usuario_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  escenario    text not null check (escenario in ('antes', 'despues')),
  categoria_id bigint not null references categorias_gasto(id) on delete cascade,
  monto        numeric(14,2) not null default 0,
  unique (usuario_id, escenario, categoria_id)
);

create index if not exists idx_lineas_usuario on presupuesto_lineas(usuario_id, escenario);

do $$
declare t text;
begin
  foreach t in array array['presupuesto','categorias_gasto','presupuesto_lineas']
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

-- ---------- Los numeros reales de Santiago (capturas del 2026-08-14) ----------
do $$
declare
  yo uuid;
  c_hogar bigint; c_neces bigint; c_ahorro bigint;
  c_diver bigint; c_edu bigint; c_deudas bigint;
begin
  select id into yo from auth.users
  where lower(email) in ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com')
  order by created_at limit 1;

  if yo is null then
    raise notice 'Entra a la app primero: todavia no existe la cuenta de Santiago.';
    return;
  end if;
  if exists (select 1 from categorias_gasto where usuario_id = yo) then
    raise notice 'El presupuesto ya estaba cargado. No se toca nada.';
    return;
  end if;

  insert into presupuesto (usuario_id, escenario, ingresos, ahorro, nota) values
    (yo, 'antes',   2219333, 0,      'Como estaba antes de la asesoria'),
    (yo, 'despues', 2302667, 190000, 'El plan que quedo con la asesoria');

  insert into categorias_gasto (usuario_id, nombre, ideal_pct, color, mas_es_mejor, orden)
  values (yo, 'Gastos del hogar',    30, '#C97B4A', false, 1) returning id into c_hogar;
  insert into categorias_gasto (usuario_id, nombre, ideal_pct, color, mas_es_mejor, orden)
  values (yo, 'Necesidades basicas', 25, '#E85D5D', false, 2) returning id into c_neces;
  insert into categorias_gasto (usuario_id, nombre, ideal_pct, color, mas_es_mejor, orden)
  values (yo, 'Ahorro con proposito',10, '#3E9E82', true,  3) returning id into c_ahorro;
  insert into categorias_gasto (usuario_id, nombre, ideal_pct, color, mas_es_mejor, orden)
  values (yo, 'Diversion y gastos',  20, '#E8A33D', false, 4) returning id into c_diver;
  insert into categorias_gasto (usuario_id, nombre, ideal_pct, color, mas_es_mejor, orden)
  values (yo, 'Educacion y negocio', 10, '#4A9CE8', false, 5) returning id into c_edu;
  insert into categorias_gasto (usuario_id, nombre, ideal_pct, color, mas_es_mejor, orden)
  values (yo, 'Deudas',              10, '#9B6BE8', false, 6) returning id into c_deudas;

  insert into presupuesto_lineas (usuario_id, escenario, categoria_id, monto) values
    (yo, 'antes',   c_hogar,  465000),
    (yo, 'antes',   c_neces,  482050),
    (yo, 'antes',   c_ahorro,      0),
    (yo, 'antes',   c_diver,  638500),
    (yo, 'antes',   c_edu,    338833),
    (yo, 'antes',   c_deudas, 373000),
    (yo, 'despues', c_hogar,  500000),
    (yo, 'despues', c_neces,  364000),
    (yo, 'despues', c_ahorro, 190000),
    (yo, 'despues', c_diver,  380000),
    (yo, 'despues', c_edu,    230500),
    (yo, 'despues', c_deudas, 373000);

  raise notice 'Presupuesto cargado: antes -78.050 / despues +265.167';
end $$;
