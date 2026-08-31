---
tags: [modozaint-v2, agentes, router]
updated: 2026-08-29
tipo: entrada
---

# Router mínimo de agentes

## Arranque común

Lee solamente:

1. `CLAUDE.md`.
2. Este archivo.
3. `00_NORTE/FUENTES_CANONICAS.md`.
4. `20_OPERACION/AHORA.md`.
5. `70_AGENTES/<AGENTE>/ESTADO.md`, si existe.

Después abre una sola fuente del dominio. Sigue enlaces directos únicamente si el encargo lo exige.

## Fuente externa vigente

Mientras la migración sea gradual, `SOURCE_ROOT` es `C:\DEPARTAMENTO MODOZAINT`. Las rutas de la
tabla siguiente se resuelven desde esa raíz y se consultan en solo lectura.

| Encargo | Agente | Fuente mínima después del arranque |
|---|---|---|
| Coordinar, repartir o verificar un cierre | ORQUESTADOR | `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` |
| Decidir público o posicionamiento | Xiomara | `70_AGENTES/XIOMARA/00_ENTRAR.md` |
| Escribir un guion | Contenido | `70_AGENTES/CONTENIDO/00_ENTRAR.md` |
| Escribir caption o CTA | Copy | `70_AGENTES/COPY/00_ENTRAR.md` |
| Diseñar montaje o edición | Juanjo | `70_AGENTES/JUANJO/00_ENTRAR.md` |
| Destilar un video | Video | `70_AGENTES/VIDEO/00_ENTRAR.md` |
| Elegir qué toca hoy | Hoy | `70_AGENTES/HOY/00_ENTRAR.md` |
| Operar Dermatinta | Dermatinta | `70_AGENTES/DERMATINTA/00_ENTRAR.md` |
| Operar House of Kaizen | Kaizen | `70_AGENTES/KAIZEN/00_ENTRAR.md` |
| Operar la marca personal | MODOZAINT | `70_AGENTES/MODOZAINT/00_ENTRAR.md` |

Cada `00_ENTRAR.md` contiene sus rutas de dominio. No cargues los nueve para resolver una tarea.

## Complejidad antes de delegar

- Clasifica S0-S3 con `50_SOP/PRESUPUESTO_Y_EFICIENCIA.md`.
- Usa un especialista por defecto.
- Abre varios frentes solo si son independientes y el contrato declara presupuesto y parada.
- Toda delegación durable usa `50_SOP/TAREA_Y_HANDOFF.md`.

## Conflictos

- Un dato vivo gana sobre un documento.
- La prioridad vigente se consulta en `SOURCE_ROOT/05_CURRENT_PRIORITIES.md`.
- Las protecciones vigentes se consultan en `SOURCE_ROOT/SISTEMA/PROTECCIONES.md`.
- La identidad se lee en su fuente; nunca se copia a la memoria del agente.
- Si dos agentes podrían intervenir, decide primero quien define la entrada y luego quien ejecuta.
