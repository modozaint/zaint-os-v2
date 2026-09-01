---
tags: [modozaint-v2, gobierno, fuentes]
updated: 2026-08-29
tipo: registro
---

# Fuentes canónicas

Este archivo registra punteros; no repite el contenido de las fuentes.

| Tema | Ruta canónica | Responsable | Revisión |
|---|---|---|---|
| Prioridad y fase actual | `20_OPERACION/AHORA.md` | ORQUESTADOR | Al cambiar el trabajo activo |
| Enrutamiento de encargos | `00_NORTE/AGENT_ROUTER.md` | ORQUESTADOR | Al crear o retirar un oficio |
| Función de cada agente | `70_AGENTES/<NOMBRE>/00_ENTRAR.md` | Agente del oficio | Con revisión de ORQUESTADOR |
| Modelos y escalado | `70_AGENTES/MODELOS.md` | ORQUESTADOR | Después de una evaluación |
| Arquitectura y eficiencia multiagente | `60_CONOCIMIENTO/DECISIONES_MULTIAGENTE.md` | ORQUESTADOR | Mediante ADR |
| Contrato de tarea y handoff | `50_SOP/TAREA_Y_HANDOFF.md` | ORQUESTADOR | Después de un fallo repetible |
| Datos de dominio V1 todavía no migrados | `SOURCE_ROOT/<RUTA_DE_DOMINIO>` | Dueño del dominio | En la fuente V1 |
| Evidencia de arquitectura | `60_CONOCIMIENTO/EVIDENCIA/ARQUITECTURA_MULTIAGENTE_2026_08_29.md` | ORQUESTADOR | Archivo fechado |
| Evidencia de eficiencia | `60_CONOCIMIENTO/EVIDENCIA/EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md` | ORQUESTADOR | Archivo fechado |

## Regla contra duplicados

1. Un archivo nuevo declara si es fuente, estado, evidencia, tarea, decisión o histórico.
2. Si el dato ya tiene fuente canónica, se enlaza esa ruta.
3. `ESTADO.md` elimina lo cerrado; la evidencia permanece en el entregable o la bitácora.
4. `_ARCHIVO_V1/` y logs históricos quedan fuera de la lectura inicial salvo solicitud expresa.
