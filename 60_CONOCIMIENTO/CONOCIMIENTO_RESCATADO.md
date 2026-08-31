---
tags: [migracion, rescate, conocimiento, portable]
creado: 2026-08-29
fuente: las 30 memorias de `~/.claude/projects/c--DEPARTAMENTO-MODOZAINT/memory/`
copia_literal: `_MIGRACION/rescate/memorias/`
---

# Conocimiento rescatado — lo que solo vivía en la memoria del modelo

> **Qué es esto.** Las 30 memorias de sesión de Claude Code, traducidas a algo que **cualquier
> agente puede leer sin conocer el formato de Claude**. La copia literal está al lado, en
> `memorias/`; esto es la versión portable.
>
> 🔒 **Nada de aquí reemplaza al vault.** Cuando un dato de este documento y uno del vault se
> contradigan, **gana el vault** — y si el vault contradice a un sistema vivo (Shopify, GitHub,
> Supabase, la app), gana el sistema vivo.

## ⚠️ Cómo leer las fechas

**Una memoria dice lo que era verdad el día que se escribió.** Cada afirmación de abajo lleva su
fecha. Las que están marcadas 🕐 **pudieron cambiar y hay que verificarlas antes de usarlas** — casi
siempre son estados de proyecto, cifras y fechas de vencimiento.

Las que no llevan 🕐 son de las que no caducan: cómo es él, cómo trabajar con él, y por qué se
decidió algo.

---

## 1. Quién es Santiago

**Santiago Giraldo.** GitHub `modozaint`. Antioquia, Colombia. **No es programador** y construye
todo dirigiendo a la IA. Trabaja por turnos de 12 horas —varios de noche— y todo lo que produce
sale de lo que sobra de eso.

🕐 *Al 2026-08-03: 178 h/mes en turnos, y de ahí salen ~35 h productivas al mes. Solo ha tenido dos
trabajos, los dos con turnos largos.*

### El patrón central: el último 5 %

**Termina el 95 % difícil y se detiene justo antes del paso trivial que lo vuelve real.** No es
disciplina ni capacidad: es la definición de «terminado».

La evidencia que lo demostró (2026-07-31, toda verificada contra archivos, no impresiones):

- La guía «Los Primeros 7 Días» estaba en HTML desde el 5-jul; **el PDF nunca se generó.** Llegó el
  primer lead real al WhatsApp de Dermatinta y no había nada que mandarle.
- El PDF del Programa de Alianza: HTML corregido el 21-jul, **PDF nunca regenerado.**
- LeadHunter: el flujo de contacto existía con `active: false` → **no se disparaba solo.**
- El módulo de seguimientos, construido y probado, **solo cableado a la ruta de simulación.**

**Y el corolario que lo agrava: no sabe lo que tiene.** Creía que LeadHunter estaba en simulación
cuando eran 3 de 4 módulos en producción con corridas reales. **Su inventario de lo propio es mucho
peor que su capacidad de crearlo**, y por eso siente que no avanza aunque avance.

**Por qué pasa:** construir paga señal inmediata; entregar no paga ninguna. Y lo que no se entrega
no se puede juzgar.

**Qué hacer:**
- **Nada cuenta como terminado hasta que está en manos de alguien o corriendo solo.** Ni «el código
  funciona» ni «el HTML está listo».
- Al planear, que el «hecho» quepa **dentro del mismo bloque de 60-90 min**, que es su unidad real.
- **No medir a diario.** Con 15 turnos al mes, un tracker diario le muestra 15 días en rojo y
  fabrica justo la sensación de fracaso que lo hace saltar de proyecto. Se mide por bloque cerrado.
- Antes de proponerle construir algo, mirar qué ya existe al 95 %. Casi siempre hay algo a un paso.

### De dónde le viene no pedir

Material que él dio en primera persona (2026-08-03). **Son sus escenas, no interpretación.**

- **Se hizo juicioso viendo llorar a su mamá** por las materias perdidas del hermano. Su valor se
  midió por **no causar dolor**, no por logro.
