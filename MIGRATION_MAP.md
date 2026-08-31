---
tags: [modozaint-v2, migracion, agentes]
updated: 2026-08-31
tipo: mapa
---

# Mapa de migración de agentes

## Raíces

- Workspace nuevo: `C:\DEPARTAMENTO MODOZAINT V2`
- Fuente V1, solo lectura durante esta migración: `C:\DEPARTAMENTO MODOZAINT`
- Evidencia externa de investigación: `C:\Users\Zaint}\.buzz\RESEARCH`, usada solo como respaldo.
- Exportación portable de origen: `_MIGRACION/agentes/`, resuelta desde la raíz V1.

Cambiar de máquina exige actualizar únicamente estas raíces. Los agentes usan rutas relativas.
La organización operativa del V2 la mandan `CLAUDE.md`, `00_NORTE/` y `70_AGENTES/`; la evidencia
externa no define la estructura.

## Correspondencia

| V1 | V2 | Estado |
|---|---|---|
| `_MIGRACION/agentes/00_QUIEN_HACE_QUE.md` | `70_AGENTES/QUIEN_HACE_QUE.md` | Copia portable |
| `_MIGRACION/agentes/_PLANTILLA.md` | `70_AGENTES/PLANTILLA.md` | Copia portable |
| `_MIGRACION/agentes/{agente}.md` | `70_AGENTES/{AGENTE}/00_ENTRAR.md` | Copia portable |
| Memoria V1 de cada agente | `70_AGENTES/<AGENTE>/` | Se migra por agente, no en bloque |
| Conocimiento e identidad V1 | Fuente V1 indicada por el router | No se duplica |

Los nueve portables son Xiomara, Juanjo, Contenido, Copy, Video, Hoy, Dermatinta, Kaizen y
MODOZAINT. Cada uno tiene una subcarpeta y una entrada única: `00_ENTRAR.md`. ORQUESTADOR es la
capa nueva de coordinación y se estabiliza antes de abrir otro agente.
