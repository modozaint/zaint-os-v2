---
tags: [modozaint-v2, agentes, skills, chats, inventario]
updated: 2026-09-01
tipo: registro
---

# Registro — chats, agentes, skills, workflows, servicios y conocimiento

> Auditoría del 2026-09-01, hecha por Claude Code. Clasifica lo que ya existe en V2 (y lo que V2
> consulta de V1 en solo lectura) en las seis categorías que usa `MATRIZ_INTERFACES_Y_MODELOS.md`.
> **Este archivo apunta, no copia** — cada fila enlaza a su fuente. No se movió, borró ni
> sobrescribió nada; no se tocó código de `80_PRODUCTOS/`.
>
> Auditado: `CLAUDE.md`, `AGENTS.md`, `00_NORTE/AGENT_ROUTER.md`, `20_OPERACION/AHORA.md`,
> `50_SOP/TAREA_Y_HANDOFF.md`, todo `70_AGENTES/`, `~/.claude/skills/` (no existe `.claude/skills/`
> de proyecto ni en V1 ni en V2 — las skills viven en el perfil global del usuario), `80_PRODUCTOS/`,
> `00_NORTE/DECISIONES/`, `60_CONOCIMIENTO/`.

## 1 · AGENTE — responsabilidad estable, dueño de un área

| Agente | Oficio en una línea | Entrada |
|---|---|---|
| ORQUESTADOR | Coordina, enruta, verifica y cierra | `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` |
| Xiomara | Decide a quién le hablamos y por qué | `70_AGENTES/XIOMARA/00_ENTRAR.md` |
| Contenido | Escribe el guion | `70_AGENTES/CONTENIDO/00_ENTRAR.md` |
| Copy | Escribe el caption | `70_AGENTES/COPY/00_ENTRAR.md` |
| Juanjo | Monta: cómo se ve y suena | `70_AGENTES/JUANJO/00_ENTRAR.md` |
| Video | Convierte un link en aprendizaje guardado | `70_AGENTES/VIDEO/00_ENTRAR.md` |
| Hoy | Dice qué toca ahora | `70_AGENTES/HOY/00_ENTRAR.md` |
| Dermatinta | Opera la marca hasta su próximo gate | `70_AGENTES/DERMATINTA/00_ENTRAR.md` |
| Kaizen | Cotiza, calcula y atiende el taller | `70_AGENTES/KAIZEN/00_ENTRAR.md` |
| MODOZAINT | Documenta lo que ya pasó | `70_AGENTES/MODOZAINT/00_ENTRAR.md` |

Ya inventariados, con su cadena de dependencia, en `70_AGENTES/QUIEN_HACE_QUE.md` y
`70_AGENTES/ORQUESTA_DEPARTAMENTOS.md`. No se repite aquí.

⚠️ **Hueco real, no un olvido:** ningún agente es dueño de **ingeniería de producto** — el código de
`80_PRODUCTOS/` (Lead Hunter, Content OS, FounderOS). Ver "Software y Soluciones IA" en la matriz.

⚠️ **Hallazgo de auditoría:** el destino declarado de dos agentes todavía es V1, no V2 — no es un
error, es el diseño mientras la migración sea gradual (`SOURCE_ROOT`, solo lectura):
- **Video** escribe en `VIDEOTECA/` — esa carpeta **no existe en V2**, solo en V1.
- **Contenido** y **Copy** escriben en "el módulo 08 del pack de la marca" — vive en
  `SOURCE_ROOT/KNOWLEDGE_PACKS/<MARCA>/08_*`, tampoco migrado.

Mientras no se decida migrar esas rutas, ambos agentes siguen escribiendo del lado V1 aunque se
invoquen desde V2. No requiere acción de este registro — es una nota para quien abra esos chats.

## 2 · SKILL — método reusable para una tarea concreta

| Skill | Vive en | Nota de V2 |
|---|---|---|
| `watch` | `70_AGENTES/watch/` (copia versionada) | Mitad no-Claude de `video`; ya migrada a V2 |
| `activo`, `cierre`, `contenido`, `copy`, `decision`, `handoff`, `hoy`, `learn`, `video`, `weekly`, `workspace` | `~/.claude/skills/<nombre>/` (perfil global, no en ningún repo) | Las 11 skills ZAINT OS. Se invocan con `/nombre` en Claude Code — formato que `70_AGENTES/PLANTILLA.md` excluye de un agente portable. Varias referencian rutas absolutas de V1 (`C:\DEPARTAMENTO MODOZAINT`); **no verificado en esta auditoría si siguen funcionando igual apuntando a V2** — auditar antes de asumirlo |
| `pdf`, `docx`, `xlsx`, `agent-browser`, `mcp-builder`, `skill-creator`, `frontend-design`, `dataviz`, `web-design-guidelines`, `viral-*`, `marketing-super-skill`, y el resto genérico del perfil | `~/.claude/skills/` | Sin dependencia de V1; usables en V2 sin auditoría adicional |

El inventario completo de las 40 skills globales, con cuáles son instalables de nuevo y cuáles son
propias, ya está hecho en `_MIGRACION/MODOZAINT_MIGRATION_INVENTORY.md` (V1, solo lectura) — no se
repite aquí.

## 3 · WORKFLOW — secuencia entre agentes o skills

