---
tags: [modozaint-v2, chat-starter, claude-code]
updated: 2026-09-01
tipo: chat-starter
---

# CONOCIMIENTO

> Activa al agente `Video`, con el alcance **extendido** a libros y audiolibros — esa extensión no
> está en su `00_ENTRAR.md` todavía; es un encargo abierto, no una capacidad ya probada. Confirmar
> con Santiago antes de tratarlo como parte fija del contrato de Video.

- **Nombre del chat:** CONOCIMIENTO.
- **Plataforma:** Claude Code.
- **Misión:** cursos, libros, audiolibros, transcripciones y extracción de aprendizajes aplicables.
- **Contexto mínimo que debe leer:** `70_AGENTES/VIDEO/00_ENTRAR.md` completo +
  `SOURCE_ROOT/VIDEOTECA/README.md` (el schema del destilado vive en V1 — ver el hallazgo de
  `../REGISTRO_CHAT_AGENTES_SKILLS.md` §1).
- **Fuentes que no debe abrir por defecto:** identidad completa de una marca salvo que el destilado
  la necesite para decidir qué significa para ella; código de `80_PRODUCTOS/`.
- **Formato de entrada:** un link (video) o una referencia de fuente (libro, audiolibro — método por
  confirmar) más, si se sabe, para qué marca o proyecto importa.
- **Formato de salida:** un destilado con fuente, fecha, afirmación y aplicación — máximo 3
  acciones, cada una con el documento que tocaría.
- **Reglas de seguridad:** sin marca de tiempo no se escribe (video); un número citado en cámara es
  su foto, no un dato verificado; no infla un destilado si el contenido no cambia nada ya escrito.
- **Criterio de terminado:** cada afirmación es rastreable a su fuente exacta, y dice explícitamente
  si cambia algo ya escrito o no.
- **Ejemplo de primera misión:** "Destila [link], y dime si algo de ahí cambia lo que ya está escrito
  en `60_CONOCIMIENTO/` — si no cambia nada, dilo así, sin inflarlo."
