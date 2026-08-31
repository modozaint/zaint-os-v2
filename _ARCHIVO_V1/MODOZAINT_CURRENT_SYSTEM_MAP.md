---
tags: [migracion, auditoria, mapa-sistema]
creado: 2026-08-29
estado: FOTO DEL ESTADO ACTUAL — no modifica nada del vault
alcance: c:\DEPARTAMENTO MODOZAINT (429 archivos .md · 513 de código · 1.364 en total sin dependencias)
---

# MAPA DEL SISTEMA ACTUAL

> ✅ **Nota de nombre, resuelta por Santiago el 2026-08-29: el sistema se llama MODOZAINT.**
> El encargo original hablaba de «Departamento Mosaic» — ese nombre venía de una plantilla y no
> corresponde a nada. El sistema auditado es **`c:\DEPARTAMENTO MODOZAINT`** (nombre interno:
> **ZAINT OS**) y lo que viene es **MODOZAINT V2**.
>
> **Este documento no cambió, movió ni borró nada.** Es una lectura.

---

## A. Resumen ejecutivo

**ZAINT OS es el sistema operativo de un holding de una sola persona.** Santiago Giraldo trabaja
turnos de 12 h en una clínica y construye, en su tiempo libre y sin saber programar, tres negocios
y una marca personal — todo con agentes de IA.

**No es un vault de notas.** Es tres cosas encajadas:

1. **Un cuerpo de conocimiento** (429 `.md`) — identidad de marcas, historia del founder, ICP,
   estrategia, aprendizajes, análisis de video.
2. **Una capa de agentes** — 20 skills instaladas que leen ese conocimiento y producen trabajo:
   contenido, cotizaciones, planes, auditorías.
3. **Cuatro aplicaciones reales en producción** (513 archivos de código) — no maquetas: corren en
   servidores, con usuarios y datos.

**Cómo funciona el ciclo hoy, observado:** Santiago habla → un chat especializado (con nombre)
convierte eso en un plan escrito en `planes/` → otro agente lo ejecuta contra ese plan → se verifica
con criterios de aceptación → el aprendizaje vuelve al conocimiento.

🔑 **La tesis del sistema, escrita en su propio `CLAUDE.md`:** *«el ecosistema debe poder operarse
con Founder + AI agents solos. Nadie es dependencia estructural.»*

**Y su tensión central, también escrita:** ~30-40 h/mes de capacidad real contra un ecosistema que
tiende a abrir frentes. Casi toda la arquitectura de gobierno del sistema existe para frenar eso.

---

## B. Mapa de carpetas

| Carpeta | Archivos | Qué es | Peso en la migración |
|---|---|---|---|
| **`_LABS/`** | 440 | **Las aplicaciones reales.** LeadHunter, Content OS, FounderOS | 🔴 Crítico — es producto |
| **`_ARCHIVO/`** | 384 | Histórico. Todo lo superado, con su README explicando cada entrada | 🟡 Contexto |
| **`BRANDS/`** | 133 | Identidad, ICP, estrategia y planes por marca | 🔴 Crítico |
| **`CONTENIDO/`** | 123 | Sistema editorial, curso Converzzo, piezas, assets, herramientas | 🔴 Crítico |
| **`SISTEMA/`** | 39 | Cómo funciona ZAINT OS: modelo operativo, protecciones, universo, prompts de chat | 🔴 Crítico |
| **`SOLUCIONES_IA/`** | 38 | La línea de IA (hoy **Zagencia**): curso Nexum, banco de soluciones, productos | 🔴 Crítico |
| **`KNOWLEDGE_PACKS/`** | 31 | El cerebro por marca + el del founder (historia, turnos, constitución) | 🔴 Crítico |
| **`VIDEOTECA/`** | 31 | Destilados de video analizado, con índice | 🔴 Crítico |
| **`ACTIVOS/`** | 32 | Activos terminados: PDFs, propuestas, lead magnets | 🟢 Referencia |
| **`planes/`** | 23 | Planes aprobados, uno por trabajo. **El registro de decisiones de ejecución** | 🔴 Crítico |
| **`_HANDOFFS/`** | 23 | Cierres de sesión | 🟡 Contexto |
| **`AGENTES/`** | 16 | Memoria de trabajo de 5 agentes (estado, bitácora, hallazgos) | 🔴 Crítico |
| **`_SKILLS/`** | 9 | Cantera de skills vistas en internet, sin adaptar | 🟢 Referencia |
| **`ESTADISTICAS ZAINT/`** | 6 | Capturas de métricas de redes (WhatsApp, sin procesar) | 🟡 Datos crudos |
| **`TEMPLATES/`** | 2 | Sistema editorial y familias F1-F8 | 🟢 |
| **raíz** | — | `CLAUDE.md` (29 KB) · `05_CURRENT_PRIORITIES.md` · **`_USO_LOG.md` (445 KB)** | 🔴 |

