---
tags: [modozaint-v2, gobierno, propiedad]
updated: 2026-08-29
tipo: matriz
---

# Propiedad de rutas

| Ruta | Escritor normal | Revisor | Aprobación humana requerida |
|---|---|---|---|
| `00_NORTE/` | ORQUESTADOR | Dueño del dominio afectado | Cambios de estructura o autoridad |
| `20_OPERACION/AHORA.md` | ORQUESTADOR | Ninguno para estado factual | Cambio de prioridad estratégica |
| `20_OPERACION/TAREAS/TASK_*.md` | ORQUESTADOR | Responsable de la tarea | Gasto, publicación o alcance nuevo |
| `70_AGENTES/<NOMBRE>/00_ENTRAR.md` | Dueño del oficio | ORQUESTADOR | Crear, retirar o ampliar autoridad |
| `70_AGENTES/<NOMBRE>/ESTADO.md` | Agente del oficio | ORQUESTADOR al cerrar | No, si solo refleja estado real |
| `50_SOP/` | Autor del procedimiento | ORQUESTADOR | Riesgo, gasto o política transversal |
| `60_CONOCIMIENTO/` | Dueño del criterio | ORQUESTADOR | Decisión estratégica o difícil de revertir |
| `SOURCE_ROOT/` | Nadie desde V2 | Dueño de V1 | Siempre durante esta migración |

ORQUESTADOR es el único escritor normal del contrato `TASK_*`. El especialista escribe su entregable
y devuelve el handoff; no modifica el contrato concurrentemente.
