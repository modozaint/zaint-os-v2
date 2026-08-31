---
tags: [migracion, inventario, clasificacion]
creado: 2026-08-29
estado: inventario clasificado — NADA se ha movido, borrado ni modificado
---

# INVENTARIO DE MIGRACIÓN

> **`DELETE_CANDIDATE` no significa borrar.** Significa: *nadie ha podido explicar para qué sirve.*
> Ningún elemento de esta tabla se ha tocado.
>
> **Valor:** 🔴 crítico (sin esto el V2 nace cojo) · 🟡 alto · 🟢 útil · ⚪ contexto

---

## 1. Gobierno y operación

| Elemento | Tipo | Ubicación | Función | Clasif. | Valor | Dependencias | Acción recomendada |
|---|---|---|---|---|---|---|---|
| `CLAUDE.md` | Configuration | raíz | Entrada única: quién opera, estado de unidades, dónde vive cada cosa | **REBUILD** | 🔴 | Claude Code | El contenido es oro; **el formato de 29 KB con 6 excepciones no aguantó**. Partir en: identidad · estado · rutas |
| `MODELO_OPERATIVO.md` | SOP | `SISTEMA/` | ZAINT es agencia, marcas son cuentas. Candados de capacidad y foco | **KEEP** | 🔴 | Ninguna | Va tal cual. Es la pieza que sostiene todo |
| `PROTECCIONES.md` | SOP | `SISTEMA/` | Las 4 cosas que frenan, con su cicatriz y su mecanismo | **KEEP** | 🔴 | Ninguna | Va tal cual, **con su criterio**: una protección existe solo si el error ocurrió y sigue ocurriendo |
| `ESTANDAR_PROMPTS.md` | SOP | `SISTEMA/` | Cómo se escribe un plan que otro agente ejecuta | **KEEP** | 🔴 | Ninguna | ⭐ **El activo más portable del sistema.** Sirve para cualquier modelo |
| `UNIVERSO_ZAINT.md` | Knowledge | `SISTEMA/` | Dirección de arte: narradores, ley de no-mezcla, ruteo sin copia | **KEEP** | 🔴 | Ninguna | Va tal cual |
| `DEPARTAMENTOS.md` (30 KB) | Knowledge | `SISTEMA/` | Departamentos, agentes y colaboradores por marca | **REFERENCE** | 🟡 | — | Revisar cuánto describe algo que hoy no opera |
| `05_CURRENT_PRIORITIES.md` | Data | raíz | El tablero. Única fuente de la jerarquía | **REBUILD** | 🔴 | — | El concepto es correcto; **en el V2 debería salir de datos, no escribirse a mano** |
| `PROMPT_CHAT_MARCOS.md` | Prompt | `SISTEMA/` | El chat de planeación | **KEEP** | 🟡 | `ESTANDAR_PROMPTS` | Va tal cual |
| `OPERACION_ECOMMERCE.md` | SOP | `SISTEMA/` | Rutina de tienda según fase | **KEEP** | 🟡 | — | |
| `MODELO_DE_NEGOCIO.md` | Knowledge | `SISTEMA/` | Cómo gana dinero cada unidad | **KEEP** | 🔴 | — | |
| `_USO_LOG.md` (445 KB) | Data | raíz | La fricción real de cada sesión | **REBUILD** | 🟡 | — | 🔴 **Nadie lo lee entero.** Extraer los patrones, archivar el resto |
| `REGLAS_DE_CONSULTA_2026-08-23.md` | Archive | `_ARCHIVO/` | Las 17 reglas superadas | **ARCHIVE** | ⚪ | — | Ya archivado. Correcto |

---

## 2. Agentes