- Papá impulsivo; el error no se corregía, se castigaba. **Y lo minimizó mientras lo contaba** — le
  baja el precio a lo malo igual que a los elogios.
- ⭐ **La escena del cartelito.** De niño no fue a una competencia de bicicross porque no había quién
  lo acompañara y no quería ir solo. Su mamá le hizo a mano el cartel del número; salió a andar por
  el pueblo con él; otro niño le dijo que era feo. Le dolió sobre todo **porque su mamá lo había
  hecho con amor**.
- **«Hacerme merecedor de lo que ya merezco»** → cumplió el trato familiar y el trato no pagó. Sigue
  haciendo la tarea mejor esperando que la califiquen. **Ya no hay boletín.**

**La cadena, con frases suyas:** valer por no generar carga → **no pedir** → hacer todo solo → todo
se siente igual → **no sabe qué le gusta** → no puede elegir → «solo he ejecutado y ejecutado».

**Qué hacer:** cuando aparezca un bloqueo suyo, preguntar **«¿a quién no le has pedido?»** antes de
proponerle construir algo. Su salida instintiva siempre es construir una máquina en vez de pedirle a
una persona — y sí tiene gente: Xiomara (su novia), Steven, Víctor, un amigo entrenador.

### Cómo se relaciona con el dinero

🔴 **Corregido por él mismo el 2026-08-13, y esta versión manda:**

> *«Yo sí me atrevo con el dinero, pero estoy buscando crear una relación más saludable y un control
> total de él.»*

Esto **corrige una lectura anterior que era inferencia y estaba sesgando las recomendaciones hacia
precios bajos** («no sabe cobrar», «cobrar para sí mismo no le resulta legítimo»). Los hechos dicen
lo contrario:

- **Gastó casi toda una quincena en una noche** para encargar la máquina de tufting, sin
  investigación previa.
- **Pidió un préstamo justo al cumplir un año de antigüedad** en su trabajo — estar estable ahí
  *«era el objetivo principal»* para tener vida crediticia. **Eso es un plan de más de un año, no
  una urgencia.**
- Trabajó márgenes y punto de equilibrio sin incomodidad, y pidió explícitamente un precio *«que
  tenga margen de ganancia para reinversión»*.

**Lo que sí es cierto, y viene de una lección pagada:** cerró su tiendita de mecato porque **le
debían mucho**. No es que no sepa cobrar — **ya perdió plata por vender fiado una vez.**

⚠️ **La lección general, que se repitió dos veces:** se le infirió una **preferencia emocional**
donde había una **limitación práctica**. Pasó con el dinero y pasó con la edición de video.
**Ante una conducta suya, preguntar la causa en vez de deducirla.**

### Qué le gusta de verdad — con evidencia

- **Construir y «arreglar el caos»** (apps, IA). Lo único que describió con entretenimiento:
  *«me entretienen bastante, es la última habilidad que aprendí y me gustaría conocerla mejor»*.
- **Tufting: sí le gusta hacerlo.** Lo que no aguanta es hacerlo después de un turno de 12 h. Su
  escenario ideal declarado: 8 h de tufting + 3 h de computador desde casa.
- **Salir en cámara no es problema:** *«me gusta salir, me desenrollo bien, pero si no salgo
  tampoco… desde que funcionen»*. Le mueve el resultado, no el protagonismo.
- 🔴 **Editar: el freno es CAPACIDAD, no gusto** (corregido por él el 2026-08-14). Sus palabras:
  *«a mí no me da pereza (…) no cumplo con la necesidad para sacar tantos videos como quiero»*.
  **La prueba más dura: se ofreció a editar él los primeros videos** para fijar el estándar.
- **No tiene hobby.** Nada que no produzca.

**Cinco cosas que se le infirieron mal y él corrigió**, todas en una sola conversación:
1. **Sí va al gimnasio.** La pausa era por un tatuaje curando.
2. **Sí muestra** — documenta el proceso desde que encargó la máquina. Lo que no hace es **cerrar**.
3. **Química farmacéutica no quedó pendiente: la cerró él.** Vio que era estabilidad de por vida y
   quiso más. Decisión firme, tomada solo.
