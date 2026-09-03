-- ================================================================
-- Content OS — Migracion 007: estrategia MODOZAINT
--
-- Requiere 003 y 004. Una pregunta del radar se guarda como pieza
-- en estado `idea`, con `eje` = pilar y `funcion` = nivel.
-- ================================================================

insert into metas (
  marca_id, piezas_por_semana, tipo_principal, activa,
  frecuencias, mezcla, rotacion_objetivo
)
values (
  'modozaint', 3, 'reel', true,
  '{"reel":3,"carrusel":0,"story":0,"foto":0}'::jsonb,
  '{"adquisicion":50,"autoridad":33,"conversion":17}'::jsonb,
  '{"probado":70,"prueba":20,"experimental":10}'::jsonb
)
on conflict (marca_id) do update set
  piezas_por_semana = excluded.piezas_por_semana,
  tipo_principal = excluded.tipo_principal,
  activa = excluded.activa,
  frecuencias = excluded.frecuencias,
  mezcla = excluded.mezcla,
  rotacion_objetivo = excluded.rotacion_objetivo;
