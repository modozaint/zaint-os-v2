---
tags: [migracion, decisiones, contradicciones, modozaint]
creado: 2026-08-29
estado: INVENTARIO — no resuelve nada, ningún documento original fue tocado
fuente: planes/preparacion-modozaint-v2-2026-08-29.md §4 Ola 2 · _MIGRACION/MODOZAINT_CURRENT_SYSTEM_MAP.md §K
---

# Contradicciones abiertas — qué dice A, qué dice B

> Las ocho de `MODOZAINT_CURRENT_SYSTEM_MAP.md` §K, una por una. **Sin recomendación cuando la
> decisión es estratégica** (es de Santiago). **Con recomendación cuando es técnica** (verificar un
> hecho no es decidir un rumbo).

---

## 1 · 🔴 Abierta — El nombre de la línea de IA

| | |
|---|---|
| **Qué dice A** | `SOLUCIONES_IA/` es el nombre de la carpeta, y así se llama en el mapa de carpetas del `CLAUDE.md` §4 |
| **Qué dice B** | El nombre decidido el 2026-08-28 es **Zagencia** (`SOLUCIONES_IA/_INDICE.md`) — reemplaza tres nombres anteriores en dos días («MODOZAINT SA (IA)» → «Soluciones IA» → «Soluciones Zaint» → Zagencia) |
| **Desde cuándo** | El nombre nuevo es del 28-ago; la carpeta se llama `SOLUCIONES_IA/` desde julio |
| **Qué se desbloquea al decidirla** | Que el `CLAUDE.md`, las skills y cualquier material nuevo usen un solo nombre. Hoy quien lee la carpeta ve un nombre y quien lee `_INDICE.md` ve otro — dentro del mismo sistema |
| **Es de Santiago o es técnica** | 🟡 **Mixta.** El nombre ya lo decidió Santiago (Zagencia). Lo que falta es **propagarlo** — eso sí es técnico |
| **Recomendación** | Renombrar la carpeta y las referencias cuando se toque el V2. No urge para esta fase — el plan no reorganiza estructura (§6) |

---

## 2 · 🔴 Abierta — ¿Dónde vive la acción: Notion o las apps?

