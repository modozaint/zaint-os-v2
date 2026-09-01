-- =============================================================
-- 012 - Las funciones que vivian SOLO en la base
--
-- POR QUE EXISTE ESTE ARCHIVO. Estas cuatro funciones se crearon el 14-ago
-- directamente en Supabase y nunca bajaron al repo. Consecuencia real: durante
-- cuatro dias no se pudo saber por que la vida no se movia, porque la logica
-- que la mueve no se podia LEER. Si la base se pierde, esto no se reconstruye
-- desde el codigo.
--
-- Bajadas de la base con pg_get_functiondef el 2026-08-20. Este archivo es el
-- ESTADO ACTUAL, no un cambio: correrlo deja todo igual que como esta.
--
-- Aqui vive la regla del juego. Si algun dia se cambia como se mueve la vida,
-- se cambia AQUI y se corre — no a mano en el panel de Supabase.
-- =============================================================


-- ---------- cerrar_dia: la unica que mueve la vida ----------
-- Se cobra una sola vez: si el dia ya esta cerrado, devuelve lo guardado y no
-- vuelve a tocar el avatar. Ese candado es lo que permite llamarla de mas.
--
-- La cuenta es la que el HUD anuncia todo el dia:
--   +vida_por_cumplido  por cada habito marcado
--   -vida_por_incumplido por cada habito activo sin marcar
--   los dias protegidos (turno con meta 'ninguno') no restan
create or replace function public.cerrar_dia(f date)
returns table(cumplidos integer, incumplidos integer, balance integer,
              minimos_ok boolean, vida integer)
language plpgsql
set search_path to 'public'
as $function$
declare
  yo uuid := auth.uid();
  cfg record;
  d record;
  activos int;
  hechos int;
  protegido boolean;
  suma int;
  resta int;
  bal int;
  ok boolean;
  vida_nueva int;
begin
  select * into cfg from config where usuario_id = yo limit 1;
  if not found then return; end if;

  select dias.*, t.meta_nivel, t.meta_habitos
    into d
  from dias left join turnos t on t.id = dias.turno_id
  where dias.fecha = f and dias.usuario_id = yo;
  if not found then return; end if;

  if d.cerrado then
    select a.vida into vida_nueva from avatar a where a.usuario_id = yo;
    return query select d.cumplidos, d.incumplidos, d.balance, d.minimos_ok, vida_nueva;
    return;
  end if;

  select count(*)::int into activos from habitos where activo and usuario_id = yo;
  select count(*)::int into hechos  from registros where fecha = f and usuario_id = yo;

  -- Dia protegido: descansar es la tarea, no puede restar vida.
  protegido := coalesce(d.meta_nivel, 'ninguno') = 'ninguno';

  suma  := hechos * cfg.vida_por_cumplido;
  resta := case when protegido then 0
                else (activos - hechos) * cfg.vida_por_incumplido end;
  bal   := suma - resta;
  ok    := protegido or hechos >= coalesce(d.meta_habitos, 0);

  update dias set cerrado = true, cumplidos = hechos,
                  incumplidos = case when protegido then 0 else activos - hechos end,
                  balance = bal, minimos_ok = ok
  where fecha = f and usuario_id = yo;

  update avatar set vida = greatest(0, least(vida_maxima, vida + bal))
  where usuario_id = yo
  returning avatar.vida into vida_nueva;

  return query select hechos, (case when protegido then 0 else activos - hechos end),
                      bal, ok, vida_nueva;
end $function$;


-- ---------- cerrar_dias_pendientes: el cierre perezoso ----------
-- No hay tareas programadas: el dia se cierra cuando se abre la app. Cierra
-- los que ya pasaron, y el de hoy solo si ya paso la hora de dormir.
create or replace function public.cerrar_dias_pendientes()
returns integer
language plpgsql
set search_path to 'public'
as $function$
declare
  yo uuid := auth.uid();
  cfg record;
  hoy date := (now() at time zone 'America/Bogota')::date;
  ahora time := (now() at time zone 'America/Bogota')::time;
  f date;
  n int := 0;
begin
  select * into cfg from config where usuario_id = yo limit 1;
  if not found then return 0; end if;

  for f in
    select fecha from dias
    where usuario_id = yo and not cerrado
      and (fecha < hoy or (fecha = hoy and ahora >= cfg.hora_dormir))
    order by fecha
  loop
    perform cerrar_dia(f);
    n := n + 1;
  end loop;
  return n;
end $function$;


-- ---------- meta_del_dia: si el dia cumplio lo que el turno pedia ----------
-- ⚠️ SOLO CALCULA: no escribe en `dias`. La app la llama y descarta el
--    resultado, y por eso `meta_cumplida` quedo en NULL en todos los dias
--    nuevos. Quien SI guarda el veredicto es `cerrar_dia`, en `minimos_ok`.
--    Son dos definiciones distintas de lo mismo, y esa es deuda viva:
--    esta filtra por nivel del habito, `cerrar_dia` solo cuenta cuantos.
create or replace function public.meta_del_dia(f date)
returns boolean
language plpgsql
as $function$
declare
  t record; cumplidos int;
begin
  select tu.* into t from dias d join turnos tu on tu.id = d.turno_id where d.fecha = f;
  if t is null then return null; end if;
  if t.meta_nivel = 'ninguno' then return true; end if;
  select count(*) into cumplidos from registros r
   where r.fecha = f
     and (t.meta_nivel = 'minimo' or r.nivel in ('normal','super'));
  return cumplidos >= t.meta_habitos;
end $function$;


-- ---------- reclamar_datos_iniciales: adopta lo que quedo sin dueno ----------
-- SECURITY DEFINER porque tiene que ver filas que RLS le esconde al propio
-- dueno. El candado es el correo: un desconocido que cree cuenta no puede
-- reclamar nada.
create or replace function public.reclamar_datos_iniciales()
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  yo uuid := auth.uid();
  correo text;
  n int := 0;
  m int;
  t text;
begin
  if yo is null then return 'sin sesion'; end if;
  select email into correo from auth.users where id = yo;
  if correo is null or lower(correo) not in
     ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com') then
    return 'este usuario no puede reclamar los datos iniciales';
  end if;
  foreach t in array array['areas','habitos','turnos','dias','registros','avatar','config','tareas','peldanos']
  loop
    execute format('update %I set usuario_id = $1 where usuario_id is null', t) using yo;
    get diagnostics m = row_count;
    n := n + m;
  end loop;
  return format('%s filas reclamadas', n);
end $function$;
