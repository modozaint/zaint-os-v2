---
tags: [modozaint-v2, sop, multiagente, codex, claude-code]
updated: 2026-09-01
tipo: sop
---

# Flujo multiagente local — Codex y Claude Code en la misma carpeta

> Describe el resultado y las restricciones, no una coreografía paso a paso — mismo formato que
> `SISTEMA/ESTANDAR_PROMPTS.md` en V1. Complementa, no repite: `50_SOP/TAREA_Y_HANDOFF.md` (el
> contrato de tarea), `00_NORTE/PROPIEDAD_DE_RUTAS.md` (quién escribe qué) y
> `70_AGENTES/ORQUESTA_DEPARTAMENTOS.md` (las cadenas por campaña).

## El flujo

```text
Idea del fundador
  → CODEX PRINCIPAL clasifica (S0-S3, con 50_SOP/PRESUPUESTO_Y_EFICIENCIA.md)
  → asigna un agente o skill (00_NORTE/AGENT_ROUTER.md decide cuál)
  → el agente trabaja dentro de C:\DEPARTAMENTO MODOZAINT V2
  → crea o modifica solo los archivos que su misión autorizó
  → ejecuta las pruebas que apliquen (compilar, lint, verificar contra el sistema vivo)
  → crea un commit local, atribuible
  → publica un cierre visible (formato exacto de 50_SOP/TAREA_Y_HANDOFF.md)
  → CODEX PRINCIPAL revisa el cierre contra el criterio de terminado
  → se decide la siguiente acción, o se para y se pregunta
```

Es el mismo ciclo que ya describe `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` — aquí se fija además **cómo
conviven dos plataformas sobre el mismo checkout.**

## Un solo checkout, dos plataformas

`C:\DEPARTAMENTO MODOZAINT V2` es la única carpeta canónica. Codex, Claude Code y VS Code la abren
tal cual — no hay una copia por plataforma ni un checkout separado. VS Code no es un agente: es
donde corren la extensión o CLI de Claude Code y la de Codex.

**La regla que evita el conflicto no es técnica, es de contrato:**

1. **Cada misión declara su alcance y sus archivos permitidos** antes de tocar nada — el contrato
   de `50_SOP/TAREA_Y_HANDOFF.md` ya exige "Fuentes mínimas" y el encargo de ORQUESTADOR ya exige
   "archivo o resultado esperado". Sin esos dos campos llenos, la misión no arranca.
2. **El campo `owner` del contrato dice qué plataforma escribe.** Mientras una tarea esté
   `in_progress`, solo su `owner` edita los archivos que declaró. La otra plataforma puede leer, o
   trabajar en una tarea distinta con archivos que no se solapan.
3. **Un agente no lee todo el repositorio por defecto.** Cada `00_ENTRAR.md` y cada chat starter fija
   su fuente mínima — es la misma regla que ya impone `AGENTS.md` y `00_NORTE/AGENT_ROUTER.md`, y es
   lo que además reduce la probabilidad de que dos misiones toquen el mismo archivo sin saberlo.
4. **Si dos misiones necesitan el mismo archivo**, una espera: se declara `blocked` en su contrato,
   no se edita en paralelo. No hay merge automático de dos ediciones simultáneas del mismo archivo —
   se evita generándolo, no resolviéndolo después.

## Regla contra la falsa fuente de verdad

- **La fuente original se conserva.** Un resumen o destilado pasa a `60_CONOCIMIENTO/` como
  conocimiento canónico **solo después de validarse** — mientras tanto vive en la carpeta del
  agente o en el borrador que lo produjo.
- **No se considera commit un mensaje de Buzz ni de un chat.** Un resultado no es "terminado" sin
  evidencia, ruta de archivo y estado de Git verificable con `git log` / `git status` — igual que
  exige `50_SOP/TAREA_Y_HANDOFF.md` para el cierre visible.
- **Un dato vivo gana sobre un documento**, como ya fija `00_NORTE/AGENT_ROUTER.md` §Conflictos.

## Lo que ninguna plataforma hace sin autorización explícita

- No push, no deploy, no publicación a una audiencia, no contacto con un tercero, no gasto de
  dinero — sin importar si lo pide Codex o Claude Code. Es la misma regla en las dos plataformas,
  no una por cada una.
- No se toca `C:\DEPARTAMENTO MODOZAINT` (V1) salvo lectura mientras la migración sea gradual.
- No se borra ni sobrescribe un archivo útil sin que su misión lo haya declarado.

## Cuándo se para y se pregunta

Igual que fija `00_NORTE/TRASPASO_CHATGPT.md`: si una decisión afecta arquitectura, producción,
datos sensibles, dinero o una acción irreversible, la plataforma que la encuentre se detiene y se lo
entrega a Santiago con el estado exacto en que quedó — no avanza "para no perder el hilo".
