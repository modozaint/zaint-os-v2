---
tags: [modozaint-v2, agentes, arquitectura, eficiencia]
updated: 2026-08-29
tipo: criterio-estable
---

# Cinco decisiones para operar el sistema multiagente

Estas decisiones incorporan la investigación sin copiarla. La evidencia completa sigue en:

- `BUZZ_RESEARCH_ROOT/ARQUITECTURA_MULTIAGENTE_2026_08_29.md` — SHA-256 `78A3C43B699F6D122AF97DC07B89BDB548971E280019B82B96B6592462113DE6`.
- `BUZZ_RESEARCH_ROOT/EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md` — SHA-256 `822BAFF4EECC1A8094F15482D1025FD3C8ED833F41A5897BAD4D76D36776EFC2`.

`BUZZ_RESEARCH_ROOT` se declara en `MIGRATION_MAP.md`. Los informes son evidencia; este archivo es
el criterio operativo.

## 1. Entrada única y fuentes canónicas

La cadena normal es `AGENTS.md` o `CLAUDE.md` -> `00_NORTE/AGENT_ROUTER.md` ->
`70_AGENTES/<NOMBRE>/00_ENTRAR.md` -> fuentes mínimas del encargo. Cada tema mutable tiene una sola
ruta y un responsable en `00_NORTE/FUENTES_CANONICAS.md`. Los demás archivos enlazan, no copian.

## 2. Un especialista por defecto y presupuesto antes de escalar

ORQUESTADOR clasifica el trabajo S0-S3 y empieza con el número mínimo de agentes. Solo abre frentes
paralelos cuando sean independientes. Cada encargo declara límite de agentes, llamadas, reintentos y
condición de parada según `50_SOP/PRESUPUESTO_Y_EFICIENCIA.md`.

## 3. Tarea y handoff mediante artefacto

Toda delegación usa un contrato bajo `20_OPERACION/TAREAS/` y el SOP
`50_SOP/TAREA_Y_HANDOFF.md`. El especialista escribe el entregable en su ruta y devuelve cinco
campos: resultado, evidencia, archivo, riesgos y pendiente. El chat transporta el aviso; el archivo
conserva el estado durable.

## 4. Separar estado vivo, historia, decisiones y propiedad

`ESTADO.md` conserva solo objetivo vivo, bloqueo y siguiente paso. `BITACORA.md` o los resultados
fechados conservan historia. Una decisión estructural aceptada vive como ADR inmutable; otra decisión
la sustituye mediante enlace. `00_NORTE/PROPIEDAD_DE_RUTAS.md` define quién propone, escribe, revisa
y aprueba.

## 5. Elegir modelos y optimizaciones por evaluación

La matriz de modelos se versiona. Antes de adoptar una configuración por ahorro, se prueba con 20
tareas representativas y solo se acepta si la calidad queda a no más de cinco puntos porcentuales de
la mejor configuración. Caché y Batch se activan únicamente cuando Buzz o el proveedor expongan la
capacidad y la telemetría; Batch queda reservado para trabajo offline. La medida principal es costo
por tarea aprobada, no costo bruto por llamada.
