# Productos migrados V1 -> V2

Esta carpeta contiene una copia de trabajo de las aplicaciones que estaban en
`V1/_LABS`. La migracion se realiza por fases y no convierte automaticamente
estas copias en produccion.

## Reglas

- V1 permanece intacto y es la fuente de comparacion durante esta fase.
- No se copian secretos, datos personales, sesiones, bases reales, builds ni
  dependencias generadas.
- Cada producto conserva sus superficies de aplicacion, infraestructura y
  documentacion separadas.
- Ningun cambio se despliega ni se publica sin una validacion posterior.

## Productos

- `LEAD_HUNTER`: prospecting y seguimiento; requiere integrar y validar el ICP
  de Juanca antes de cualquier contacto real.
- `CONTENT_OS`: planificacion y operacion editorial; las migraciones SQL deben
  reconciliarse antes de usarse contra una base viva.
- `FOUNDER_OS`: aplicacion personal; los datos de habitos, turnos, tareas y
  finanzas permanecen fuera de esta copia.

El estado detallado y las exclusiones estan en `MIGRATION_STATUS.md`.
