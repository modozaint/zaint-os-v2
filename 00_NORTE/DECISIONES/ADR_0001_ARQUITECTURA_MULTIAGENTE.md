---
tags: [modozaint-v2, adr, agentes, arquitectura]
updated: 2026-08-29
tipo: decision
status: accepted
owner: zaint-oficina
---

# ADR 0001 — Arquitectura multiagente mínima

## Contexto

El sistema necesita conservar los oficios de V1, operar con distintos modelos, evitar cargar todo el
vault y cerrar trabajo mediante archivos revisables.

## Decisión

Adoptar las cinco reglas de `60_CONOCIMIENTO/DECISIONES_MULTIAGENTE.md`: entrada única, un
especialista por defecto, contrato de tarea y handoff por artefacto, separación de estado e historia,
y selección de modelo por evaluación.

## Consecuencias

- Más rutas explícitas y menos contexto implícito.
- El paralelismo requiere justificar independencia y presupuesto.
- Las optimizaciones de caché o Batch quedan pendientes de capacidad y medición reales.
- Un cambio estructural posterior crea otro ADR y enlaza `supersedes: ADR_0001`.

## Evidencia

- `BUZZ_RESEARCH_ROOT/ARQUITECTURA_MULTIAGENTE_2026_08_29.md`.
- `BUZZ_RESEARCH_ROOT/EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md`.
- Solicitud humana del 2026-08-29 y handoff de integración de Fizz en ORQUESTA.
