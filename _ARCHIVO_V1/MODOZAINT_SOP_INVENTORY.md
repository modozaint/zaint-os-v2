---
tags: [migracion, sop, procesos]
creado: 2026-08-29
estado: inventario — no se formalizó ni automatizó nada
---

# INVENTARIO DE SOPs

> Cuatro categorías: **SOP EXISTENTE** (ya documentado) · **POTENTIAL SOP** (se repite, no está
> escrito) · **SKILL CANDIDATE** (capacidad reutilizable) · **AUTOMATION CANDIDATE** (repetitivo y
> determinista).
>
> **Nada se ha automatizado ni formalizado.** Esto es un hallazgo, no una implementación.

---

## 1 · SOP EXISTENTE

### 1.1 ⭐ Escribir un plan que otro agente ejecuta
**`SISTEMA/ESTANDAR_PROMPTS.md`**

Input: una idea hablada. Output: un plan de 8 secciones en `planes/`.

Lo que lo hace bueno y no obvio: la coreografía `PASO 1 → PASO 2` **empeora** el trabajo de juicio ·
el registro del prompt se contagia a la respuesta · los ejemplos pesan más que las reglas · los topes
numéricos matan de hambre el razonamiento.

**Criterio de calidad:** *alguien que no estuvo en la conversación puede ejecutarlo sin preguntar.*

→ **KEEP tal cual. Es el SOP más portable del sistema: no depende de Claude.**

### 1.2 El flujo de tres pasos
**MARCOS planea (Opus) → un ejecutor construye → un revisor verifica.**

El revisor tiene contrato: puede verificar corriendo y cazar lo que falló en silencio; **no puede**
ampliar el alcance, rediseñar decisiones ya tomadas ni **cambiar el criterio para que pase**.

⚠️ **Observación de uso real:** el revisor casi no se ha usado. El control efectivo ha sido **pegar
la salida de los criterios de aceptación** — eso sí atrapó errores (el 33 vs 30 de las piezas).

→ **KEEP, con una corrección honesta: el control es el criterio, no el revisor.**

### 1.3 Analizar un video
Skill `video` → `watch` → destilado en `VIDEOTECA/` + índice. Ver §G.3 del mapa.
→ **KEEP**

### 1.4 Operar una tienda según su fase
`SISTEMA/OPERACION_ECOMMERCE.md` — la rutina depende de la fase (sin tráfico / sin ventas / con
ventas), no del día.
→ **KEEP**

### 1.5 Cómo se trabaja: cuentas, estados y candados
`SISTEMA/MODELO_OPERATIVO.md` — 🟢 ACTIVA / 🟡 MANTENIMIENTO / ⚪ DORMIDA, capacidad, foco, y
**«entregado = publicado»**. Todo trabajo entra con un brief de 4 líneas.
→ **KEEP**

### 1.6 Cerrar el día · cerrar la semana
Skills `cierre` y `weekly`. La segunda **llega hecha y no pregunta nada**.
→ **KEEP** — ⚠️ `cierre` depende de Notion, cuyo rol está en disputa

### 1.7 Publicar el FounderOS
`publicar.sh`. Con su trampa documentada: **Vercel bloquea los commits de otro autor y un deploy
bloqueado no falla ni avisa.**
→ **KEEP**

### 1.8 Registrar un aprendizaje
Skill `learn` → módulo 08 del pack, en la misma sesión.
→ **KEEP** — ⚠️ se cumple desigual

---

## 2 · POTENTIAL SOP — se repite y no está escrito

### 2.1 ⭐⭐ Auditar antes de construir
**El de mayor retorno de todos, y no está formalizado en ninguna parte.**

Todos los planes de agosto tienen una sección «Lo que ya existe, verificado». **Y en la mitad de los
casos el hallazgo cambió el trabajo:**

| Caso | Lo que se descubrió |
|---|---|
| El historial del FounderOS | Ya estaba construido; **faltaba la pestaña para llegar** |
| La ficha de rodaje | Ya estaba planeada desde el 23-ago; casi se rediseña de cero |
| El planner de Converzzo | **Ya estaba adentro** de la base del Content OS |
| Las preguntas del guion | **Ya estaban escritas** en el prompt del chat de contenido |
| El motor de la casa | Ya escrito, solo mezclado con el dibujo del cuarto |

**El proceso observado:** pedido → buscar en el vault y en el código si ya existe → verificar contra
el sistema vivo → **recién entonces** diseñar.

→ **POTENTIAL SOP · máxima prioridad.** Hoy depende de que alguien se acuerde.

### 2.2 ⭐ Verificar un dato antes de escribirlo, y corregirlo en todo el vault si es falso
El error #1 registrado del sistema. Casos reales:

- El **4,7/5 fabricado** de Dermatinta → hubo que borrarlo de la tienda y de 7 documentos
- *«El Content OS sigue sin commit ni push»* → **falso en las tres cosas**
- *«Septiembre está sin cargar, 0 de 30 días»* → **falso: se leyó con la clave pública y RLS lo escondía**
- Un molde de contenido que afirmaba en 3 sitios que había material grabado que **no existía**

