-- =============================================================
-- 008 · El plan línea por línea, y los ajustes de agosto
--
-- A: cada categoría se abre en sus conceptos reales. Sin esto el presupuesto
--    dice "Educación y negocio $230.500" y no en QUÉ se va.
-- B: los cambios de agosto: ChatGPT cancelado, Parcero por cancelar, la cuota
--    de manejo baja a $15.900 con la NU, y entra Hostinger — que faltaba en el
--    informe del asesor y salió del propio conector de Hostinger ($57.900/mes,
--    VPS KVM 1). Spotify se queda en Gastos del hogar, por decisión de Santiago.
-- =============================================================

create table if not exists presupuesto_conceptos (
  id           bigserial primary key,
  usuario_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  categoria_id bigint not null references categorias_gasto(id) on delete cascade,
  grupo        text,                       -- el bolsillo al que pertenece
  concepto     text not null,
  detalle      text,                       -- "$36.000 a la semana"
  monto_mes    numeric(14,2) not null default 0,
  activo       boolean not null default true,
  orden        int not null default 0
);

create index if not exists idx_conceptos_cat on presupuesto_conceptos(categoria_id);

alter table presupuesto_conceptos enable row level security;
drop policy if exists "propias_select" on presupuesto_conceptos;
drop policy if exists "propias_insert" on presupuesto_conceptos;
drop policy if exists "propias_update" on presupuesto_conceptos;
drop policy if exists "propias_delete" on presupuesto_conceptos;
create policy "propias_select" on presupuesto_conceptos for select to authenticated using (usuario_id = auth.uid());
create policy "propias_insert" on presupuesto_conceptos for insert to authenticated with check (usuario_id = auth.uid());
create policy "propias_update" on presupuesto_conceptos for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "propias_delete" on presupuesto_conceptos for delete to authenticated using (usuario_id = auth.uid());

do $$
declare
  yo uuid;
  c_hogar bigint; c_neces bigint; c_ahorro bigint;
  c_diver bigint; c_edu bigint; c_deudas bigint;
  nuevo_edu numeric;
begin
  select id into yo from auth.users
  where lower(email) in ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com')
  order by created_at limit 1;
  if yo is null then raise notice 'Entra a la app primero.'; return; end if;
  if exists (select 1 from presupuesto_conceptos where usuario_id = yo) then
    raise notice 'Los conceptos ya estaban cargados.'; return;
  end if;

  select id into c_hogar  from categorias_gasto where usuario_id = yo and orden = 1;
  select id into c_neces  from categorias_gasto where usuario_id = yo and orden = 2;
  select id into c_ahorro from categorias_gasto where usuario_id = yo and orden = 3;
  select id into c_diver  from categorias_gasto where usuario_id = yo and orden = 4;
  select id into c_edu    from categorias_gasto where usuario_id = yo and orden = 5;
  select id into c_deudas from categorias_gasto where usuario_id = yo and orden = 6;

  insert into presupuesto_conceptos (usuario_id, categoria_id, grupo, concepto, detalle, monto_mes, orden) values
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Aporte a la mamá',         null, 200000, 1),
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Luz',                      null, 100000, 2),
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Mercado completo del mes', null,  70000, 3),
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Agua',                     null,  50000, 4),
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Spotify',                  null,  30500, 5),
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Arena de la gata',         null,  25000, 6),
    (yo, c_hogar, 'SERVICIOS, MERCADO, GATA, CELULAR Y MAMÁ', 'Celular (recargas)',       null,  20000, 7),

    (yo, c_neces, 'GASOLINA',                  'Gasolina de transporte propio', '$36.000 a la semana',     144000, 1),
    (yo, c_neces, 'ROPA, BELLEZA Y ARTÍCULOS', 'Ropa, calzado, accesorios',     null,                      100000, 2),
    (yo, c_neces, 'ROPA, BELLEZA Y ARTÍCULOS', 'Barbería',                      null,                       50000, 3),
    (yo, c_neces, 'ROPA, BELLEZA Y ARTÍCULOS', 'Loción',                        '$125.000 cada 2.5 meses',  50000, 4),
    (yo, c_neces, 'ROPA, BELLEZA Y ARTÍCULOS', 'Crema',                         '$40.000 cada 2 meses',     20000, 5),

    (yo, c_ahorro, 'ANUALES DE LA MOTO', 'Mantenimiento y repuestos', '$600.000 al año',        50000, 1),
    (yo, c_ahorro, 'ANUALES DE LA MOTO', 'SOAT e ITV',                '$326.600 al año',        27000, 2),
    (yo, c_ahorro, 'ANUALES DE LA MOTO', 'Revisión tecnomecánica',    '$240.000 al año',        20000, 3),
    (yo, c_ahorro, 'CELULAR Y LENTES',   'Lentes',                    '$600.000 al año',        50000, 4),
    (yo, c_ahorro, 'CELULAR Y LENTES',   'Cambio de celular',         '$900.000 cada 24 meses', 38000, 5),

    (yo, c_diver, 'RECREACIÓN Y CULTURA', 'Domicilios',   '$30.000 a la semana',   120000, 1),
    (yo, c_diver, 'RECREACIÓN Y CULTURA', 'Restaurantes', null,                     80000, 2),
    (yo, c_diver, 'RECREACIÓN Y CULTURA', 'Mecato',       null,                     80000, 3),
    (yo, c_diver, 'RECREACIÓN Y CULTURA', 'Cine',         '$100.000 cada 2 meses',  50000, 4),
    (yo, c_diver, 'RECREACIÓN Y CULTURA', 'Regalos',      null,                     50000, 5),

    (yo, c_edu, 'NEGOCIO / EDUCACIÓN', 'Claude',          null,                                     79000, 1),
    (yo, c_edu, 'NEGOCIO / EDUCACIÓN', 'Hostinger',       'VPS KVM 1 · renueva el 30 de cada mes',  57900, 2),
    (yo, c_edu, 'NEGOCIO / EDUCACIÓN', 'Cuota de manejo', 'Tarjeta NU · antes $24.000',             15900, 3),
    (yo, c_edu, 'NEGOCIO / EDUCACIÓN', 'Shopify',         null,                                      3500, 4),

    (yo, c_deudas, 'OBLIGACIONES FINANCIERAS', 'Confiar · refinanciamiento', 'Saldo $11.000.000', 323000, 1),
    (yo, c_deudas, 'OBLIGACIONES FINANCIERAS', 'Crédito de la moto',         'Saldo $5.000.000',   50000, 2);

  -- Los cancelados quedan registrados, no borrados: son la prueba del ahorro.
  insert into presupuesto_conceptos (usuario_id, categoria_id, grupo, concepto, detalle, monto_mes, activo, orden) values
    (yo, c_edu, 'NEGOCIO / EDUCACIÓN', 'ChatGPT',            'Cancelado en agosto',        99000, false, 8),
    (yo, c_edu, 'NEGOCIO / EDUCACIÓN', 'Parcero Financiero', 'Se reemplaza por esta app',  25000, false, 9);

  -- Educación y negocio baja a la suma de lo que sigue activo.
  select coalesce(sum(monto_mes), 0) into nuevo_edu
  from presupuesto_conceptos
  where usuario_id = yo and categoria_id = c_edu and activo;

  update presupuesto_lineas
  set monto = nuevo_edu
  where usuario_id = yo and escenario = 'despues' and categoria_id = c_edu;

  raise notice 'Conceptos cargados. Educación y negocio: 230.500 -> %', nuevo_edu;
end $$;