| Elemento | Tipo | Ubicación | Función | Clasif. | Valor | Dependencias | Acción |
|---|---|---|---|---|---|---|---|
| `/xiomara` | Agent | `.claude/skills/xiomara/` | A quién le hablamos y por qué: ICP, branding, voz | **KEEP** | 🔴 | `BRANDS/`, `UNIVERSO_ZAINT` | ⭐ Está **por encima** de los de marca. Rol bien definido |
| `/juanjo` | Agent | `.claude/skills/juanjo/` | Cómo se ve y suena: montaje, ritmo, color, audio | **KEEP** | 🔴 | `ESTANDAR_PRODUCCION_VIDEO` | ⭐ Cubre el eslabón que frenó dos meses de publicación |
| `/dermatinta` | Agent | `.claude/skills/dermatinta/` | Todo Dermatinta punta a punta | **KEEP** | 🟡 | KP + Shopify + `/contenido` `/copy` `/activo` | Revisar las 11 prohibiciones que se le añadieron el 21-ago |
| `/kaizen` | Agent | `.claude/skills/kaizen/` | Todo HK: cotizar, catálogo, contenido | **KEEP** | 🟡 | Ídem | ⚠️ 412 líneas, **28 prohibiciones añadidas en un día** |
| `/modozaint` | Agent | `.claude/skills/modozaint/` | La marca personal | **KEEP** | 🟡 | Ídem | ⚠️ 370 líneas, 16 prohibiciones |
| `MARCOS` | Prompt | `SISTEMA/PROMPT_CHAT_MARCOS.md` | Planea, no ejecuta | **KEEP** | 🔴 | `ESTANDAR_PROMPTS` | ⭐ **No es una skill: es un prompt pegable.** Eso lo hace portable a cualquier modelo |
| `AGENTES/<X>/ESTADO·BITACORA·HALLAZGOS` | Data | `AGENTES/` | Memoria de trabajo de 5 agentes | **KEEP** | 🔴 | — | ⭐ El patrón es correcto y hay que conservarlo entero |
| `AGENTES/00_README.md` | SOP | `AGENTES/` | La regla: memoria nunca conocimiento; si sirve fuera, sube | **KEEP** | 🔴 | — | ⭐ Una de las mejores reglas del sistema |

---

## 3. Skills

| Elemento | Tipo | Ubicación | Función | Clasif. | Valor | Dependencias | Acción |
|---|---|---|---|---|---|---|---|
| `video` (157 líneas) | Skill | `.claude/skills/video/` | Link → destilado indexado en VIDEOTECA | **KEEP** | 🔴 | skill `watch`, `yt-dlp`, `ffmpeg` | ⭐ **La joya operativa.** Ver §G.3 del mapa |
| `watch` | Skill | `~/.claude/skills/` | Descarga, fotogramas, transcripción | **KEEP** | 🔴 | `yt-dlp`, `ffmpeg`, Whisper | 🔴 **Vive fuera del repo.** Traerla |
| `hoy` (303 líneas) | Skill | `.claude/skills/hoy/` | Turno + calendario + capacidad → UNA cosa | **REBUILD** | 🔴 | Notion, calendario, turnos | La lógica es valiosa; **303 líneas es demasiada para lo que decide** |
| `contenido` (51) | Skill | `.claude/skills/contenido/` | Pieza con identidad y hooks cargados | **KEEP** | 🔴 | KP de la marca | |
| `copy` (144) | Skill | `.claude/skills/copy/` | Caption en dos versiones con CTA por datos | **KEEP** | 🟡 | Content OS | |
| `activo` (39) | Skill | `.claude/skills/activo/` | PDFs, checklists, lead magnets | **KEEP** | 🟡 | `FABRICA_DE_ACTIVOS` | |
| `weekly` (124) | Skill | `.claude/skills/weekly/` | Revisión semanal, llega hecha | **KEEP** | 🟡 | Todo el vault | ⭐ «No pregunta nada» es la decisión correcta |
| `cierre` (108) | Skill | `.claude/skills/cierre/` | Cerrar el día en 30 s | **KEEP** | 🟡 | Notion | ⚠️ Depende de Notion, que está en duda (§K.2) |
| `founderos` (142) | Skill | `.claude/skills/founderos/` | Lee la app Mi Vida | **KEEP** | 🟡 | Supabase | Su regla de no mezclar dinero personal y de negocio es 🔴 |
| `handoff`·`learn`·`decision`·`workspace` | Skill | `.claude/skills/` | Punteros de 11-13 líneas a documentos | **REBUILD** | 🟡 | Rutas absolutas | Frágiles: si el documento se mueve, apuntan al vacío |
| `zaint-system`·`zaint-review` | Skill | `.claude/skills/` | Auditoría del sistema · del trabajo | **KEEP** | 🟡 | — | ⚠️ Prefijo `zaint-` obligatorio, poco descubrible |
| Las 40 de `~/.claude/skills/` | Skill | fuera del repo | Incluye `viral-*`, `marketing-super-skill`, `shopify-*`, `agent-browser` | **REFERENCE** | 🟡 | Claude Code | 🔴 **No están versionadas.** Decidir cuáles entran al repo |
| `_SKILLS/` (cantera) | Archive | `_SKILLS/` | Skills vistas en internet, sin adaptar | **ARCHIVE** | ⚪ | — | Revisar si alguna sigue interesando |

---

## 4. Knowledge por marca

