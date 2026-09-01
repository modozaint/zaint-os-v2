---
title: "Arquitectura operativa para el sistema multiagente de MODOZAINT"
tags: [multiagente, orquestacion, arquitectura, handoffs, memoria, decisiones, modozaint-v2]
status: active
created: 2026-08-29
---

# Arquitectura operativa para el sistema multiagente de MODOZAINT

## Veredicto

La arquitectura recomendada es **orquestador-trabajadores con estado por archivos y comunicación por
hilos**. ORQUESTADOR recibe el objetivo humano, abre una tarea canónica, elige el patrón mínimo necesario
y asigna especialistas con un contrato breve. Cada especialista lee una entrada estable y únicamente las
fuentes enlazadas para su tarea; entrega en un archivo propio y devuelve evidencia. ORQUESTADOR integra y
cierra. Esta forma coincide con el patrón orquestador-trabajadores usado por Anthropic y con la recomendación
de Microsoft de usar el nivel de coordinación menos complejo que resuelva el caso. [E2][E3]

Buzz debe transportar asignaciones, preguntas, bloqueos y cierres; el repositorio debe conservar instrucciones,
estado, decisiones y entregables. Una conversación no debe convertirse en una segunda fuente de verdad. La
documentación de decisiones debe vivir junto al trabajo y adoptar una única fuente de verdad para referencia,
auditoría y respuesta operativa. [E4][L1]

## Alcance y método

Este informe cubre jerarquía de carpetas, entrada única por agente, reparto de responsabilidades, handoffs,
memoria y bitácora, ciclo de decisiones, nomenclatura y control de duplicados. La eficiencia económica
detallada —caché, compactación, modelos, presupuestos y batch— corresponde al informe separado de Pollen.

Las secciones **Hechos verificados** y **Recomendación** están separadas. Las afirmaciones verificables llevan
un identificador de fuente; las decisiones propuestas se presentan como diseño para MODOZAINT V2, no como
estado ya implementado.

## Hechos verificados

### Estado local

| Hecho | Evidencia |
|---|---|
| La investigación previa establece que MODOZAINT V2 todavía no debe construirse hasta cerrar el estado de Git de V1; este informe no modifica V2. | [L3] |
| Ya existe una propuesta de contexto mínimo para ORQUESTADOR: router, estado vigente, estado propio y una fuente del dominio; `AGENT_ROUTER.md` debe ser índice, no resumen del vault. | [L2] |
| La propuesta local ya separa entrada, gobierno, estado actual, agentes, decisiones, planes y archivo. | [L3] |
| El log histórico `_USO_LOG.md` de V1 pesa 455.096 bytes y el diagnóstico recomienda un resumen activo pequeño más históricos por periodo. | [L3] |
| Existen rutas absolutas en skills y planes de V1; el diagnóstico recomienda rutas relativas en V2. | [L3] |
| El espacio Buzz exige investigación local primero, resultados en `RESEARCH/`, frontmatter uniforme y no sobrescribir silenciosamente. | [L1] |

### Evidencia externa

| Hecho | Evidencia |
|---|---|
| Codex descubre instrucciones desde el ámbito global hasta el directorio de trabajo; concatena desde raíz hacia abajo y las instrucciones más cercanas prevalecen. Carga como máximo un archivo de instrucciones por directorio y el límite combinado predeterminado es 32 KiB. | [E1] |
| Microsoft distingue orquestación secuencial, concurrente, grupal y por handoff, y recomienda el nivel de complejidad más bajo que cumpla el objetivo. La coordinación multiagente añade latencia, costo y modos de fallo. | [E2] |
| Anthropic usa un patrón orquestador-trabajadores: el agente líder planifica, delega investigaciones independientes y sintetiza. Sus subagentes funcionan como filtros que comprimen hallazgos para el líder. | [E3] |
| Anthropic observó duplicación y vacíos cuando la delegación era vaga; recomienda que cada encargo incluya objetivo, formato de salida, herramientas o fuentes y límites claros. | [E3] |
| AWS define un ADR como contexto, decisión y consecuencias; al aceptarse se vuelve inmutable y un cambio posterior debe crear otro ADR que lo sustituya. Cada ADR debe tener propietario y estado. | [E4] |
| GitHub permite declarar responsables por rutas mediante `CODEOWNERS` y exigir su revisión antes de integrar cambios. | [E5] |
| La documentación oficial de OpenAI recomienda declarar cada instrucción una sola vez, exponer solo las herramientas relevantes y conservar las políticas compactas en un solo lugar. | [E6] |

