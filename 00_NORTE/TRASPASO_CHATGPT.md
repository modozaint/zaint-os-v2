---
tags: [modozaint-v2, traspaso, chatgpt, contexto]
created: 2026-08-31
type: handoff
---

# Contexto de trabajo para ChatGPT

Este archivo es un puente de contexto, no una nueva fuente de verdad. Para trabajar, seguir los
enlaces y leer solo lo necesario para la tarea.

## Identidad del sistema

MODOZAINT V2 es la casa operativa nueva de MODOZAINT y ZAINT OS. Es hermana del V1, no lo reemplaza
automáticamente. El V1 conserva la identidad, conocimiento histórico y fuentes externas mientras la
migración sea gradual; se consulta en solo lectura desde `C:\DEPARTAMENTO MODOZAINT`.

Repositorio V2: `https://github.com/modozaint/zaint-os-v2` (privado).
Carpeta local: `C:\DEPARTAMENTO MODOZAINT V2`.

## Estado confirmado al 2026-08-31

- La estructura V2, políticas, router y rutas fueron verificadas.
- Las diez puertas de entrada de agentes están ordenadas en `70_AGENTES/`.
- Se verificaron 10 entradas, 82 rutas declaradas existentes, 9 políticas y 2 evidencias.
- ORQUESTADOR tiene tres evaluaciones registradas en `70_AGENTES/ORQUESTADOR/EVALS.md`.
- El runbook está en `70_AGENTES/ORQUESTADOR/PROCESO_EVALS.md`.
- El cierre documental está versionado en Git y el repositorio está sincronizado con `origin/master`.
- Los nueve especialistas están preparados como portables, pero no deben abrirse todos a la vez ni
  activarse fuera de su oficio.
- Buzz tiene la identidad local del usuario configurada; la publicación o vinculación de un repo en
  Buzz requiere hacerlo desde Buzz Desktop con la clave privada activa. Nunca copiar una clave
  privada a este archivo ni al repositorio.

## Entrada mínima obligatoria

1. `CLAUDE.md`
2. `00_NORTE/AGENT_ROUTER.md`
3. `00_NORTE/FUENTES_CANONICAS.md`
4. `20_OPERACION/AHORA.md`
5. `70_AGENTES/<AGENTE>/ESTADO.md`, si existe
6. Una sola fuente de dominio según el encargo

No escanear todo el vault por defecto. Usar recuperación just-in-time y conservar el router como
índice, no como copia del conocimiento.

## Separación de responsabilidades

- Agentes y skills portables: `70_AGENTES/`
- Workflows, SOPs y contratos de tarea: `50_SOP/`
- Servicios, aplicaciones y sistemas externos: se referencian desde sus fuentes canónicas; no se
  mezclan con la memoria del agente
- Conocimiento estable: `60_CONOCIMIENTO/`
- Estrategia: `10_ESTRATEGIA/`
- Operación viva y tareas: `20_OPERACION/`
- Resultados y métricas: `30_RESULTADOS/`
- Aprendizajes: `40_APRENDIZAJE/`
- Puente e histórico V1: `_ARCHIVO_V1/`

## Cómo debe trabajar ChatGPT

- Entrevistar primero: cerrar misión, alcance, fuentes, entregable, criterio de salida y escalamiento.
- Usar un especialista por defecto; delegar varios solo si los frentes son independientes y el
  presupuesto está declarado.
- Separar hechos, recomendaciones, decisiones y resultados.
- No inventar datos vivos, precios, fechas o estados; verificarlos en el sistema correspondiente.
- No publicar contenido ni gastar dinero sin la decisión del propietario.
- No borrar ni sobrescribir trabajo útil. Copiar, versionar y dejar cada cambio reversible.
- No tocar V1 durante la integración salvo lectura explícita.
- Si una decisión afecta arquitectura, producción, datos sensibles, dinero o una acción irreversible,
  detenerse y pedir al propietario la decisión.

## Primer mensaje recomendado

> Estás trabajando con MODOZAINT V2. Lee primero `CLAUDE.md`, `00_NORTE/AGENT_ROUTER.md`,
> `00_NORTE/FUENTES_CANONICAS.md`, `20_OPERACION/AHORA.md` y el `ESTADO.md` del agente pertinente.
> No escanees todo el vault. Confirma qué tarea concreta quieres resolver, el resultado observable,
> la fuente mínima y el criterio de terminado. Conserva V1, no dupliques instrucciones y deja cada
> cambio versionado y reversible.

## Nota de acceso

ChatGPT no puede leer una carpeta local solo porque exista en este equipo. Para darle este contexto,
abre este archivo y pégalo en el chat, o conecta el repositorio privado V2 mediante el mecanismo de
acceso que use esa instalación. Después de cada sesión, los resultados deben volver a V2 como archivo
revisable y commit atribuible.
