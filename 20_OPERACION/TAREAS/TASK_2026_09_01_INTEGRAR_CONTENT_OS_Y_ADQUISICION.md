---
id: TASK_2026_09_01_INTEGRAR_CONTENT_OS_Y_ADQUISICION
owner: orquestador
reviewer: santiago
status: pending
class: S2
created: 2026-09-01
updated: 2026-09-01
---

# Integrar Content OS con el sistema de adquisición

## Objetivo

Dejar el Content OS listo para operar MODOZAINT y Dermatinta con datos separados, alimentar la
prospección B2B de LeadHunter con tesis verificadas y cerrar un ciclo medible de contenido -> señal
-> conversación -> resultado -> aprendizaje.

## Fases

1. Auditar y actualizar la documentación del Content OS contra el código real.
2. Verificar localmente `lint`, `build`, arranque y rutas principales.
3. Confirmar que las marcas, autores y piezas no se mezclan.
4. Definir la entrada mínima de MODOZAINT y Dermatinta al sistema.
5. Crear un tablero de métricas que separe atención, adquisición y facturación.
6. Auditar LeadHunter antes de reconectar o enviar mensajes, especialmente por la salida de Unipile.
7. Ejecutar primero una corrida controlada y manualmente aprobada.
8. Registrar resultados y ajustar una sola fricción por ciclo.

## Regla sobre LinkedIn

La cancelación o vencimiento de Unipile puede afectar el canal de envío. No se reconecta, reactiva ni
envía a contactos reales automáticamente. Antes hay que verificar proveedor, cuenta, cola pendiente,
cadencia, límites, respaldo y autorización de la campaña concreta.

## Criterio de terminado

- Content OS arranca localmente y sus rutas principales pasan verificación.
- La documentación no contradice el código ni presenta modelos/API obsoletos como actuales.
- MODOZAINT y Dermatinta tienen objetivos y métricas separadas.
- Cada agente de contenido recibe su entrada del Content OS sin cargar contexto innecesario.
- Existe una corrida documentada de contenido con métricas y aprendizaje.
- LeadHunter tiene un estado verificable antes de cualquier envío real.

## Fuera de alcance

- No publicar contenido automáticamente.
- No enviar mensajes de LinkedIn sin aprobación de la campaña.
- No añadir suscripciones o API de pago.
- No migrar todo el Content OS a V2 hasta verificar si conviene mantenerlo como laboratorio de código.