| Workflow | Vive en |
|---|---|
| Contrato de tarea y handoff | `50_SOP/TAREA_Y_HANDOFF.md` |
| Clases de esfuerzo S0-S3 | `50_SOP/PRESUPUESTO_Y_EFICIENCIA.md` |
| Runbook de evaluación de ORQUESTADOR | `70_AGENTES/ORQUESTADOR/PROCESO_EVALS.md` |
| Cadena de campaña B2B / campaña Dermatinta | `70_AGENTES/ORQUESTA_DEPARTAMENTOS.md` |
| **Flujo multiagente local (Codex ⇄ Claude Code, mismo checkout)** | `50_SOP/FLUJO_MULTIAGENTE_LOCAL.md` — nuevo, creado en esta auditoría |

## 4 · SERVICIO — herramienta externa o infraestructura

| Servicio | Estado verificado hoy (2026-09-01) | Fuente |
|---|---|---|
| GitHub — `modozaint/zaint-os-v2` | Remoto privado del repo V2, sincronizado | `00_NORTE/TRASPASO_CHATGPT.md` |
| GitHub — `modozaint/zaint-os` (V1) | Remoto de trabajo de V1; `vault-respaldo` es un segundo remoto con push bloqueado a propósito | `00_NORTE/DECISIONES/DECISIONES_PENDIENTES.md` §8 |
| Supabase | Dos proyectos separados: Content OS (`posts`/`metrics`/`transcriptions`, RLS apagado desde el 26-ago) y FounderOS (`bancos/bolsillos/movimientos`) | `60_CONOCIMIENTO/CONTRATO_CONTENT_OS.md`, `60_CONOCIMIENTO/FOUNDEROS_ESTADO_Y_PRODUCTO.md` |
| Hostinger | Runtime opcional, **sin despliegue activo**. Sus MCP de agency-hosting, dominios y WordPress **fallaron al conectar en esta sesión** (`CONNECTION_CLOSED`) — verificar contra el sistema vivo antes de asumir disponible | `00_NORTE/DECISIONES/ADR_0003_GIT_Y_HOSTINGER.md` |
| n8n | MCP configurado pero el endpoint no respondió en esta sesión (`ENDPOINT_NOT_FOUND`) — no operativo hoy | — |
| Shopify | Vive en V1 (Dermatinta); V2 no lo toca todavía | `SOURCE_ROOT` |
| Buzz | Opcional, no bloqueante, no es fuente de verdad | `20_OPERACION/AHORA.md` |

## 5 · CONOCIMIENTO — información, decisiones, documentación

| Bloque | Vive en |
|---|---|
| Rescate destilado de V1 (memorias, saberes sueltos) | `60_CONOCIMIENTO/CONOCIMIENTO_RESCATADO.md`, `SABERES_SUELTOS.md` |
| Decisiones de arquitectura | `00_NORTE/DECISIONES/ADR_0001..0003` |
| ICP y decisiones de negocio | `00_NORTE/DECISIONES/DECISION_ICP_ZAGENCIA_2026-09-01.md`, `DECISION_VEHICULO_INGRESOS_2026-09-01.md` |
| Contradicciones abiertas | `00_NORTE/DECISIONES/DECISIONES_PENDIENTES.md` |
| Evidencia de arquitectura/eficiencia multiagente | `60_CONOCIMIENTO/EVIDENCIA/` |
| Identidad y conocimiento de marca (no migrado) | `SOURCE_ROOT/BRANDS/`, `SOURCE_ROOT/KNOWLEDGE_PACKS/` — solo lectura |
| Auditoría de conocimiento V1↔V2 | `60_CONOCIMIENTO/AUDITORIA_CONOCIMIENTO_V1_V2_2026-09-01.md` — existe, sin commitear al momento de este registro; no es de esta tarea |

## 6 · CHAT — interfaz concreta de Claude Code, Codex u otra plataforma

Las 9 recomendadas por Santiago el 2026-08-29, detalladas campo a campo en
`MATRIZ_INTERFACES_Y_MODELOS.md`, cada una con su primer mensaje listo en `70_AGENTES/CHAT_STARTERS/`:

| Chat | Plataforma | Agente(s) que activa |
|---|---|---|
| CODEX PRINCIPAL | Codex | ORQUESTADOR |
| SOFTWARE Y SOLUCIONES IA | Codex | Ninguno todavía — hueco de agente, ver §1 |
| OPERACIÓN DIARIA | Codex | Hoy |
| CLAUDE PRINCIPAL | Claude Code | Ninguno fijo — investigación y síntesis larga, apoya a ORQUESTADOR |
| MARKETING | Claude Code | Xiomara |
| CONTENIDO | Claude Code | Contenido, Copy, Juanjo, y MODOZAINT (ver nota) |
| DERMATINTA | Claude Code | Dermatinta |
| HOUSE OF KAIZEN | Claude Code | Kaizen |
| CONOCIMIENTO | Claude Code | Video (extendido a libros/audiolibros, ver chat starter) |

⚠️ **Decisión abierta para Santiago:** el listado original de 9 chats no nombra uno para el agente
**MODOZAINT** (documenta lo que ya pasó, reparte audiencia). Este registro lo agrupó dentro de
**CONTENIDO** porque su salida es una pieza, igual que Contenido/Copy/Juanjo — es una propuesta de
esta auditoría, no una instrucción recibida. Confirmar o mover.

### Chats pendientes de mapear

Si en Claude Code, Codex o VS Code ya existe una conversación con historial que esta auditoría no
puede leer (vive solo en la interfaz, no en archivo), regístrala aquí con la plantilla de
`70_AGENTES/CHAT_STARTERS/README.md` §Pendientes en cuanto tengas su nombre y su función real.
Ninguna se identificó como URL, id o nombre reconocible dentro de la carpeta durante esta auditoría.