**Fuera del vault pero parte del sistema:**
`~/.claude/skills/` (40 skills) · `~/.claude/projects/…/memory/` (memoria persistente entre
sesiones, 27 entradas) · `~/.claude.json` (configuración MCP).

---

## C. Sistemas encontrados

### C.1 · El sistema de gobierno (SISTEMA/ + CLAUDE.md)

Lo que decide **qué se hace y qué no**. Sus piezas:

| Pieza | Qué resuelve |
|---|---|
| **`CLAUDE.md`** (29 KB) | La entrada única. Quién opera, estado de cada unidad, dónde vive cada cosa, cómo se trabaja. **Declarado congelado**, con excepciones documentadas |
| **`MODELO_OPERATIVO.md`** | ⭐ ZAINT es una agencia, las marcas son cuentas. **Dos candados: capacidad (las horas salen de algún lado) y foco (máximo 2 cuentas activas)** |
| **`PROTECCIONES.md`** | Las 4 cosas que frenan. Nació el 23-ago al contar **554 prohibiciones en 165 archivos** y decidir crearlas de nuevo |
| **`UNIVERSO_ZAINT.md`** | Dirección de arte. Los tres narradores, la ley de no-mezcla, y **cero códigos de color a propósito** (rutea, no copia) |
| **`DEPARTAMENTOS.md`** (30 KB) | Cómo se organiza cada marca: departamentos, agentes, colaboradores |
| **`ESTANDAR_PROMPTS.md`** | ⭐ Cómo se escribe un plan que otro agente ejecuta. 7 reglas + anatomía de 8 secciones |
| **`PROMPT_CHAT_MARCOS.md`** | El chat de planeación, con nombre propio |

### C.2 · El sistema de conocimiento (KNOWLEDGE_PACKS/ + BRANDS/)

Un pack por marca, con módulos numerados; el módulo 08 es donde caen los aprendizajes. Packs
existentes: `FOUNDER`, `DERMATINTA`, `HOUSE_OF_KAIZEN`, `ZAINT_MODOZAINT`, `ADAPTOGENOS`.

⚠️ **La migración de packs quedó a medias:** HK está migrado; Dermatinta y MODOZAINT **rutean** a
`BRANDS/<MARCA>.md`. Hay que seguir la tabla de routing del `00_INDEX.md` de cada pack.

### C.3 · El sistema de agentes (skills + AGENTES/)

**20 skills en el vault + 40 en el perfil global.** Se dividen en tres familias (detalle en §D y §E).

**`AGENTES/` es memoria de trabajo, no conocimiento** — regla escrita: si un dato sirve fuera de ese
agente, sube (aprendizaje → módulo 08 · prioridad → tablero · tarea → Notion · identidad → jamás).

### C.4 · Las cuatro aplicaciones (`_LABS/`)

| App | Estado verificado | Dónde corre |
|---|---|---|
| **LeadHunter** | 🟢 En producción. Consiguió una reunión con un CEO **contactado en frío** | VPS Hostinger, `leads.modozaint.online` |
| **Content OS** | 🟢 En producción. 33 piezas de Dermatinta con guion, hooks y ficha de rodaje | Vercel, Supabase `Dermatinta Labs` |
| **FounderOS** | 🟢 En producción. Hábitos, dinero, turnos + **una casa isométrica navegable** | Vercel, Supabase `modozaint's Project` |
| **Content OS plantilla** | ⚪ Archivada 23-ago | — |