4. **El hermano no es su espejo invertido** — lo rechazó explícitamente.
5. **La restricción central es física, no psicológica.**

### El canal personal

Existe un modo aparte para lo suyo, distinto del trabajo. Lo que pidió textual (2026-07-31):
*«no quiero que me des la razón siempre, quiero que me ayudes a entenderme y mirarme como el
observador»*.

**Cómo se acompaña ahí:** pedir la escena concreta antes de aceptar la etiqueta («soy ansioso»,
«siempre me pasa»). Nombrar el patrón aunque incomode, separando lo que él dijo de lo que se está
infiriendo. **No convertirlo en un sistema con checklists ni KPIs** — su patrón conocido es volver
todo un dashboard, y ese es el riesgo específico de este canal. **No es terapia:** ante algo pesado,
decirlo de frente y mencionar ayuda profesional, sin sermón. Y lo personal **no se escribe en el
vault** salvo que él lo pida.

---

## 2. Cómo trabajar con él

### Escribirle simple

**Textual, 2026-08-26:** *«no entiendo bien esas cosas que me dice»* — después de una respuesta con
cinco tablas, nombres de columnas de base de datos y jerga de autenticación.

- **Primero la conclusión en una frase, en sus palabras.** Después, si hace falta, el detalle.
- **Una tabla por respuesta como máximo**, y solo si compara algo que él va a decidir.
- ⭐ **El detalle técnico va al plan, no al chat.** El plan lo lee un agente; el chat lo lee él. Son
  dos públicos distintos, y confundirlos fue lo que produjo la queja.
- Cuando se le levante un riesgo y él lo descarte, **se cierra y no se vuelve a mencionar.**

### El estándar de verificación — «el loop»

Salió de un día (2026-08-02) en que se le afirmaron **tres cosas falsas**, las tres por la misma
causa: **se infirió el estado desde un artefacto en vez de consultarlo donde vive.**

1. **La verdad está en el sistema vivo, no en el archivo.** Repo ≠ servidor · build ≠ desplegado ·
   JSON del repo ≠ el servicio corriendo · documento ≠ producción.
2. **Nada se reporta hecho sin una comprobación que pudiera haber fallado**, y la comprobación va
   con su salida a la vista. Si no se puede correr, se dice — no se infiere.
3. ⭐ **Vacío no es éxito.** Un resultado en cero se investiga hasta encontrar la causa. Tres fallas
   distintas se disfrazaron del mismo mensaje inocuo («no se encontraron perfiles»).
4. **Un solo comando bloqueante por mensaje.** Uno se perdió entre párrafos y costó dos rondas.
5. **«Terminado» = está en manos de alguien, o corriendo solo.**

**El cierre del loop:** cada entrega termina con esa comprobación pegada en la respuesta. Si no se
pudo correr, la entrega se marca **no verificada**, no hecha.

### Preguntar antes de construir

**Sus palabras (2026-08-14):** *«primero organizamos un plan mínimo a ejecutar. O sea, tú me
entrevistas, tú me haces preguntas para lograr el mejor resultado posible.»*

**El orden:** entrevista → plan mínimo → **su visto bueno** → construir.

Falló dos veces el mismo día: se le empezó a construir un Excel sin preguntar (quería entender el
**método**, no recibir la tabla), y se iba a inventar una plantilla desde cero cuando lo que quería
era **adaptar una que ya había pagado y estudiado**.

| Aplica | No aplica |
|---|---|
| Cualquier artefacto nuevo con varias formas posibles | Tareas de una sola forma obvia |
| Cuando existe material previo suyo que podría reusarse | Cuando él ya dio el plan |
| Cuando la decisión cambia el diseño entero | Decisiones reversibles menores |

⭐ **Antes de preguntar, buscar lo que ya existe** — en el vault y en su carpeta de descargas. La
mejor pregunta es la informada, y él suele tener el material.

### Desplegar sin preguntar