## Recomendación

### 1. Topología: un plano de control y varios planos de trabajo

ORQUESTADOR debe ser el **plano de control**: interpreta el resultado solicitado, determina si basta un agente,
elige patrón, crea el encargo, vigila bloqueos, solicita revisión y registra el cierre. No debe reemplazar a los
especialistas ni rehacer sus entregables. Esta elección aplica el patrón orquestador-trabajadores y limita la
coordinación abierta a los casos que realmente la necesitan. [E2][E3][L2]

Los especialistas deben ser **planos de trabajo** con oficio estable:

| Agente | Propiedad operativa propuesta | No debe hacer por defecto |
|---|---|---|
| ORQUESTADOR | Intake, routing, contrato de tarea, estado global, integración y cierre | Ejecutar el oficio de todos o convocarlos sin necesidad |
| Honey | Escritura, síntesis, arquitectura de información y preparación de mensajes | Investigación exhaustiva si basta ordenar evidencia ya disponible |
| Pollen | Investigación, contraste, fuentes y recomendaciones basadas en evidencia | Reescribir todo el sistema operativo |
| Fizz | Convertir objetivos en planes, secuencias y entregables ejecutables | Duplicar el control de estado de ORQUESTADOR |
| Codencio | Implementación, pruebas, depuración y revisión de código | Cambiar decisiones de producto o arquitectura sin ADR/aprobación |

La tabla es una recomendación derivada de los roles activos registrados en Buzz y del contrato local de
ORQUESTADOR; debe aprobarse como decisión antes de tratarla como política. [L1][L2]

### 2. Jerarquía de carpetas

La estructura propuesta conserva la arquitectura mínima ya investigada y añade solo los contratos necesarios:

```text
MODOZAINT V2/
|-- AGENTS.md                    # Adaptador corto para Codex; apunta al router
|-- CLAUDE.md                    # Adaptador corto para Claude; apunta al mismo router
|-- 00_START/
|   |-- AGENT_ROUTER.md          # Mapa: tipo de tarea -> agente -> fuentes
|   `-- PROJECT_MAP.md           # Proyecto -> repo/app -> estado -> dueño
|-- GOVERNANCE/
|   |-- SOURCES_OF_TRUTH.md      # Tema -> ruta canónica -> dueño -> revisión
|   |-- OPERATING_RULES.md       # Reglas transversales, una sola vez
|   `-- OWNERSHIP.md             # Quién puede decidir, editar, revisar y aprobar
|-- CURRENT/
|   |-- NOW.md                   # Prioridades vigentes, pequeño y fechado
|   `-- TASKS/                   # Un TASK por trabajo abierto
|-- AGENTS/
|   `-- <NAME>/
|       |-- ENTRY.md             # Misión, límites, entradas y salida
|       `-- STATE.md             # Solo trabajo vivo y bloqueos
|-- FOUNDER/                     # Conocimiento canónico del fundador
|-- BRANDS/                      # Conocimiento canónico por marca
|-- CONTENT/                     # Sistema editorial y activos de conocimiento
|-- APPS/                        # Código, contratos e instrucciones locales
|-- SKILLS/                      # Procedimientos invocables y portables
|-- SOPS/                        # Procesos independientes del modelo
|-- DECISIONS/                   # ADR inmutables y trazables
|-- PLANS/                       # Planes ejecutables aprobados
|-- WORK_LOGS/                   # Evidencia histórica segmentada
`-- ARCHIVE_V1/                  # Histórico fuera de rutas activas
```

Los adaptadores de raíz no deben repetir gobierno ni personalidad: deben indicar el router común, la precedencia
de instrucciones y las comprobaciones obligatorias. Esto aprovecha la carga jerárquica de `AGENTS.md` sin
convertir cada arnés en una copia divergente. [E1][E6][L2]

### 3. Una entrada única por agente

Cada agente tendrá exactamente un `AGENTS/<NAME>/ENTRY.md`. El archivo contendrá únicamente:

