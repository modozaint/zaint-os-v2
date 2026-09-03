---
id: TASK_2026_09_03_CONTENT_OS_ESTRATEGIA_PILARES
owner: ORQUESTADOR
reviewer: Santiago
status: partial
class: S2
created: 2026-09-03
updated: 2026-09-03
---

# Resultado esperado

Integrar la estrategia de contenido IA de MODOZAINT en ContentOS mediante una
pantalla de pilares y un radar que convierta preguntas observadas en referentes
en ideas clasificadas dentro del pipeline existente.

## Fuentes minimas

- `10_ESTRATEGIA/ARQUITECTURA_CONTENIDO_IA_MODOZAINT_2026-09-03.md`
- `80_PRODUCTOS/CONTENT_OS/app/lib/piezasTipos.ts`
- Comentarios publicos observables manualmente en los referentes aprobados.

## Rutas excluidas por defecto

- Credenciales, tokens, mensajes privados y datos no publicos de terceros.
- Publicacion, contacto, sincronizacion automatica de comentarios o despliegue.

## Entregable

- Ruta `/estrategia` con los ocho pilares y mezcla 50/33/17.
- Formulario que guarde una pregunta observada como `pieza` en estado `idea`,
  con pilar y nivel asignados.
- Migracion SQL lista para dejar MODOZAINT en tres reels por semana y mezcla
  50/33/17, sin ejecutarla.
- Analisis documentado de una muestra verificable de comentarios por referente;
  ningun vacio se rellena con supuestos.

## Limites y presupuesto

- Solo comentarios publicos visibles; no mensajes ni interacciones con cuentas.
- No importar ni almacenar nombres, fotos o perfiles de comentaristas.
- No correr SQL, desplegar ni publicar sin autorizacion expresa de Santiago.

## Criterio de terminado

- La interfaz compila y conserva la misma idea en Estrategia y Plan.
- Cada insight guarda fuente, pregunta y clasificacion o se marca como sin
  evidencia.
- La migracion puede revisarse antes de aplicarse a produccion.

## Evidencia de cierre

- Diff, lint/build y captura de la ruta local cuando haya entorno configurado.
- Enlaces a publicaciones de referentes y extracto anonimo de la pregunta.

## Avance 2026-09-03

- Implementada en local la ruta `/estrategia`, pendiente de migracion y
  despliegue autorizado para verla en produccion.
- Muestra publica revisada en
  `30_RESULTADOS/ANALISIS_MUESTRA_COMENTARIOS_REFERENTES_IA_2026-09-03.md`.
- La muestra es parcial: no autoriza conclusiones sobre todos los referentes.

## Siguiente responsable

ORQUESTADOR termina la revision manual de comentarios y prepara el reporte.
Santiago autoriza, si corresponde, ejecutar `supabase/007_modozaint_estrategia.sql`
y desplegar despues de revisar la interfaz.
