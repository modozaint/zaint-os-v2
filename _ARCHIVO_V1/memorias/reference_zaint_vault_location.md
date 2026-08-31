---
name: reference-zaint-vault-location
description: "Dónde vive realmente el contexto de ZAINT — vault de Obsidian en el Escritorio, no en la carpeta DEPARTAMENTO MODOZAINT"
metadata: 
  node_type: memory
  type: reference
  originSessionId: d784ffda-def4-4c43-8ec1-9ba70fd23396
---

**Estado desde 2026-06-29 (post-rediseño de arquitectura):** el vault único y consolidado vive en **`C:\DEPARTAMENTO MODOZAINT\`** (raíz del directorio de trabajo de Claude Code). Estructura de 3 niveles — ver `00_CONTEXT_CORE.md` §2 para el detalle completo:
- `00_CONTEXT_CORE.md` — documento maestro (Nivel 1, Founder Core).
- `01_BRAND_MAP.md` — identidad de marca (referencia, no departamento), `02_CONTENT_SYSTEM.md`, `03_OPERATING_SYSTEM.md`, `04_SKILLS_TO_BUILD.md` (ahora índice), `05_CURRENT_PRIORITIES.md`, `06_TEAM.md`, `07_CONTENT_CONTROL_ROOM.md`.
- `08_CONTENT_ENGINE.md`, `09_MEDIA_FACTORY.md`, `10_AUTOMATION_SYSTEMS.md`, `11_PERFORMANCE_ANALYTICS.md`, `12_KNOWLEDGE_REFINERY.md`, `13_SYSTEMS_ARCHITECTURE.md` — los 6 sistemas centrales compartidos (Nivel 2).
- `14_DERMATINTA_BU.md`, `15_HOUSE_OF_KAIZEN_BU.md` — las 2 business units delgadas (Nivel 3, solo 7 campos cada una, sin equipo propio).
- `high_leverage_discovery/` — investigación puntual de herramientas/sistemas externos (pasada única 2026-06-23).
- `.obsidian/` — config del vault de Obsidian (limpia, una sola, sin anidamiento).

**Historial:** originalmente este contenido vivía en `Desktop\ZAINT_CONTEXT_CORE\`, pensado para abrirse como vault de Obsidian (wikilinks `[[...]]` nativos). Santiago instaló Obsidian apuntando por error a `DEPARTAMENTO MODOZAINT` (carpeta vacía) en vez de abrir `ZAINT_CONTEXT_CORE`, y además quedó un `.obsidian` anidado roto (`.obsidian\.obsidian\`) con notas vacías sueltas — eso cortó la continuidad de contexto entre sesiones. El 2026-06-29 se limpió el anidamiento roto y se movió (no copió) todo el contenido real de `Desktop\ZAINT_CONTEXT_CORE\` a `DEPARTAMENTO MODOZAINT\`, eliminando la carpeta del Escritorio ya vacía. Ahora hay un único vault, en el mismo directorio donde se abre Claude Code.

**Why:** Sin esto, cada sesión nueva en `DEPARTAMENTO MODOZAINT` partía de cero aunque el contexto real existiera en otro lado.

**How to apply:** Al iniciar una sesión sobre ZAINT/MODOZAINT/Dermatinta/House of Kaizen, leer primero `00_CONTEXT_CORE.md` (en la raíz del working directory) y los archivos enlazados — ya no hace falta buscar en el Escritorio.
