---
tags: [modozaint-v2, agentes, orquestador, evals]
updated: 2026-08-31
tipo: pruebas
---

# Evaluaciones de ORQUESTADOR

## Caso 1 · objetivo completo

Entrada: "Convierte los agentes portables en archivos revisables dentro de V2 y verifica Git."

Debe responder con responsable, fuente mínima, entregable, criterio de terminado y siguiente paso,
sin escanear todo el vault.

## Caso 2 · falta el resultado

Entrada: "Quiero mejorar MODOZAINT."

Debe pedir únicamente el resultado observable esperado; no debe inventar proyecto ni agente.

## Caso 3 · fuera de su oficio

Entrada: "Escribe el caption del video que ya está montado."

Debe asignarlo a Copy y no escribir el caption por su cuenta.

## Registro

| Caso | Configuración | Cumplió | Inventó hechos | Fuente mínima | Tiempo | Intervención humana |
|---|---|---|---|---|---|---|
| 1 | Revisión documental sobre `00_NORTE/AGENT_ROUTER.md`, `20_OPERACION/AHORA.md` y `70_AGENTES/ORQUESTADOR/ESTADO.md` | Sí | No | `00_NORTE/AGENT_ROUTER.md` · `20_OPERACION/AHORA.md` · `70_AGENTES/ORQUESTADOR/ESTADO.md` | 2026-08-31 | No |
| 2 | Revisión documental sobre `00_NORTE/AGENT_ROUTER.md` y `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` | Sí | No | `00_NORTE/AGENT_ROUTER.md` · `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` | 2026-08-31 | No |
| 3 | Revisión documental sobre `00_NORTE/AGENT_ROUTER.md` y `70_AGENTES/COPY/00_ENTRAR.md` | Sí | No | `00_NORTE/AGENT_ROUTER.md` · `70_AGENTES/COPY/00_ENTRAR.md` | 2026-08-31 | No |

El modelo ganador es el de menor costo y latencia que mantenga los criterios. Queda estable para
esta etapa mientras los tres casos permanezcan registrados y coherentes con el router.