| Elemento | Tipo | Ubicación | Función | Clasif. | Valor | Acción |
|---|---|---|---|---|---|---|
| `HISTORIA.md` | Knowledge | `KP/FOUNDER/` | Cronología, 8 intentos, el dinero, el nombre, el origen de niño | **KEEP** | 🔴 | ⭐ **El activo más irreemplazable del vault.** No se puede reconstruir |
| `PATRON_TURNOS.md` + `TURNOS/*` | Knowledge | `KP/FOUNDER/` | Modelo de turnos y capacidad real | **KEEP** | 🔴 | Septiembre verificado contra los 3 totales del PDF |
| `01_CONSTITUCION` · `02_FOUNDER_LOOP` · `03_DECISION_ENGINE` | Knowledge | `KP/FOUNDER/` | Sesgos, ritmo, evaluación | **KEEP** | 🔴 | Sin las R1-R15, retiradas el 23-ago |
| `VIDEOJUEGO_VIDA_SPEC.md` | Knowledge | `KP/FOUNDER/` | Spec del FounderOS + cola de ideas | **KEEP** | 🟡 | |
| `BRANDS/DERMATINTA.md` + `/DERMATINTA/` (60+) | Brand | `BRANDS/` | Identidad, BU, producto, inteligencia, planes | **KEEP** | 🔴 | Con sus 3 candados de contenido |
| `KP/HOUSE_OF_KAIZEN/` | Brand | `KNOWLEDGE_PACKS/` | El único pack migrado del todo | **KEEP** | 🔴 | ⭐ **Es el modelo a seguir** para los otros dos |
| `BRANDS/MODOZAINT/` (8 ICP) | Research | `BRANDS/` | ICP y buyer personas | **REBUILD** | 🔴 | 🔴 **Consolidar en uno.** Decisión humana (§J) |
| `AUDIENCIA_REAL_verificada_2026-08-28.md` | Data | `BRANDS/MODOZAINT/` | Datos medidos del panel de TikTok | **KEEP** | 🔴 | ⭐ **Es el único que no es hipótesis** |
| `PRODUCTO_PROPIO_maquilas.md` (73 KB) | Research | `BRANDS/DERMATINTA/` | Investigación de maquilas | **REFERENCE** | 🟡 | Muy grande; extraer la conclusión |
| `KP/ADAPTOGENOS/` | Archive | `KNOWLEDGE_PACKS/` | Oportunidad dormida | **ARCHIVE** | ⚪ | Con su gatillo escrito |

---

## 5. Marketing e inteligencia de contenido

| Elemento | Tipo | Ubicación | Función | Clasif. | Valor | Acción |
|---|---|---|---|---|---|---|
| `PROMPT_CHAT_CONTENIDO.md` (24 KB) | Prompt | `CONTENIDO/` | El chat que escribe. **«Las preguntas. Tres, y ni una más»** | **KEEP** | 🔴 | ⭐ Conocimiento portable de altísimo valor |
| `CURSO_CONVERZZO/` | Knowledge | `CONTENIDO/` | 60 hooks, ángulos, frecuencias, rotación, referentes | **KEEP** | 🔴 | ⭐ **Ya está adoptado en código** (columnas del Content OS) |
| `VIDEOTECA/` (31 destilados + índice) | Knowledge | `VIDEOTECA/` | Qué enseñó cada video y qué hacer con eso | **KEEP** | 🔴 | ⭐ Con su regla de no-duplicación |
| `Calendario_Dermatinta_v2_EJEMPLO.xlsx` | Data | `CONTENIDO/` | **159 filas: los guiones escena por escena** | **KEEP** | 🔴 | Ya cargado en el Content OS |
| `PLAN_CONTENIDO_V2_TOFU_MOFU.md` | Strategy | `BRANDS/DERMATINTA/` | 30 piezas, 20 TOFU / 10 MOFU / 0 BOFU | **KEEP** | 🔴 | Con su razón: no hay a quién convertir |
| `MAPA_CONTENIDO_SEPTIEMBRE_2026.md` | Data | `BRANDS/DERMATINTA/` | El calendario del mes | **KEEP** | 🟡 | Ya en la base |
| `HOJA_RODAJE_*.pdf` (4) | Reference | `BRANDS/` | El formato de rodaje que se volvió pantalla | **REFERENCE** | 🟡 | Ya replicado en el Content OS |
| `PLAN_CONTENIDO_DERMATINTA_30_DIAS.md` | Archive | `BRANDS/DERMATINTA/` | El plan de julio | **ARCHIVE** | ⚪ | Superado por v2, ya declarado |
| `ESTADISTICAS ZAINT/*.jpeg` (6) | Data | raíz | Capturas de paneles sin procesar | **DELETE_CANDIDATE** | ⚪ | ⚠️ **Solo si lo que traen ya está destilado.** Verificar antes |
| `_ARCHIVO/` (384) | Archive | `_ARCHIVO/` | Histórico con README por entrada | **ARCHIVE** | ⚪ | ⭐ Bien gestionado. **No mover al V2**, dejarlo como archivo del V1 |

---

## 6. Código y automatizaciones

