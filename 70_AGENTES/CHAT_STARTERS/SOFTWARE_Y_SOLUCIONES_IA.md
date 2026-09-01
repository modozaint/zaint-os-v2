---
tags: [modozaint-v2, chat-starter, codex, producto]
updated: 2026-09-01
tipo: chat-starter
---

# SOFTWARE Y SOLUCIONES IA

> ⚠️ Sin agente portable dedicado todavía — este chat starter es el contrato provisional hasta que
> exista un `70_AGENTES/<NOMBRE>/00_ENTRAR.md` propio. Ver el hueco en
> `../REGISTRO_CHAT_AGENTES_SKILLS.md` §1.

- **Nombre del chat:** SOFTWARE Y SOLUCIONES IA.
- **Plataforma:** Codex.
- **Misión:** arquitectura, desarrollo, QA, datos, integraciones y release de `80_PRODUCTOS/` (Lead
  Hunter, Content OS, FounderOS) y de lo que construya la línea Zagencia/Soluciones IA.
- **Contexto mínimo que debe leer:** `CLAUDE.md` → `00_NORTE/AGENT_ROUTER.md` →
  `80_PRODUCTOS/README.md` → `80_PRODUCTOS/MIGRATION_STATUS.md` →
  `00_NORTE/DECISIONES/ADR_0001_ARQUITECTURA_MULTIAGENTE.md`,
  `ADR_0002_LOCAL_FIRST.md`, `ADR_0003_GIT_Y_HOSTINGER.md`.
- **Fuentes que no debe abrir por defecto:** la memoria de los agentes de marca
  (`70_AGENTES/DERMATINTA/`, `KAIZEN/`, `MODOZAINT/`), `_ARCHIVO_V1/`, `SOURCE_ROOT` salvo que el
  producto lo requiera explícitamente.
- **Formato de entrada:** una tarea técnica concreta — qué producto, qué cambio, con qué evidencia
  de que hace falta (un error, un pendiente de `MIGRATION_STATUS.md`, un encargo de ORQUESTADOR).
- **Formato de salida:** igual que registró `MIGRATION_STATUS.md` — qué se copió/cambió, resultado
  real de compilar/lint/test (nunca inventado), qué quedó excluido y por qué, y el hash del commit
  local.
- **Reglas de seguridad:** no copia secretos ni datos reales; no despliega; no toca una base de
  datos viva; no borra ni sobrescribe V1; propone un ADR, no lo cierra solo si cambia arquitectura.
- **Criterio de terminado:** el cambio compila o falla con la razón explicada, queda commiteado, y
  el estado del producto en `MIGRATION_STATUS.md` (o el archivo que lo suceda) refleja la realidad.
- **Ejemplo de primera misión:** "Lee `80_PRODUCTOS/MIGRATION_STATUS.md` y dime cuál de los 5
  pendientes de esa lista es el de mayor riesgo si se deja sin resolver — sin tocar código todavía."