**Autorizado el 2026-08-26.** Textual: *«quiero que tú puedas hacer push, que puedas desplegarlo en
vercel y que yo solo sea decirte lo que quiero y tú lo hagas.»*

**Por qué se separó de «publicar»:** desplegar una app suya **lo ven él y un socio detrás de un
login**, y se deshace con un revert en minutos. Sacar contenido a una audiencia no se deshace.

**Las tres condiciones que lo mantienen reversible:**
1. **El build pasa ANTES del push.** Un deploy roto no avisa.
2. **Comprobar que quedó en vivo y pegar la evidencia.** Push ≠ desplegado. La buena es el registro
   de despliegue del proveedor, con su identificador de commit y su estado. **Un código HTTP de la
   URL no prueba que el código nuevo esté arriba**, y un 307 en una ruta con login es correcto.
3. **Decir qué se subió y con qué commit**, para que revertirlo sea una línea.

🔴 **Lo que NO está autorizado:** publicar contenido a una audiencia (redes, la tienda en vivo,
mandar un mensaje a un tercero) y **gastar dinero**.

### Los chats especializados

Decidido el 2026-08-23: **un chat por especialidad, cada uno con nombre y función.**

| Chat | Qué hace |
|---|---|
| **MODOZAINT** | Coordina **y opera**. Aquí sí se ejecuta |
| **MARCOS** | Planea apps, soluciones de IA y proyectos. **No ejecuta** |
| **JUAN** | Analiza video: destila e indexa. **No escribe guiones** |
| **JOSSE** | Lee libros y prepara el club de lectura |
| Contenido | Escribe guiones y piezas, con su propio prompt |

**Por qué:** mezclar funciones impide que ninguna se especialice — cada chat acumula criterio propio
con el uso.

**El flujo de tres pasos** (2026-08-21): **planear** (un plan autocontenido que pueda ejecutar
alguien que no estuvo en la conversación) → **ejecutar** contra ese plan → **revisar** con veredicto.

⭐ **Y el input de Santiago es mínimo por diseño:** llega con la idea hablada o a medias, y
estructurarla es trabajo del que planea. Sus palabras: *«tú te encargas de empezar las bases
perfectas para que ellos ejecuten y no gastar tanto como solo yo escribiendo o hablando»*.
**Preguntar solo lo que cambiaría el plan es parte del oficio.**

### El marcador «MR zaint»

**Empezar el mensaje final de cada turno con `MR zaint`.** Pedido el 2026-08-12.

**Por qué:** es su canario. Si un mensaje de cierre llega sin el marcador, él sabe que se perdió
parte del hilo y que conviene recargar contexto o abrir sesión nueva.

---

## 3. Reglas del proyecto

### Las rectoras

**«No dispersarse. Ejecución sobre teoría. ¿Qué estamos ejecutando esta semana?»** — él mismo
identificó *«demasiadas ideas nuevas»* como su error de enfoque. La regla existe para corregir eso.

**No prometer «modo autónomo 24/7».** No es algo que se pueda cumplir sin que algo lo invoque. La
versión honesta son tareas programadas con alcance y horario explícitos.

**Construir una herramienta solo cuando la tarea se repite por segunda vez.** Mismo criterio para
adoptar algo externo: ¿se puede tomar prestado en vez de construir? ¿se puede adaptar sin romper la
marca? ¿crea palanca real? ¿reduce tiempo de ejecución?

**Las 6 reglas del holding lean** (fijadas 2026-06-29): no duplicar departamentos · un solo núcleo
operativo central que sirve a todas las marcas · las unidades de negocio no tienen equipo propio ·
la marca personal controla la infraestructura compartida · pensar como holding lean, no como varias
empresas separadas · ⭐ **cualquier arquitectura que requiera más de un humano para funcionar queda
rechazada** — tiene que poder operarse con él más agentes.

### Conocimiento maximal, ejecución enfocada

Aclarado el 2026-07-21, y es una distinción que se le aplicó mal una vez:

