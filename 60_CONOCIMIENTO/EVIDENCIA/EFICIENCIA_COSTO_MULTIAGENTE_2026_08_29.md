---
title: "Eficiencia tecnica y de consumo para ORQUESTA y MODOZAINT V2"
tags: [multiagente, eficiencia, contexto, costos, orquestacion, modozaint-v2]
status: active
created: 2026-08-29
---

# Eficiencia tecnica y de consumo para ORQUESTA y MODOZAINT V2

## Alcance

Este informe contrasta contexto minimo, recuperacion dirigida, prompt caching, compactacion,
persistencia de estado, enrutamiento de modelos, evaluaciones, presupuestos y procesamiento por
lotes. Separa hechos observados de recomendaciones. No se edito `C:\DEPARTAMENTO MODOZAINT V2`.

## Conclusion ejecutiva

La configuracion eficiente para el uso diario no es convocar a todos los agentes. Es **un
especialista por defecto, contexto recuperado bajo demanda y escalamiento multiagente solo cuando
existen frentes independientes y el valor esperado justifica el gasto**. La mayor palanca es evitar
llamadas y tokens innecesarios; despues vienen caching, compactacion, enrutamiento de modelos y
Batch. Persistir una conversacion mejora continuidad, pero por si solo no reduce la facturacion de
tokens anteriores.

Para ORQUESTA, el patron recomendado es:

```text
objetivo humano
    -> ORQUESTADOR clasifica complejidad y fija presupuesto
    -> un especialista recibe rutas, no el vault completo
    -> se agregan agentes solo para frentes independientes
    -> cada agente escribe un artefacto y devuelve una referencia corta
    -> ORQUESTADOR valida el estado final contra criterios y metricas
```

## 1. Hechos verificados

### 1.1 Estado local y volumen de contexto

- La foto local de V1 registra 1.340 archivos trackeados, 425 Markdown y tres aplicaciones; tambien
  concluye que V2 aun no debe construirse hasta cerrar el estado de Git. Fuente local:
  `RESEARCH/DIAGNOSTICO_DEPARTAMENTO_MODOZAINT_V2_2026_08_29.md`.
- El arnes ya propuesto para ORQUESTADOR limita su entrada normal a un router corto, el estado
  vigente, su estado de agente, las reglas de modelo y una sola fuente del dominio. Fuente local:
  `RESEARCH/ORQUESTADOR_HARNESS_Y_MODELOS_2026_08_29.md`.

**Lectura del hecho:** leer el vault completo no es una condicion de funcionamiento del sistema y
contradice la arquitectura local ya acordada.

### 1.2 El multiagente tiene un costo alto y un dominio de uso concreto

