---
name: reference-zaint-external-systems
description: "Mapa de sistemas externos conectados al ecosistema ZAINT — Notion ZAINT HQ, Shopify de Dermatinta, GitHub, rutinas en la nube"
metadata: 
  node_type: memory
  type: reference
  originSessionId: d784ffda-def4-4c43-8ec1-9ba70fd23396
---

**Notion — "ZAINT HQ"** (conectado vía MCP, búsqueda con `notion-search`). Existe un ZAINT OS completo en Notion **anterior al vault de Obsidian** (contenido desde 2026-05-24, un mes antes del traspaso que originó el vault, 2026-06-23) — **sin reconciliar todavía con el vault**, ver [[feedback-zaint-governing-rules]] y la pregunta abierta #0 en `00_CONTEXT_CORE.md` del vault. Páginas relevantes encontradas:
- "ZAINT HQ" (página raíz) — contiene la Knowledge Vault.
- "🧠 Knowledge Vault — Base" (database, data source `collection://9bc5660f-c104-4619-b3bf-cc1ab580b9e5`). Esquema: Título, Categoría (Marketing/Ventas/Branding/Ecommerce/Psicología del Consumidor/Curso Converzo/IA/Automatización/Sistemas Empresariales), Fecha, Fuente (ChatGPT/Claude/Libro/Curso/Experiencia propia/Otro), Contenido, Proyecto relacionado (Dermatinta/House of Kaizen/ZAINT general).
- "🧠 Bóveda de Conocimiento", "🤖 Sistema Operativo de IA", "🧠 ZAINT — Base de Conocimiento Estratégica" (tiene una "regla de oro" no traída al vault todavía), "🟢 Interfaz ZAINT", "CREATIVE VAULT", "📦 Operaciones y Producción de Marca (Dermatinta / House of Kaizen)" (usa el nombre "KAYZEN STUDIO", a confirmar si es lo mismo que "House of Kaizen"), "Revisión semanal ZAINT OS" (ya existe el ritual semanal que en el vault aparecía solo como propuesta).

**Shopify de Dermatinta** (conectado vía MCP `mcp__claude_ai_Shopify__*`). Tienda real: `tpqsds-0c.myshopify.com` (cambió desde `dermatinta.online` — Santiago migró/recreó la tienda, confirmado 2026-06-30 por contenido idéntico ya cargado), plan Basic, COP, Colombia. 3 productos activos con reseñas verificadas (4.7/5): Crema Hidratante 300ml, Espuma Limpiadora pH Neutro, Kit Recomendado (rutina completa, es la oferta principal). Detalle completo de pricing/inventario en el vault, `14_DERMATINTA_BU.md`. Tema en vivo se llama `theme-export-dhb4w4-0a-myshopify-com-zendrop` (MAIN) — el conector bloquea escribir directo ahí; para subir código hay que duplicar el tema primero (`themeDuplicate`) y trabajar en la copia sin publicar. Ver [[19_DERMATINTA_HOME_ARCHITECTURE]] para el detalle del flujo de subida vía API.

**GitHub** (cuenta `modozaint`, vía `gh` CLI). Repos: `zaint-content-control-room` (público, banco de ideas/calendario/dashboard de las 3 marcas) y `cv-santiago-giraldo` (privado).

**Rutina en la nube (claude.ai/code/routines).** `trig_01HbVqgvvw36YiTBsdbSnLoz` — investigación mensual de competencia de Dermatinta, corre el día 1 de cada mes, escribe hallazgos en la Knowledge Vault de Notion (no puede tocar el vault local de Obsidian, que no es un repo git).

**Why:** estos son los sistemas reales que hay que consultar antes de asumir que el vault de Obsidian es la única fuente de verdad — varias veces en la sesión del 2026-06-29 el vault estaba desactualizado o incompleto respecto a lo que ya existía en Shopify/Notion.

**How to apply:** antes de dar por buena cualquier suposición sobre Dermatinta/ZAINT (precios, inventario, identidad visual, decisiones ya tomadas), verificar primero contra Shopify y Notion si la pregunta lo amerita — no asumir que el vault de Obsidian ya tiene todo.
