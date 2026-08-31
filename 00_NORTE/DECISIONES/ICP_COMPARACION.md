---
tags: [migracion, decisiones, icp, modozaint]
creado: 2026-08-29
estado: COMPARACIÓN — no elige. Ningún ICP fue editado, movido ni borrado
fuente: planes/preparacion-modozaint-v2-2026-08-29.md §4 Ola 2 · _MIGRACION/MODOZAINT_CURRENT_SYSTEM_MAP.md §G.1 y §J
---

> # ✅ RESUELTO EL 2026-08-29
>
> **La fuente vigente del ICP es `BRANDS/MODOZAINT/DECISION_ICP_Y_ARRANQUE_2026-08-28.md`.**
> Santiago: *«el ICP lo definimos bien con una entrevista detallada con el departamento de marketing»*.
>
> 🔑 **Y el hallazgo: no eran 8 documentos compitiendo, eran 8 pasos de un proceso** — investigación
> → instrumento → decisión → datos que la respaldan. La duplicación era aparente. El detalle y la
> clasificación de cada uno están en `DECISIONES_PENDIENTES.md` §1.
>
> **Lo de abajo queda como el análisis que preparó esta decisión.**

---

# Los ICP de MODOZAINT — comparados, no elegidos

> **Este documento no elige.** Presenta los nueve documentos que hoy describen a la audiencia de
> MODOZAINT para que Santiago decida cuál queda vigente y qué pasa con el resto. Ningún archivo
> original fue tocado para escribir esto.
>
> **La pregunta que este documento deja contestable de un vistazo:** *¿cuál de estos sobrevive, y
> qué se pierde si los otros pasan a referencia?*

---

## 0. Antes de la tabla — dos de los nueve ya se resolvieron solos

**No son ocho documentos compitiendo. Son seis, más un instrumento y un método.** Dos ya están
autodeclarados muertos dentro de su propio archivo, sin que nadie los haya movido:

| Documento | Qué dice su propio frontmatter |
|---|---|
| `buyer-persona-modozaint.md` (02-ago) | *«⛔ REEMPLAZADO. NO USAR.»* — reemplazado el 27-ago por `ICP_v1_desde-cero.md` |
| `ICP_ENTREVISTA_2026-08-27.md` (27-ago) | *«🔴 REEMPLAZADA el 2026-08-28 por `ENTREVISTA_ICP_DEFINITIVA.md` — no responder esta»* |

**Se incluyen en la tabla por completitud** (el plan pide los ocho + el de `CONTENIDO/`), pero la
decisión que de verdad espera a Santiago es entre los **seis restantes**.

---

## 1. La tabla — los nueve, uno por uno

