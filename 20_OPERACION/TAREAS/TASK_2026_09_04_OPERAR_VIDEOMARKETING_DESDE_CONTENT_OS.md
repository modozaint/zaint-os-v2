---
id: TASK_2026_09_04_OPERAR_VIDEOMARKETING_DESDE_CONTENT_OS
owner: Contenido
reviewer: ORQUESTADOR
status: in_progress
class: S1
created: 2026-09-04
updated: 2026-09-04
---

# Resultado esperado

Dejar probado y documentado el flujo para que una idea o pedido breve de
MODOZAINT se convierta en una pieza organizada en ContentOS, sin que Santiago
repita el contexto de la marca ni se creen archivos paralelos.

## Fuentes minimas

- `80_PRODUCTOS/CONTENT_OS/docs/CLAUDE.md`
- `80_PRODUCTOS/CONTENT_OS/app/components/estrategia/EstrategiaContenido.tsx`
- `20_OPERACION/TAREAS/TASK_2026_09_03_CONTENT_OS_ESTRATEGIA_PILARES.md`
- `70_AGENTES/CONTENIDO/00_ENTRAR.md`
- Una idea real que entregue Santiago en el chat CONTENIDO.

## Rutas y acciones excluidas por defecto

- No editar codigo, migraciones, credenciales ni base de datos.
- No publicar, programar, contactar, seguir cuentas ni sincronizar redes.
- No modificar V1 ni inventar metricas, fuentes o el guion de una pieza.

## Entregable

1. Una guia operativa de maximo una pantalla: `idea -> pilar/nivel -> ficha ->
   plan/calendario -> guion -> rodaje -> medicion -> aprendizaje`.
2. Una prueba con una sola idea real, guardada en ContentOS como `pieza` en
   estado `idea`, con pilar y nivel; o marcada como bloqueada con la causa
   exacta si el acceso no permite guardarla.
3. Un formato de respuesta para que Santiago pueda pedir contenido con una sola
   frase y el equipo haga solo las preguntas que no esten en ContentOS.

## Limites y presupuesto

- Un solo responsable escribe en esta tarea: Contenido.
- Copy, Juanjo y MODOZAINT solo se invocan despues de que la idea tenga ficha y
  nunca editan el mismo campo a la vez.
- Maximo una idea de prueba. No se crean piezas de relleno.

## Criterio de terminado

- Santiago puede enviar una idea corta y saber donde verla en ContentOS.
- La prueba conserva autor, marca, pilar, nivel y estado, sin duplicar la idea
  en un archivo Markdown.
- La guia indica quien interviene y en que punto se detiene por falta de
  evidencia o autorizacion.

## Evidencia de cierre

- URL o captura de la ficha de prueba en ContentOS, o evidencia del bloqueo.
- Guia operativa y texto de entrada usados.
- Confirmacion de que no hubo publicacion, contacto ni cambio de datos de red.

## Siguiente responsable

Contenido ejecuta la prueba; ORQUESTADOR revisa trazabilidad y decide si se
necesita un cambio de software en ContentOS.