### C.5 · El sistema de contenido (CONTENIDO/)

Curso Converzzo destilado (ángulos, 60 hooks, frecuencias, rotación) · `PROMPT_CHAT_CONTENIDO.md`
(24 KB, el chat que escribe) · `PIEZAS_PUBLICADAS/` · `video-assets/` · herramientas de carga.

### C.6 · La Videoteca

Ver §G.3. Es el sistema de aprendizaje externo.

---

## D. Agentes — inventario

**Cinco agentes con memoria propia** en `AGENTES/<NOMBRE>/` (ESTADO · BITACORA · HALLAZGOS):

| Agente | Propósito | Input | Output | Qué lee | Depende de | ¿Sigue útil? |
|---|---|---|---|---|---|---|
| **`/dermatinta`** (254 líneas) | Todo lo de Dermatinta de punta a punta | `/dermatinta` o pedido de la marca | Piezas, activos, estado de tienda | `BRANDS/DERMATINTA/`, KP, Shopify | Llama a `/contenido`, `/copy`, `/activo` | ✅ Sí |
| **`/kaizen`** (412 líneas) | Todo lo de House of Kaizen: cotizar, catálogo, contenido | `/kaizen` | Cotizaciones con margen, guiones | `KNOWLEDGE_PACKS/HOUSE_OF_KAIZEN/` | Ídem | ✅ Sí |
| **`/modozaint`** (370 líneas) | La marca personal: qué publicar, auditar montaje | `/modozaint` | Guiones, captions, auditorías | `BRANDS/MODOZAINT/` | Ídem | ✅ Sí |
| **`/xiomara`** (110 líneas) | ⭐ **Jefa de presencia:** a quién le hablamos y por qué. Buyer persona, branding, voz | `/xiomara` | Briefs, ICP, identidad | `BRANDS/`, `UNIVERSO_ZAINT` | Está **por encima** de los tres de marca | ✅ Sí |
| **`/juanjo`** (113 líneas) | ⭐ **Editor de video:** cómo se ve y cómo suena. Ritmo, subtítulos, color, audio | `/juanjo` | Notas de montaje, presets | `ESTANDAR_PRODUCCION_VIDEO` | Trabaja después del guion | ✅ Sí |

**Y un sexto que no tiene carpeta pero opera igual:** `MARCOS` — el chat de planeación
(`SISTEMA/PROMPT_CHAT_MARCOS.md`). Convierte una idea hablada en un plan de 8 secciones.

🔑 **La cadena de responsabilidad está bien definida y es el activo más maduro del sistema:**
Xiomara dice **a quién** · `/contenido` y `/copy` dicen **qué se dice** · Juanjo lo **monta** ·
MARCOS **planea** · un ejecutor **construye** · un revisor **verifica**.

---

## E. Skills — inventario

### E.1 · Skills de marca (agentes) — ver §D
`dermatinta` · `kaizen` · `modozaint` · `xiomara` · `juanjo`

### E.2 · Skills de producción

| Skill | Propósito | Output |
|---|---|---|
| **`contenido`** (51) | Cualquier pieza cargando identidad, buyer persona y hooks de la marca | Guion escena por escena |
| **`copy`** (144) | El caption en sus dos versiones (TikTok e IG), con CTA elegido con datos reales | Captions |
| **`activo`** (39) | Activos e infoproductos: PDF, checklist, lead magnet, guía | Activo terminado |
| **`video`** (157) | ⭐ **Análisis de video → destilado indexado.** Ver §G.3 | Destilado en `VIDEOTECA/` |

### E.3 · Skills de operación

| Skill | Propósito |
|---|---|
| **`hoy`** (303) | ⭐ El más complejo. Lee turno, calendario y proyectos; calcula capacidad real y asigna **UNA** cosa |
| **`cierre`** (108) | Cerrar el día en 30 s: hábitos a Notion, qué quedó a medias, línea de log |
| **`weekly`** (124) | Revisión semanal de todo el ecosistema. **Llega hecha, no pregunta nada** |
| **`founderos`** (142) | Lee la app «Mi Vida» (Supabase) para responder sobre día, hábitos, tareas y dinero |
| **`handoff`** (13) · **`learn`** (12) · **`decision`** (12) · **`workspace`** (11) | Punteros cortos a un formato |
| **`zaint-system`** (12) · **`zaint-review`** (11) | Auditoría del sistema · auditor del trabajo recién hecho |