1. misión estable;
2. tareas que acepta y rechaza;
3. autoridad y acciones que requieren aprobación;
4. rutas iniciales mínimas;
5. contrato de entrada y salida;
6. criterio de terminado;
7. ruta a su `STATE.md`.

`ENTRY.md` no almacenará estrategia de marca, prioridades, investigaciones ni historial. Esos datos tienen
otros propietarios. Mantener las instrucciones compactas, con cada regla escrita una sola vez, reduce el riesgo
de truncamiento, conflicto y desalineación. [E1][E6]

`00_START/AGENT_ROUTER.md` será la única entrada universal. Debe responder, sin explicar el dominio completo:

| Pregunta | Campo |
|---|---|
| ¿Qué tipo de trabajo es? | `task_type` |
| ¿Quién responde? | `primary_agent` |
| ¿Quién revisa? | `reviewer` |
| ¿Qué debe leer primero? | `minimum_sources` |
| ¿Qué no debe cargar? | `excluded_by_default` |
| ¿Dónde entrega? | `deliverable_pattern` |

La entrada universal y las entradas por agente forman una cadena de punteros, no dos manuales paralelos. [L2]

### 4. Elección explícita del patrón de colaboración

ORQUESTADOR debe escoger el patrón antes de mencionar agentes:

| Situación | Patrón | Regla |
|---|---|---|
| Tarea breve de un solo oficio | Un agente | No convocar al resto |
| Etapas dependientes y conocidas | Secuencial | Cada salida valida la entrada siguiente |
| Líneas independientes | Concurrente | Dividir alcance sin solapamiento y reunir al final |
| Especialidad no identificable al inicio | Handoff | Transferir una vez con motivo y estado |
| Decisión de alto riesgo con perspectivas necesarias | Grupo/revisión | Moderador, turnos y condición de salida |

El chat grupal no debe ser el valor predeterminado: multiplica coordinación y contexto. El paralelismo debe
reservarse para líneas realmente independientes, como esta investigación dividida entre arquitectura y costo.
[E2][E3]

### 5. Contrato de tarea y handoff

Cada trabajo abierto tendrá un archivo `CURRENT/TASKS/TASK_<YYYY_MM_DD>_<SLUG>.md` creado y mantenido por
ORQUESTADOR. La notificación de Buzz incluirá solo el objetivo, el responsable y la ruta al contrato. La fuente
canónica es el archivo, no la copia del mensaje.

Plantilla mínima:

```markdown
---
id: TASK_2026_08_29_EXAMPLE
owner: pollen
reviewer: orquestador
status: in_progress
created: 2026-08-29
updated: 2026-08-29
---

# Resultado esperado

## Fuentes mínimas
- ruta o enlace

## Entregable
- ruta exacta y formato

## Límites
- fuera de alcance, permisos y presupuesto

## Criterio de terminado
- prueba observable

## Evidencia de cierre
- inicialmente vacío

## Siguiente responsable
- nombre y condición de transferencia
```

Un handoff debe transportar `task_id`, resultado esperado, fuentes mínimas, estado ya alcanzado, entregable,
restricciones, criterio de terminado y siguiente responsable. No debe transportar la conversación completa si
un resumen enlazado basta. La evidencia de Anthropic muestra que los encargos vagos causan duplicación y
vacíos; Microsoft reserva el handoff dinámico para casos donde la especialidad emerge durante la ejecución.
[E2][E3]

Para evitar escrituras concurrentes, ORQUESTADOR es el único escritor del archivo `TASK_*`; el especialista
escribe su entregable y comunica estado en el hilo. ORQUESTADOR copia al contrato únicamente el estado útil y
la evidencia de cierre. La matriz de propiedad debe residir en `GOVERNANCE/OWNERSHIP.md`. [E4][E5]

### 6. Memoria y bitácora en cuatro capas

| Capa | Contenido | Regla de retención |
|---|---|---|
| `ENTRY.md` | Identidad, oficio, límites, contrato | Estable; cambia mediante revisión |
| `STATE.md` | Máximo: tareas vivas, bloqueos, próximo paso y punteros | Se elimina lo cerrado en el mismo ciclo |
| Fuentes de dominio | Hechos y políticas canónicas | Propietario y fecha de revisión |
| `WORK_LOGS/` | Evidencia, comandos, resultados y retrospectivas | Segmentado por fecha; fuera del contexto inicial |

