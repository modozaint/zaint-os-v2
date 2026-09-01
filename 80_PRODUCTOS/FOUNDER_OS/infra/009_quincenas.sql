-- =============================================================
-- 009 · La quincena entra a los bolsillos
--
-- Por que: a Santiago la plata NO le entra una vez al mes, le entra dos veces.
-- Un presupuesto mensual obliga a dividir de cabeza cada 15 dias, que es justo
-- el momento en que se abandona. Ahora cada bolsillo declara CUANDO se llena.
--
-- `asignacion_mes` sigue siendo la verdad (el mes es la unidad del presupuesto
-- y del informe del asesor). El ritmo solo dice como se reparte ese mes:
--
--   quincenal → mitad en cada quincena
--   q1        → completo, con la primera quincena (1-15)
--   q2        → completo, con la segunda  (16-fin de mes)
--   mensual   → el valor heredado; se comporta como q1
--
-- ⚠️ La vista `bolsillos_con_saldo` se recrea a proposito. Se definio con
--    `select b.*`, y en Postgres eso CONGELA las columnas al momento de
--    crearla: sin dropearla, la columna nueva nunca aparece en la app.
-- =============================================================

alter table bolsillos
  add column if not exists ritmo text not null default 'mensual';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'bolsillos'::regclass and conname = 'bolsillos_ritmo_valido'
  ) then
    alter table bolsillos add constraint bolsillos_ritmo_valido
      check (ritmo in ('mensual', 'quincenal', 'q1', 'q2'));
  end if;
end $$;

-- ---------- La vista, con la columna nueva ----------
drop view if exists bolsillos_con_saldo;

create view bolsillos_con_saldo
with (security_invoker = on) as
select
  b.*,
  coalesce(sum(case when m.tipo = 'cargar' then m.monto else -m.monto end), 0) as saldo,
  count(m.id) as n_movimientos,
  -- Lo que YA se cargo en la quincena en curso. Sirve para saber que falta
  -- meter sin tener que abrir los movimientos uno por uno.
  coalesce(sum(case
    when m.tipo = 'cargar'
     and m.fecha >= (case
           when extract(day from (now() at time zone 'America/Bogota')) <= 15
           then date_trunc('month', (now() at time zone 'America/Bogota'))::date
           else (date_trunc('month', (now() at time zone 'America/Bogota'))::date + 15)
         end)
    then m.monto else 0 end), 0) as cargado_quincena
from bolsillos b
left join movimientos m on m.bolsillo_id = b.id
group by b.id;

-- ---------- Comprobacion ----------
-- select nombre, ritmo, asignacion_mes, saldo, cargado_quincena
--   from bolsillos_con_saldo order by orden;
