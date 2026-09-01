-- ============================================================
-- MIGRACION del historico de la bitacora de Notion
-- Extraido el 2026-08-14 de collection://5c654c4d-f42f-412e-ada0-ad7f05add157
-- Solo los dias CON registro real. Las 4 filas marcadas "BORRAR" se descartan.
-- ============================================================

-- LOS DIAS -------------------------------------------------------
insert into dias (fecha, turno_id, energia, agradezco_por, apunte) values
 ('2026-08-08','POSTURNO',2,'Gracias por el dia tan lindo y el cafecito que tome con mi novia', null),
 ('2026-08-09','LIBRE',   3,'un dia mas con salud y familia unida', null),
 ('2026-08-10','CF1',     3,'Agradezco por la vida y por mi familia, hoy ocurrio un terremoto. GRACIAS DIOS POR BENDECIRME TANTO', null),
 ('2026-08-11','CF1',     3,'Agradezco por la abundancia en mi vida y todas las cosas ricas que me puedo comer',
                            'El cuadro decia LIBRE y le cambiaron el turno: trabajo. Codigo del turno sin confirmar.'),
 ('2026-08-12','N',       3, null,
                            'Segundo cambio de turno en dos dias: el cuadro decia CF1 7am-7pm. Al ser noche, la MANANA quedo libre. Ejercicio al aire libre: caminar, trotar, flexiones y fondos.'),
 ('2026-08-13','POSTURNO',null, null,
                            'Consecuencia de la noche del 12. Sale a las 7am: el turno A que decia el cuadro era imposible.'),
 ('2026-08-14','LIBRE',   null, null,
                            'Primer dia registrado desde la app. Notion estaba caido cuando lo reporto.');

-- LOS REGISTROS (el xp lo calcula el trigger) ---------------------
insert into registros (fecha, habito_id, nivel) values
 -- sabado 8 · posturno · el dia mas completo del historico
 ('2026-08-08','bloque',   'minimo'),
 ('2026-08-08','ejercicio','minimo'),
 ('2026-08-08','leer',     'minimo'),
 ('2026-08-08','dormir',   'minimo'),
 ('2026-08-08','aprender', 'normal'),
 -- domingo 9 · libre
 ('2026-08-09','bloque',   'normal'),
 ('2026-08-09','ejercicio','minimo'),
 ('2026-08-09','aprender', 'normal'),
 -- lunes 10 · turno de 12h y aun asi entreno 60
 ('2026-08-10','bloque',   'minimo'),
 ('2026-08-10','ejercicio','normal'),
 ('2026-08-10','aprender', 'normal'),
 -- martes 11 · turno sorpresa
 ('2026-08-11','bloque',   'minimo'),
 ('2026-08-11','ejercicio','minimo'),
 ('2026-08-11','aprender', 'normal'),
 -- miercoles 12 · noche, con la manana libre
 ('2026-08-12','ejercicio','super'),
 -- jueves 13 · posturno: dia protegido, sin registro. NO se inventa nada.
 -- viernes 14 · lo que reporto hoy
 ('2026-08-14','ejercicio','super'),
 ('2026-08-14','bloque',   'minimo');

-- CERRAR LOS DIAS: calcular si cumplio la meta segun su turno -----
update dias set meta_cumplida = meta_del_dia(fecha)
 where fecha <= '2026-08-14';

-- La vida NO se toca en la migracion: el historico no castiga hacia atras.
-- El avatar arranca con los 1000 puntos completos.

-- COMPROBACION ---------------------------------------------------
-- select * from niveles_por_area;
-- select fecha, turno_id, meta_cumplida from dias order by fecha;
