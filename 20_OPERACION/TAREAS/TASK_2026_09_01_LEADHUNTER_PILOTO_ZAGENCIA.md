---
id: TASK_2026_09_01_LEADHUNTER_PILOTO_ZAGENCIA
owner: codex-principal
reviewer: santiago
status: pending
class: S2
created: 2026-09-01
updated: 2026-09-01
---

# Piloto personal de LeadHunter: tres solicitudes revisadas

## Objetivo

Encontrar y contactar desde la cuenta de Santiago a tres decisores que encajen con la solucion de
LeadHunter/Zagencia, para verificar calidad de busqueda, personalizacion y envio individual antes de
retirar Unipile.

## Alcance

- Usar el ICP inicial vigente de Zagencia: fundador, socio o decisor de una agencia, estudio,
  consultoria o servicio digital pequeno en Colombia con problema de prospeccion o seguimiento.
- Extraer una muestra corta y revisar el encaje de cada perfil contra la oferta activa de MODOZAINT.
- Seleccionar tres perfiles con evidencia visible de decision, sector y ubicacion.
- Generar y revisar una nota de invitacion personalizada por perfil.
- Enviar exactamente tres solicitudes de conexion, de una en una, desde `api/contactar/real`.

## Fuentes minimas

- `00_NORTE/DECISIONES/DECISION_ICP_ZAGENCIA_2026-09-01.md`
- `00_NORTE/DECISIONES/DECISION_VEHICULO_INGRESOS_2026-09-01.md`
- `80_PRODUCTOS/LEAD_HUNTER/app/app/api/search/route.ts`
- `80_PRODUCTOS/LEAD_HUNTER/app/app/api/contactar/real/route.ts`
- Oferta y remitente activos en el cliente de MODOZAINT dentro de LeadHunter.

## Archivos permitidos

- `80_PRODUCTOS/LEAD_HUNTER/app/app/api/contactar/real/route.ts`
- Esta tarea.
- Un resultado nuevo bajo `30_RESULTADOS/` sin datos personales de los prospectos.

## Limites y presupuesto

- Se autorizan exactamente tres solicitudes de conexion de LinkedIn hoy, 2026-09-01.
- Cada solicitud se envia manualmente y debe contener una nota personalizada de hasta 280 caracteres.
- No enviar mensajes posteriores, seguimientos, recordatorios ni activar n8n.
- No guardar nombres, URLs, contenido de perfiles ni notas de prospectos en Git.
- Si falta nota, el perfil no encaja, Unipile falla o la cuenta esta restringida, no se sustituye por
  otro envio automatico: se registra el bloqueo y se detiene.

## Entregable

- Evidencia de la busqueda y criterios aplicados.
- Tres solicitudes enviadas con confirmacion individual de Unipile, o el bloqueo verificable.
- Resumen anonimizado de calidad de la muestra y siguiente paso.

## Criterio de terminado

- Los tres perfiles cumplen el ICP vigente y la oferta configurada es de Santiago, no la demo.
- Las tres notas son revisadas antes de cada envio y no hacen claims no verificados.
- Cada envio tiene respuesta exitosa de Unipile y se verifica en LinkedIn cuando sea posible.
- No se envian mensajes posteriores ni se activa automatizacion.

## Evidencia de cierre

El cierre usa `50_SOP/TAREA_Y_HANDOFF.md`. Sin confirmacion individual de envio o evidencia del
bloqueo, la tarea queda `sin evidencia`.
