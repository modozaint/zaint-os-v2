---
name: project-dermatinta-launch
description: "Estado de lanzamiento Dermatinta — URLs reales, estructura de tema Shopify, workflows de contenido, estrategia de pauta. Actualizado 2026-07-03."
metadata: 
  node_type: memory
  type: project
  originSessionId: d784ffda-def4-4c43-8ec1-9ba70fd23396
  modified: 2026-07-21T01:13:57.994Z
---

# Dermatinta — Estado de Lanzamiento (2026-07-03)

## 🔄 ACTUALIZACIÓN 2026-07-20 (estado vigente — lo de abajo es histórico técnico del montaje)
- **Lanzamiento YA está.** Fase actual = pulir. Ahora hay **3 personas reales involucradas** en el proyecto.
- **Necesidades definidas del proyecto ahora:** (1) mejorar el **contenido con una estrategia de marketing/contenido junto a los tatuadores aliados**; (2) pasar a **producto de MARCA PROPIA** (dejar de vender el producto HIU que hoy distribuyen).
- **Implicación:** la carga de tiempo de Santiago en Dermatinta bajó vs. el pico del lanzamiento → ya no compite tanto con el build del MVP de barbería (línea [[sellable-ai-solutions-venture]]). Oportunidad: el Content OS de Nexum podría potenciar justo esa estrategia de contenido con tatuadores (dogfood).

## Tienda Shopify
- **Dominio**: dermatinta.online
- **Plan**: Basic · COP · Colombia (GMT-5)
- **Tema activo**: "Copia de theme-export..." — `gid://shopify/OnlineStoreTheme/154525368512` (MAIN)
- **Nota API**: Mutations de archivos de tema bloqueadas para el tema MAIN por el MCP tool — editar vía Shopify Admin Customize o Code Editor

## URLs de Productos (reales, verificadas)
- **Crema 300ml**: `/products/crema-para-tatuajes-300ml` → $63.450 COP (antes $74.800)
- **Espuma**: `/products/espuma-limpiadora-tatuajes-ph-neutro` → $58.950 COP (antes $69.350)
- **Kit Rutina Completa** (HERO): `/products/kit-rutina-completa-tatuajes` → $112.480 COP (antes $129.550)
- Stock: Crema 11u, Espuma 11u, Kit 8u

## Estructura del Tema (index.json — secciones activas)
Orden CORRECTO (pendiente fix manual):
1. `dt_quiz_popup_v2` — Quiz popup (habilitado)
2. `dt_home_v2_main` — Hero / homepage principal
3. `custom_liquid_6GWaHR` — Pet Friendly / Cruelty Free / Fórmula Limpia
4. `dt_subscribe_popup_v2` — Popup de suscripción
5. `dt_footer_main` — Footer

**Fixes manuales pendientes** (hacerlos en Shopify Admin → Customize):
- Arrastrar Pet Friendly de posición 2 a posición 3 (después del hero)
- Rellenar res_url_1/2/3 en Quiz (URLs de arriba)
- Rellenar links del footer (productos + colección)

## Quiz Popup — Routing por Avatar (CORREGIDO 2026-07-03)
Avatar → Producto correcto (confirmado por Santiago):

| Respuesta quiz | Avatar | Producto | URL |
|---|---|---|---|
| Recién tatuado | Healing phase, necesita rutina completa | **Kit Rutina Completa** | `/products/kit-rutina-completa-tatuajes` |
| Ya cicatrizó / mantenimiento | Lleva años, quiere mantenerlo o hacerlo más negro | **Solo Crema 300ml** | `/products/crema-para-tatuajes-300ml` |
| Quiero los colores más vivos | Quiere pigmentación intensa | **Kit Rutina Completa** | `/products/kit-rutina-completa-tatuajes` |

→ res_url_1 = Kit, res_url_2 = Crema, res_url_3 = Kit

**Lógica**: Recién tatuado necesita LIMPIAR + HIDRATAR (espuma + crema = kit completo). Tatuaje cicatrizado solo necesita mantenimiento diario con la crema.

