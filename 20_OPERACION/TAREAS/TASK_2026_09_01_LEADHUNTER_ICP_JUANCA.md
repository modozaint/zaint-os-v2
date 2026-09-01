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
estructurado y revisable, ejecutar una extraccion manual de prueba en Peru y, despues de revision
humana, enviar exactamente tres solicitudes de conexion personalizadas desde la cuenta actual.

## Alcance

- Aceptar hasta dos archivos `.md` locales y leerlos solo en el servidor.
- Extraer un borrador estructurado de ICP: problema, sector, tipo de empresa, cargos, seniority,
  industrias, palabras clave, inclusiones, exclusiones y ubicacion.
- Mostrar el borrador para revision humana y permitir corregirlo antes de buscar.
- Resolver y mostrar una ubicacion de LinkedIn valida para Peru antes de ejecutar la extraccion.
- Permitir una unica extraccion manual acotada, con los filtros aprobados.
- Enviar individualmente hasta tres solicitudes de conexion, cada una con su nota personalizada
  revisada, solo durante la sesion del 2026-09-01 mientras Unipile siga disponible.

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
- Flujos n8n, endpoints de contacto automatico y despliegue VPS.
- Cualquier archivo ajeno a LeadHunter.

## Limites y presupuesto

- Se autorizan exactamente tres solicitudes de conexion de LinkedIn, enviadas de una en una desde
  `api/contactar/real`, despues de que Santiago y Juanca aprueben los perfiles y cada nota.
- No enviar mensajes posteriores, seguimientos ni recordatorios.
- No activar workflows n8n ni endpoints de contacto automatico.
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
5. Registro verificable de las tres solicitudes enviadas o de cada bloqueo que impida enviarlas.

## Criterio de terminado

- Dos MD de prueba se procesan sin exponer su contenido al cliente ni persistirlos en Git.
- El ICP estructurado se puede revisar y editar antes de iniciar una busqueda.
- Peru se resuelve desde el catalogo de LinkedIn y queda visible antes de la ejecucion.
- Una extraccion de prueba se inicia solo por accion humana.
- Cada solicitud individual exige nota personalizada, aprobacion humana y respuesta exitosa de
  Unipile; una nota ausente o un error bloquean el envio de ese perfil.
- Se ejecutan build y pruebas pertinentes o se registran con evidencia los bloqueos.
- El resultado, limites y proximo responsable quedan en `30_RESULTADOS/`.

## Dependencias

- Juanca entrega los dos MD antes de la sesion.
- Santiago y Juanca validan el ICP normalizado, los tres perfiles y sus tres notas antes de cada
  envio real.

## Handoff de Claude PRINCIPAL

Claude PRINCIPAL solo analiza los dos MD y entrega un contrato de ICP estructurado, ambiguedades y
casos de prueba. No edita LeadHunter. CODEX PRINCIPAL implementa, revisa e integra los cambios.

## Evidencia de cierre

El cierre usa el formato de `50_SOP/TAREA_Y_HANDOFF.md`. Si no hay evidencia de procesamiento,
ubicacion valida, revision humana y prueba, el estado es `sin evidencia`, no completada.
