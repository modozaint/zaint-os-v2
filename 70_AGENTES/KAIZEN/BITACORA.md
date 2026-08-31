---
agente: KAIZEN
updated: 2026-08-21
entradas: 1
---
# Bitácora · Agente KAIZEN

> **Append-only. Una fila por corrida, aunque haya durado 5 minutos.**
> **Máx. 10 entradas.** Al pasar de 10, las más viejas se mueven a `_ARCHIVO_BITACORA.md`.
> La columna que más vale es **fricción real** — es de donde sale la regla de las dos veces.

| fecha | qué se pidió | qué se entregó (o por qué no) | fricción real | quedó a medias |
|---|---|---|---|---|
| 2026-08-21 | Primera corrida: briefing de apertura tras construir la skill en la Ola 2 | Medición propia de `@houseofkaizen` (20 posts, reach mediana 315, máx 1.402), fase calculada **0 · PARADO**, eslabón roto identificado y `ESTADO.md` escrito con los 2 bloqueadores de Santiago | **EL DATO QUE NO ESTABA EN NINGÚN DOCUMENTO Y SOLO APARECE MIDIENDO: el último post de IG es del 3-jul, 49 DÍAS DE SILENCIO** — el vault hablaba de la reactivación decidida el 2-ago sin que nadie notara que el canal llevaba 7 semanas apagado. **Regla 3 aplicada antes de llamarlo falla:** HK está 🟡 EN MANTENIMIENTO por decisión declarada, así que el silencio es consecuencia, no abandono — pero tiene precio y se dice. **Segunda fricción, técnica:** la tabla `posts` del Content OS **no tiene columna `timestamp`** (es `published_at`) y `metrics` no admite embed anidado desde `posts` — dos consultas fallaron antes de acertar. Queda escrito para no repetirlo: columnas reales de `posts` = id·caption·media_type·thumbnail_url·permalink·published_at·created_at·updated_at·marca_id·plataforma; de `metrics` = post_id·reach·likes·comments·shares·saves·avg_watch_time_ms·engagement_rate·captured_at·views. **Tercera:** `views` viene en 0 en los 20 posts de IG — no se inventa, se dice que no está | Los 3 datos de las ventas (Santiago) · el catálogo · el barrido de nicho · ninguna conversación de cliente registrada |