⚠️ **Cuatro skills son punteros de 11-13 líneas** (`handoff`, `learn`, `decision`, `workspace`,
`zaint-system`, `zaint-review`). Su contenido real vive en documentos del vault. Funciona, pero es
frágil: si el documento se mueve, la skill queda apuntando al vacío.

### E.4 · Skills globales (`~/.claude/skills/`, 40)
Duplican las del vault (`hoy`, `contenido`, `copy`, `activo`, `video`, `weekly`…) **y añaden un
paquete de marketing y ecommerce que no está en el vault:** `viral-hooks`, `viral-short-form`,
`viral-instagram-reels`, `viral-captions-and-ctas`, `marketing-super-skill`,
`research-knowledge-super-skill`, `market-gap-analysis`, `ecommerce-competitor-analysis`,
`shopify-*` (4), `agent-browser`, `watch`, `skill-creator`, `cyber-neo`.

🔴 **Riesgo de portabilidad:** esas 40 viven **fuera del repositorio**. Si Santiago cambia de
máquina o de cuenta, se pierden. Ver §M.

---

## F. Knowledge — qué existe y dónde

| Dominio | Dónde | Estado |
|---|---|---|
| **La historia del founder** | `KNOWLEDGE_PACKS/FOUNDER/HISTORIA.md` | ⭐ La joya. Cronología, los 8 intentos, el dinero real, el origen del nombre, y desde el 28-ago **el origen de niño** |
| **Cómo piensa y decide** | `FOUNDER/01_CONSTITUCION.md` · `02_FOUNDER_LOOP.md` · `03_DECISION_ENGINE.md` | Vigente (las R1-R15 se retiraron el 23-ago) |
| **Turnos y capacidad** | `FOUNDER/PATRON_TURNOS.md` + `TURNOS/2026-08.md`, `2026-09.md` | ⭐ Septiembre leído del PDF oficial y verificado contra sus tres totales |
| **El videojuego / FounderOS** | `FOUNDER/VIDEOJUEGO_VIDA_SPEC.md` | Vigente, con la cola de ideas del 26-ago |
| **Identidad de marca** | `BRANDS/<MARCA>.md` (DT, MZ) · `KNOWLEDGE_PACKS/HOUSE_OF_KAIZEN/01_IDENTIDAD.md` | ⚠️ Rutas distintas por marca |
| **ICP / buyer persona** | `BRANDS/MODOZAINT/` — **8 archivos** · `BRANDS/DERMATINTA/16_*` | 🔴 Duplicación seria, §J |
| **Estrategia por marca** | `BRANDS/<MARCA>/*_BU.md`, `ESTRATEGIA_01`, `MODELO_DE_NEGOCIO` | Vigente |
| **Producto e inteligencia** | `PRODUCTO_PROPIO_maquilas.md` (73 KB) · `INTELIGENCIA_*` | Vigente |
| **Curso Converzzo** | `CONTENIDO/CURSO_CONVERZZO/` | ⭐ Destilado y adoptado en el Content OS |
| **Curso Nexum** | `SOLUCIONES_IA/CURSO_NEXUM/` | Vigente |
| **Videos analizados** | `VIDEOTECA/` — 31 destilados | ⭐ Ver §G.3 |
| **Aprendizajes** | Módulo 08 de cada pack | ⚠️ Desigual: el de HK no se tocó entre el 5-jul y el 7-ago |
| **La fricción real de cada sesión** | `_USO_LOG.md` — **445 KB** | 🔴 Ver §N |
| **Memoria entre sesiones** | `~/.claude/projects/…/memory/` — 27 entradas | 🔴 Fuera del repo, §M |

---

## G. Marketing Intelligence

### G.1 · Buyer personas e ICP

