---
agente: KAIZEN
updated: 2026-08-21
abiertos: 2
---
# Hallazgos · Agente KAIZEN

> **Lo aprendido que todavía NO es aprendizaje consolidado.** Primera vez que aparece → entra aquí.
> **Si se repite → sube al módulo 08 del Knowledge Pack y se BORRA de este archivo.**
> Un hallazgo no puede estar en los dos sitios: esa fue la contradicción que se arregló el 21-jul.

## H1 · El canal que trajo las dos ventas lleva 49 días apagado, y nadie lo había contado
**2026-08-21 · 1ª vez**

El vault discute la reactivación de HK (decidida el 2-ago, keyboard rug como héroe) sin que en ningún
documento aparezca que **el último post de `@houseofkaizen` es del 3-jul-2026**. Solo aparece al
medir contra el Content OS.

**Por qué importa:** las 2 ventas reales llegaron **por el contenido** — ninguna por pauta, ninguna
por búsqueda. Es el único mecanismo de adquisición probado que tiene HK, y está apagado.

**Lo que NO es:** una falla. HK está 🟡 EN MANTENIMIENTO por decisión declarada (regla 3 aplicada
antes de diagnosticar). **Pero la decisión tiene un precio que no estaba escrito.**

→ **Si vuelve a aparecer en otra corrida, sube al módulo 08** como aprendizaje de marca: *el estado
de un canal no se deduce del plan, se mide.*

## H2 · El esquema del Content OS no es el que se supone, y cuesta dos consultas fallidas
**2026-08-21 · 1ª vez**

`posts` **no tiene `timestamp`** (es `published_at`), y `metrics` no se puede traer embebido desde
`posts` en una sola consulta REST. Además **`views` viene en 0 en los 20 posts de Instagram** — la
columna existe pero no se llena para IG.

**Columnas reales, para no volver a adivinar:**
- `posts`: id · caption · media_type · thumbnail_url · permalink · published_at · created_at ·
  updated_at · marca_id · plataforma
- `metrics`: post_id · reach · likes · comments · shares · saves · avg_watch_time_ms ·
  engagement_rate · captured_at · views

→ **Si otro agente tropieza con lo mismo, esto deja de ser hallazgo de KAIZEN y sube** — sería
conocimiento del sistema, no de la marca.
