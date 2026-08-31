---
tags: [modozaint-v2, agentes, costo, evaluacion]
updated: 2026-08-29
tipo: sop
---

# Presupuesto y eficiencia diaria

Evidencia: `BUZZ_RESEARCH_ROOT/EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md`.

| Clase | Uso | Agentes iniciales | Herramientas | Motor inicial | Escalada |
|---|---|---:|---:|---|---|
| S0 | Ruta, formato o resumen corto | 1 | 0-3 | Rápido, esfuerzo bajo | Solo si falta una fuente |
| S1 | Investigación o plan enfocado | 1 | Hasta 8 | Equilibrado, bajo/medio | Dos frentes independientes |
| S2 | Comparación o trabajo cruzado | 2 | Hasta 10 por agente | Equilibrado; fuerte al sintetizar si la evaluación lo exige | División y presupuesto documentados |
| S3 | Decisión estratégica de alto valor | 3-4 | Presupuesto explícito | Fuerte, medio/alto selectivo | Aprobación humana al exceder presupuesto |

## Reglas

- Un especialista por defecto; no duplicar objetivo y fuentes.
- Un reintento del mismo fallo; después cambiar fuente o declarar bloqueo.
- Detener al cumplir el criterio, no al agotar la curiosidad.
- Contexto estable primero y tarea variable al final; medir caché antes de depender de ella.
- Batch solo para trabajo offline que tolere hasta 24 horas y cuando el proveedor lo ofrezca.

## Medición mínima

Registrar por tarea: clase, agentes, modelo, esfuerzo, tokens disponibles, caché disponible, llamadas,
reintentos, tiempo, costo disponible, aprobación e intervenciones humanas. Si Buzz no expone tokens o
costo, registrar `no_disponible` y usar llamadas, tiempo y tasa de aprobación; nunca inventar cifras.

Una configuración barata se adopta después de 20 tareas representativas y solo si su aprobación queda
a no más de cinco puntos porcentuales de la mejor. Objetivos iniciales: 30% menos tokens de entrada
medianos cuando sean medibles, menos de 5% de llamadas duplicadas y ninguna degradación de seguridad.
