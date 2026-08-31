---
tags: [zaint, modozaint-v2, manual, operacion]
creado: 2026-08-30
estado: vigente
---

# MODOZAINT V2 - manual de operacion

> Entrada unica. Lee este archivo, luego `00_NORTE/AGENT_ROUTER.md`,
> `00_NORTE/FUENTES_CANONICAS.md` y `20_OPERACION/AHORA.md`, y solo despues actua.

## 0. Que es esto

- Es la casa nueva de MODOZAINT.
- Es hermana del V1, no su reemplazo automatico.
- Nace vacia de operacion y llena de criterio.
- Lo que entra aqui tiene que poder explicarse solo.

## 1. El ciclo

| Carpeta | Responde |
|---|---|
| `00_NORTE/` | A donde va esto y por que entra |
| `10_ESTRATEGIA/` | Que se ofrece, a quien y con que tesis |
| `20_OPERACION/` | Que se esta ejecutando ahora |
| `30_RESULTADOS/` | Que salio y que se midio |
| `40_APRENDIZAJE/` | Que cambio por lo medido |
| `50_SOP/` | Que proceso se reusa sin reinventarlo |
| `60_CONOCIMIENTO/` | Que sabemos que no caduca |
| `70_AGENTES/` | Que agentes y skills trabajan aqui |
| `_ARCHIVO_V1/` | Que quedo como puente al sistema anterior |

## 2. Como se trabaja

- Capacidad finita. Si entra algo nuevo, sale tiempo de algun otro lado.
- Maximo 2 cuentas activas a la vez.
- "Entregado" significa publicado o en manos de quien paga.
- Antes de construir algo nuevo, primero se audita si ya existe total o parcialmente.
- Antes de escribir un numero, estado o fecha, se verifica en el sistema vivo.
- Si una salida es reversible, se hace y se cuenta despues.

## 3. Lo que frena

Las cuatro protecciones viven en el V1 y siguen mandando aqui:

- [PROTECCIONES](../DEPARTAMENTO MODOZAINT/SISTEMA/PROTECCIONES.md)

Si algo no esta ahi, esta permitido.

## 4. Donde vive cada cosa

| Tipo | Donde vive |
|---|---|
| Prioridad y orden del trabajo | `00_NORTE/` |
| Decisiones de arranque | `00_NORTE/decisiones/` |
| Planes vivos y ejecucion | `20_OPERACION/` |
| Resultados y metricas | `30_RESULTADOS/` |
| Aprendizajes nuevos | `40_APRENDIZAJE/` |
| SOPs reutilizables | `50_SOP/` |
| Conocimiento que no caduca | `60_CONOCIMIENTO/` |
| Agentes y skills portables | `70_AGENTES/` |
| Puente al V1 y archivos historicos | `_ARCHIVO_V1/` |

## 5. Como agregar algo nuevo

1. Si es una decision de arranque, entra en `00_NORTE/`.
2. Si es un proceso reusable, entra en `50_SOP/`.
3. Si es conocimiento estable, entra en `60_CONOCIMIENTO/`.
4. Si es un agente o skill, entra en `70_AGENTES/`.
5. Si viene del V1 solo como referencia, va en `_ARCHIVO_V1/` como copia o puntero.

## 6. Regla de seguridad

- No tocar el V1 por accidente.
- No mover nada util sin dejar rastro.
- No inventar una fuente si ya existe un archivo de arranque para ese dominio.
- Si algo afecta arquitectura, produccion, datos sensibles, dinero o acciones irreversibles, se detiene y se pregunta.
