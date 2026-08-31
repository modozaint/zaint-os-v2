---
tags: [modozaint-v2, agentes, orquestador, proceso]
updated: 2026-08-31
tipo: runbook
---

# Proceso de evaluaciones de ORQUESTADOR

## Antes de empezar

1. El propietario guarda el borrador actualizado.
2. `70_AGENTES/ORQUESTADOR/ESTADO.md` queda con el borrador ya guardado.
3. `git status` sigue limpio antes de correr las pruebas.

## Orden de ejecución

1. Correr `70_AGENTES/ORQUESTADOR/EVALS.md`.
2. Completar el registro con el resultado real de cada caso.
3. Si un caso falla, ajustar solo lo que el fallo demuestre y volver a correr una vez.
4. Si los tres casos pasan, cerrar el estado de ORQUESTADOR y registrar el commit que lo dejó listo.

## Qué se registra

- Caso.
- Configuración usada.
- Si cumplió.
- Si inventó hechos.
- Fuente mínima.
- Tiempo.
- Intervención humana.

## Qué no se hace

- No se abre un segundo agente para ayudar a evaluar.
- No se declara estable sin las tres filas completas.
- No se cambia la arquitectura por un solo fallo de formato.

