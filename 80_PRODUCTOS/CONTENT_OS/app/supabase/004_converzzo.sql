-- ================================================================
-- Content OS — Migración 004: el sistema Converzzo en el Plan
--
-- Trae al calendario las tres rejillas del curso, que son lo que
-- convierte una grilla de fechas en un sistema que decide QUÉ pieza
-- toca, no solo cuándo:
--
--   1. FUNCIÓN  — para qué existe la pieza (mezcla 50/25/25)
--   2. ÁNGULO   — el enfoque, de una lista cerrada de 9
--   3. ROTACIÓN — 70 % probado / 20 % en prueba / 10 % experimental
--
-- Fuente: CONTENIDO/CURSO_CONVERZZO/ (módulo 4 y ángulos-y-formatos).
-- Idempotente: se puede correr varias veces sin romper nada.
-- ================================================================

alter table piezas add column if not exists funcion  text;
alter table piezas add column if not exists angulo   text;
alter table piezas add column if not exists rotacion text default 'probado';

-- Las tres listas son cerradas a propósito. Si cualquiera se puede
-- inventar sobre la marcha, el balance del mes deja de significar algo.
alter table piezas drop constraint if exists piezas_funcion_valida;
alter table piezas add constraint piezas_funcion_valida
  check (funcion is null or funcion in ('adquisicion','autoridad','conversion'));

alter table piezas drop constraint if exists piezas_angulo_valido;
alter table piezas add constraint piezas_angulo_valido
  check (angulo is null or angulo in (
    'tutorial','comparacion','desmitificacion','correcto_incorrecto',
    'consejo','transformacion','reto','storytelling','review'
  ));

alter table piezas drop constraint if exists piezas_rotacion_valida;
alter table piezas add constraint piezas_rotacion_valida
  check (rotacion is null or rotacion in ('probado','prueba','experimental'));

create index if not exists piezas_funcion_idx  on piezas (funcion);
create index if not exists piezas_rotacion_idx on piezas (rotacion);

-- ----------------------------------------------------------------
-- El plan de escenas: lo que convierte un guion en un rodaje.
-- Cada escena lleva sus CUATRO capas de hook (visual, verbal,
-- textual, auditiva), que es lo que pide el módulo 4: un hook cada
-- ~3 segundos combinando tipos, no una sola frase al principio.
-- ----------------------------------------------------------------
alter table piezas add column if not exists escenas jsonb;

-- ----------------------------------------------------------------
-- METAS: la cadencia deja de ser un número suelto.
--
-- El módulo 4 da frecuencias POR FORMATO, no una cifra global —
-- reel 2-3/semana no es lo mismo que carrusel 1-2/semana. Y da dos
-- balances que el calendario tiene que poder medir.
-- ----------------------------------------------------------------
alter table metas add column if not exists frecuencias jsonb
  default '{"reel":3,"carrusel":1,"story":0,"foto":0}'::jsonb;

-- La mezcla de arranque del curso para una cuenta desde casi cero.
alter table metas add column if not exists mezcla jsonb
  default '{"adquisicion":50,"autoridad":25,"conversion":25}'::jsonb;

alter table metas add column if not exists rotacion_objetivo jsonb
  default '{"probado":70,"prueba":20,"experimental":10}'::jsonb;

-- Las filas que ya existían no traen los defaults: se les ponen.
update metas set
  frecuencias       = coalesce(frecuencias,       '{"reel":3,"carrusel":1,"story":0,"foto":0}'::jsonb),
  mezcla            = coalesce(mezcla,            '{"adquisicion":50,"autoridad":25,"conversion":25}'::jsonb),
  rotacion_objetivo = coalesce(rotacion_objetivo, '{"probado":70,"prueba":20,"experimental":10}'::jsonb);

-- Kaizen y MODOZAINT estan en mantenimiento: sin frecuencia, para que
-- el calendario no les pinte huecos que nadie va a llenar.
update metas set frecuencias = '{"reel":0,"carrusel":0,"story":0,"foto":0}'::jsonb
  where marca_id in ('kaizen','modozaint') and piezas_por_semana = 0;