| | |
|---|---|
| **Qué dice A** | `CLAUDE.md` §3: *«Notion, una base por departamento — decidido 2026-08-07. El vault guarda conocimiento; Notion guarda acción.»* |
| **Qué dice B** | El seguimiento real de hoy pasa por el **FounderOS** (hábitos, tareas por cuenta, dinero) y el **Content OS** (pipeline de piezas). La skill `cierre` sigue escribiendo hábitos en Notion, pero las tareas y el dinero personal ya viven en Supabase, no en Notion |
| **Desde cuándo** | Notion se decidió el 07-ago; el FounderOS con tareas y dinero es del 14-ago en adelante — la contradicción nació con la segunda decisión y nunca se corrigió en el `CLAUDE.md` |
| **Qué se desbloquea al decidirla** | Si Notion deja de ser la fuente de acción, `skill cierre` y cualquier plan que asuma Notion como destino de tareas se actualiza. Si Notion sigue siendo la fuente formal, hay que explicar por qué las tareas de ZAINT ya no están ahí |
| **Es de Santiago o es técnica** | 🔴 **Estratégica.** Cambia una fuente de verdad declarada en el documento congelado |
| **Recomendación** | Ninguna — bloquea el V2 según el propio plan (§7, decisión #2), no se opina aquí |

---

## 3 · 🔴 Abierta — El inventario del Kit de Dermatinta

| | |
|---|---|
| **Qué dice A** | La tienda ofrece **33 unidades** del Kit (crema + espuma + kit, con `requiresComponents: false`) |
| **Qué dice B** | Solo hay **22 unidades físicas** reales (11 de crema + 11 de espuma) — el Kit es un producto independiente con su propio `InventoryItem`, no compuesto de los otros dos |
| **Desde cuándo** | Detectado el 2026-08-07, confirmado el 2026-08-09 |
| **Qué se desbloquea al decidirla** | Que la tienda deje de poder vender de más el día que entre el primer pedido de volumen. Hoy está dormido porque Dermatinta lleva 0 pedidos — el riesgo es real pero no ha estallado |
| **Es de Santiago o es técnica** | 🔴 **Estratégica** — las dos salidas ya están escritas en `MODELO_DE_NEGOCIO` §Dermatinta; elegir cuál es de Santiago |
| **Recomendación** | Ninguna sobre cuál salida tomar. Técnicamente sí vale decir: **mientras no se decida, la política DENY actual es la protección correcta** — evita vender lo que no existe, aunque no resuelve la causa |

---

## 4 · 🔴 Abierta — RLS apagado en el Content OS

| | |
|---|---|
| **Qué dice A** | Las tablas `posts`, `metrics` y `transcriptions` no tienen Row Level Security activo |
| **Qué dice B** | Con la clave pública (la que va al navegador) cualquiera que la obtenga puede leer o modificar esas filas — 98 en cada tabla |
| **Desde cuándo** | Abierto desde el 2026-08-26 |
| **Qué se desbloquea al decidirla** | Poder activar RLS sin romper la app — requiere escribir las políticas primero, porque activarlo sin políticas bloquea la aplicación |
| **Es de Santiago o es técnica** | 🟡 **Mixta.** Que haya que arreglarlo no es decisión — **cuándo** priorizarlo si es capacidad (candado de horas del `MODELO_OPERATIVO`) |
| **Recomendación** | 🟢 **Técnica, y con dueño claro:** escribir las políticas de RLS para las tres tablas antes de cualquier lanzamiento con tráfico real. Hoy el repo es privado, lo que baja el riesgo inmediato — no lo elimina |

---

## 5 · ✅ Resuelta — MODOZAINT era narrador y marca a la vez

| | |
|---|---|
| **Qué decía A** | La landing trataba a MODOZAINT como un narrador (la voz) y como una marca (un negocio) al mismo tiempo, sin distinguir |
| **Qué decía B** | `UNIVERSO_ZAINT.md` define tres narradores separados de las marcas que narran |
| **Resuelto** | 2026-08-28 — **1 narrador + 3 negocios.** No requiere acción de esta fase |

---

## 6 · ✅ Resuelta — El origen del nombre, contado al revés

| | |
|---|---|
| **Qué decía A** | El brief de la landing contaba el origen del nombre en un orden que no correspondía a los hechos |
| **Qué decía B** | `HISTORIA.md` §3: Santiago quería «Santi» → cambió la S por Z → movió las letras → **después** descubrió que Saint es Santo. El orden real importa: SANTI y SAINT son las mismas cinco letras, pero el «Saint» no fue el punto de partida |
| **Resuelto** | 2026-08-28. No requiere acción de esta fase |

---

## 7 · ✅ Resuelta — El spec del videojuego decía «sin auth ni RLS»

| | |
|---|---|
| **Qué decía A** | `VIDEOJUEGO_VIDA_SPEC.md` §11.1: *«Sin auth ni RLS. Con la URL, cualquiera lee y escribe»* |
| **Qué decía B** | `middleware.ts` del FounderOS ya valida la sesión en cada petición desde antes de esa afirmación — el spec estaba desactualizado, no la app |
| **Resuelto** | En el plan `planes/cuarto-founderos-2026-08-23.md` §2, con la corrección anotada. No requiere acción de esta fase |

---

## 8 · ✅ Resuelta ahora mismo — verificada contra el sistema vivo, no era una contradicción real

| | |
|---|---|
| **Qué decía A** | El remoto configurado en el vault es `modozaint/zaint-os` |
| **Qué decía B** | Un listado de la cuenta mostró también `zaint-os-vault` |
| **Verificado el 2026-08-29, aplicando `SOP_VERIFICAR_CONTRA_EL_SISTEMA_VIVO.md`** | `git remote -v` tiene **dos remotos, a propósito:** `origin` → `zaint-os` (el que se usa) y `vault-respaldo` → `zaint-os-vault`, con el push **bloqueado explícitamente** (`NO-PUSH-es-solo-respaldo`). No es un repo huérfano ni un nombre desactualizado: **es un segundo remoto de respaldo, configurado a propósito.** `gh repo list modozaint` confirma que ambos existen en GitHub, junto con `dermatinta-content-os`, `founderos`, `nexum-leadhunter`, `cv-santiago-giraldo` y dos repos más viejos (`content-os-zaint`, `zaint-content-control-room`) |
| **Qué se desbloquea** | Nada pendiente — la duda queda cerrada con el propio `git remote -v`. No hay decisión que tomar ni limpieza que hacer sobre este punto |
| **Es de Santiago o es técnica** | 🟢 Era técnica, y ya está verificada — no llegó a ser una contradicción real |

---

## Resumen — qué bloquea, qué no

| # | Contradicción | Bloquea el V2 | Bloquea esta fase |
|---|---|---|---|
| 1 | Nombre Zagencia sin propagar | No | No |
| 2 | Notion vs. las apps | 🔴 **Sí** | No |
| 3 | Kit de Dermatinta, 33 sobre 22 | No (dormido, 0 pedidos) | No |
| 4 | RLS apagado | No | No |
| 5 | Narrador vs. marca | — resuelta | — |
| 6 | Origen del nombre al revés | — resuelta | — |
| 7 | Spec del videojuego desactualizado | — resuelta | — |
| 8 | `zaint-os-vault` — verificada, es un respaldo a propósito | — resuelta | — |

**Solo una de las ocho bloquea el V2: la #2, quién es la fuente de la acción.** Es la que Santiago
ya tiene marcada como bloqueante en el plan (§7). **De las ocho, cuatro ya estaban resueltas o se
resolvieron al verificarlas hoy (5, 6, 7, 8) — quedan cuatro genuinamente abiertas (1, 2, 3, 4).**

---

# ✅ DECISIONES TOMADAS POR SANTIAGO — 2026-08-29

*Añadido tras la Ola 2. Lo de arriba queda como el análisis que las preparó.*

## 1. El ICP: ✅ RESUELTO — y ya estaba resuelto en los propios documentos

**Santiago, textual (2026-08-29):** *«El ICP lo definimos bien con una entrevista detallada con el
departamento de marketing.»*

🔑 **Y al verificarlo, los documentos ya se autodeclaraban.** No hacían falta ocho candidatos: había
una cadena, y solo faltaba que alguien la escribiera.

| Documento | Qué es de verdad | Estado |
|---|---|---|
| **`DECISION_ICP_Y_ARRANQUE_2026-08-28.md`** | ⭐ **LA FUENTE VIGENTE.** Su propio encabezado dice *«🟢 DECIDIDO por Santiago el 2026-08-28 en la entrevista. Cierra la pregunta ¿a quién le hablamos?»* | **KEEP · fuente única** |
| `ENTREVISTA_ICP_DEFINITIVA.md` | El **instrumento** — las preguntas que produjeron la decisión | **REFERENCE** — se conserva porque explica *cómo* se llegó |
| `AUDIENCIA_REAL_verificada_2026-08-28.md` | Los **datos medidos** del panel de TikTok | **KEEP** — es evidencia, no hipótesis. No compite: alimenta |
| `BUYER_PERSONAS_v1.md` | Los tres personas nombrados (Brayan, Julián, Eli) que citan los briefs | **KEEP subordinado** a la decisión |
| `ICP_ENTREVISTA_2026-08-27.md` | Ya marcado 🔴 *«REEMPLAZADA — no responder esta»* | **ARCHIVE** — con su §0.1, que sigue válido |
| `ICP_v1_desde-cero.md` · `ICP_v2_LAS_OCHO_VARIANTES.md` | Investigación previa a la entrevista | **REFERENCE** |
| `buyer-persona-modozaint.md` (2-ago) · `CONTENIDO/AGENTES_MARCA/buyer-persona.md` (29-jul) | Anteriores a todo el trabajo de agosto | **ARCHIVE** |

**Lo que decidió, en sus palabras (28-ago):**
> 1. **A quién:** *«Los dos, con el tufting como puerta»* — entrar por el oficio, salir hacia el negocio.
> 2. **Qué queremos que pase:** *«Que te vea gente que te pueda abrir puertas»* — los founders.

⚠️ **Lo que esto NO era.** El inventario lo leyó como «8 documentos compitiendo». **Eran 8 pasos de
un proceso**: investigación → instrumento → decisión → datos que la respaldan. **La duplicación era
aparente; lo que faltaba era que la cadena estuviera escrita en algún lado.** Ahora lo está.

**Para el V2:** la fuente del ICP es `DECISION_ICP_Y_ARRANQUE_2026-08-28.md`. Todo lo demás rutea a
ella o la alimenta.

---

## 2. Notion: ✅ RESUELTO — ya no es

**Santiago, textual (2026-08-29):** *«Notion ya no es, ya es el FounderOS.»*

**El seguimiento de acción vive en el FounderOS** (`_LABS/videojuego-vida`), no en Notion.

🔴 **Consecuencia que el V2 tiene que recoger:** el `CLAUDE.md` §3 sigue diciendo que *«Notion
guarda la acción — una base por departamento, decidido 2026-08-07»*. **Eso queda desactualizado
desde hoy.**

**No se corrige aquí a propósito:** esta fase no modifica documentos del vault. Queda anotado para
que el V2 nazca con la versión correcta y no herede la contradicción.

**Y hay que revisar lo que depende de Notion:**
- La skill **`cierre`** marca los hábitos «en la bitácora de Notion»
- La skill **`hoy`** lee el turno de Notion
- **El turno se marca a mano en Notion** según el tablero

⚠️ **Ninguna de las tres se toca en esta fase.** Se listan para que el V2 las redirija al FounderOS.

---

## 3. El repositorio: ✅ RESUELTO — sigue privado

**Santiago, textual (2026-08-29):** *«El repo sí sigue privado.»*

**Confirma la recomendación de la auditoría.** La razón no son las claves —379 commits sin un solo
secreto— sino que **el vault nombra personas reales**: un CEO contactado en frío con su correo,
proveedores, prospectos, y datos de un socio.

**Para el V2:** privado por defecto. Si algún día se quiere abrir una parte, se extrae lo publicable
a un repo aparte; **no se abre este.**

---

## Lo que sigue abierto

| # | Decisión | Desde | ¿Bloquea el V2? |
|---|---|---|---|
| 4 | **El Kit de Dermatinta** — la tienda ofrece 33 unidades sobre 22 físicas, con política DENY | 7-ago | **No.** Dormido con 0 pedidos; estalla con el primero de volumen |
| 5 | **El RLS apagado** en `posts`, `metrics` y `transcriptions` del Content OS | 26-ago | **No.** Pero con la clave pública cualquiera lee o modifica esas filas |

**Las dos son operativas, no estructurales. MODOZAINT V2 puede arrancar sin ellas.**