## Tema UNPUBLISHED listo para publicar (2026-07-04)
- Tema borrador `gid://shopify/OnlineStoreTheme/154483359936` ("theme-export-tpqsds...") tiene TODO implementado:
  - `sections/dt-home-v2.liquid` premium (hero full-bleed + gradiente, escasez animada, sliders, FAQ, placeholders de imagen)
  - `templates/index.json` con copy Hormozi+AIDA, quiz URLs corregidas, footer con links, 13 blocks
  - 4 imágenes IA generadas con producto real como referencia (Higgsfield, marketing_studio_image) ya subidas a Shopify Files y conectadas: `dt-hero-bg.png` (hero), `dt-crema-halo.png` (halo), `dt-kit-editorial.png` (kit), `dt-lifestyle-ritual.png` (manifiesto)
- **Pendiente Santiago**: publicar el tema en Admin → Themes → Publish. Añadir fotos propias en: 3 problem cards, 3 ingredientes, antes/después (usar fotos REALES de clientes, no IA), founder.
- Higgsfield: 0 créditos restantes (plan free, 2 créditos/imagen, max 1 job concurrente). Fotos de referencia del producto viven en el CDN de Shopify (IMG_5210, IMG_5211).

## Mejoras home v2 + arquitectura de secciones (2026-07-04)
- **Snippet reutilizable** `snippets/dt-before-after.liquid`: slider antes/después arrastrable (pointer+touch+teclado), con blur mientras se arrastra. Params: uid, before, after, before_label, after_label, ratio, start. Usa `[data-dtba]` para auto-init. YA está en el tema.
- **dt-home-v2 actualizado**: hero_bg ahora opacity 1 + veil radial/lineal (antes .54 = invisible sobre near-black); activos en carrusel horizontal scroll-snap (#ingTrack) con flechas+dots; Antes/Después usa el snippet dt-before-after; problemas siguen con reveal `.rv` al scroll.
- **Páginas de PRODUCTO — arquitectura** (cada una plantilla distinta, NO comparten):
  - Kit → `templates/product.json` → sección `dt-product-experience` ("DT Producto Pro"). Ya tiene before/after propio (before_img/after_img "Desliza Y Mira").
  - Crema → `product.crema-hidratante-300ml.json` → sección `dt-producto-crema-300ml` ("DT Crema 300"). Tiene EL DIFERENCIADOR (50ml vs 300ml barras — diff_them_vol/diff_us_vol), tabla comparativa, activos VERTICALES, loyalty, sticky bar.
  - Espuma → `product.espuma-ph-neutro.json` → sección `dt-producto-espuma-ph-neutro` ("DT Espuma PH"). Tiene sección edu pH, tabla comparativa, activos, loyalty.
  - Los 3 usan un `custom_liquid_fL77CF` que fuerza fondo global e inyecta `--dt-green: #1F5A4A` (OFF-BRAND). `main` (main-product estándar) está disabled en los 3.
- **PENDIENTE producto (próximo bloque)**: (1) cambiar verdes #1F5A4A/#0f4a3f→#0D3D34 y dorados #B78F47/#B9934B→#C49A52 en los 3 templates + custom_liquid + barras/tickers; (2) en dt-producto-crema-300ml reemplazar el visual del DIFERENCIADOR por render de dt-before-after (mantener copy 300ml); (3) activos consistentes tipo carrusel horizontal en los 3 (hoy Crema/Espuma los muestran verticales; Kit distinto).
- **COLORES OFICIALES** (de BRANDS/DERMATINTA.md, fuente de verdad): --g #0D3D34, --gd #0A2A23, --gx #070E0C, --c #FBF8F1, --a #C49A52, --ah #B8863E. Alt bg #FFFFFF / #F5F2EA. Las páginas de producto están fuera de estos valores.

## Secciones Nuevas a Agregar
- **Antes/Después**: código Liquid en scratchpad session `d784ffda-def4-4c43-8ec1-9ba70fd23396` o recrear. Archivo: `sections/dt-before-after.liquid`. Necesita fotos reales de clientes.

## Estrategia de Contenido — TIPO A Scale System
- 14 videos planificados: 4 ADQ / 7 AUT / 3 CONV
- Dashboard: `https://modozaint.github.io/zaint-content-control-room/DERMATINTA_CONTENT_HUB.html`
- 14 hooks ya grabados (en sesión previa)
- VOs: grabar todos en una sesión (ordenados de más corto a más largo)

## Workflow Seedance 2.0 en CapCut (B-roll sin regrabar)
Santiago tiene CapCut Pro con créditos. Seedance 2.0 disponible en CapCut:
- **Text → Video**: generar b-roll de piel tatuada / producto desde descripción
- **Image → Video**: animar fotos de producto para Reels/Stories
- **Video → Video**: cambiar fondo de hooks grabados sin re-grabar
Reemplaza Pexels para b-roll. Disponibilidad en Colombia: verificar al abrir CapCut (expanding en LATAM).

## Pauta Meta Ads — Regla clave
**NO usar "tattoo care" como interés**. Hablar al avatar de estilo (22-35, Colombia), no al mercado de cuidado de tatuajes.
- Intereses: sneakers (Nike/Jordan/Adidas), streetwear, skincare general, fitness urbano
- 3 ad copies: Inconsistencia / El detalle / Contraste de precio — en Ops Hub artifact

## Deliverables generados en este bloque (2026-07-03)
- Ops Hub artifact con: fixes Shopify + Seedance guide + Marketplace listings + pauta copy + Liquid before/after
- 3 listados de Facebook Marketplace (Kit, Crema, Espuma) — listos para pegar
- 3 ads Meta específicos por avatar (no hablan de "aftercare")
- Código Liquid `dt-before-after` — pegar en Shopify Code Editor

## Sesión 2026-07-04 — imágenes reales + colores oficiales (tema DRAFT)
- **Tema a editar = DRAFT unpublished** `gid://shopify/OnlineStoreTheme/154483359936` ("theme-export-tpqsds…"). Tiene el build completo (home v2 con 13 blocks, 3 product pages). El **MAIN publicado** ("Copia de theme-export…", `154525368512`) es una versión más simple/vieja. **Regla del usuario: NO publicar; Santiago revisa y aprueba la publicación él mismo.**
- **API Shopify:** `themeFilesUpsert` funciona en temas **unpublished**; bloqueado en MAIN. Editar el draft por API, no el MAIN.
- **Imágenes:** Santiago subió 29 fotos lifestyle reales (Pexels) a Shopify Files. Nombres = original con espacios→`_`, ñ→n, sin paréntesis. Ref en tema: `shopify://shop_images/<nombre>.jpg`. Shop id CDN: `1/0768/4204/1536`. **Faltan 4 por subir:** `tatuaje con crema y mano aplicando` (la más útil), `tatuada con auto de fondo`, `tatuado en la calle solo`, `duo mujeres tatuadas`.
- **Montado:** Home `hero_bg`=mujer_tatuada_posando_en_bano, `lifestyle_img`=tatuada_mirando_a_camara. Espuma `edu_image`=tatuado_lavando_manos. (hero_product/kit/founder/antes-después se dejan para fotos de producto/cliente reales.)
- **COLORES OFICIALES aplicados** (reemplazaron off-brand) en Home + 3 product pages + el `custom_liquid_fL77CF` global: verde `#0D3D34` (era #1F5A4A/#0F4A3F/#0F4A3D), dorado `#C49A52` (era #B78F47/#B9934B), crema `#FBF8F1`/`#F5F2EA` (era #F7F4EE/#FBF8F2), rgba verde `13,61,52`, rgba dorado `196,154,82`. Barra anuncios Crema: texto negro→blanco (legibilidad).
- **Pendiente estructural (LIQUID, secciones):** Crema diferenciador (barras 50ml vs 300ml) → antes/después deslizable (snippet `dt-before-after` ya existe; Kit ya usa "Desliza Y Mira"); activos en carrusel horizontal en las 3; cards de problema con reveal al scroll.
- **Instagram HIU:** handle = **@hiuaftercare** (https://instagram.com/hiuaftercare). Son distribuidores, HIU autoriza reusar contenido. Tarea: revisar feed y recomendar qué usar. Requiere login en vivo (agent-browser).

**Why:** Lanzamiento del primer lote Dermatinta; sesión de montaje de visuales reales y sistema de color oficial.
**How to apply:** Al retomar, leer BRANDS/DERMATINTA.md + este archivo. Editar SIEMPRE el tema draft 154483359936, nunca publicar.