| # | Documento | Qué afirma sobre la audiencia | ¿Dato medido o hipótesis? | Con cuál se contradice | Quién lo cita hoy |
|---|---|---|---|---|---|
| 1 | **`AUDIENCIA_REAL_verificada_2026-08-28.md`** ⭐ | Quién sigue HOY la cuenta: 71 % hombres · núcleo 25-34 (42,9 %) · segundo grupo 35-44 (23,5 %) · Colombia 62,8 % (Bogotá > Medellín) · pico de actividad 6 pm · crecimiento plano desde jun | 🟢 **MEDIDO.** Panel nativo de TikTok, capturado por Santiago el 28-ago 09:55 | Corrige tres afirmaciones de `ICP_v1` (horario nocturno, Medellín primero, duda sobre si era hombre) — las tres quedan **falsas** | `ICP_v1` · `ICP_v2` · `BUYER_PERSONAS_v1` · `DECISION_ICP_Y_ARRANQUE` · `LENGUAJE_Y_FILTRO` · `_USO_LOG` |
| 2 | **`BUYER_PERSONAS_v1.md`** ⭐ | Cinco personas nombradas con evidencia textual: Brayan (volumen, quiere *hacer*) · Eli (quiere *cobrar*, mayor valor comercial) · Julián (founder que ya llegó) · Nico (compra, ya no se le diseña contenido) · Ferro (proveedor, no cliente) | 🟡 **Mixto** — construido sobre comentarios reales y el dato medido de #1, pero el propio documento admite **cero entrevistas** (el estándar declarado es 8-12 por persona) | No se contradice con #1 ni con #6 (`ICP_v2`) — los tres convergen en el mismo núcleo. Sí diverge de `ICP_v1` en el método (parte de la audiencia que ya llegó por tufting; `ICP_v1` pide ignorar esa audiencia) | 🔑 **Es el único de los nueve citado directamente por las skills que producen contenido:** `.claude/skills/contenido`, `copy`, `modozaint`, `kaizen` (las cuatro citan la misma línea, verbatim) |
| 3 | **`ICP_v2_LAS_OCHO_VARIANTES.md`** | El mismo núcleo que #1/#2, derivado por 8 métodos independientes (evidencia, founder, JTBD, competencia, hueco de mercado, alto valor, intersección de marcas, oficio+IA). Nombra a la persona **«El que le está metiendo»** y formaliza el modelo de **dos anillos** (24-32 que aprende · 30-45 founder que ya llegó) | 🟡 **Mixto** — 7 de 8 métodos convergen en el dato medido; el método D (founder hace 2 años) y parte del resto son narrativa/arquetipo, no medición | Declara explícitamente que **sustituye la conclusión de `ICP_v1`** («no lo borra») | `AGENTES/XIOMARA/ESTADO.md` · `ANILLO_2_founders_reales` · `AUDIENCIA_REAL` · `BUYER_PERSONAS_v1` · `DECISION_ICP_Y_ARRANQUE` · `ENTREVISTA_ICP_DEFINITIVA` |
| 4 | **`DECISION_ICP_Y_ARRANQUE_2026-08-28.md`** | Cierra el ICP en una frase: *«alguien que quiere hacer algo con sus manos y que eso le dé plata»* (mismo núcleo que #1-#3) + decide cómo arranca el contenido, qué se mide y la meta de ingreso | 🟢 Se apoya en el dato medido de #1, más **decisiones explícitas de Santiago tomadas en la entrevista del 28-ago** (no son hipótesis: son elecciones) | Ninguna con #1/#2/#3 — es la síntesis operativa de los tres. Sí resuelve una tensión interna propia (§1: la puerta elegida — tufting — chocaba con la meta elegida — founders — hasta que el propio documento la resuelve en §2) | `ANILLO_2_founders_reales` · `BUYER_PERSONAS_v1` · `LENGUAJE_Y_FILTRO` · `CONTENIDO/MANUAL_EDICION` · `AGENTES/XIOMARA/` · `_USO_LOG` |
| 5 | **`ENTREVISTA_ICP_DEFINITIVA.md`** | **No es una afirmación sobre la audiencia — es el instrumento** que se usó para producir #2/#3/#4 (14 bloques de preguntas, de las cuales «solo 2 respondidas» en su antecesora directa) | — *(no aplica: es método, no conclusión)* | Reemplaza a `ICP_ENTREVISTA_2026-08-27.md` | `AGENTES/XIOMARA/ESTADO.md` · `AUDIENCIA_REAL` · `DECISION_ICP_Y_ARRANQUE` · `ICP_ENTREVISTA_2026-08-27` (como su reemplazo) |
| 6 | **`ICP_v1_desde-cero.md`** | Pide **ignorar a propósito** la audiencia real de tufting («consecuencia de lo publicado, no evidencia de a quién debe hablarle la marca») y construye un arquetipo compuesto — **«Andrés»**, 26-30 años — desde la historia del founder y estadísticas de mercado (fracaso de emprendimientos, informalidad en Colombia) | 🔴 **HIPÓTESIS.** Ningún dato es de la audiencia de @modozaint: son estadísticas de mercado externas (Cámara de Comercio, OCDE) aplicadas a un arquetipo inventado | ⚠️ **Directa con #1/#2/#3/#4:** su instrucción explícita de ignorar la audiencia de tufting es lo que los documentos posteriores (con dato medido en la mano) terminan incorporando de todos modos — «El que le está metiendo» de `ICP_v2` es, en la práctica, la misma audiencia que `ICP_v1` pidió no mirar | `ICP_v2` · `ENTREVISTA_ICP_DEFINITIVA` · `AUDIENCIA_REAL` · `buyer-persona-modozaint` (como su reemplazo) · `INFORME_MERCADO_2026-2027` · `UNIVERSO_NARRATIVO_v1` · `SISTEMA/SYSTEM_COMMANDS` |
| 7 | **`ICP_ENTREVISTA_2026-08-27.md`** | Instrumento de 60 preguntas, **solo 2 respondidas** (la 13 y la 20) antes de ser reemplazado | — *(método, ya autodeclarado muerto — ver §0)* | Su propio frontmatter dice que no se responde más | Ninguno activo — solo referenciado como antecesor de `ENTREVISTA_ICP_DEFINITIVA` |
| 8 | **`buyer-persona-modozaint.md`** | Arquetipo **«El Encarretado»** (un pana paisa curioso de IA), construido sobre **una sola señal real** (el mensaje de Germán Arboleda) | 🔴 **HIPÓTESIS**, y el propio documento se declaraba sin validar desde el 02-ago | Su propio frontmatter dice que fue reemplazado — ver §0 | Ninguno activo — se conserva «como registro», su propio texto dice «no se cita» |
| 9 | **`CONTENIDO/AGENTES_MARCA/buyer-persona.md`** | **No describe a la audiencia de MODOZAINT.** Es la plantilla genérica del método (Módulo 2 de Converzzo) para construir el avatar de *cualquier* marca — dermatinta, kaizen o modozaint | — *(no aplica: es un procedimiento, no una conclusión sobre esta marca)* | Ninguna — es una capa distinta (cómo se construye un avatar, no cuál es) | Citado por wikilink `[[buyer-persona]]` desde `optimizacion-perfil.md` y `CURSO_CONVERZZO/00_MAPA_CURSO.md`. Cita a `R12`, una regla retirada en el replanteo del 23-ago — **referencia obsoleta dentro del propio documento, sin corregir** |

---

## 2. Lo que la tabla deja ver de un vistazo

**Tres documentos (#1, #2, #3) y la síntesis que los cierra (#4) cuentan la misma historia con
distintos métodos, y convergen.** No compiten entre sí — se apilan: la medición (#1) alimenta las
personas nombradas (#2) y la convergencia de ocho métodos (#3), y `DECISION_ICP_Y_ARRANQUE` (#4)
es donde Santiago ya tomó la decisión operativa sobre ese mismo núcleo.

**El único documento genuinamente en tensión con los otros tres es `ICP_v1_desde-cero` (#6)** —
no porque el dato esté mal, sino porque su instrucción explícita («ignora la audiencia de
tufting») es la que los documentos posteriores terminan sin seguir: la audiencia medida el 28-ago
**es**, en su mayoría, la audiencia de tufting que #6 pedía ignorar. Los dos pueden ser ciertos a
la vez —Santiago quería una marca que no dependiera de un tema, y los datos dicen que hoy el tema
es lo que trajo a la gente— pero es una tensión sin resolver por escrito en ningún documento, y no
la resuelve este tampoco: es de las que van a `DECISIONES_PENDIENTES.md`.

**Los otros cuatro (#5, #7, #8, #9) no son variantes compitiendo:** #5 es el instrumento vigente,
#7 y #8 ya están autodeclarados muertos, y #9 es un método genérico, no una conclusión sobre esta
marca.

**El criterio más verificable de los nueve no es narrativo, es de código:** de los nueve
documentos, **uno solo** — `BUYER_PERSONAS_v1.md` — es el que citan hoy, textualmente y en las
cuatro, las skills que de verdad producen piezas (`contenido`, `copy`, `modozaint`, `kaizen`). Sea
cual sea la decisión de Santiago, **hoy el sistema ya está operando con ese como el vigente** —
aunque nadie lo haya declarado así en ningún documento.

**Qué se pierde si los otros siete pasan a referencia:** nada del dato medido (vive en #1, que
ningún otro documento reemplaza) y nada del método (vive en #3 y #5). Lo que sí se perdería es la
narrativa de «Andrés» / «El Encarretado» (#6, #8) como voz de guion — son arquetipos escritos para
generar guiones, no solo fichas de datos, y esa prosa no está repetida en ningún otro documento.

---

## 3. Lo que NO decide este documento

- **Cuál de los nueve queda como fuente única.** Es la decisión #1 pendiente del plan de
  preparación — bloquea el V2, no esta fase.
- **Si `ICP_v1` estaba equivocado o si la tensión con la audiencia medida es real y sigue
  abierta.** Se deja registrada, no resuelta, en `DECISIONES_PENDIENTES.md`.
- **Qué pasa con los dos ya autodeclarados muertos** (`buyer-persona-modozaint.md`,
  `ICP_ENTREVISTA_2026-08-27.md`). Seguir la misma regla que ya usó el vault con
  `PLAN_CONTENIDO_DERMATINTA_30_DIAS` — «superado, no borrado» — parece consistente con lo que el
  propio sistema ya decidió, pero formalizarlo (moverlos a `_ARCHIVO/`, por ejemplo) es un cambio
  de estructura y no toca a esta fase.
