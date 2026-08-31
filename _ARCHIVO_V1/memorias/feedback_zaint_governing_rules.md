---
name: feedback-zaint-governing-rules
description: "Reglas de operación de ZAINT — no dispersarse, no prometer autonomía 24/7 falsa, construir skills solo cuando se repiten, las 6 reglas de holding lean, verificar contra sistemas reales antes de confiar en el vault/memoria, y el patrón de confirmación explícita por skill antes de instalar"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d784ffda-def4-4c43-8ec1-9ba70fd23396
---

**Regla rectora del ecosistema:** "No dispersarse. Ejecución sobre teoría. ¿Qué estamos ejecutando esta semana?" — toda decisión se mide contra esta pregunta. Nunca abrir nuevos proyectos si los actuales no generan dinero todavía.

**Why:** Santiago identificó explícitamente como su propio error de enfoque "demasiadas ideas nuevas" — esta regla existe para corregir eso.

**How to apply:** Antes de proponer una nueva marca, herramienta, sistema o skill, preguntar primero si resuelve algo de esta semana o si es dispersión. Preferir ejecutar lo ya diseñado (ver el vault (`00_CONTEXT_CORE.md` y archivos enlazados, ver [[reference-zaint-vault-location]])) sobre diseñar algo nuevo.

---

**No prometer "modo autónomo 24/7" de la IA investigando sola.** Eso no es algo que Claude pueda cumplir literalmente sin que algo lo invoque. La versión honesta es tareas programadas (`/loop` o cron) con alcance y horario explícitos.

**Why:** Se planteó esa expectativa una vez y se corrigió explícitamente como engañosa/imposible de cumplir tal cual.

**How to apply:** Si Santiago pide "que investigues solo" o "que corras esto en segundo plano todo el tiempo", ofrecer en su lugar configurar un `/loop` o cron con alcance y frecuencia concretos — nunca prometer ejecución continua sin invocación.

---

**Construir una skill/herramienta solo cuando la tarea que resuelve se vuelve repetitiva por segunda vez**, no antes — evitar sobre-construir para tareas de una sola vez. Mismo criterio para adoptar herramientas externas: solo si pasa 4 preguntas (¿se puede robar en vez de construir? ¿se puede adaptar sin romper reglas de marca? ¿crea leverage real? ¿reduce tiempo de ejecución?).

**Why:** Es el filtro que Santiago ya aplicó a sí mismo en la pasada de investigación de 2026-06-23 (ver el vault (`00_CONTEXT_CORE.md` y archivos enlazados, ver [[reference-zaint-vault-location]])) — evita acumular infraestructura no usada.

**How to apply:** Al proponer una skill nueva o adoptar un repo externo, verificar explícitamente contra estas 4 preguntas antes de construir.

---

**Principio permanente fijado 2026-06-29 — ZAINT no es una empresa tradicional, es un ecosistema operado por un solo founder con AI agents.** De ahí salen 6 reglas estructurales que gobiernan toda la arquitectura (documentadas en `00_CONTEXT_CORE.md` §2 del vault):
1. No duplicar departamentos (nunca un Content Team por marca, por ejemplo).
2. Existe un solo núcleo operativo central que presta servicio a todas las marcas/BUs.
3. Las business units (Dermatinta, House of Kaizen) no tienen equipo propio — se definen solo por 7 campos delgados (Current Priority, Product, Audience, Offer, Revenue Goal, Active Campaign, Metrics).
4. MODOZAINT no solo documenta — controla toda la infraestructura compartida; todo sistema trabaja desde MODOZAINT.
5. Pensar como holding lean: 1 Founder Core + 1 capa de infraestructura compartida + N business units delgadas, nunca como "varias empresas separadas".
6. Cualquier arquitectura que requiera más de un humano (founder) para funcionar queda rechazada — debe poder operarse con Founder + AI agents solos. Colaboradores humanos reales (Roberto, Renata, Steven) son aceleradores de hoy, no una dependencia estructural del diseño.

**Why:** Santiago lo declaró explícitamente como restricción crítica antes de aprobar una reestructuración grande del ecosistema (ZAINT OS), después de que el diseño inicial propuesto (departamentos completos por marca) le pareciera corporativamente pesado.

**How to apply:** Antes de proponer cualquier estructura nueva (agente, departamento, "lab", carpeta), verificar contra estas 6 reglas primero. Si algo parece requerir un departamento dedicado por marca, buscar primero si puede ser un servicio compartido único en su lugar. Optimizar leverage > organización bonita.

---

**Verificar contra sistemas reales (Shopify, Notion, GitHub — ver [[reference-zaint-external-systems]]) antes de confiar en el vault de Obsidian o en lo que Santiago recuerda de memoria.** El 2026-06-29 esto importó varias veces: el vault tenía la identidad visual de Dermatinta como "Bebas+dorado" pero el sitio real usa otra cosa; Santiago calculó precios de un lote a mano y los reales en Shopify eran ~2x más altos; y existe un ZAINT OS completo en Notion (desde 2026-05-24) que el vault de Obsidian (desde 2026-06-23) nunca incorporó.

**Why:** un dato recordado o documentado puede estar desactualizado; el sistema en vivo (Shopify/Notion/GitHub) es la fuente de verdad cuando hay conflicto.

**How to apply:** si la pregunta es sobre precios, inventario, identidad visual en producción, o "qué se decidió ya" — revisar primero la herramienta conectada correspondiente (MCP de Shopify, `notion-search`, `gh`) antes de responder o de escribir algo nuevo al vault.

---

**Las skills externas (`npx skills add`) requieren confirmación explícita por cada skill individual antes de instalarse — un clasificador de seguridad bloquea instalaciones que se sienten "proactivas" aunque el usuario ya haya aprobado algo similar antes.** Patrón observado repetidas veces el 2026-06-29: presentar la skill encontrada (qué hace, installs, fuente) → esperar un sí explícito → instalar. Saltarse el paso de preguntar (incluso para una skill del mismo paquete ya confiado) provoca el bloqueo.

**Why:** es una protección del harness contra traer código externo sin que el usuario confirme la fuente específica, no un capricho — no intentar rodearlo.

**How to apply:** después de una búsqueda con `/find-skills`, siempre presentar candidatos y esperar confirmación explícita antes de `npx skills add`, incluso si son del mismo repo que uno ya instalado.
