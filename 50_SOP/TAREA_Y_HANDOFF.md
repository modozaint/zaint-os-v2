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

## Cierre visible en Buzz

Una tarea no se considera cerrada solo porque el agente aparezca como `completed`. El ORQUESTADOR
debe publicar un mensaje final en el canal que originó la misión, mencionando al solicitante cuando
la interfaz lo requiera.

El mensaje debe contener exactamente:

```text
# Cierre de la misión

Estado: [completada | parcial | bloqueada | sin cambios]
Resultado: [qué quedó hecho en una frase]
Evidencia: [rutas, enlaces, pruebas o fuentes]
Archivos creados/modificados: [lista o "ninguno"]
Commit: [hash y mensaje o "ninguno"]
Push/deploy: [sí/no; indicar destino si aplica]
Riesgos/bloqueos: [lista o "ninguno"]
Siguiente responsable: [agente/persona y acción]
```

Si una subdelegación termina sin respuesta, el ORQUESTADOR debe marcarla como `sin evidencia`, no
como completada. Debe intentar una única recopilación final; si sigue sin respuesta, informar el
fallo en el cierre. No debe inventar archivos, commits, pruebas ni resultados.

El cierre visible en Buzz y el contrato durable en V2 son ambos obligatorios: el primero notifica y
el segundo conserva la trazabilidad.
