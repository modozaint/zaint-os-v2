---
tags: [modozaint-v2, agentes, interfaces, modelos, matriz]
updated: 2026-09-01
tipo: matriz
---

# Matriz de interfaces y modelos — los 9 chats

> Un bloque por chat, no una tabla de 13 columnas — no cabía legible. **No inventa modelos ni
> disponibilidad:** donde no hay confirmación, dice "candidato, verificar en el selector" igual que
> `MODELOS.md` y `REGISTRO_OPERATIVO.md`, con los que esta matriz no compite — les añade el eje que
> no tenían: **qué chat/plataforma concreta lo activa**, con archivos que puede y no puede tocar.
>
> Parte de la recomendación de Santiago del 2026-08-29 (§CODEX / §CLAUDE CODE). Los agentes citados
> ya existen — su contrato completo está en su propio `00_ENTRAR.md`; aquí no se repite, se acota.

---

## CODEX PRINCIPAL

- **Tipo:** CHAT, activa el AGENTE `ORQUESTADOR`.
- **Responsabilidad:** orquestación, priorización, integración, revisión y cierre de todo lo que
  pasa por V2.
- **Departamento:** Dirección y control (`70_AGENTES/ORQUESTA_DEPARTAMENTOS.md`).
- **Plataforma recomendada:** Codex — ya es la asignación existente en `MODELOS.md` y
  `REGISTRO_OPERATIVO.md`, no una novedad de esta matriz.
- **Modelo recomendado:** OpenAI de alta capacidad para coordinación con herramientas; escala a
  Claude equilibrado o de máxima capacidad para una síntesis o un cierre largo. Candidatos citados
  en `MODELOS.md`: `gpt-5.6-sol` (difícil), `gpt-5.6-terra` (corto). **No confirmado como disponible
  — verificar en el selector antes de fijarlo.**
- **Fuentes mínimas:** `CLAUDE.md` → `00_NORTE/AGENT_ROUTER.md` → `00_NORTE/FUENTES_CANONICAS.md` →
  `20_OPERACION/AHORA.md` → `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` + `ESTADO.md`.
- **Archivos que puede modificar:** `20_OPERACION/TAREAS/TASK_*.md` (único escritor normal del
  contrato, por `00_NORTE/PROPIEDAD_DE_RUTAS.md`), `20_OPERACION/AHORA.md`,
  `00_NORTE/AGENT_ROUTER.md` al crear o retirar un oficio, su propia carpeta
  `70_AGENTES/ORQUESTADOR/`.
- **Archivos que NO debe tocar:** código de `80_PRODUCTOS/**`, el `00_ENTRAR.md` de otro agente sin
  su dueño, `SOURCE_ROOT/**` (V1) salvo lectura, cualquier archivo de identidad de marca.
- **Entregable:** un encargo cerrado — responsable, entregable, estado, evidencia, siguiente paso —
  con el mensaje de cierre exacto de `50_SOP/TAREA_Y_HANDOFF.md`.
- **Criterio de terminado:** hay archivo o resultado verificable, commit local si aplica, y el
  mensaje de cierre está publicado en el canal que originó la misión.
- **Cuándo debe delegar:** siempre que exista un especialista con oficio más preciso — nunca escribe
  un guion, un caption o una cotización por su cuenta (ver Caso 3 de `ORQUESTADOR/EVALS.md`).
- **Cuándo pide decisión humana:** publicar, gastar, cambiar prioridad estratégica, ampliar la
  autoridad de un agente, o cualquier acción irreversible.

---

## SOFTWARE Y SOLUCIONES IA

- **Tipo:** CHAT nuevo — **sin AGENTE dueño todavía** (hueco real, ver `REGISTRO_CHAT_AGENTES_SKILLS.md` §1).
- **Responsabilidad:** arquitectura, desarrollo, QA, datos, integraciones y release de
  `80_PRODUCTOS/` (Lead Hunter, Content OS, FounderOS) y de la línea Zagencia/Soluciones IA.
