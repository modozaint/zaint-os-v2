---
tags: [zaint, sistema, sop, auditoria, migracion]
creado: 2026-08-29
estado: NUEVO — nace en la preparación de MODOZAINT V2, no modifica nada existente
fuente: planes/preparacion-modozaint-v2-2026-08-29.md §4 Ola 3 · _MIGRACION/MODOZAINT_SOP_INVENTORY.md §2.1
---

# Auditar antes de construir

> **Qué responde:** *antes de diseñar o escribir código para un pedido, ¿ya existe total o
> parcialmente en el vault o en el código?*
> **Quién lo usa:** cualquier agente, en cualquier plan, antes de la sección «El trabajo».
> **De dónde sale:** es el proceso de mayor retorno del sistema y **no estaba escrito en ninguna
> parte** — se detectó por repetición, no por nombre de archivo. Cinco planes de agosto lo
> ejecutaron sin tener dónde citarlo.

---

## El resultado que produce

Antes de proponer una sola línea de diseño, el agente entrega una respuesta a esta pregunta,
con evidencia: **¿esto ya existe, y en qué estado?**

Tres respuestas posibles, y las tres son válidas — el SOP no empuja hacia ninguna:

1. **Ya existe y funciona.** El trabajo real es conectar o exponer lo que hay, no reconstruirlo.
2. **Existe a medias.** Hay que decir exactamente qué falta, no rediseñar la parte que ya sirve.
3. **No existe.** Recién aquí se diseña, y se dice explícitamente que se buscó y no apareció.

**La búsqueda cubre tres capas, no una:** el conocimiento (`.md` del vault: planes, specs,
knowledge packs), el código (`_LABS/*`, `.claude/skills/*`), y el sistema vivo (la base de datos,
la tienda, el repositorio remoto) — un documento puede decir que algo está construido y el código
puede no tenerlo, o al revés.

---

## Restricciones

- **No se diseña nada hasta que la búsqueda de las tres capas esté hecha.** Si el pedido es
  urgente, la auditoría igual va primero — es minutos, no horas.
- **El hallazgo se escribe con su evidencia**, no como una afirmación suelta: qué archivo, qué
  línea, qué comando se corrió. Un «ya existe» sin dónde no ahorra la siguiente búsqueda.
- **Si algo existe pero rutea a otro sitio o quedó a medias, se dice así** — no se cuenta como
  «ya existe» ni como «no existe». La migración a medias de los Knowledge Packs (HK migrado,
  Dermatinta y MODOZAINT ruteando a `BRANDS/`) es el ejemplo vigente de este estado intermedio.
- **No se generaliza de un caso.** Que algo no aparezca en la primera búsqueda no basta para
  declarar que no existe — se prueba con más de un término y, si el pedido lo justifica, con
  `grep` además de memoria.

---

## Los cinco casos reales que lo justifican

Todos de agosto de 2026. En los cinco, la auditoría cambió el trabajo — no lo confirmó.

### 1 · El historial del FounderOS (2026-08-23)

**Pedido:** que Santiago pudiera ver los días registrados y navegar el cuarto con un muñequito.
**Lo que apareció al auditar:** `app/historial/` ya tenía 471 líneas en tres archivos, con un
arreglo caro del 18-ago (el historial se arma desde `registros`, nunca desde `dias`, porque un
día con hábitos marcados podía desaparecer si esa fila no existía). **El problema real era de
acceso, no de construcción:** la pantalla no estaba en la barra de navegación.
→ El trabajo se redujo a diez minutos: una pestaña nueva en `app/nav.tsx`.

### 2 · La hoja de rodaje del Content OS (2026-08-26)

**Pedido:** una pantalla para ver el desarrollo completo de una pieza al abrirla.
**Lo que apareció:** ya existía un plan completo y aprobado —
`planes/vista-rodaje-content-os-2026-08-23.md`— con la ruta, el componente, la estructura por
secciones y las tres reglas de la pantalla, **sin ejecutar**.
→ Estuvo a punto de rediseñarse de cero. El plan de carga de piezas remitió a ese documento en
vez de duplicar la decisión.

### 3 · El planner de Converzzo en el Content OS (fecha no registrada individualmente, verificado 2026-08-29)

**Lo que apareció:** las tres rejillas del curso (función / ángulo / rotación) **ya eran columnas
de la base** del Content OS y ya se usaban en el generador de piezas — no había que llevar el
sistema de ideas del curso a código: ya estaba adentro.

### 4 · Las preguntas del guion (verificado 2026-08-29)

**Lo que apareció:** «las tres preguntas antes de escribir un guion» (a qué público · qué es
verdad acá · qué tienes para mostrar) **ya estaban escritas** en `CONTENIDO/PROMPT_CHAT_CONTENIDO.md`
(24 KB). No hacía falta inventar un marco nuevo para el chat de contenido.

### 5 · El motor de la casa del FounderOS (2026-08-26)

**Pedido:** que un muñequito camine por un cuarto isométrico entre los hábitos.
**Lo que apareció:** el motor de habitaciones **ya estaba escrito**, mezclado con el dibujo del
cuarto anterior — no había que construir la navegación isométrica desde cero, solo separarla del
dibujo viejo y añadir la habitación nueva (~95 líneas, según quedó medido en la auditoría del
2026-08-29).

---

## Cómo se aplica — sin coreografía, con el criterio

No hay un PASO 1 → PASO 2. El criterio es uno: **antes de escribir «el trabajo es…», el agente
puede responder de memoria «busqué en X, Y, Z y encontré/no encontré esto»**, con archivo y línea
si aplica. Si no puede responder eso, todavía no auditó.

**Dónde buscar depende del pedido, no de una lista fija** — pero casi siempre incluye: los planes
de `planes/` sobre el mismo tema, el Knowledge Pack o `BRANDS/` de la marca, el código de la app
si el pedido toca una de las tres aplicaciones, y — cuando el pedido afirma un estado («ya está
cargado», «ya se grabó», «ya está en producción») — el sistema vivo correspondiente (ver
`SOP_VERIFICAR_CONTRA_EL_SISTEMA_VIVO.md`, que es el paso que sigue a este).

---

## Qué se desbloquea al tenerlo escrito

Los cinco casos de arriba ahorraron, entre los cinco, más horas que las que costó escribir este
documento. **Es la diferencia entre un sistema que acumula trabajo repetido y uno que lo
reconoce.** Sin este SOP, cada auditoría depende de que quien ejecuta se acuerde de hacerla —
que es exactamente cómo se perdió dos días de trabajo redundante mencionados en
`_USO_LOG.md` (el Content OS diagnosticado como «sin respaldo» sin verificar el subdirectorio
correcto del repo, corregido el 2026-08-23).