| Elemento | Tipo | Ubicación | Función | Clasif. | Valor | Dependencias | Acción |
|---|---|---|---|---|---|---|---|
| **LeadHunter** | Code | `_LABS/nexum-leadhunter/` | Prospección de punta a punta | **KEEP** | 🔴 | VPS, Unipile, Cal.com, Anthropic | ⚠️ El repo propio está desfasado; el VPS tiene cambios a mano |
| **Content OS** | Code | `_LABS/content-os-nexum/` | Planner, fichas de rodaje, referentes | **KEEP** | 🔴 | Vercel, Supabase, repo propio | ⭐ La casa en orden: `dashboard/` ignorado en el vault, una sola fuente |
| **FounderOS** | Code | `_LABS/videojuego-vida/` | Hábitos, dinero, turnos, la casa isométrica | **KEEP** | 🔴 | Vercel, Supabase | ⭐ El motor de habitaciones: añadir una cuesta ~95 líneas |
| `publicar.sh` | Automation | `_LABS/videojuego-vida/` | Del vault al repo propio a Vercel | **KEEP** | 🔴 | Git, Vercel | ⚠️ **Firma con `modozaint@gmail.com` a propósito** — conocimiento crítico en un comentario |
| `CONTENIDO/tools/cargar-piezas-dermatinta/` | Automation | `CONTENIDO/` | Carga las 33 piezas | **KEEP** | 🟡 | Supabase | ⚠️ **Sobreescribe ediciones manuales.** Su README lo advierte |
| `CONTENIDO/tools/completar-piezas-dermatinta/` | Automation | `CONTENIDO/` | Completa hooks y setup | **KEEP** | 🟡 | Anthropic | |
| `_LABS/nexum-leadhunter/n8n/` | Automation | `_LABS/` | Flujos de n8n | **REFERENCE** | 🟡 | n8n cloud | 🔴 **n8n está caído ahora** (`ENDPOINT_NOT_FOUND`). Y «verificar los flujos» lleva pendiente desde el 12-ago |
| `_datos.json` | Data | `_LABS/nexum-leadhunter/app/` | Datos de la app | **REFERENCE** | 🟡 | — | ⚠️ **Verificar si contiene leads con datos personales** antes de cualquier push |
| `planes/` (23) | Decision | `planes/` | Un plan por trabajo, con criterios verificables | **KEEP** | 🔴 | — | ⭐ **Es el registro de decisiones de ejecución.** Vale más que los handoffs |
| `_HANDOFFS/` (23) | Archive | `_HANDOFFS/` | Cierres de sesión | **REFERENCE** | 🟡 | — | Extraer decisiones, archivar el resto |

---

## 7. Configuración

| Elemento | Tipo | Ubicación | Clasif. | Valor | Acción |
|---|---|---|---|---|---|
| `.gitignore` | Configuration | raíz | **KEEP** | 🔴 | ⭐ Cubre bien lo técnico. **379 commits sin un solo secreto** |
| `.claude/settings.local.json` | Configuration | `.claude/` | **REFERENCE** | 🟢 | Permisos locales |
| `~/.claude.json` | Configuration | fuera | **REBUILD** | 🟡 | 🔴 Claves MCP en texto plano. **Nunca versionar** |
| `~/.claude/projects/…/memory/` (27) | Knowledge | fuera | **REBUILD** | 🔴 | ⭐ **Lo más urgente de traer al repo.** Ver §M del mapa |
| `AGENTS.md` | Configuration | raíz | **KEEP** | 🟢 | Solo puntero |

---

## Resumen por clasificación

| | Cuántos | Los que más pesan |
|---|---|---|
| **KEEP** | ~45 | HISTORIA · ESTANDAR_PROMPTS · MODELO_OPERATIVO · PROTECCIONES · las 3 apps · VIDEOTECA · CURSO_CONVERZZO · los 5 agentes |
| **REFERENCE** | ~12 | DEPARTAMENTOS · PRODUCTO_PROPIO · handoffs · hojas de rodaje · las 40 skills globales |
| **REBUILD** | ~8 | CLAUDE.md · 05_CURRENT_PRIORITIES · _USO_LOG · los 8 ICP · skill `hoy` · las 4 skills-puntero · la memoria fuera del repo |
| **ARCHIVE** | ~5 | `_ARCHIVO/` entero · plan de contenido de julio · Adaptógenos · `_SKILLS/` |
| **DELETE_CANDIDATE** | **1** | `ESTADISTICAS ZAINT/*.jpeg` — **y solo si se confirma que ya está destilado** |

🔑 **Un solo candidato a borrar en 1.364 archivos.** El vault no tiene basura: tiene **duplicación
de conocimiento vivo** y **archivos que crecieron más de lo que alguien puede leer**. Son dos
problemas distintos y ninguno se arregla borrando.