- **Departamento:** nuevo — "Producto y Soluciones IA". No existía en
  `70_AGENTES/ORQUESTA_DEPARTAMENTOS.md` porque V1 no construía software directamente; V2 sí, desde
  que `80_PRODUCTOS/` se pobló el 2026-09-01.
- **Plataforma recomendada:** Codex — es quien "mejor cuando hay que inspeccionar el repositorio,
  editar archivos, verificar Git o ejecutar pruebas reproducibles" (`REGISTRO_OPERATIVO.md`).
- **Modelo recomendado:** sin asignación previa en ningún documento existente — **no se inventa
  aquí.** Usar el criterio general de `70_AGENTES/MODELOS.md`: Claude si el trabajo exige contexto
  largo o arquitectura, Codex/ChatGPT si es iteración corta o mecánica.
- **Fuentes mínimas:** `CLAUDE.md` → `00_NORTE/AGENT_ROUTER.md` → `80_PRODUCTOS/README.md` →
  `80_PRODUCTOS/MIGRATION_STATUS.md` → `00_NORTE/DECISIONES/ADR_0001..0003`.
- **Archivos que puede modificar:** código, docs e infra dentro de `80_PRODUCTOS/**` — sin secretos
  reales, sin datos de usuarios, sin desplegar.
- **Archivos que NO debe tocar:** `.env` y credenciales reales, bases vivas, `SOURCE_ROOT/**` salvo
  lectura, la carpeta de cualquier agente de marca (no es su dominio), y no cierra un ADR de
  arquitectura por su cuenta — puede redactar el borrador.
- **Entregable:** código o documentación técnica revisable, con resultado de compilación/lint/test
  registrado tal como hizo `MIGRATION_STATUS.md` (sin inventar que algo "compila" sin correrlo).
- **Criterio de terminado:** el cambio compila o falla de forma explicada, queda commiteado
  localmente, y el estado de migración/producto se actualiza con evidencia.
- **Cuándo debe delegar:** si el trabajo es de negocio (precio, ICP, oferta) lo deriva a Dermatinta,
  Kaizen o Marketing; si es de decisión estratégica, a CLAUDE PRINCIPAL o Santiago.
