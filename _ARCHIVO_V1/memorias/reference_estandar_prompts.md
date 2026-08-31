---
name: reference-estandar-prompts
description: "Dónde vive el estándar de ZAINT para escribir planes que otro agente ejecuta, y qué corrige de lo que \"todo el mundo\" recomienda."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 68b980fd-da28-47a9-8b61-8f95c1834ec5
  modified: 2026-08-21T16:39:46.331Z
---

`c:\DEPARTAMENTO MODOZAINT\SISTEMA\ESTANDAR_PROMPTS.md` — v1 del 2026-08-21, investigado contra fuentes oficiales de Anthropic (guía de auditoría de prompts de la skill `claude-api`, *Effective harnesses for long-running agents*, *Claude Code best practices*).

Lleva las 7 reglas de redacción, la anatomía de 8 secciones de un plan ZAINT, cómo se escribe un criterio de aceptación, el prompt de arranque que Santiago copia, y el contrato del revisor.

**Lo que corrige y no es obvio:** la coreografía `PASO 1 → PASO 2` empeora el trabajo de juicio · el registro del prompt se contagia a la respuesta (un prompt que grita produce trabajo defensivo) · los ejemplos pesan más que las reglas escritas · prohibir un error que el modelo no iba a cometer puede empujarlo hacia él · «piensa paso a paso» y las etiquetas `<thinking>` son fósiles en modelos que ya razonan.

Se revisa **con cada modelo nuevo**, no por calendario: un prompt es un artefacto por modelo. Lo usa [[feedback-rol-planeador]] en cada plan.
