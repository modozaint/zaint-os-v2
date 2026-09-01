---
tags: [modozaint-v2, adr, local-first, multiagente]
updated: 2026-09-01
tipo: decision
status: accepted
owner: zaint-oficina
supersedes: null
---

# ADR 0002 - Operación local-first y motores reemplazables

## Contexto

La integración con Buzz permitió validar coordinación, pero su repositorio no puede importar de forma
íntegra el historial Git de V2 sin deformar padres y hashes. La carpeta local y GitHub conservan el
historial completo y portable.

## Decisión

V2 se opera localmente desde `C:\DEPARTAMENTO MODOZAINT V2`. Git y el repositorio son la fuente de
verdad; Claude Code, Codex, Buzz y otros modelos son interfaces o motores intercambiables. Buzz queda
opcional para coordinación y no es dependencia de arquitectura, contexto, estado ni despliegue.

## Reglas operativas

- La entrada es `AGENTS.md` o `CLAUDE.md`, seguida del router y recuperación just-in-time.
- La carpeta V1 `C:\DEPARTAMENTO MODOZAINT` se consulta en solo lectura durante la migración.
- Todo cambio durable se guarda en V2, se revisa y se versiona con Git.
- No se duplica la conversación completa ni se depende de memoria de un proveedor.
- Agentes, skills, workflows, servicios y conocimiento mantienen responsabilidades separadas.
- Todo cambio estratégico, sensible, financiero o irreversible requiere decisión del propietario.

## Consecuencias

- El mismo repositorio puede abrirse desde Codex, Claude Code u otro runtime compatible.
- La sincronización entre máquinas se hace con Git.
- La coordinación externa puede cambiar sin rediseñar V2.
- Los artefactos de Buzz quedan como evidencia histórica/opcional, no como fuente operativa.

## Evidencia

- `60_CONOCIMIENTO/EVIDENCIA/ARQUITECTURA_MULTIAGENTE_2026_08_29.md`.
- `60_CONOCIMIENTO/EVIDENCIA/EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md`.
- Decisión explícita del propietario del 2026-09-01.
