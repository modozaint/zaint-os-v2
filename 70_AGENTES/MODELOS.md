---
tags: [modozaint-v2, agentes, modelos, eficiencia]
updated: 2026-08-29
tipo: politica-operativa
---

# Modelos - que modelo usa cada cosa?

Esta es la matriz de reparto para trabajar con `Claude Pro` y `ChatGPT Plus` sin gastar de mas.

## Regla madre

Primero se decide el tipo de trabajo, despues el modelo.

- Si el trabajo necesita contexto largo, arquitectura, lectura cruzada de archivos o un cierre bien ordenado, arranca en `Claude`.
- Si el trabajo necesita velocidad, varias iteraciones cortas, reescritura ligera o formateo, arranca en `ChatGPT`.
- Si el trabajo es repetitivo y mecanico, primero se resuelve con archivos, `rg`, `git` o la carpeta local; el modelo entra solo para lo que no se puede automatizar.
- Si la primera pasada deja ambiguedad, se sube una sola vez al modelo mas fuerte para ese tipo de salida, no se reitera por costumbre.

## Reparto base

| Tipo de trabajo | Modelo de arranque | Por que |
|---|---|---|
| Entrevista inicial de un agente | ChatGPT | Va bien para preguntas cortas, recoger datos y cerrar campos vacios rapido |
| Sintesis de contexto grande | Claude | Sostiene mejor contexto largo y devuelve una pieza mas ordenada |
| Diseno de estructura y politica | Claude | Mejor para armar reglas, jerarquia y documentos que deben durar |
| Reescritura corta o mejora de tono | ChatGPT | Mas rapido para iterar y ajustar formulacion |
| Resumen de una bitacora o hallazgo | ChatGPT | Eficiente para convertir texto bruto en una nota limpia |
| Consolidacion final de un criterio | Claude | Mejor para cerrar la version que va a quedar como referencia |
| Verificacion contra archivos y datos vivos | Ninguno | Eso se hace con lectura directa de archivos, no con suposiciones |

## Como ahorrar tokens

1. No abrir contexto que no hace falta.
2. No mezclar en una sola conversacion tareas que tienen salida distinta.
3. Hacer primero la extraccion corta y despues la sintesis larga.
4. Guardar la version util en archivo, no en el chat.
5. Si un agente ya sabe su rol, no volver a re-explicarle la marca cada vez.

## Reparto practico por capa

| Capa | Uso sugerido |
|---|---|
| `70_AGENTES/<NOMBRE>/ENTREVISTA.md` | ChatGPT para capturar la informacion base |
| `70_AGENTES/<NOMBRE>/ESTADO.md` | ChatGPT para actualizar rapido con datos ya cerrados |
| `70_AGENTES/<NOMBRE>/BITACORA.md` | ChatGPT para dejar registro breve y ordenado |
| `70_AGENTES/<NOMBRE>/HALLAZGOS.md` | Claude para convertir hallazgo en criterio utilizable |
| `60_CONOCIMIENTO/` | Claude para consolidar lo que ya merece vivir fuera del agente |

## Regla de salida

Si una tarea no justifica el modelo mas caro, no se lo des.
Si una tarea puede romper una decision o una estructura, no la cierres en el modelo rapido sin una segunda pasada.

## Puerta de adopción

La clase S0-S3 se decide con `50_SOP/PRESUPUESTO_Y_EFICIENCIA.md`. Un cambio de modelo o esfuerzo
solo se adopta después de 20 tareas representativas y si mantiene la aprobación a no más de cinco
puntos porcentuales de la mejor configuración. Caché y Batch no se suponen: se activan únicamente
cuando la instalación exponga capacidad y telemetría verificables.