La memoria del agente debe guardar punteros y asuntos abiertos, no copias del conocimiento del negocio. Al
cerrar una tarea: una decisión duradera pasa a `DECISIONS/`, el hecho de dominio pasa a su fuente canónica, la
evidencia pasa a `WORK_LOGS/` y el elemento desaparece de `STATE.md`. Esto responde al problema observado de
un log monolítico de 455.096 bytes y al diseño local de estado pequeño. [L2][L3]

### 7. Ciclo de decisiones

Solo una elección significativa, difícil de revertir o que cambie estructura, autoridad, fuente canónica o
interfaz merece un ADR. El ciclo será:

```text
propuesta -> revisión -> accepted | rejected -> implementación -> verificación
                                      |
                                      `-> superseded por un ADR nuevo
```

Nombre: `DECISIONS/ADR_<NNNN>_<SHORT_SLUG>.md`. Campos obligatorios: contexto, opciones consideradas,
decisión, consecuencias, propietario, estado, fecha, evidencia y `supersedes` cuando aplique. Un ADR aceptado
no se reescribe; otro ADR lo sustituye. [E4]

ORQUESTADOR puede proponer y registrar; el dueño humano o de dominio aprueba según `OWNERSHIP.md`. Codencio
no debe implementar una decisión estructural propuesta como si ya estuviera aceptada. Si GitHub aloja el
repositorio, `CODEOWNERS` puede convertir la propiedad documental en solicitud y puerta de revisión. [E5]

### 8. Nomenclatura y metadatos

Se conserva la convención local de mayúsculas y guiones bajos. [L1]

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Entrada estable | Nombre reservado | `AGENT_ROUTER.md`, `ENTRY.md`, `STATE.md`, `NOW.md` |
| Tarea | `TASK_YYYY_MM_DD_SHORT_SLUG.md` | `TASK_2026_08_29_MULTIAGENT_ARCHITECTURE.md` |
| Decisión | `ADR_NNNN_SHORT_SLUG.md` | `ADR_0007_SINGLE_SOURCE_REGISTRY.md` |
| Investigación | `TOPIC_YYYY_MM_DD.md` | `ARQUITECTURA_MULTIAGENTE_2026_08_29.md` |
| Log | `YYYY_MM_DD_AGENT_TASK.md` | `2026_08_29_HONEY_MULTIAGENT_ARCHITECTURE.md` |

Se prohíben nombres como `FINAL_V2`, `NUEVO`, `BUENO` o `ULTIMO`. La vigencia se expresa mediante `status`,
`updated`, `supersedes` y el registro de fuentes. La ruta debe ser relativa al repositorio en todo contrato
portable. Esta regla corrige el riesgo local de rutas absolutas. [L3]

Frontmatter mínimo para conocimiento:

```yaml
---
title: "Título citado"
id: UNIQUE_ID
owner: domain-or-agent
status: active
created: 2026-08-29
updated: 2026-08-29
source_of_truth_for: topic-or-null
supersedes: null
---
```

### 9. Regla contra fuentes duplicadas

`GOVERNANCE/SOURCES_OF_TRUTH.md` será un registro, no otra enciclopedia:

```markdown
| Tema | Ruta canónica | Dueño | Revisión | Sustituye |
|---|---|---|---|---|
| Prioridad actual | CURRENT/NOW.md | ORQUESTADOR | diaria | 05_CURRENT_PRIORITIES.md |
```

Reglas:

1. cada tema mutable tiene una sola ruta canónica y un dueño;
2. los demás documentos enlazan esa ruta y no copian el dato;
3. un archivo nuevo declara si es canónico, evidencia, plan, estado o archivo;
4. una decisión nueva sustituye mediante enlace; no borra la historia;
5. búsquedas iniciales excluyen `ARCHIVE_V1/` y `WORK_LOGS/` salvo petición expresa;
6. una revisión mensual detecta dos archivos que reclamen el mismo `source_of_truth_for`.

La regla sigue la recomendación de una única fuente de verdad y el modelo inmutable/sustituible de ADR; también
evita repetir instrucciones que OpenAI recomienda mantener una sola vez. [E4][E6]

### 10. Protocolo de Buzz

Cada tarea usa un solo hilo. Los mensajes válidos son: asignación con contrato, pregunta que desbloquea,
bloqueo con necesidad explícita, hito que exige acción y cierre con evidencia. El responsable menciona al
delegador únicamente al entregar resultado o bloqueo; las narraciones y reconocimientos vacíos se omiten. Es
una regla operativa propuesta para reducir ruido y conservar cada trabajo bajo un único identificador.

El cierre debe tener esta forma:

```text
@Delegador TASK_ID cerrado.
Entregable: ruta
Verificación: prueba y resultado
Decisión o riesgo restante: enlace o ninguno
Siguiente paso: responsable + acción
```

## Cinco cambios aplicables a MODOZAINT V2

Estos cambios son propuestas; no se ejecutaron en V2.

### Cambio 1 — Crear la cadena de entrada sin duplicación

**Archivos:** adaptadores `AGENTS.md` y `CLAUDE.md`, `00_START/AGENT_ROUTER.md` y
`GOVERNANCE/SOURCES_OF_TRUTH.md`.

**Resultado:** cualquier agente encuentra la entrada universal, su entrada específica y las fuentes mínimas sin
escanear el vault. [E1][E6][L2]

**Prueba de aceptación:** desde la raíz, Codex enumera en orden los archivos de instrucciones cargados; desde
una tarea de Dermatinta, el agente identifica la ruta canónica correcta sin abrir `ARCHIVE_V1/` ni hacer una
búsqueda global. La respuesta lista las rutas efectivamente leídas.

### Cambio 2 — Crear cápsulas operativas de los cinco agentes

**Archivos:** `AGENTS/<NAME>/ENTRY.md` y `STATE.md` para ORQUESTADOR, Honey, Pollen, Fizz y Codencio.

**Resultado:** cada agente conserva un oficio estable y un estado pequeño; el conocimiento de negocio queda en
su dominio. [L2][L3]

**Prueba de aceptación:** tres escenarios por agente: tarea propia, tarea incompleta y tarea fuera de oficio. El
agente entrega, pregunta o enruta correctamente; no inventa hechos ni duplica una fuente.

### Cambio 3 — Implantar contrato de tarea y handoff

**Archivos:** plantilla `SOPS/TASK_HANDOFF.md`, tareas bajo `CURRENT/TASKS/` y propiedad en
`GOVERNANCE/OWNERSHIP.md`.

**Resultado:** toda delegación tiene objetivo, fuentes, entregable, límites, criterio de terminado, evidencia y
siguiente responsable. [E2][E3]

**Prueba de aceptación:** asignar una tarea paralela a Honey y Pollen. Ninguna repite la búsqueda de la otra;
cada una entrega en su ruta; ORQUESTADOR integra con una sola lectura de cada resultado y cierra el `TASK_ID`.

### Cambio 4 — Separar estado vivo de memoria histórica

**Archivos:** `CURRENT/NOW.md`, `AGENTS/*/STATE.md` y `WORK_LOGS/YYYY/MM/`.

**Resultado:** el inicio cotidiano no carga logs históricos; lo cerrado conserva evidencia pero sale del estado
activo. [L2][L3]

**Prueba de aceptación:** cerrar una tarea y reiniciar el agente. El trabajo cerrado no aparece en `STATE.md`,
la evidencia sigue localizable por `TASK_ID` en `WORK_LOGS/` y el agente puede continuar la prioridad vigente
leyendo `NOW.md`.

### Cambio 5 — Adoptar ADR y propiedad por ruta

**Archivos:** `DECISIONS/ADR_0001_*.md`, plantilla ADR, `GOVERNANCE/OWNERSHIP.md` y, si aplica,
`.github/CODEOWNERS`.

**Resultado:** las decisiones estructurales tienen contexto, propietario, consecuencias, estado e historia; los
cambios sensibles reciben revisión del dueño. [E4][E5]

**Prueba de aceptación:** proponer una decisión, aceptarla y luego cambiarla. El primer ADR queda intacto y
marcado `superseded`; el segundo enlaza al primero; una modificación de una ruta protegida solicita revisión
del propietario correspondiente.

## Riesgos y mitigaciones

| Riesgo | Señal | Mitigación | Base |
|---|---|---|---|
| ORQUESTADOR se convierte en cuello de botella | Tareas esperan solo para actualizar estado | Automatizar cambios mecánicos y permitir ejecución directa cuando el routing sea determinista | [E2] |
| Demasiados agentes para tareas simples | Varias respuestas equivalentes en un hilo | Un agente por defecto; paralelizar solo alcances independientes | [E2][E3] |
| Router se vuelve enciclopedia | Crece con explicaciones de cada dominio | Límite de longitud y solo tabla de rutas | [E6][L2] |
| Estado y conocimiento se mezclan | `STATE.md` contiene hechos de marca | Mover hechos a fuente canónica y conservar solo puntero | [L2][L3] |
| Dos fuentes reclaman autoridad | Resultados contradictorios para el mismo tema | Registro `SOURCES_OF_TRUTH.md` y auditoría de `source_of_truth_for` | [E4][L3] |
| Handoff pierde contexto esencial | Especialista pregunta de nuevo o entrega otro formato | Plantilla obligatoria y prueba con tarea incompleta | [E3] |
| Varios agentes editan el mismo archivo | Conflictos o contenido intercalado | Un escritor por archivo y propiedad por ruta | [E5] |
| Historial vuelve a contaminar búsquedas | Agente abre `WORK_LOGS/` o `ARCHIVE_V1/` por defecto | Exclusión explícita en router y acceso solo por `TASK_ID` | [L2][L3] |
| ADR se usa para toda decisión menor | Exceso de documentos sin valor | ADR solo para cambios significativos o difíciles de revertir | [E4] |

## Prueba integral de aceptación

La arquitectura está lista para adopción cuando una evaluación en frío demuestre, con logs:

1. **Routing:** cinco solicitudes representativas llegan al agente correcto sin convocar a los cinco.
2. **Contexto:** cada agente declara rutas leídas y ninguna ejecución normal abre el árbol completo.
3. **Handoff:** un trabajo secuencial y otro concurrente cumplen el contrato sin repetición ni huecos.
4. **Persistencia:** una sesión nueva reconstruye objetivo, bloqueo y próximo paso desde `NOW.md`, `TASK_*` y
   `STATE.md`, sin releer el hilo completo.
5. **Gobierno:** una decisión sustituida conserva trazabilidad y una fuente duplicada es detectada antes de
   integrar cambios.

Los criterios son verificables mediante las rutas y patrones de orquestación descritos arriba. [E1][E2][E3][E4]

## Secuencia sugerida de implantación

1. Aprobar el modelo operativo y el dueño de cada dominio.
2. Crear router y registro de fuentes, todavía como esqueletos.
3. Crear las cinco cápsulas `ENTRY.md`/`STATE.md`.
4. Pilotar la plantilla de tarea con un caso simple, uno secuencial y uno paralelo.
5. Añadir ADR y propiedad por ruta.
6. Ejecutar la prueba integral y corregir solo fallos observados.
7. Migrar conocimiento por dominio; no copiar el vault completo de una vez.

Esta secuencia mantiene V1 recuperable y respeta la puerta local que impide construir V2 antes de cerrar el
estado pendiente de V1. [L3]

## Fuentes

### Locales

- **[L1]** `C:\Users\Zaint}\.buzz\AGENTS.md`, secciones “Directory Layout”, “Knowledge File
  Conventions” y “Core Guidelines”.
- **[L2]** `C:\Users\Zaint}\.buzz\RESEARCH\ORQUESTADOR_HARNESS_Y_MODELOS_2026_08_29.md`,
  secciones “Instrucciones base”, “Paquete de contexto mínimo” y “Prueba antes de fijar cada modelo”.
- **[L3]** `C:\Users\Zaint}\.buzz\RESEARCH\DIAGNOSTICO_DEPARTAMENTO_MODOZAINT_V2_2026_08_29.md`,
  secciones 6–10.

### Oficiales

- **[E1]** OpenAI, [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- **[E2]** Microsoft Azure Architecture Center, [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns).
- **[E3]** Anthropic Engineering, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- **[E4]** AWS Prescriptive Guidance, [Architectural decision record process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html).
- **[E5]** GitHub Docs, [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
- **[E6]** OpenAI, [Model guidance: favor leaner prompts](https://developers.openai.com/api/docs/guides/latest-model#favor-leaner-prompts).
