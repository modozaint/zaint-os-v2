alter table piezas add column if not exists funcion  text;
alter table piezas add column if not exists angulo   text;
alter table piezas add column if not exists rotacion text default 'probado';
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
alter table piezas add column if not exists escenas jsonb;
alter table metas add column if not exists frecuencias jsonb
  default '{"reel":3,"carrusel":1,"story":0,"foto":0}'::jsonb;
alter table metas add column if not exists mezcla jsonb
  default '{"adquisicion":50,"autoridad":25,"conversion":25}'::jsonb;
alter table metas add column if not exists rotacion_objetivo jsonb
  default '{"probado":70,"prueba":20,"experimental":10}'::jsonb;
update metas set
  frecuencias       = coalesce(frecuencias,       '{"reel":3,"carrusel":1,"story":0,"foto":0}'::jsonb),
  mezcla            = coalesce(mezcla,            '{"adquisicion":50,"autoridad":25,"conversion":25}'::jsonb),
  rotacion_objetivo = coalesce(rotacion_objetivo, '{"probado":70,"prueba":20,"experimental":10}'::jsonb);
update metas set frecuencias = '{"reel":0,"carrusel":0,"story":0,"foto":0}'::jsonb
  where marca_id in ('kaizen','modozaint') and piezas_por_semana = 0;
