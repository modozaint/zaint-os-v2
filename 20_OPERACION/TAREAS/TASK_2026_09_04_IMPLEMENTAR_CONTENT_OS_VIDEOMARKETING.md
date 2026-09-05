---
id: TASK_2026_09_04_IMPLEMENTAR_CONTENT_OS_VIDEOMARKETING
owner: Claude Contenido
reviewer: ORQUESTADOR
status: blocked
class: S1
created: 2026-09-04
updated: 2026-09-04
---

# Objetivo

Dejar ContentOS operativo y desplegado como el centro de videomarketing de
MODOZAINT: una idea breve debe convertirse en una pieza trazable dentro del
flujo Brújula -> ficha -> rodaje -> plan/calendario -> medición.

## Alcance permitido

- Editar solo `80_PRODUCTOS/CONTENT_OS/app/` y su documentación directa.
- Integrar y terminar los cambios locales ya existentes de Brújula, sin borrar
  cambios de otros agentes.
- Ejecutar las pruebas pertinentes, aplicar solo migraciones necesarias y
  desplegar el proyecto de ContentOS a su hosting configurado.
- Registrar la URL de producción, migraciones aplicadas y resultado de pruebas.

## Exclusiones

- No publicar ni programar contenido, ni contactar, seguir o sincronizar redes.
- No crear piezas de relleno ni inventar métricas, resultados, credenciales o
  datos de cuenta.
- No modificar V1, otras aplicaciones, secretos ni archivos fuera del alcance.

## Fuentes mínimas

- `80_PRODUCTOS/CONTENT_OS/docs/CLAUDE.md`
- `80_PRODUCTOS/CONTENT_OS/app/README.md`
- `80_PRODUCTOS/CONTENT_OS/app/package.json`
- `20_OPERACION/TAREAS/TASK_2026_09_04_OPERAR_VIDEOMARKETING_DESDE_CONTENT_OS.md`
- Código de estrategia, plan, nueva pieza, rodaje, referentes y APIs que cada
  cambio requiera.

## Criterio de terminado

- La interfaz Brújula explica pilares, niveles y el ciclo de videomarketing.
- Una idea puede guardarse como `pieza` sin duplicación y pasar a ficha/rodaje/
  plan desde la interfaz; si falta configuración, se muestra un error útil.
- TypeScript y lint acotado pasan, el build de producción pasa y se entrega una
  URL desplegada verificable.
- Se documentan límites: TikTok sin API conectada y ninguna publicación o
  sincronización ejecutada.

## Evidencia requerida

- Lista de archivos modificados y hash de commit.
- Salida resumida de pruebas y build.
- URL de producción abierta y verificada.
- Migraciones aplicadas o bloqueo exacto, sin secretos.

## Siguiente responsable

## Resultado de Contenido y revisión de ORQUESTADOR

- Integrado: la Brújula enlaza referentes, radar de preguntas, banco de ideas,
  pipeline/ficha/rodaje, calendario y métricas; TikTok queda declarado como
  carga manual hasta que exista API conectada.
- Validación: `tsc --noEmit` y lint acotado pasaron. El build pasó con valores
  de marcador, pero no se verificó con credenciales reales porque no existe
  `.env.local` disponible en este checkout.
- Migraciones: ninguna necesaria; el cambio es de interfaz y rutas existentes.
- Producción bloqueada: no existe `.vercel/`, `vercel.json` ni Vercel CLI, y la
  documentación apunta a un repositorio/carpeta productivos distintos. No se
  creó proyecto, dominio ni despliegue sin un vínculo inequívoco.

## Desbloqueo mínimo

Santiago confirma el proyecto Vercel de ContentOS o proporciona el contenido de
`.vercel/project.json` desde el checkout productivo. Luego ORQUESTADOR puede
desplegar `80_PRODUCTOS/CONTENT_OS/app` y verificar la URL antes de cargar la
primera idea real.

## Siguiente responsable

Santiago aporta el vínculo de Vercel; ORQUESTADOR ejecuta el deploy y su
verificación. Después Contenido registra la primera idea real.
