-- =============================================================
-- 004 · Las cuentas de ZAINT — personalizacion de Santiago
--
-- ⚠️ Este archivo NO es parte de la base generica. El 003 siembra cuentas
--    vacias para cualquier usuario; este carga las de Santiago.
--
-- Los estados salen de 05_CURRENT_PRIORITIES.md, que es la fuente unica de
-- la jerarquia de prioridad del vault. Si alli cambian, aqui quedan viejos.
--
-- Los colores son de INTERFAZ, para distinguirlas de un vistazo. NO son las
-- paletas de identidad de las marcas — esas viven en BRANDS/ y no se tocan.
-- =============================================================

do $$
declare yo uuid;
begin
  select id into yo from auth.users
  where lower(email) in ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com')
  order by created_at limit 1;

  if yo is null then
    raise notice 'Todavia no existe la cuenta de Santiago. Entra a la app primero y vuelve a correr esto.';
    return;
  end if;

  if exists (select 1 from cuentas where usuario_id = yo) then
    raise notice 'Las cuentas ya estaban sembradas. No se toca nada.';
    return;
  end if;

  insert into cuentas (usuario_id, nombre, estado, color, orden, gatillo, nota) values
    (yo, 'SOLUCIONES IA',   'activa',        '#4A9CE8', 1, null,
     'La unica cuenta activa de agosto y la de mejor economia: margen de software, motor propio de adquisicion, cero inventario.'),

    (yo, 'MODOZAINT',       'mantenimiento', '#A3BE4C', 2, null,
     '1.671 seguidores y 22.900 me gusta con ~70 videos. Le preguntan por maquinas y tela de tufting: demanda entrante, gratis y repetida, sin atender.'),

    (yo, 'Dermatinta',      'mantenimiento', '#3E9E82', 3, null,
     '0 ventas. Cobra 79% sobre el PVP que sugiere su propio fabricante. Bajar el precio es gratis y es lo primero.'),

    (yo, 'House of Kaizen', 'mantenimiento', '#E8A33D', 4, null,
     'La unica cuenta con ventas a desconocidos: dos, llegadas por los videos. RIESGO: la maquina esta fallando y no hay quien la arregle.'),

    (yo, 'LUUMUS',          'dormida',       '#9B6BE8', 5,
     '¿House of Kaizen ya vendio una pieza a precio real? (vendio dos, falta saber si con margen)',
     'Comparte taller, maquina y manos con HK: arrancarla antes es apagar HK.'),

    (yo, 'Adaptogenos',     'dormida',       '#7A879B', 6,
     '¿Dermatinta ya vendio?',
     'Oportunidad dormida. No trabajar sin reactivacion explicita.');

  -- Las tareas que ya existen quedan sin cuenta a proposito: que Santiago las
  -- reparta a mano es el ejercicio, no un dato que yo deba adivinar.
  raise notice 'Cuentas de ZAINT sembradas.';
end $$;
