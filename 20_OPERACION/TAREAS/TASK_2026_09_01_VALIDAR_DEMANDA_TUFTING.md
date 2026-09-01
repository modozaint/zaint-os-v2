---
id: TASK_2026_09_01_VALIDAR_DEMANDA_TUFTING
owner: codex-principal
reviewer: santiago
status: pending
class: S2
created: 2026-09-01
updated: 2026-09-01
---

# Validar demanda real de tufting

## Objetivo

Determinar si hay un problema de tufting repetido, concreto y potencialmente pagable a partir de
señales organicas ya existentes, antes de construir una solucion de IA o definir una oferta.

## Alcance

- Inventariar preguntas y solicitudes organicas ya recibidas por House of Kaizen.
- Normalizar cada señal por fecha, fuente disponible, problema y frecuencia.
- Agrupar problemas repetidos y describir la friccion de la solucion actual.
- Identificar la senal de interes o pago existente, sin provocarla mediante contacto nuevo.
- Recomendar una sola hipotesis para una prueba manual posterior, o declarar que no hay evidencia.

## Fuentes minimas

- `00_NORTE/DECISIONES/DECISION_RUTA_ADQUISICION_ZAGENCIA_2026-09-01.md`
- `10_ESTRATEGIA/ARQUITECTURA_OFERTAS_ZAGENCIA.md`
- `60_CONOCIMIENTO/MAPA_ESTRATEGICO_ADQUISICION_ZAGENCIA_2026-09-01.md`
- Registros existentes de House of Kaizen que documenten preguntas o solicitudes, solo cuando sean
  necesarios y en lectura.

## Archivos permitidos

- Este contrato de tarea.
- Un resultado nuevo en `30_RESULTADOS/` con la matriz de señales y la recomendacion.
- Un aprendizaje nuevo en `40_APRENDIZAJE/` solo si el resultado cambia una decision operativa.

## Rutas excluidas por defecto

- Todo V1, salvo consulta puntual en lectura y con justificacion.
- `60_CONOCIMIENTO/MAPA_ESTRATEGICO_ADQUISICION_ZAGENCIA_2026-09-01.md` (mapa original, solo lectura).
- Codigo de producto, paginas de venta, precios, buyer persona final y oferta comercial.
- Cuentas, prospectos, canales externos y herramientas de publicacion.

## Limites y presupuesto

- No contactar prospectos ni enviar mensajes.
- No publicar contenido, formulario o llamada a la accion.
- No gastar dinero ni contratar servicios.
- No usar datos personales de terceros fuera del contexto ya autorizado.
- No construir software ni automatizaciones; la prueba posterior, si se aprueba, sera manual.

## Entregable

Una matriz fechada de señales organicas con problema, frecuencia, fuente, evidencia disponible,
friccion y nivel de confianza; una hipotesis priorizada; y una recomendacion: probar manualmente,
seguir observando o archivar.

## Criterio de terminado

- Cada señal tiene fuente y fecha, o se declara explicitamente como no verificable.
- Se separan hechos, inferencias e hipotesis.
- Se informa si existe o no un problema repetido con señal de demanda.
- El resultado queda guardado en `30_RESULTADOS/`.
- La decision de construir, contactar, publicar, cobrar o fijar oferta queda pendiente de aprobacion.

## Evidencia de cierre

El responsable debe entregar el cierre con el formato de `50_SOP/TAREA_Y_HANDOFF.md`, incluyendo
estado, resultado, archivo de evidencia, commit y siguiente responsable. Sin evidencia, el estado es
`sin evidencia`, no completada.
