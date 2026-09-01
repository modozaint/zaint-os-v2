---
tags: [modozaint-v2, founderos, mi-vida, producto, hábitos]
updated: 2026-09-01
tipo: estado-de-producto
status: auditado-localmente
---

# FounderOS / Mi Vida - estado y dirección

## Qué es hoy

FounderOS es la aplicación personal de Santiago, presentada al usuario como **Mi Vida**. Es una
PWA en Next.js con Supabase que concentra el día, hábitos, tareas, turnos, áreas, dinero personal y
una primera capa de navegación de casa/isométrica.

## Capacidades actuales encontradas

- Hoy: turno, capacidad y hábitos del día.
- Hábitos: niveles mínimo/normal/super, notas, evidencia e historial.
- Tareas: backlog, prioridad, minutos y cuenta de ZAINT.
- Dinero: bancos, bolsillos, presupuesto, movimientos y diagnóstico personal.
- Áreas: nivel y XP por área de vida.
- Ajustes: hábitos, áreas, horario y configuración.
- Onboarding y autenticación Supabase con RLS.
- Casa navegable con habitaciones como capa narrativa.
- Migraciones Supabase versionadas de `001` a `013`.

## Fuente de verdad

- Código y migraciones: `C:\DEPARTAMENTO MODOZAINT\_LABS\videojuego-vida`.
- Datos personales vivos: Supabase conectado a la app.
- No copiar saldos, hábitos ni turnos al vault como cifras actuales.
- Nunca mezclar dinero personal con dinero de negocio.

## Dirección de producto

La primera meta no es “hacer un videojuego grande”. Es dejar una aplicación personal estable,
entendible y agradable que Santiago use diariamente y que pueda probarse públicamente sin exponer
datos privados. El videojuego es una posible capa de experiencia sobre un sistema útil, no una
excusa para reemplazarlo.

## Roadmap por capas

### Capa 0 - uso personal estable

- Arranque local y producción verificables.
- Flujo Hoy -> marcar hábitos -> historial consistente.
- Turnos y capacidad correctos.
- Datos personales protegidos por auth/RLS.
- Copias y rollback antes de migraciones.

### Capa 1 - producto demostrable

- Cuenta de prueba o datos de demostración separados.
- Onboarding comprensible para alguien que no sea Santiago.
- Explicación clara del sistema de niveles, vida, XP y tareas.
- Métricas de activación, uso semanal y retención.
- Página pública sin datos personales ni promesas médicas/financieras.

### Capa 2 - experiencia de juego

- Misiones, progreso visual, habitaciones y recompensas coherentes.
- Narrativa que ayude a actuar, no solo decoración.
- Pruebas con usuarios reales antes de añadir mecánicas.
- Decidir si sigue siendo app gamificada o evoluciona a videojuego.

## Qué no hacer todavía

- No abrir datos personales reales al público.
- No convertir la casa visual en prioridad antes de cerrar el bucle diario.
- No añadir multijugador, economía virtual ni funciones sociales sin evidencia de uso.
- No publicar una versión pública sin separar datos, auth, RLS, analítica y soporte.
- No usar “videojuego” como promesa comercial antes de comprobar que la experiencia engancha.

## Criterio de validación inicial

La app se considera lista para una prueba pública controlada cuando una persona externa puede crear
su cuenta de prueba, completar el onboarding, entender qué hacer hoy, registrar un hábito y volver a
ver su progreso sin ayuda directa de Santiago, con datos aislados y sin acceso a información privada.