**MODOZAINT tiene ocho documentos sobre la misma audiencia**, siete actualizados el mismo día:

| Archivo | KB | updated |
|---|---|---|
| `ICP_v1_desde-cero.md` | 32 | 27-ago |
| `DECISION_ICP_Y_ARRANQUE_2026-08-28.md` | 26 | 28-ago |
| `ICP_v2_LAS_OCHO_VARIANTES.md` | 20 | 28-ago |
| `ENTREVISTA_ICP_DEFINITIVA.md` | 17 | 28-ago |
| `ICP_ENTREVISTA_2026-08-27.md` | 13 | 28-ago |
| `BUYER_PERSONAS_v1.md` | 10 | 28-ago |
| `buyer-persona-modozaint.md` | 7 | 02-ago |
| `AUDIENCIA_REAL_verificada_2026-08-28.md` | 6 | 28-ago |
| *(+ `CONTENIDO/AGENTES_MARCA/buyer-persona.md`, 2 KB, 29-jul)* | | |

⭐ **El de más valor no es el más grande: es `AUDIENCIA_REAL_verificada_2026-08-28.md`**, porque son
datos medidos del panel de TikTok, no hipótesis — 71 % hombres · 25-34 el 42,9 % · 35-44 el 23,5 % ·
Colombia 62,8 % · pico a las 6 pm.

**Los tres personas nombrados que usan los briefs:** Brayan (el volumen), Julián (23,5 %, mira y no
compra), Eli (el de más valor comercial).

### G.2 · Contenido, hooks y guiones

- **`CONTENIDO/CURSO_CONVERZZO/`** — `banco-de-hooks-60-tipos.md`, `angulos-y-formatos.md`,
  `modulo-4-frecuencias-rotacion.md`, `referentes-benchmark.md`. **Ya está adoptado en código:** las
  tres rejillas (función / ángulo / rotación) son columnas de la base del Content OS.
- **`CONTENIDO/PROMPT_CHAT_CONTENIDO.md`** (24 KB) — ⭐ contiene **«Las preguntas. Tres, y ni una
  más»**: a qué público · qué es verdad acá · qué tienes para mostrar. Es conocimiento portable de
  altísimo valor.
- **Planes de contenido de Dermatinta:** 30 piezas TOFU/MOFU + mapa de septiembre + el xlsx con los
  **guiones escena por escena** (159 filas).
- **Hojas de rodaje en PDF** (`HOJA_RODAJE_*.pdf`) → convertidas en pantalla dentro del Content OS.

### G.3 · ⭐ La capacidad de análisis de video

**Es la que más pidió documentar. Está completa y bien resuelta.**

| | |
|---|---|
| **Dónde** | `.claude/skills/video/SKILL.md` (157 líneas) + `~/.claude/skills/video/` |
| **Qué usa por debajo** | La skill **`watch`** — descarga con `yt-dlp`, extrae fotogramas con `ffmpeg`, saca la transcripción de los subtítulos (o Whisper como respaldo) |
| **Input** | Uno o varios links. Acepta contexto libre (*«esto es personal, sobre disciplina»*) |
| **Output** | Un destilado `.md` por video en `VIDEOTECA/NEGOCIO/` o `VIDEOTECA/PERSONAL/`, con nombre `AAAA-MM-DD-tema.md`, más su entrada en `_INDICE.md` |
| **Comportamiento** | **Analiza y guarda solo, sin pedir confirmación** |
| **Volumen actual** | 31 destilados |

**Por qué existe, en sus propias palabras:** antes cada video caía en un sitio distinto — *«cuatro
sitios, tres convenciones de nombre. No se podía saber si un video ya se había analizado, ni qué
ideas quedaron pendientes de ejecutar.»*

🔒 **Y su regla de no-duplicación, que es lo más valioso de su diseño:** *«el destilado vive aquí, la
decisión adoptada vive en el pack. Nunca las dos cosas en los dos lados.»*

**Qué conservar para el V2:** el schema del destilado, la separación NEGOCIO/PERSONAL, el índice que
responde *«¿ya lo vi? ¿qué quedó sin ejecutar?»*, y sobre todo **la regla de que el destilado y la
decisión adoptada viven en sitios distintos.**

