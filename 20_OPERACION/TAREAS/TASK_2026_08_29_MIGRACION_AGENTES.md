---
id: TASK_2026_08_29_MIGRACION_AGENTES
owner: orquestador
reviewer: zaint-oficina
status: in_progress
class: S2
created: 2026-08-29
updated: 2026-08-31
---

# Resultado esperado

Workspace V2 ordenado, versionado y utilizable con el router local sin cargar todo V1.

## Fuentes mínimas

- `00_NORTE/AGENT_ROUTER.md`.
- `60_CONOCIMIENTO/DECISIONES_MULTIAGENTE.md`.
- `60_CONOCIMIENTO/EVIDENCIA/ARQUITECTURA_MULTIAGENTE_2026_08_29.md`.
- `60_CONOCIMIENTO/EVIDENCIA/EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md`.

## Rutas excluidas por defecto

- `_ARCHIVO_V1/`.
- Historial completo de V1.

## Entregable

- Diez entradas `70_AGENTES/<NOMBRE>/00_ENTRAR.md`.
- Router, SOP, estado, bitácora, ADR, pruebas y borrador revisable del ORQUESTADOR.

## Límites y presupuesto

- V1 permanece en solo lectura.
- Un especialista por frente; paralelismo solo para investigación independiente.
- No abrir un segundo agente hasta estabilizar ORQUESTADOR.

## Criterio de terminado

- Rutas verificadas automáticamente.
- Commit con autoría explícita.
- Propietario guarda el borrador del ORQUESTADOR y pasan sus tres pruebas en vivo.

## Evidencia de cierre

- Verificación estructural: 10 entradas, 82 rutas existentes, 9 políticas y 2 evidencias verificadas;
  cero rutas antiguas o faltantes.
- Borrador actualizado: `82c9643e11b0018c5d6d0b1bac11019b9c0c604f272ab5e6d0fc1b684600f7ca`.

## Siguiente responsable

- Zaint OFICINA: elegir autoría Git y guardar el borrador.
- ORQUESTADOR: commit, pruebas en vivo y cierre.
