-- =============================================================
-- 010 · Los bolsillos salen del presupuesto, no de la memoria
--
-- El presupuesto ya tiene los grupos reales (008): SERVICIOS/MERCADO/GATA,
-- GASOLINA, ROPA Y BELLEZA, ANUALES DE LA MOTO, CELULAR Y LENTES, RECREACION,
-- NEGOCIO/EDUCACION y OBLIGACIONES. Esos grupos SON los bolsillos — escribirlos
-- otra vez a mano seria copiar un dato que ya existe, y copiar es como se
-- desincronizan las cosas.
--
-- Cada bolsillo queda con la suma de sus conceptos ACTIVOS. Los cancelados
-- (ChatGPT, Parcero) no suman: por eso se guardaron desactivados.
--
-- ⚠️ Requiere 009 (la columna `ritmo`).
-- ⚠️ Idempotente: si ya hay bolsillos, no toca nada.
-- =============================================================

do $$
declare
  yo uuid;
  banco bigint;
  g record;
  nombre_corto text;
  ritmo_grupo text;
  n int := 0;
begin
  select id into yo from auth.users
  where lower(email) in ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com')
  order by created_at limit 1;
  if yo is null then raise notice 'Entra a la app primero.'; return; end if;

  if exists (select 1 from bolsillos where usuario_id = yo) then
    raise notice 'Ya hay bolsillos. No se toca nada.';
    return;
  end if;

  -- Un banco donde vivan. Si ya hay uno, se usa el primero.
  select id into banco from bancos where usuario_id = yo order by orden, id limit 1;
  if banco is null then
    insert into bancos (usuario_id, nombre, saldo_total, orden)
      values (yo, 'Principal', 0, 1)
      returning id into banco;
    raise notice 'Banco "Principal" creado — renombralo al tuyo.';
  end if;

  for g in
    select p.grupo, sum(p.monto_mes) as mes
    from presupuesto_conceptos p
    where p.usuario_id = yo and p.activo and p.grupo is not null
    group by p.grupo
    order by sum(p.monto_mes) desc
  loop
    -- Nombres cortos: en el celular un titulo de 40 caracteres no se lee.
    nombre_corto := case
      when g.grupo like 'SERVICIOS%'   then 'Hogar y servicios'
      when g.grupo like 'GASOLINA%'    then 'Gasolina'
      when g.grupo like 'ROPA%'        then 'Ropa y belleza'
      when g.grupo like 'ANUALES%'     then 'Anuales de la moto'
      when g.grupo like 'CELULAR%'     then 'Celular y lentes'
      when g.grupo like 'RECREACION%'  then 'Diversión'
      when g.grupo like 'RECREACIÓN%'  then 'Diversión'
      when g.grupo like 'NEGOCIO%'     then 'Negocio y educación'
      when g.grupo like 'OBLIGACIONES%' then 'Obligaciones'
      else initcap(lower(g.grupo))
    end;

    -- Lo que se gasta de a poco se llena cada quincena; lo que se paga de una
    -- (cuotas, suscripciones) va completo con la primera.
    ritmo_grupo := case
      when g.grupo like 'OBLIGACIONES%' then 'q1'
      when g.grupo like 'NEGOCIO%'      then 'q1'
      else 'quincenal'
    end;

    insert into bolsillos (usuario_id, banco_id, nombre, asignacion_mes, ritmo, color, orden)
    values (
      yo, banco, nombre_corto, g.mes, ritmo_grupo,
      case
        when g.grupo like 'SERVICIOS%'    then '#C97B4A'
        when g.grupo like 'GASOLINA%'     then '#E85D5D'
        when g.grupo like 'ROPA%'         then '#E85D5D'
        when g.grupo like 'ANUALES%'      then '#3E9E82'
        when g.grupo like 'CELULAR%'      then '#3E9E82'
        when g.grupo like 'NEGOCIO%'      then '#4A9CE8'
        when g.grupo like 'OBLIGACIONES%' then '#9B6BE8'
        else '#E8A33D'
      end,
      n + 1
    );
    n := n + 1;
  end loop;

  raise notice 'Listos % bolsillos, con el monto real de tu presupuesto.', n;
end $$;

-- ---------- Comprobacion ----------
-- select nombre, ritmo, asignacion_mes from bolsillos_con_saldo order by orden;