### G.4 · Métricas
`ESTADISTICAS ZAINT/` son **6 capturas de WhatsApp sin procesar** (28-ago). Los datos ya destilados
viven en `AUDIENCIA_REAL_verificada_2026-08-28.md`. Métricas de contenido: tablas `posts` y
`metrics` del Content OS (98 filas cada una).

---

## H. SOPs existentes (formalizados)

| SOP | Dónde | Estado |
|---|---|---|
| **Escribir un plan que otro ejecuta** | `SISTEMA/ESTANDAR_PROMPTS.md` | ⭐ El más maduro. 7 reglas + 8 secciones + contrato del revisor |
| **El flujo de tres pasos** | Memoria + `PROMPT_CHAT_MARCOS.md` | MARCOS planea → ejecutor construye → revisor verifica |
| **Operación de una tienda por fase** | `SISTEMA/OPERACION_ECOMMERCE.md` | La rutina depende de la fase, no del día |
| **Cómo se trabaja (cuentas y candados)** | `SISTEMA/MODELO_OPERATIVO.md` | Capacidad + foco + «entregado = publicado» |
| **Analizar un video** | skill `video` | §G.3 |
| **Cerrar el día / la semana** | skills `cierre` y `weekly` | |
| **Registrar un aprendizaje** | skill `learn` → módulo 08 | |
| **Publicar el FounderOS** | `_LABS/videojuego-vida/publicar.sh` | Con su trampa documentada (el autor del commit) |
| **Cargar piezas al Content OS** | `CONTENIDO/tools/cargar-piezas-dermatinta/` | Con README y su advertencia |

---

## I. Potential SOPs — procesos repetidos sin formalizar

Detectados por repetición observable, no por nombre de archivo.

| # | Proceso | Evidencia | Por qué formalizarlo |
|---|---|---|---|
| **1** | ⭐ **Idea hablada → plan → ejecución → verificación → corrección del plan** | 9 planes en `planes/` con la misma anatomía, todos de agosto | Es **el proceso central del sistema** y solo está escrito a medias |
| **2** | ⭐ **Auditar antes de construir** | Todos los planes tienen §2 «Lo que ya existe, verificado» y **la mitad descubre que la mitad ya estaba hecha** | Es lo que más horas ahorra y depende de que alguien se acuerde |
| **3** | **Video → destilado → adopción → pieza** | 31 destilados; la adopción a módulo 08 es desigual | El eslabón «adoptar» se pierde |
| **4** | **Dato dudoso → verificar en sistema vivo → corregir en todo el vault** | El 4,7/5 fabricado (7 documentos) · el «sin desplegar» falso · **el falso negativo de septiembre por leer con la clave pública** | Es el error #1 registrado del sistema |
| **5** | **Llega el cuadro de turnos → leer → escribir el mes → cargar en la app** | Agosto (dictado, falló 2 veces) y septiembre (leído del PDF y verificado) | **Se repite cada mes** y ya está pedido como botón |
| **6** | **Cotizar una pieza de HK** | Costo real 70×70 = $351.350 · mínimo $413k · sugerido $502k | Determinista: candidato a automatización |
| **7** | **Cerrar una sesión: log + prioridades + aprendizaje** | 23 handoffs + `_USO_LOG` | Existe como hábito, no como SOP |
| **8** | **Nombrar un chat especializado y darle prompt propio** | MODOZAINT, JUAN, MARCOS, contenido | Patrón claro, sin plantilla |

---

## J. Duplicaciones

