---
tags: [modozaint-v2, chats, starters, indice]
updated: 2026-09-01
tipo: indice
---

# Chat starters — las 9 puertas de entrada

Un archivo por chat, con el formato fijo: nombre · plataforma · misión · contexto mínimo · fuentes
que NO abre por defecto · formato de entrada · formato de salida · reglas de seguridad · criterio de
terminado · ejemplo de primera misión. El detalle campo-a-campo (departamento, modelo, archivos que
puede y no puede tocar) vive en `../MATRIZ_INTERFACES_Y_MODELOS.md` — aquí no se repite, se pega.

**Cómo se usa:** abre el chat en su plataforma, pega el archivo completo como primera instrucción, y
responde a lo que pida antes de dar la primera misión real.

| # | Chat | Plataforma | Archivo |
|---|---|---|---|
| 1 | CODEX PRINCIPAL | Codex | `CODEX_PRINCIPAL.md` |
| 2 | SOFTWARE Y SOLUCIONES IA | Codex | `SOFTWARE_Y_SOLUCIONES_IA.md` |
| 3 | OPERACIÓN DIARIA | Codex | `OPERACION_DIARIA.md` |
| 4 | CLAUDE PRINCIPAL | Claude Code | `CLAUDE_PRINCIPAL.md` |
| 5 | MARKETING | Claude Code | `MARKETING.md` |
| 6 | CONTENIDO | Claude Code | `CONTENIDO.md` |
| 7 | DERMATINTA | Claude Code | `DERMATINTA.md` |
| 8 | HOUSE OF KAIZEN | Claude Code | `HOUSE_OF_KAIZEN.md` |
| 9 | CONOCIMIENTO | Claude Code | `CONOCIMIENTO.md` |

## Antes de abrir el segundo chat

No abras los 9 a la vez. `70_AGENTES/COMO_USAR_AGENTES.md` ya lo dice para los agentes portables y
aplica igual aquí: valida CODEX PRINCIPAL primero (es quien reparte lo demás), y abre cada chat solo
cuando tengas una misión real para él.

## Pendientes — chats que ya existen en una interfaz y esta auditoría no pudo leer

Si Claude Code, Codex o VS Code ya tienen una conversación con historial que no vive en ningún
archivo de este repositorio, regístrala con esta plantilla en cuanto tengas nombre y función:

```markdown
## [nombre del chat existente]

- Plataforma: [Claude Code / Codex / otra]
- Dónde vive: [solo en la interfaz — sin archivo, sin id verificable desde aquí]
- Función observada: [qué ha estado haciendo, con evidencia si existe]
- Se asigna a: [uno de los 9 de arriba, o uno nuevo — decisión de Santiago]
- Fecha de registro: [AAAA-MM-DD]
```

Ninguna se identificó como URL, id o nombre reconocible dentro de la carpeta durante la auditoría
del 2026-09-01 — ver `../REGISTRO_CHAT_AGENTES_SKILLS.md` §6.