- **Cuándo pide decisión humana:** antes de cualquier despliegue, antes de cambiar la fuente
  canónica de un producto (pendiente #5 de `MIGRATION_STATUS.md`), antes de tocar una base de datos
  viva, y antes de cerrar un ADR de arquitectura.

---

## OPERACIÓN DIARIA

- **Tipo:** CHAT, activa el AGENTE `Hoy`.
- **Responsabilidad:** tareas, prioridades y seguimiento del día a día — "ver todo, hacer una".
- **Departamento:** Ejecución diaria.
- **Plataforma recomendada:** Codex — coincide con `REGISTRO_OPERATIVO.md` ("Hoy: Codex/ChatGPT").
- **Modelo recomendado:** OpenAI rápido/equilibrado; escala a OpenAI de alta capacidad solo si hay
  conflicto de herramientas (`70_AGENTES/MODELOS.md`).
- **Fuentes mínimas:** `70_AGENTES/HOY/00_ENTRAR.md` + sus fuentes vivas declaradas ahí (turno,
  calendario, capacidad).
- **Archivos que puede modificar:** su propia carpeta `70_AGENTES/HOY/`. Puede redactar el
  *borrador* de una tarea nueva; el contrato formal en `20_OPERACION/TAREAS/TASK_*.md` lo cierra
  ORQUESTADOR (regla de `00_NORTE/PROPIEDAD_DE_RUTAS.md`).
- **Archivos que NO debe tocar:** identidad de marca, código de producto, decisiones de negocio.
- **Entregable:** una sola acción concreta para hoy, con de dónde sale la capacidad.
- **Criterio de terminado:** la acción está escrita, es una sola, y cabe en la capacidad real del
  turno.
- **Cuándo debe delegar:** en cuanto la acción elegida sea de un oficio (guion, cotización, código):
  la nombra y la pasa, no la ejecuta ella misma.
- **Cuándo pide decisión humana:** cuando dos cuentas activas compiten por la misma hora y no hay
  candado que las desempate.

---

## CLAUDE PRINCIPAL

- **Tipo:** CHAT nuevo — sin un único AGENTE existente que lo cubra entero.
- **Responsabilidad:** estrategia, investigación profunda, síntesis de contexto largo y revisión
  extensa — el par de CODEX PRINCIPAL para lo que necesita sostener más contexto, no para
  coordinar tareas del día a día.
- **Departamento:** nuevo — "Estrategia y síntesis", ligado a `10_ESTRATEGIA/` y a los ADR de
  `00_NORTE/DECISIONES/`.
- **Plataforma recomendada:** Claude Code — es "mejor cuando hay que sostener contexto largo,
  sintetizar identidad, investigar una decisión o cerrar una pieza estratégica"
  (`REGISTRO_OPERATIVO.md`).
- **Modelo recomendado:** Claude de máxima capacidad para síntesis o decisión; equilibrado para
  trabajo de rutina. Sin candidato de identificador concreto — verificar disponibilidad real.
- **Fuentes mínimas:** `CLAUDE.md` → `00_NORTE/FUENTES_CANONICAS.md` → `10_ESTRATEGIA/` →
  `00_NORTE/DECISIONES/` → `60_CONOCIMIENTO/` (solo lo que el encargo pida, no todo).
- **Archivos que puede modificar:** borradores en `00_NORTE/DECISIONES/ADR_*.md`, `10_ESTRATEGIA/**`,
  síntesis nuevas en `60_CONOCIMIENTO/**` (sin reescribir lo ya validado sin nota de por qué).
- **Archivos que NO debe tocar:** código de producto, el `ESTADO.md` de un agente de marca (es de
  cada agente), nada que publique.
- **Entregable:** un documento de síntesis o decisión, con sus fuentes citadas y fechadas.
- **Criterio de terminado:** el documento existe, cita evidencia verificable, y no repite lo que ya
  vive en otra fuente canónica.
- **Cuándo debe delegar:** para ejecutar código o correr pruebas, a SOFTWARE Y SOLUCIONES IA; para
  coordinar el reparto de trabajo, a CODEX PRINCIPAL.
- **Cuándo pide decisión humana:** al cerrar un ADR que cambia arquitectura, o al tocar la
  Constitución del Founder / documentos congelados de V1.

---

## MARKETING

- **Tipo:** CHAT, activa el AGENTE `Xiomara`.
- **Responsabilidad:** competencia, buyer persona, posicionamiento y oferta.
- **Departamento:** Audiencia y mercado.
- **Plataforma recomendada:** Claude Code — coincide con `REGISTRO_OPERATIVO.md`.
- **Modelo recomendado:** Claude equilibrado; escala a Claude de máxima capacidad (`MODELOS.md`).
- **Fuentes mínimas:** `70_AGENTES/XIOMARA/00_ENTRAR.md` + su tabla "Lo que sé, y de dónde lo saco".
- **Archivos que puede modificar:** su propia carpeta `70_AGENTES/XIOMARA/`; el público, el ICP y el
  posicionamiento en `SOURCE_ROOT/BRANDS/` o `00_NORTE/DECISIONES/` según corresponda.
- **Archivos que NO debe tocar:** una identidad de marca ya aprobada (paleta, tipografía, logo) — la
  corrige si está mal copiada, no la cambia; no escribe piezas (guion, caption, montaje).
- **Entregable:** brief de audiencia — a quién, por qué le importa, qué hago, qué es de Santiago,
  cómo se mide (formato exacto en su `00_ENTRAR.md` §7).
- **Criterio de terminado:** las dos preguntas (a quién / por qué le importa) responden con
  evidencia, no con una descripción bonita.
- **Cuándo debe delegar:** escribir la pieza es de CONTENIDO; montar es de Juanjo dentro de
  CONTENIDO; operar la marca es de DERMATINTA o HOUSE OF KAIZEN.
- **Cuándo pide decisión humana:** cambiar una identidad aprobada, usar una cifra de finanzas
  personales de Santiago, cualquier gasto.

---

## CONTENIDO

- **Tipo:** CHAT, activa tres AGENTES (`Contenido`, `Copy`, `Juanjo`) y, propuesto en esta auditoría,
  `MODOZAINT` — ver la decisión abierta en `REGISTRO_CHAT_AGENTES_SKILLS.md` §6.
- **Responsabilidad:** yapping, guiones, storytelling, formatos y calendario — de la idea a la pieza
  lista para publicar.
- **Departamento:** Sistema editorial, con Mensaje comercial (Copy) y Producción audiovisual
  (Juanjo) operando dentro del mismo chat.
- **Plataforma recomendada:** Claude Code para los tres — coincide con `REGISTRO_OPERATIVO.md`.
- **Modelo recomendado:** Claude equilibrado para Contenido y Juanjo; ChatGPT/OpenAI para Copy en
  iteración corta, Claude si exige voz de marca extensa (`MODELOS.md`).
- **Fuentes mínimas:** `70_AGENTES/CONTENIDO/00_ENTRAR.md`, `70_AGENTES/COPY/00_ENTRAR.md`,
  `70_AGENTES/JUANJO/00_ENTRAR.md` — se abre solo el que corresponde al encargo, no los tres.
- **Archivos que puede modificar:** el módulo 08 del pack de la marca (vía `SOURCE_ROOT`, ver el
  hallazgo de §1 del registro) y `CONTENIDO/MANUAL_EDICION.md` para Juanjo.
- **Archivos que NO debe tocar:** identidad de marca (solo la lee), quién es el público (es de
  MARKETING), publicar nada.
- **Entregable:** hook + guion con timing, o las 4 versiones de caption, o el plan de montaje —
  formato exacto en el §7 de cada `00_ENTRAR.md`.
- **Criterio de terminado:** el guion tiene un hecho propio adentro; el caption completa el video, no
  lo repite; el montaje especifica el segundo exacto de cada corte.
- **Cuándo debe delegar:** a quién le habla es de MARKETING; operar la marca es del agente de esa
  marca; el video en sí (grabar/editar de verdad) es una herramienta, no un oficio de este chat.
- **Cuándo pide decisión humana:** publicar, cualquier cifra de Santiago sin verificar.

---

## DERMATINTA

- **Tipo:** CHAT, activa el AGENTE `Dermatinta`.
- **Responsabilidad:** producto, mercado, marca y validación comercial de Dermatinta de punta a
  punta.
- **Departamento:** Laboratorio Dermatinta.
- **Plataforma recomendada:** Claude Code.
- **Modelo recomendado:** Claude para síntesis de marca, política y cierre largo; ChatGPT para
  bitácora y estado (`MODELOS.md`).
- **Fuentes mínimas:** `70_AGENTES/DERMATINTA/00_ENTRAR.md` completo — ya trae sus 3 candados y su
  tabla de fuentes.
- **Archivos que puede modificar:** su propia carpeta `70_AGENTES/DERMATINTA/`; contenido y
  decisiones operativas de la tienda dentro de sus 3 candados.
- **Archivos que NO debe tocar:** inventario real de Shopify sin verificarlo en vivo, ninguna cifra
  de negocio sin fuente, y no toca `80_PRODUCTOS/CONTENT_OS` como código — lo usa como servicio.
- **Entregable:** el que su propio `00_ENTRAR.md` fije para el encargo (cotización, pieza, estado).
- **Criterio de terminado:** el definido en su contrato — no se repite aquí para no crear una
  segunda versión que se desactualice.
- **Cuándo debe delegar:** guion a CONTENIDO, público a MARKETING, código de producto a SOFTWARE Y
  SOLUCIONES IA.
- **Cuándo pide decisión humana:** publicar, gastar, y el Kit de Dermatinta (33 sobre 22 físicas,
  pendiente #4 de `00_NORTE/DECISIONES/DECISIONES_PENDIENTES.md`).

---

## HOUSE OF KAIZEN

- **Tipo:** CHAT, activa el AGENTE `Kaizen`.
- **Responsabilidad:** tufting, infoproductos, materiales y comunidad del taller.
- **Departamento:** Laboratorio Kaizen.
- **Plataforma recomendada:** Claude Code.
- **Modelo recomendado:** Claude para costeo explicado y síntesis de precedentes; ChatGPT para
  formatear una cotización ya calculada (`MODELOS.md`).
- **Fuentes mínimas:** `70_AGENTES/KAIZEN/00_ENTRAR.md` completo.
- **Archivos que puede modificar:** su propia carpeta `70_AGENTES/KAIZEN/`.
- **Archivos que NO debe tocar:** no despierta LUUMUS, no entrega un precio suelto sin poder
  explicarlo, no gasta.
- **Entregable:** el que fije su `00_ENTRAR.md` — nunca un precio sin desglose.
- **Criterio de terminado:** el cliente podría repetir por qué cuesta lo que cuesta.
- **Cuándo debe delegar:** guion a CONTENIDO, público a MARKETING, código a SOFTWARE Y SOLUCIONES IA.
- **Cuándo pide decisión humana:** publicar, gastar, reactivar LUUMUS.

---

## CONOCIMIENTO

- **Tipo:** CHAT, activa el AGENTE `Video`, con su alcance **extendido** más allá de lo que su
  `00_ENTRAR.md` cubre hoy.
- **Responsabilidad:** cursos, libros, audiolibros, transcripciones y extracción de aprendizajes.
  `Video` solo tiene escrito el método para video (link → transcripción con `watch` → destilado);
  la extensión a libros y audiolibros **no está en su contrato todavía** — se declara aquí como
  encargo abierto, no como capacidad ya probada.
- **Departamento:** Inteligencia externa.
- **Plataforma recomendada:** Claude Code — "mejor para sostener contexto largo" en transcripciones.
- **Modelo recomendado:** Claude equilibrado para transcripción y síntesis; modelo de máxima
  capacidad solo si cruza varias fuentes (`REGISTRO_OPERATIVO.md`).
- **Fuentes mínimas:** `70_AGENTES/VIDEO/00_ENTRAR.md` + `SOURCE_ROOT/VIDEOTECA/README.md` (el
  schema del destilado vive en V1 — ver el hallazgo de §1 del registro).
- **Archivos que puede modificar:** un destilado nuevo en `SOURCE_ROOT/VIDEOTECA/` (V1, mientras no
  se migre), o donde Santiago decida que viva la versión V2.
- **Archivos que NO debe tocar:** no convierte una opinión citada en cámara en dato certificado; no
  infla un destilado si el video no cambia nada de lo ya escrito.
- **Entregable:** un destilado con fuente, fecha, afirmación y aplicación — máximo 3 acciones,
  siempre con marca de tiempo si es video.
- **Criterio de terminado:** cada afirmación señala su minuto (si es video) o su página/capítulo (si
  es libro — método por confirmar), y dice si cambia algo ya escrito.
- **Cuándo debe delegar:** si el destilado revela una prioridad nueva, la sube al tablero, no la
  ejecuta él mismo.
- **Cuándo pide decisión humana:** antes de fijar el método para libros/audiolibros como parte
  oficial del contrato de Video — hoy es una extensión propuesta, no aprobada.