**El patrón:** el dato falso es *coherente consigo mismo*, por eso no se detecta leyendo — **solo
preguntándole al sistema vivo.**

→ **POTENTIAL SOP · máxima prioridad.** Existe como protección P1, pero **sin procedimiento**

### 2.3 El cuadro de turnos del mes
Llega un PDF (o una foto) → leer alineando columnas por posición → mapear turnos a días → **deducir
los posturnos, que el cuadro no marca** → verificar contra los tres totales que el propio cuadro
calcula → escribir el mes → cargar en la app.

**Se repite todos los meses.** Agosto se dictó de memoria y falló dos veces; septiembre se leyó del
PDF y cuadró exacto.

→ **POTENTIAL SOP + AUTOMATION CANDIDATE.** Ya pedido por Santiago como botón (26-ago)

### 2.4 Video → destilado → adopción → pieza
El destilado funciona (31 archivos). **El eslabón que se pierde es «adoptar»**: llevar lo aprendido
al módulo 08 o a las prioridades.
→ **POTENTIAL SOP** — falta el paso de cierre

### 2.5 Nombrar un chat especializado y darle prompt propio
MODOZAINT, JUAN, MARCOS, el chat de contenido. Patrón claro: nombre + oficio + prompt en el vault +
memoria actualizada. **Sin plantilla.**
→ **POTENTIAL SOP**

### 2.6 Cargar contenido masivo a una app
Leer las fuentes → mapear al esquema real (no a uno inventado) → **script re-corrible que no
duplique** → verificar con conteos → **advertir que sobreescribe ediciones manuales**.
→ **POTENTIAL SOP** — ya ejecutado bien una vez

### 2.7 Cerrar una sesión
Actualizar prioridades + línea en `_USO_LOG` con la fricción real + aprendizaje al módulo 08.
Existe como hábito y como handoff, no como procedimiento.
→ **POTENTIAL SOP**

### 2.8 Decidir si una idea nueva entra
Observado repetidamente: ¿cuántas horas cuesta? ¿de qué cuenta salen? ¿reemplaza o se suma? ¿cómo
sabremos que quedó? Está implícito en el modelo operativo, **sin formato**.
→ **POTENTIAL SOP**

---

## 3 · SKILL CANDIDATE — capacidades reutilizables

| Capacidad | Por qué | Estado |
|---|---|---|
| ⭐ **Auditoría previa** («¿esto ya existe?») | El proceso de mayor retorno (§2.1) | Sin skill |
| ⭐ **Verificar un dato contra el sistema vivo** | El error #1 (§2.2). Debería saber **con qué clave** consultar cada base | Sin skill |
| **Leer un cuadro de turnos** | Se repite cada mes (§2.3) | Sin skill |
| **Generar el prompt del revisor** | Existe el contrato en `ESTANDAR_PROMPTS`, no la skill | Sin skill |
| **Cotizar una pieza de HK** | Fórmula conocida y determinista | Dentro de `/kaizen` |
| **Extraer la miniatura de un video** | Necesario para la landing; YouTube directo, TikTok con navegador | Sin skill |
| **Consolidar documentos duplicados** | Los 8 ICP lo piden a gritos | Sin skill |

---

## 4 · AUTOMATION CANDIDATE — repetitivo y determinista

**No automatizar nada todavía.** Solo señalados.

| Candidato | Por qué califica | Riesgo |
|---|---|---|
| ⭐ **Cargar el cuadro de turnos** | Entrada fija (PDF), salida fija (30 filas), **con verificación matemática incorporada** — los tres totales del propio cuadro | Bajo. Si no cuadran los totales, no carga |
| **Conteo de prohibiciones del vault** | Ya se hizo a mano: 554 en 165 archivos. **El criterio dice que si pasa de 40, el sistema volvió a crecer** | Ninguno. Es un `grep` |
| **Detectar datos sin verificar** | Buscar cifras que aparecen en varios documentos sin fuente | Medio: distinguir dato de ejemplo |
| **Recordatorio de suscripciones** | Unipile ~11-sep · LinkedIn Premium 2-nov · VPS día 30 | Bajo |
| **Actualizar el tablero desde datos reales** | Hoy se escribe a mano y llegó a estar 2 semanas viejo | Medio |
| **Chequeo previo a push** | Buscar secretos y datos personales antes de subir | Bajo. **Ya hay un `.gitignore` que funciona** |

🔴 **Y uno que NO debe automatizarse:** publicar contenido y gastar dinero. Es la protección P4 y
tiene dueño.

---

## Los tres procesos que sostienen el sistema

Si el V2 solo pudiera llevarse tres, serían estos:

1. **Escribir un plan que otro ejecuta** (§1.1) — ya está escrito y es portable
2. **Auditar antes de construir** (§2.1) — no está escrito, y es el que más horas ahorra
3. **Verificar contra el sistema vivo** (§2.2) — existe como protección, falta el procedimiento

**Dos de los tres no están formalizados.** Y son justo los que evitan el trabajo repetido y el dato
falso, que son los dos costos más caros registrados en este sistema.
