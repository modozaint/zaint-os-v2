---
id: TASK_2026_09_01_ESTABILIZAR_FOUNDEROS
owner: orquestador
reviewer: santiago
status: pending
class: S2
created: 2026-09-01
updated: 2026-09-01
---

# Estabilizar FounderOS / Mi Vida

## Objetivo

Dejar la aplicación personal de hábitos usable, documentada y preparada para una prueba pública
controlada, preservando la privacidad de Santiago y sin convertir todavía el proyecto en un
videojuego de alcance grande.

## Orden

1. Auditar arranque, build, auth, RLS y rutas principales.
2. Probar el flujo diario completo con datos de prueba y con la cuenta personal sin modificar datos.
3. Verificar que hábitos, turnos, tareas, XP e historial sean consistentes.
4. Separar explícitamente modo personal y modo demostración.
5. Definir onboarding público y métricas de activación/retención.
6. Probar con pocos usuarios autorizados.
7. Solo con evidencia, decidir qué mecánica de videojuego merece construcción.

## Criterio de terminado

- Existe una auditoría reproducible del estado actual.
- El flujo principal funciona en local y producción, o el bloqueo queda documentado.
- Los datos personales no aparecen en el modo demostración.
- Hay una ruta de prueba para un usuario externo sin privilegios indebidos.
- El siguiente cambio de producto está elegido por evidencia de uso.

## Riesgos que requieren cuidado

- Auth, RLS, migraciones y datos personales son sensibles.
- Cualquier cambio de esquema Supabase requiere backup, prueba y rollback.
- Publicar la app o habilitar usuarios externos es una decisión de exposición y no se ejecuta sin
  revisión específica.
