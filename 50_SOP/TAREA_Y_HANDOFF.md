---
tags: [modozaint-v2, agentes, tareas, handoff]
updated: 2026-08-31
tipo: sop
---

# Tarea y handoff

## Contrato de tarea

ORQUESTADOR crea `20_OPERACION/TAREAS/TASK_AAAA_MM_DD_SLUG.md` con:

```markdown
---
id: TASK_AAAA_MM_DD_SLUG
owner: agente
reviewer: orquestador
status: pending
class: S0
created: AAAA-MM-DD
updated: AAAA-MM-DD
---

# Resultado esperado
## Fuentes mínimas
## Rutas excluidas por defecto
## Entregable
## Límites y presupuesto
## Criterio de terminado
## Evidencia de cierre
## Siguiente responsable
```

El aviso de coordinación contiene objetivo, responsable y ruta al contrato. El archivo es la
fuente durable.

## Handoff

El especialista entrega exactamente:

1. Resultado.
2. Evidencia.
3. Archivo o enlace.
4. Riesgos.
5. Pendiente y siguiente responsable.

No copia el historial completo si una referencia corta basta. ORQUESTADOR verifica el criterio de
terminado, actualiza el contrato y publica un solo cierre humano.
