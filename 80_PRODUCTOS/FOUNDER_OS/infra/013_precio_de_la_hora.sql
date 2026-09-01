-- =============================================================
-- 013 - Cuanto vale tu hora, y que sale mas barato que hacerlo tu
--
-- DE DONDE SALE. Sesion 2 con Pablo (2026-08-19) y el destilado de Freddy Vega
-- (VIDEOTECA/PERSONAL/2026-08-07): la hora se calcula con lo que uno QUIERE
-- ganar dividido por las horas que de verdad tiene, no por las 192 de un mes
-- de oficina. Para Santiago: $2.500.000 / ~35 h = ~$71.400.
--
-- ⚠️ ESTO NO MEZCLA PLATA PERSONAL CON LA DEL NEGOCIO. Es un CRITERIO de
--    decision, no un movimiento: no hay llave foranea con `bancos` ni con
--    `bolsillos`, y `cuentas` (las unidades de ZAINT) sigue midiendo horas.
--
-- EL CAMPO QUE DE VERDAD IMPORTA ES `pedido_enviado`. Lo que quedo escrito en
-- la sesion es que el cuello de botella no es saber que delegar: es PEDIRLO.
-- Decidir y pedir son dos actos distintos, y el segundo es el que falta.
-- =============================================================

alter table config
  add column if not exists meta_ingreso_mes numeric not null default 2500000,
  add column if not exists horas_libres_mes numeric not null default 35;

alter table tareas
  add column if not exists costo_delegar numeric,
  add column if not exists delegar_a text,
  add column if not exists pedido_enviado boolean not null default false;

comment on column config.meta_ingreso_mes is
  'Lo que se quiere ganar al mes. Con horas_libres_mes sale el precio de la hora.';
comment on column config.horas_libres_mes is
  'Horas reales al mes fuera de la clinica. En agosto 2026: ~35 (15 turnos, 178 h).';
comment on column tareas.costo_delegar is
  'Cuanto costaria que otro la haga. Si es menor que minutos x precio_hora, delegar ahorra.';
comment on column tareas.pedido_enviado is
  'Si ya se pidio de verdad. Decidir delegar no es pedirlo.';