- En el sistema de investigacion de Anthropic, los agentes consumieron aproximadamente 4 veces los
  tokens de una interaccion de chat y el sistema multiagente aproximadamente 15 veces. La mejora de
  90,2% frente al agente unico aparecio en una evaluacion interna de consultas amplias con frentes
  independientes; la misma fuente advierte que tareas con muchas dependencias o contexto comun no
  son buen ajuste. [Anthropic: multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- Anthropic recomienda empezar por la solucion mas simple y aumentar complejidad solo cuando haya
  una mejora demostrable; workflows predefinidos dan mas predictibilidad y los agentes autonomos
  intercambian costo y latencia por flexibilidad. [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).

**Lectura del hecho:** el modo multiagente debe ser una escalada, no el valor predeterminado.

### 1.3 Contexto minimo y recuperacion dirigida

- Anthropic describe recuperacion *just in time*: mantener identificadores livianos —rutas,
  consultas guardadas y enlaces— y cargar solo lo requerido mediante herramientas. Tambien concluye
  que el objetivo es el conjunto mas pequeno de tokens de alta senal que maximice la probabilidad
  del resultado correcto. [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).
- Para corpora grandes, la recuperacion combina busqueda semantica y coincidencia exacta. En una
  evaluacion de Anthropic, contextualizar los fragmentos redujo en 35% la tasa de fallo de
  recuperacion top-20; combinar embeddings contextuales y BM25 la redujo en 49%. Estos resultados
  son del conjunto evaluado por Anthropic y no una garantia para MODOZAINT.
  [Anthropic: Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval).

**Lectura del hecho:** primero conviene un router y busqueda por rutas/nombres; RAG o embeddings se
justifican despues si una evaluacion local demuestra fallos de recuperacion.

### 1.4 Compactacion, memoria y handoffs

- Para trabajo largo, Anthropic usa tres tecnicas distintas: compactacion, notas estructuradas fuera
  de la ventana y subagentes con contextos enfocados. La compactacion conserva decisiones,
  problemas abiertos y detalles necesarios, pero una compactacion agresiva puede perder contexto
  sutil. [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).
- Anthropic recomienda que el subagente escriba el resultado directamente en un artefacto
  persistente y entregue al coordinador una referencia liviana; esto reduce perdida por el
  "telefono roto" y evita copiar salidas grandes por el historial.
  [Anthropic: multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- OpenAI ofrece compactacion de estado para conversaciones largas; el elemento opaco resultante
  conserva estado previo relevante usando menos tokens. [OpenAI Docs: Compaction](https://developers.openai.com/api/docs/guides/compaction).

**Lectura del hecho:** memoria durable, resumen operativo y transcripcion no son la misma cosa. El
handoff debe transportar estado accionable y referencias, no todo el chat.

### 1.5 Persistir estado no equivale a ahorrar tokens

- `previous_response_id` permite encadenar respuestas y mantener una conversacion, pero OpenAI
  aclara que todos los tokens de entrada anteriores de la cadena siguen facturandose como entrada.
  [OpenAI Docs: Conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

**Lectura del hecho:** la persistencia evita reconstruir estado, pero el ahorro requiere reducir,
cachear o compactar el contexto que llega al modelo. Como regla operativa propuesta, ORQUESTA debe
elegir una sola estrategia de persistencia por conversacion para no reenviar el mismo historial por
dos rutas.

### 1.6 Prompt caching

- El cache reutiliza trabajo solo cuando coincide el prefijo completo. OpenAI indica descuentos de
  hasta 90% para entrada cacheada y caching automatico en modelos compatibles; cambiar el modelo,
  herramientas, su orden, esfuerzo o verbosidad puede romper la coincidencia.
  [OpenAI Docs: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).
- Para GPT-5.6+, el prefijo cacheable minimo es 1.024 tokens. La escritura cuesta 1,25 veces la
  entrada normal y la lectura 0,1 veces: una escritura mas una reutilizacion completa cuesta 1,35
  veces frente a 2 veces sin cache; una escritura y nueve lecturas cuestan 2,15 veces frente a 10.
  [OpenAI Docs: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).

**Lectura del hecho:** se debe poner lo estable primero —identidad, politicas, herramientas y
ejemplos canonicos— y lo variable al final. No conviene escribir al cache prefijos que no se
reutilizaran.

### 1.7 Modelos, esfuerzo y prompts

- La guia vigente de OpenAI asigna GPT-5.6 Sol a trabajo complejo, Terra al equilibrio entre
  capacidad y costo, y Luna a volumen sensible a costo. Recomienda iniciar normalmente en esfuerzo
  `medium`, usar `low` cuando importe latencia y subir a `high` o mas solo si una evaluacion mide una
  ganancia. [OpenAI Docs: Model guidance](https://developers.openai.com/api/docs/guides/latest-model).
- En evaluaciones internas de agentes de codigo reportadas por OpenAI, prompts mas compactos
  mejoraron puntajes aproximadamente 10-15%, redujeron tokens 41-66% y costo 33-67%. OpenAI pide
  tratar estas cifras como direccionales y validarlas en la carga propia.
  [OpenAI Docs: Model guidance](https://developers.openai.com/api/docs/guides/latest-model).
- La guia de costos de OpenAI prioriza tres acciones: reducir solicitudes, minimizar tokens y usar
  el modelo mas pequeno que mantenga la precision requerida.
  [OpenAI Docs: Cost optimization](https://developers.openai.com/api/docs/guides/cost-optimization).

**Lectura del hecho:** el modelo mas grande no debe ser el predeterminado para clasificar,
reescribir, resumir o rutear.

### 1.8 Evaluaciones y Batch

- OpenAI define las evaluaciones como criterios mas datos de prueba y recomienda ejecutar, analizar
  e iterar; una muestra representativa debe incluir entradas y verdad de referencia cuando exista.
  [OpenAI Docs: Working with evals](https://developers.openai.com/api/docs/guides/evals).
- Anthropic empezo su evaluacion multiagente con unas 20 consultas de uso real y evaluo precision,
  citas, cobertura, calidad de fuentes y eficiencia de herramientas; tambien mantiene revision
  humana porque detecta fallos que el evaluador automatico no ve.
  [Anthropic: multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- Para trabajo asincrono, OpenAI Batch ofrece 50% de descuento frente a endpoints sincronos y
  completa cada lote dentro de 24 horas. Sus casos propuestos incluyen evaluaciones, clasificacion,
  embeddings y otros trabajos offline. [OpenAI Docs: Batch API](https://developers.openai.com/api/docs/guides/batch).

**Lectura del hecho:** las optimizaciones solo se aceptan si mantienen calidad; Batch no sirve para
respuestas interactivas del canal.

## 2. Recomendaciones para ORQUESTA

Estas son propuestas, no hechos externos. Los umbrales son una linea base que debe ajustarse con
mediciones reales de Buzz y del proveedor habilitado.

### Presupuesto operativo propuesto

| Clase | Uso | Agentes | Herramientas externas | Modelo/esfuerzo inicial | Puerta de escalada |
|---|---|---:|---:|---|---|
| S0 | ruta, clasificacion, formato, resumen corto | 1 | 0-3 | Luna `low` | solo si falta una fuente |
| S1 | investigacion o plan enfocado | 1 | hasta 8 | Terra `low/medium` | si aparecen dos frentes independientes |
| S2 | comparacion o trabajo cruzado | 2 | hasta 10 por agente | Terra; Sol para sintesis si la eval lo exige | ORQUESTADOR documenta division y presupuesto |
| S3 | decision estrategica de alto valor | 3-4 | presupuesto explicito | Sol `medium/high` selectivo | aprobacion humana si supera el presupuesto |

Reglas transversales propuestas:

- detener cuando se cumpla el criterio de evidencia, no cuando se agote la curiosidad;
- un reintento del mismo fallo; despues cambiar herramienta, fuente o declarar bloqueo;
- no activar dos agentes con el mismo objetivo y las mismas fuentes;
- una sola respuesta humana final, salvo que se pidan voces independientes;
- registrar tokens, costo, llamadas, reintentos, tiempo y resultado por tarea.

## 3. Cinco cambios aplicables a MODOZAINT V2

### Cambio 1: manifiesto de contexto por tarea

**Propuesta:** ORQUESTADOR entrega a cada agente `objetivo`, `criterio de cierre`, `rutas permitidas`,
`presupuesto` y `salida`. La entrada normal contiene `AGENT_ROUTER.md`, `CURRENT/NOW.md`, el
`STATE.md` del agente y una fuente canonica del dominio. Una lectura global requiere justificacion.

**Prueba de aceptacion:** en 20 tareas representativas, 100% registra las rutas abiertas; al menos
95% usa la fuente canonica correcta; la mediana de tokens de entrada cae al menos 30% frente a una
linea base que carga el contexto amplio, sin reducir la tasa de tareas aprobadas.

### Cambio 2: puerta de complejidad y presupuesto antes de delegar

**Propuesta:** clasificar cada objetivo S0-S3 y empezar con el numero minimo de agentes de la tabla.
Solo paralelizar frentes que no dependan entre si. El presupuesto incluye agentes, llamadas,
reintentos y condicion de parada.

**Prueba de aceptacion:** cero tareas S0 convocan mas de un agente; menos de 5% de llamadas repite
la misma intencion sobre la misma fuente; las tareas que exceden presupuesto muestran autorizacion o
un bloqueo explicito.

### Cambio 3: estado durable y handoff por artefacto

**Propuesta:** cada subagente escribe el entregable en su ruta y devuelve un paquete corto:
`resultado`, `evidencia`, `archivo`, `riesgos`, `pendiente`. `STATE.md` conserva solo objetivo vivo,
decisiones, bloqueos y siguiente paso; la transcripcion queda fuera. Compactar al cerrar una fase o
cuando un umbral de contexto medido lo exija, no en cada turno.

**Prueba de aceptacion:** 100% de handoffs tiene los cinco campos y una ruta valida; una sesion nueva
puede continuar una tarea sin repetir llamadas ya completadas; el resultado reanudado pasa el mismo
criterio de cierre que la ejecucion continua.

### Cambio 4: prefijo estable y telemetria de cache

**Propuesta:** ordenar el prompt como `politicas estables -> herramientas estables -> ejemplos
canonicos -> estado resumido -> tarea variable`. Versionar el prefijo y no reordenar herramientas
entre llamadas equivalentes. Medir `input_tokens`, `cached_tokens`, `cache_write_tokens`, latencia y
costo. Activar breakpoints explicitos solo si el arnes/proveedor de Buzz los soporta.

**Prueba de aceptacion:** en un flujo repetible de al menos 10 llamadas, el cache presenta lecturas
despues del calentamiento y el costo total es menor que la ejecucion equivalente sin cache. Si no
hay reutilizacion o la escritura cuesta mas de lo ahorrado, se desactiva ese breakpoint.

### Cambio 5: router de modelos, eval minima y cola Batch

**Propuesta:** mantener una matriz versionada `tipo de tarea -> modelo -> esfuerzo -> fallback`.
Probar cada cambio con 20 tareas reales: normal, datos incompletos, fuera de rol y fallo de
herramienta. Enviar por Batch, cuando el proveedor lo permita, evaluaciones nocturnas,
clasificaciones masivas, embeddings e informes que no necesiten respuesta inmediata.

**Prueba de aceptacion:** la configuracion mas barata se adopta solo si mantiene la tasa de aprobacion
dentro de 5 puntos porcentuales de la mejor configuracion y no aumenta alucinaciones; el trabajo
Batch tolera hasta 24 horas y nunca bloquea una respuesta interactiva.

## 4. Tablero minimo de medicion

Por tarea se debe registrar:

```text
task_id, clase, agente(s), modelo, esfuerzo,
input_tokens, cached_tokens, cache_write_tokens,
output_tokens, reasoning_tokens, tool_calls, retries,
wall_time, cost, passed, human_interventions
```

Indicadores semanales:

- `costo_por_tarea_aprobada = costo_total / tareas_aprobadas`;
- `cache_hit_tokens = cached_tokens / input_tokens`;
- `llamadas_duplicadas = llamadas_repetidas / tool_calls`;
- mediana y percentil 90 de tokens, llamadas, tiempo y costo por clase;
- tasa de aprobacion y alucinaciones por modelo/esfuerzo;
- porcentaje de tareas que escalaron de S0/S1 a S2/S3 y motivo.

## 5. Riesgos y mitigaciones

| Riesgo | Efecto | Mitigacion |
|---|---|---|
| Multiagente por defecto | costo y ruido de coordinacion | puerta S0-S3; especialista unico por defecto |
| Contexto demasiado recortado | se pierde una decision critica | router canonico, referencias y eval de recuperacion |
| Compactacion agresiva | omite detalles que luego importan | preservar decisiones, evidencia, bloqueos e IDs; conservar artefacto fuente |
| Memoria duplicada o vencida | agentes actuan sobre estados distintos | una fuente por dato, propietario, fecha y version |
| Cache con prefijo inestable | escrituras caras sin lecturas | version estable, telemetria y desactivacion si no hay ahorro neto |
| Modelo pequeno sin eval | menor calidad o mas reintentos | fallback y adopcion solo si pasa la muestra representativa |
| `previous_response_id` como supuesto ahorro | continuidad sin reduccion de factura | medir tokens; combinar con cache o compactacion |
| Batch en tareas interactivas | respuesta tardia | reservarlo a trabajo offline tolerante a 24 horas |
| Metricas no expuestas por Buzz | no se puede demostrar ahorro | instrumentar en el arnes/API; mientras tanto medir llamadas, tiempo y artefactos |

## 6. Decision recomendada

Adoptar primero los cambios 1-3, porque funcionan incluso sin acceso a parametros del proveedor.
Activar caching, router de modelos y Batch solo despues de verificar que el arnes de Buzz expone esas
capacidades y su telemetria. La prueba decisiva no es "usa menos tokens", sino **menor costo por tarea
aprobada sin degradar evidencia, seguridad ni tiempo humano**.

## Fuentes

### Locales

- `RESEARCH/DIAGNOSTICO_DEPARTAMENTO_MODOZAINT_V2_2026_08_29.md`
- `RESEARCH/ORQUESTADOR_HARNESS_Y_MODELOS_2026_08_29.md`

### Primarias externas

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Anthropic: Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
- [OpenAI Docs: Cost optimization](https://developers.openai.com/api/docs/guides/cost-optimization)
- [OpenAI Docs: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [OpenAI Docs: Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)
- [OpenAI Docs: Compaction](https://developers.openai.com/api/docs/guides/compaction)
- [OpenAI Docs: Model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Docs: Working with evals](https://developers.openai.com/api/docs/guides/evals)
- [OpenAI Docs: Batch API](https://developers.openai.com/api/docs/guides/batch)
