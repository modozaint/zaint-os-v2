---
tags: [modozaint-v2, adr, git, hostinger, despliegue]
updated: 2026-09-01
tipo: decision
status: accepted
owner: zaint-oficina
supersedes: null
---

# ADR 0003 - Git como fuente y Hostinger como runtime opcional

## Decisión

GitHub privado conserva el repositorio, historial, cambios y artefactos versionados. El checkout local
es el espacio principal de trabajo. El servidor de Hostinger puede utilizarse como runtime, hosting,
endpoint o ejecutor remoto cuando un proyecto concreto lo necesite.

Hostinger no es fuente de verdad, sustituto de Git ni requisito para operar V2.

## Flujo autorizado

`local -> Git -> revisión -> pruebas -> despliegue explícitamente aprobado -> verificación`

Cada servicio desplegado debe tener un documento de proyecto que indique objetivo, dominio, método de
despliegue, variables necesarias, prueba de salud, responsable y procedimiento de rollback.

## Protecciones

- No desplegar por defecto ni cambiar producción sin encargo explícito.
- No guardar claves, tokens, contraseñas ni `.env` en Git.
- Usar variables y secretos gestionados por el servicio de Hostinger.
- Probar localmente antes de desplegar.
- Mantener una versión recuperable y registrar commit, fecha, resultado y rollback.
- Si el cambio afecta dinero, datos sensibles, disponibilidad o producción, pedir aprobación antes
  del paso irreversible.

## Alcance actual

No hay un despliegue activo requerido por esta decisión. Hostinger queda disponible para una necesidad
concreta futura, sin activar infraestructura 24/7 ni migrar servicios automáticamente.