- **Conocimiento = maximal.** Guardar todo, aunque no se aplique ahora. Es un activo en sí, y **él
  no puede retener tanta información: la IA es su capa de memoria.**
- **Ejecución = enfocada.** La regla de no dispersarse aplica a **qué se construye ahora**, no a qué
  se aprende y se guarda.

### Escribir en el vault, no solo en la memoria

Cuando aparezca información de valor sobre el ecosistema, **escribirla en el vault**, no dejarla
solo en el chat ni en la memoria del modelo. Él pidió (2026-06-29) poder *«acumular mucha
información para investigar a lo largo del tiempo»*, y **la memoria del modelo es invisible para
él** — que es exactamente el problema que este documento existe para resolver.

**Qué va a dónde:** el conocimiento del negocio → al vault. Cómo trabajar con él y dónde vive cada
cosa → a la memoria.

### El patrón de instalar herramientas externas

Instalar una herramienta externa **requiere confirmación explícita por cada una**, aunque ya se haya
aprobado algo parecido antes. Es una protección del entorno, no un capricho: **presentar la
candidata, esperar el sí, instalar.**

---

## 4. Estado de proyectos

> 🕐 **Todo este bloque caduca.** Son estados a una fecha. **Verificar contra el sistema vivo antes
> de usar cualquiera de estos datos.**

| Proyecto | Estado al escribirse | Fecha |
|---|---|---|
| **LeadHunter** | Primer producto **terminado** de la casa. Prospección de punta a punta: extrae, juzga con IA, escribe, conversa y agenda | 2026-08-16 |
| **Nexum** | Video entregado. **El premio no era una venta: era sociedad.** La oferta comercial iba en una llamada posterior | 2026-08-13 |
| **Dermatinta** | Lanzada; fase de pulir. Dos necesidades definidas: estrategia de contenido con tatuadores aliados, y **pasar a producto de marca propia** | 2026-07-20 |
| **Soluciones de IA** | Línea nueva con propósito dual: automatizar lo propio **y** vender a terceros | 2026-07-21 |
| **Adaptógenos** | 🔴 **Decidido NO entrar.** Oportunidad real, timing equivocado | 2026-07-02 |
| **La clínica** | 🟡 **Dormida a propósito**, con gatillo | 2026-07-31 |

### Lo que no caduca de cada uno

**LeadHunter — la lección más cara.** La cuenta de la red social desde la que prospecta **es
infraestructura, no un detalle**: se bloqueó tres veces en diez días. **No fue el volumen** (3-6 al
día contra ~100 semanales de tope): fue la forma. Y **se perdió la única conversación real con cita
agendada** porque borrar leads desde la app no pedía confirmación ni dejaba respaldo, y el volumen
del servidor no tenía copia. Es el bug más caro del sistema.

**Adaptógenos — la cadena de racionalización, que vale para cualquier oportunidad nueva:** *«no es
dispersión porque es comisión»* / *«el cash flow financia lo otro»* / *«el sistema es replicable así
que el costo es bajo»*. **Todas ciertas, y ninguna elimina el costo de tiempo.** La pregunta que
resuelve: *¿el negocio actual ya vendió?* Si no, el timing sigue equivocado.

**La clínica — el candado que no se negocia.** Son datos de salud, y psiquiátricos. **Nunca sale
información de pacientes hacia ninguna herramienta externa, incluida la IA.** Y hay un riesgo
laboral real: si hay cosas bloqueadas y se rodean, el costo posible es el empleo. El camino correcto
es la puerta del frente.
También separa dos cosas que parecen una: **vender una solución ahí** es un frente nuevo; **usar IA
para acelerar su propio trabajo repetitivo** es palanca sobre horas que ya gasta. Solo lo segundo
estaba autorizado.

**Sus cinco metas del año** (revisadas por él el 2026-08-03): los 12 libros del club · tres videos
por semana · entregar Nexum y llegar a clientes de mantenimiento · actividad física constante · el
primer producto propio de tufting vendido al precio que deja margen.
⚠️ **Nexum ocupaba dos de las cinco casillas hasta que él lo corrigió.** La aritmética que gobierna
todo: **~35 h productivas/mes → ~400 h en 12 meses.**