| A | B | Conflicto | Posible causa | Recomendación |
|---|---|---|---|---|
| `BRANDS/MODOZAINT/` — **8 archivos de ICP** | entre sí | 8 documentos sobre la misma audiencia, 7 actualizados el 27-28 de agosto | Una sesión larga de investigación que fue guardando cada paso como archivo nuevo en vez de versionar uno | 🔴 **Decisión humana.** Elegir UNO vigente; el resto a `REFERENCE`. El más defendible como fuente es `AUDIENCIA_REAL_verificada` (datos medidos) + `BUYER_PERSONAS_v1` (el que citan los briefs) |
| `.claude/skills/` (20) | `~/.claude/skills/` (40) | Las mismas skills en dos sitios | Instalación global + versión de proyecto | Verificar cuál gana y cuál está desactualizada |
| `PLAN_CONTENIDO_DERMATINTA_30_DIAS` | `PLAN_CONTENIDO_V2_TOFU_MOFU` | Dos planes de 30 días | v2 reemplazó a v1 en agosto | ✅ Ya resuelto en el propio doc («superado, no borrado») |
| `01_CONSTITUCION.md` | `PROTECCIONES.md` | Dos sitios con reglas | La Constitución tenía R1-R15, retiradas el 23-ago | ✅ Resuelto — verificar que no queden citas a R# |
| `_ARCHIVO/content-os-zaint-*` | `_LABS/content-os-nexum` | Dos Content OS | El propio se archivó el 21-jul | ✅ Resuelto |
| `ACTIVOS/` | `_LABS/*/propuesta*` | Propuestas en dos sitios | — | Revisar cuál es la entregada |

---

## K. Contradicciones — requieren decisión humana

| # | Qué | Estado |
|---|---|---|
| **1** | **El nombre de la línea de IA cambió tres veces en dos días:** «MODOZAINT SA (IA)» → «Soluciones IA» → «Soluciones Zaint» → **«Zagencia»** (28-ago) | 🟡 Zagencia es el último. `SOLUCIONES_IA/` sigue siendo el nombre de la carpeta. **Falta propagarlo** |
| **2** | **`CLAUDE.md` dice «Notion guarda la acción»** pero el seguimiento real se hace en el FounderOS y en el Content OS | 🔴 Sin resolver |
| **3** | **El inventario del Kit de Dermatinta está roto** — ofrece 33 unidades sobre 22 físicas, con política DENY | 🔴 Abierto desde el 7-ago. Dormido con 0 pedidos; estalla con el primero de volumen |
| **4** | **RLS apagado** en `posts`, `metrics` y `transcriptions` del Content OS | 🔴 Abierto desde el 26-ago |
| **5** | **MODOZAINT era narrador y marca a la vez** en la landing | ✅ Resuelto el 28-ago: 1 narrador + 3 negocios |
| **6** | **El origen del nombre se contó al revés** en el brief de la landing | ✅ Corregido el 28-ago |
| **7** | **El spec del videojuego decía «sin auth ni RLS»** cuando ya había auth | ✅ Corregido en el plan |
| **8** | **Nombres de proyecto:** el remoto es `modozaint/zaint-os` pero el listado de repos mostró `zaint-os-vault` | 🟡 Verificar |

---

## L. Información sensible

**Resultado general: 🟢 el repositorio está limpio.** Ningún valor se muestra aquí.

| Archivo | Riesgo | Estado | Acción |
|---|---|---|---|
| `_LABS/*/.env.local` (4) | 🔴 **Claves reales**: Supabase, Anthropic, Gemini, Groq, Instagram, Apify | ✅ **Ignorados por git** | Ninguna. Mantener |
| `.env*.example` trackeados (4) | Bajo | ✅ **Verificado: solo nombres de variables, cero valores** | Ninguna |
| **Historial de git completo** | — | ✅ **Cero archivos `.env`/`.key`/`.pem` añadidos en los 379 commits** | Ninguna |
| `~/.ssh/hostinger_leadhunter` | 🔴 Clave privada del VPS | ✅ Fuera del vault | No moverla nunca al repo |
| `~/.claude.json` | 🔴 API keys de MCP (Hostinger) en texto plano | ⚠️ Fuera del vault | No versionar |
| `_LABS/nexum-leadhunter/app/_datos.json` | 🟡 Puede contener leads con datos personales | Revisar antes de push | **Verificar si está ignorado** |
| `ESTADISTICAS ZAINT/*.jpeg` | 🟡 Capturas de paneles | Trackeadas | Revisar que no muestren datos privados |
| **Datos de terceros** | 🟡 El vault nombra clientes y prospectos reales (un CEO, correos, proveedores) | — | **Decisión: el repo debe seguir privado** |

