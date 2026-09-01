---
id: TASK_SETUP_MULTIAGENTE_V2
owner: Claude Code (rol arquitecto, a pedido de Santiago)
reviewer: Santiago / CODEX PRINCIPAL cuando exista
status: completed (documentación) — pending (adopción real de los chats)
class: S1
created: 2026-09-01
updated: 2026-09-01
---

# Resultado esperado

Organizar los chats, agentes y skills existentes en una estructura clara para trabajar desde Claude
Code, Codex y VS Code sobre la misma carpeta canónica `C:\DEPARTAMENTO MODOZAINT V2`, sin tocar V1,
sin modificar código de producto y sin mover nada dentro de las interfaces de chat.

## Fuentes mínimas

Auditadas antes de escribir nada: `CLAUDE.md`, `AGENTS.md`, `00_NORTE/AGENT_ROUTER.md`,
`00_NORTE/FUENTES_CANONICAS.md`, `00_NORTE/PROPIEDAD_DE_RUTAS.md`, `00_NORTE/TRASPASO_CHATGPT.md`,
`00_NORTE/DECISIONES/` (ADR_0001-3, DECISIONES_PENDIENTES, ICP), `20_OPERACION/AHORA.md`,
`50_SOP/TAREA_Y_HANDOFF.md`, `50_SOP/PRESUPUESTO_Y_EFICIENCIA.md`, todo `70_AGENTES/` (los 10
`00_ENTRAR.md`, `PLANTILLA.md`, `MODELOS.md`, `QUIEN_HACE_QUE.md`, `COMO_USAR_AGENTES.md`,
`ORQUESTA_DEPARTAMENTOS.md`, `REGISTRO_OPERATIVO.md`, `INDICE.md`, `ORQUESTADOR/EVALS.md`),
`80_PRODUCTOS/README.md` y `MIGRATION_STATUS.md`, `~/.claude/skills/` (listado global, sin abrir
cada `SKILL.md`).

## Rutas excluidas por defecto

Código de `80_PRODUCTOS/**`, `SOURCE_ROOT` (V1) salvo lectura puntual para verificar una ruta
citada, identidad de marca completa (`BRANDS/`, `KNOWLEDGE_PACKS/`).

## Entregable

Cinco documentos nuevos, ninguno existía antes de esta tarea:

1. `70_AGENTES/REGISTRO_CHAT_AGENTES_SKILLS.md` — inventario clasificado en las 6 categorías.
2. `70_AGENTES/MATRIZ_INTERFACES_Y_MODELOS.md` — los 9 chats, campo a campo.
3. `50_SOP/FLUJO_MULTIAGENTE_LOCAL.md` — el flujo operativo y las reglas de colaboración
   Codex ⇄ Claude Code sobre el mismo checkout.
4. `70_AGENTES/CHAT_STARTERS/README.md` + 9 archivos de chat starter (uno por chat recomendado).
5. Este archivo.

## Límites y presupuesto

S1 — trabajo documental de un solo especialista, sin frentes paralelos. Sin gasto, sin push, sin
deploy, sin publicación, sin contacto con terceros. Ningún archivo de V1 ni de código de producto
fue modificado.

## Criterio de terminado

- [x] Los 5 documentos existen y ninguno duplica contenido ya cubierto por `MODELOS.md`,
      `REGISTRO_OPERATIVO.md`, `ORQUESTA_DEPARTAMENTOS.md`, `QUIEN_HACE_QUE.md`,
      `COMO_USAR_AGENTES.md` o `TAREA_Y_HANDOFF.md` — se enlazan en vez de repetirse.
- [x] Cada chat de la recomendación de Santiago (CODEX PRINCIPAL, SOFTWARE Y SOLUCIONES IA,
      OPERACIÓN DIARIA, CLAUDE PRINCIPAL, MARKETING, CONTENIDO, DERMATINTA, HOUSE OF KAIZEN,
      CONOCIMIENTO) tiene su matriz y su chat starter.
- [x] Ningún archivo existente fue modificado, movido ni borrado.
- [x] Ningún archivo de `80_PRODUCTOS/` fue tocado.
- [x] `git status` en V2 muestra solo archivos nuevos.
- [ ] **Pendiente, no de esta tarea:** que Santiago confirme la decisión abierta (dónde va el
      agente MODOZAINT entre los 9 chats) y decida si crea un agente propio para SOFTWARE Y
      SOLUCIONES IA o lo deja como chat sin oficio fijo.

## Evidencia de cierre

`git log -1` y `git status` después del commit de esta tarea, en la respuesta que cierra esta
misión en el chat. Los 15 archivos nuevos están listados ahí con su ruta completa.

## Siguiente responsable

Santiago decide: (a) la ubicación de MODOZAINT entre los 9 chats, (b) si abre CODEX PRINCIPAL
primero para validar el flujo antes de abrir los demás, (c) si esta tarea justifica escribir un
`00_ENTRAR.md` propio para "Software y Soluciones IA" como agente formal.
