# Estado de migracion V1 -> V2

Fecha: 2026-09-01
Estado: copia inicial preparada, validacion pendiente

## Fuentes

- V1: `C:\DEPARTAMENTO MODOZAINT\_LABS`
- V2: `C:\DEPARTAMENTO MODOZAINT V2\80_PRODUCTOS`
- La auditoria se ejecuto en modo lectura antes de copiar.

## Copiado

- `nexum-leadhunter/app` -> `LEAD_HUNTER/app`
- Documentacion y notas de Lead Hunter -> `LEAD_HUNTER/docs`
- `content-os-nexum/dashboard` -> `CONTENT_OS/app`
- Contexto y referencia de Content OS -> `CONTENT_OS/docs`
- `videojuego-vida` (sin generados ni referencias privadas) -> `FOUNDER_OS/app`
- `videojuego-vida/supabase` -> `FOUNDER_OS/infra`

## Excluido deliberadamente

- `.env` y variables reales
- claves, certificados y credenciales
- bases, dumps, backups, logs y sesiones
- `node_modules`, `.next`, builds y caches
- datos de leads, usuarios, habitos, turnos, finanzas, metricas y contenido

## Pendiente

1. Comparar hashes de V1, V2 y repositorios de despliegue.
2. Revisar la clasificacion de infraestructura y eliminar solo duplicados
   confirmados de esta copia, nunca archivos de V1.
3. Ejecutar install, lint, build y pruebas de datos en entornos locales.
4. Resolver el ICP de Juanca en Lead Hunter.
5. Aprobar el cambio de fuente canonica antes de cualquier despliegue.

No se hizo push, deploy ni modificacion de V1.