**El club de lectura es su tercera puerta real.** Entró porque ahí está alguien del mundo del
ecommerce al que quiere acceder, y viven en el mismo pueblo sin conocerse. **La trampa es entrar
buscándolo.** La lección que él mismo vivió: la puerta se abre cuando dejas de pedir y empiezas a
aportar.

### Sus finanzas personales

🔴 **Hay DOS escenarios en su app y confundirlos invierte cualquier conclusión.** El vigente es el
segundo: pasó de gastar más de lo que ingresa a tener superávit mensual.

🔒 **Las cifras exactas NO se copian aquí y no salen en nada público** — ni su nómina, ni el
préstamo, ni las deudas. Viven en su app y en la memoria original (`user_pablo_financiero.md`).
Lo único que se dice hacia afuera es relativo: *«gano poco más de un mínimo»*.

---

## 5. Referencias — dónde vive cada cosa

| Qué | Dónde | Nota |
|---|---|---|
| **El vault** | `C:\DEPARTAMENTO MODOZAINT\` | Se entra por `CLAUDE.md` y `05_CURRENT_PRIORITIES.md` |
| **Identidad de marca** | `BRANDS/<MARCA>.md` y los Knowledge Packs | Leer **antes** de producir cualquier pieza |
| **El estándar de planes** | `SISTEMA/ESTANDAR_PROMPTS.md` | v1 del 2026-08-21 |
| **Notion «ZAINT HQ»** | Conector de Notion | 🕐 Anterior al vault. **Consultar como archivo, no como verdad** |
| **La tienda** | Shopify | 🕐 El tema en vivo manda sobre los archivos locales |
| **Repositorios** | GitHub, cuenta `modozaint` | |

### Lo que el estándar de planes corrige, y no es obvio

- **La coreografía «PASO 1 → PASO 2» empeora el trabajo de juicio.**
- **El registro del prompt se contagia a la respuesta:** un prompt que grita produce trabajo
  defensivo.
- **Los ejemplos pesan más que las reglas escritas.**
- ⭐ **Prohibir un error que el modelo no iba a cometer puede empujarlo hacia él.**
- «Piensa paso a paso» y las etiquetas de razonamiento **son fósiles** en modelos que ya razonan.

**Se revisa con cada modelo nuevo, no por calendario:** un prompt es un artefacto por modelo.

### Verificar contra los sistemas vivos

El 2026-06-29 esto importó varias veces: el vault tenía una identidad visual que el sitio real no
usaba, y unos precios calculados a mano que en la tienda eran **el doble**. **Un dato recordado o
documentado puede estar desactualizado; el sistema en vivo es la fuente cuando hay conflicto.**

---

## 6. Qué quedó fuera de este destilado, y por qué

**Las 30 memorias están cubiertas.** Lo que no se trasladó, con su razón:

| Qué | Por qué no entró |
|---|---|
| **Las cifras exactas de sus finanzas personales** | Candado del proyecto: nómina, préstamo y deudas no se copian ni se publican. Están en la copia literal |
| **El nombre y la ubicación de su trabajo** | Mismo candado: no se nombra. Está en la copia literal |
| **Los estados técnicos detallados de LeadHunter y Nexum** | 🕐 Caducan y **ya viven en el vault**, que es su fuente. Duplicarlos aquí crearía una segunda verdad |
| **URLs, precios e identificadores de la tienda** | 🕐 Cambian, y el sistema vivo manda. Se dejó el puntero, no el dato |
| **El inventario de módulos de un curso** | Es material de terceros y vive en su carpeta del vault |
| **Nombres de terceros** (clientes, contactos, gente del club) | Son personas reales; no entran a un documento que puede viajar |

🔑 **Y lo que este documento NO puede reemplazar:** la copia literal de al lado. Si algo de aquí
suena raro o incompleto, **la memoria original está en `memorias/` con su fecha y su sesión.**