⚠️ **`.gitignore` cubre bien lo técnico** (`.env*`, `*.pem`, `*.key`, `credentials.json`,
`node_modules`, `.next`). **Lo que no cubre es el juicio:** el riesgo real de este repo no son claves,
son **datos de personas reales** en documentos de marketing y ventas.

---

## M. Dependencias — lo que ata el sistema a un modelo, una máquina o una ruta

| Dependencia | Gravedad para la portabilidad |
|---|---|
| 🔴 **Las 40 skills globales viven en `~/.claude/skills/`, fuera del repo** | Si cambia de máquina o cuenta, se pierden. **Incluye `video` y `watch`, que son capacidades centrales** |
| 🔴 **La memoria persistente vive en `~/.claude/projects/…/memory/`** (27 entradas) | Contiene decisiones y correcciones que no están en el vault. **Es el caso más claro de «inteligencia que vive en el modelo y no en el repo»** |
| 🔴 **Todas las skills están escritas para Claude Code** — formato `SKILL.md`, invocación `/nombre` | Otro agente no las puede usar sin traducción |
| 🟡 **Rutas absolutas de Windows** (`c:\DEPARTAMENTO MODOZAINT\…`) dentro de skills y planes | Rompen en otra máquina u otro sistema |
| 🟡 **Cuatro skills son punteros de 11-13 líneas** a documentos del vault | Si el documento se mueve, la skill apunta al vacío |
| 🟡 **Conectores MCP** (Supabase, Notion, Shopify, Hostinger, n8n) | Se caen — pasó tres veces en agosto. **n8n está caído ahora mismo (`ENDPOINT_NOT_FOUND`)** |
| 🟡 **`publicar.sh` firma con `modozaint@gmail.com`** porque Vercel bloquea otros autores | Conocimiento crítico que solo vive en un comentario del script |
| 🟢 **El conocimiento en `.md` es portable** | Es la mayor parte del valor y no depende de nadie |

---

## N. Deuda y problemas estructurales

| # | Problema | Evidencia |
|---|---|---|
| **1** | 🔴 **`_USO_LOG.md` pesa 445 KB.** Ningún agente lo lee entero, así que la fricción registrada ayer es invisible para el de hoy | Medido el 21-ago a 330 KB; **creció 115 KB en 8 días** |
| **2** | 🔴 **Las prohibiciones se reproducen.** Se pasó de 32 reglas a 3 el 12-ago; **el 21-ago se crearon 55 nuevas en un solo día** dentro de los `SKILL.md`. El conteo total fue **554 en 165 archivos** | `PROTECCIONES.md` |
| **3** | 🔴 **8 documentos de ICP para una audiencia** | §J |
| **4** | 🟡 **La migración de Knowledge Packs quedó a medias** — dos marcas rutean, una está migrada | `CLAUDE.md` §3 |
| **5** | 🟡 **El módulo 08 (aprendizajes) se llena desigual** | HK sin tocar entre 5-jul y 7-ago |
| **6** | 🟡 **`CLAUDE.md` pesa 29 KB y está declarado congelado**, pero lleva **6 excepciones documentadas** en 6 semanas | El congelamiento no está funcionando como control |
| **7** | 🟡 **`_ARCHIVO/` es el 28 % de los archivos** (384). Bien documentado, pero pesa en cada búsqueda | |
| **8** | 🟡 **Datos crudos sin procesar** — 6 capturas de WhatsApp como fuente de métricas | |
| **9** | 🟢 **Lo que SÍ funciona y hay que preservar:** cero secretos en 379 commits · los planes con criterios de aceptación verificables · la regla de no-duplicación de la Videoteca · la cadena de agentes con responsabilidades separadas |

---

## Cómo leer esto

- El **inventario elemento por elemento** con su clasificación → `MODOZAINT_MIGRATION_INVENTORY.md`
- **Qué sabemos y dónde**, por dominio → `MODOZAINT_KNOWLEDGE_MAP.md`
- **Procesos formalizados y por formalizar** → `MODOZAINT_SOP_INVENTORY.md`
