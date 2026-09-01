-- =============================================================
-- 011 - Los dias que existen pero nadie ve
--
-- EL SINTOMA (16 al 18 de agosto, reportado por Santiago):
--   1. El historial no muestra los dias anteriores.
--   2. La vida sigue en 1000 aunque haya dias sin cumplir.
--
-- LA CAUSA, UNA SOLA PARA LOS DOS:
--   La tabla `dias` casi no tiene filas visibles para el usuario. Sin fila de
--   dia no hay historial que listar, y `cerrar_dias_pendientes` no encuentra
--   nada que cerrar, asi que la vida nunca se mueve.
--
--   Dos motivos posibles, y este script cubre los dos:
--   a) Los dias migrados de Notion (8-14 ago) se insertaron ANTES del
--      multiusuario, asi que quedaron con usuario_id NULL. RLS los esconde
--      del propio dueno.
--   b) `marcarHabito` inserta la fila del dia sin mirar si el insert fallo:
--      si fallaba, el habito quedaba guardado y el dia no.
--
-- QUE HACE:
--   1. Adopta toda fila sin dueno (usuario_id NULL) y se la asigna a Santiago.
--   2. Crea la fila de `dias` que falte, sacada de los habitos ya marcados:
--      si un dia tiene un habito, ese dia existio.
--   3. Deja un resumen para verificar.
--
-- ⚠️ YA NO HACE FALTA CORRERLO A MANO (18-ago). La app hace lo mismo sola al
--    abrirse: `repararDias()` en lib/datos.ts llama a reclamar_datos_iniciales
--    y crea los dias que falten. Esto queda como RESPALDO, para el caso en que
--    RLS no deje adoptar una fila desde la sesion del usuario.
--
-- COMO SE CORRE, si hace falta: pegar entero en Supabase > SQL Editor > Run.
-- Es idempotente: correrlo dos veces no hace dano.
-- =============================================================

do $$
declare
  yo uuid;
  n int;
  tabla text;
  tiene_col bool;
begin
  select id into yo from auth.users
  where lower(email) in ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com')
  order by created_at limit 1;

  if yo is null then
    raise exception 'No encontre el usuario. Entra a la app primero.';
  end if;
  raise notice 'Usuario: %', yo;

  -- ---------- 1. Adoptar lo que no tiene dueno ----------
  foreach tabla in array array[
    'dias', 'registros', 'habitos', 'areas', 'turnos', 'config', 'avatar',
    'peldanos', 'tareas', 'bancos', 'bolsillos'
  ]
  loop
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = tabla and column_name = 'usuario_id'
    ) into tiene_col;

    if tiene_col then
      execute format('update public.%I set usuario_id = $1 where usuario_id is null', tabla)
        using yo;
      get diagnostics n = row_count;
      if n > 0 then raise notice '  %: % filas adoptadas', tabla, n; end if;
    end if;
  end loop;

  -- ---------- 2. El dia que falta, sacado de los habitos ----------
  -- Si hay un habito marcado, ese dia existio. Sin esta fila el dia es
  -- invisible para el historial y para el cierre.
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dias' and column_name = 'usuario_id'
  ) into tiene_col;

  if tiene_col then
    insert into dias (fecha, usuario_id)
    select distinct r.fecha, yo
    from registros r
    where not exists (select 1 from dias d where d.fecha = r.fecha)
    on conflict do nothing;
  else
    insert into dias (fecha)
    select distinct r.fecha
    from registros r
    where not exists (select 1 from dias d where d.fecha = r.fecha)
    on conflict do nothing;
  end if;

  get diagnostics n = row_count;
  raise notice 'Dias creados desde los habitos marcados: %', n;
end $$;

-- ---------- 3. Verificacion: esto es lo que hay que mirar ----------
select
  (select count(*) from dias)                   as dias_totales,
  (select count(*) from registros)              as registros_totales,
  (select count(distinct fecha) from registros) as dias_con_habitos,
  (select min(fecha) from dias)                 as primer_dia,
  (select max(fecha) from dias)                 as ultimo_dia,
  (select vida from avatar limit 1)             as vida_ahora;


-- =============================================================
-- OPCIONAL - Perdonar lo de atras
--
-- Al aparecer los dias viejos, el cierre los va a procesar TODOS de una y la
-- vida va a caer de golpe por dias que ya pasaron y que no se pueden volver a
-- vivir. Con 8 habitos, un dia con 3 marcados resta 20; diez dias asi son 200.
--
-- Castigar hacia atras no cambia ninguna conducta: la vida existe para que
-- duela HOY, cuando todavia se puede hacer algo.
--
-- Si prefieres arrancar el marcador desde hoy, quita los dos guiones de las
-- lineas de abajo y corre solo eso. Si quieres asumir el golpe, no hagas nada.
-- =============================================================

-- update dias set cerrado = true where fecha < current_date and cerrado is not true;
-- select 'Dias viejos marcados como cerrados. La vida empieza a contar desde hoy.' as listo;
