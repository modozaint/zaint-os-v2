---
name: project-nexum-leadhunter
description: "Sistema de prospección del reto Nexum (app LeadHunter) — estado, roadmap y dónde vive todo."
metadata: 
  node_type: memory
  type: project
  originSessionId: 91b338ba-e077-4428-b009-511868e4dc3c
  modified: 2026-07-30T16:24:23.550Z
---

Sistema de prospección para ganar el reto Nexum (→ rol + producto vendible). App "LeadHunter".

**Código:** `_LABS/nexum-leadhunter/app` (Next.js + TS, corre en `localhost:3000` con `npm run dev`). Bajo git; commits SIEMPRE acotados con `git add _LABS/nexum-leadhunter/` (nunca `git add -A`). Tokens solo en `.env.local` (gitignored): Apify, Anthropic, Airtable.

**Roadmap y estado completo (fuente de verdad del alcance):** `SOLUCIONES_IA/BANCO_SOLUCIONES/nexum-roadmap-producto.md`. Ahí está TODO lo construido + lo que falta + el módulo en curso.

**Construido (Capa 1, simulación real, 8/9 del reto):** búsqueda LinkedIn (multi-país/provincia/ciudad) · enriquecimiento 2 posts del mismo perfil · análisis IA + mensaje · cadencia/contacto · setter multicanal · seguimientos · kanban 6 estados · Cal.com · persistencia local · CRM Airtable · panel de métricas · **perfil por cliente + canal ecommerce**.

**Completado 2026-07-24:** módulo "Más automatización del setter" (3/3: conversación autónoma end-to-end, orquestador "Piloto automático", agentes especializados visibles) + **fuente Google Maps** (negocios locales multi-nicho, actor `compass/crawler-google-places`, ~$0,007/negocio, filtros web/cerrados/estrellas). Selector de fuente LinkedIn/Maps en Búsqueda.

**También completado 2026-07-24:** contador de gasto REAL de Apify + presupuesto tope que bloquea · cockpit "Ruta" (llamar/WhatsApp con botones de resultado, outreach real sin Capa 2) · white-label (la app se re-tinta con el color del cliente activo).

**ESTADO 2026-07-24: listo para presentar.** Guion de demo + mensaje de contacto + preguntas en `SOLUCIONES_IA/BANCO_SOLUCIONES/nexum-presentacion.md`. Pendiente real: que Santiago envíe el mensaje y agende la demo.

**Ampliado 2026-07-26:** 4 fuentes (LinkedIn, Google Maps, **Instagram** por hashtag→DM, Ecommerce) en **Fuentes multi-selección** · **Consola de llamada** · **notas automáticas del agente IA** · X para eliminar + limpiar tablero. IG no trae teléfono → DM (no va a la Ruta).

**Capa 2 CONSTRUIDA 2026-07-28 (ya no es solo simulación):** LinkedIn real vía **Unipile** (invitaciones + conversación auto) + **Cal.com** (crea cita real end-to-end). Probado en vivo: descubrimiento → propone 2 fechas → pide hora+correo → crea cita → confirma. Cableado a la app: `lib/unipile.ts`, `lib/calcom.ts`, `/api/motor/sync` (lee respuestas reales, agenda, mueve el kanban), botón "Conectar (real)" en LeadPanel, polling 25s. LinkedIn de Santiago conectado (account jDvZyc…).

**Ampliado 2026-07-30 (8 mejoras del feedback, ref. visual = Camel Export):** (1) **LOGIN por usuario con roles** — `admin` ve/config todo (clientes, panel, gasto, ajustes, historial); `comercial` solo opera (Leads/In the loop/Ruta), sin costos ni config. Picker "¿Quién eres?" client-side (sin contraseñas; auth real = Capa 2). Store: `usuarios[]` + `/api/usuarios`. (2) **Ruta** rehecha como cola de a uno (traer 20 → tarjeta grande que avanza sola, objetivo del día + tareas locales). (3) **Vista Tabla** en Leads (toggle kanban/tabla + buscador). (4) **Historial de EXTRACCIONES** (no personas): cada búsqueda registrada por mes, filtro por fuente, costo — `Extraccion` en store + `/api/historial`. (5) **Coste como barra** vs presupuesto tope en Fuentes. (6) Ayuda contextual por interfaz + tour filtrado por rol. (7) Nota de **adaptabilidad** (cualquier actor Apify por nicho) en Fuentes. (8) **Setter escala a humano** cuando no puede resolver, sin inventar (regla de oro en ambos prompts, R14).

⚠️ **Camel Export (camel-scraping-system.vercel.app) NO es nuestro código** — es una referencia visual vista en la clase de Nexum. Nuestro producto es `nexum-leadhunter`.

**Permiso (2026-07-24):** se pueden gastar créditos de Apify probando actores; si se agotan, cambiar API key.

**Pendiente real (no código):** Santiago debe enviar el mensaje a Juanpa (en `nexum-presentacion.md` §4) y agendar la demo. La reunión del miércoles 2026-07-29 era técnica, no con él. Regla viva: solo mismo perfil/red del lead, nunca cruzar redes ni datos personales.
