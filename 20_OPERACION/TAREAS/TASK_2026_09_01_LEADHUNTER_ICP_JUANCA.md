---
id: TASK_2026_09_01_LEADHUNTER_ICP_JUANCA
owner: codex-principal
reviewer: santiago
status: pending
class: S2
created: 2026-09-01
updated: 2026-09-01
---

# Preparar LeadHunter para la prueba de ICP de Juanca

## Objetivo

Dejar LeadHunter listo para recibir dos archivos Markdown de Juanca, convertirlos en un ICP
estructurado y revisable, y ejecutar una extraccion manual de prueba en Peru sin contactar a ningun
lead.

## Alcance

- Aceptar hasta dos archivos `.md` locales y leerlos solo en el servidor.
- Extraer un borrador estructurado de ICP: problema, sector, tipo de empresa, cargos, seniority,
  industrias, palabras clave, inclusiones, exclusiones y ubicacion.
- Mostrar el borrador para revision humana y permitir corregirlo antes de buscar.
- Resolver y mostrar una ubicacion de LinkedIn valida para Peru antes de ejecutar la extraccion.
- Permitir una unica extraccion manual acotada, con los filtros aprobados, sin enviar invitaciones,
  mensajes ni seguimientos.

## Fuentes minimas

- Los dos archivos Markdown que entregue Juanca.
- `80_PRODUCTOS/README.md`
- `80_PRODUCTOS/LEAD_HUNTER/app/README.md`
- `80_PRODUCTOS/LEAD_HUNTER/app/app/api/search/route.ts`
- `80_PRODUCTOS/LEAD_HUNTER/app/lib/claude.ts`
- `80_PRODUCTOS/LEAD_HUNTER/app/lib/unipile.ts`
- `80_PRODUCTOS/LEAD_HUNTER/app/lib/types.ts`
- `80_PRODUCTOS/LEAD_HUNTER/app/components/BusquedaView.tsx`

## Archivos permitidos

- `80_PRODUCTOS/LEAD_HUNTER/app/app/**`
- `80_PRODUCTOS/LEAD_HUNTER/app/components/**`
- `80_PRODUCTOS/LEAD_HUNTER/app/lib/**`
- `80_PRODUCTOS/LEAD_HUNTER/app/scripts/**` para una prueba local no destructiva.
- Esta tarea y un resultado nuevo bajo `30_RESULTADOS/`.

## Rutas excluidas por defecto

- V1, excepto consulta puntual en lectura si una discrepancia lo exige.
- Variables `.env*`, secretos, datos persistidos y datos de leads reales.
- Flujos n8n, endpoints de contacto y despliegue VPS.
- Cualquier archivo ajeno a LeadHunter.

## Limites y presupuesto

- No contactar prospectos, no enviar invitaciones, mensajes, seguimientos ni recordatorios.
- No activar workflows n8n ni endpoints de contacto.
- No publicar, desplegar, gastar ni cambiar credenciales.
- La extraccion solo ocurre despues de revision humana explicita del ICP y de los filtros.
- Limite inicial recomendado para la prueba: 5 perfiles; aumentar solo con aprobacion expresa de
  Santiago y Juanca durante la sesion.
- No registrar el contenido de los MD ni PII de los perfiles en Git.

## Entregable

1. Flujo de carga de los dos MD con validacion de tipo y tamano.
2. Borrador de ICP estructurado y editable antes de buscar.
3. Filtros de LinkedIn preparados para Peru con ubicacion catalogada.
4. Evidencia de una prueba local y una guia de la sesion de las 14:00.

## Criterio de terminado

- Dos MD de prueba se procesan sin exponer su contenido al cliente ni persistirlos en Git.
- El ICP estructurado se puede revisar y editar antes de iniciar una busqueda.
- Peru se resuelve desde el catalogo de LinkedIn y queda visible antes de la ejecucion.
- Una extraccion de prueba se inicia solo por accion humana y no contacta a ningun lead.
- Se ejecutan build y pruebas pertinentes o se registran con evidencia los bloqueos.
- El resultado, limites y proximo responsable quedan en `30_RESULTADOS/`.

## Dependencias

- Juanca entrega los dos MD antes de la sesion.
- Santiago y Juanca validan el ICP normalizado y confirman el limite de perfiles antes de la
  extraccion real.

## Handoff de Claude PRINCIPAL

Claude PRINCIPAL solo analiza los dos MD y entrega un contrato de ICP estructurado, ambiguedades y
casos de prueba. No edita LeadHunter. CODEX PRINCIPAL implementa, revisa e integra los cambios.

## Evidencia de cierre

El cierre usa el formato de `50_SOP/TAREA_Y_HANDOFF.md`. Si no hay evidencia de procesamiento,
ubicacion valida, revision humana y prueba, el estado es `sin evidencia`, no completada.
