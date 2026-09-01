# LeadHunter · Mapa nodo por nodo

> **Para qué:** seguir qué pasa exactamente, en qué orden y en qué archivo, desde que un lead entra hasta que queda una reunión agendada. Sirve para depurar en vivo y para explicarlo en la demo.
> Levantado del código real el **2026-07-31**, actualizado el **2026-08-03**. Si tocas el flujo, actualiza este mapa en el mismo commit.

---

## 0. Dónde corre cada cosa

| Pieza | Dónde vive | Estado |
|---|---|---|
| App (cerebro + CRM + panel) | VPS Hostinger `2.25.92.88`, Docker tras Traefik → **leads.modozaint.online** | 🟢 en producción |
| El reloj | **n8n en el mismo VPS** (Docker), llama a `http://leadhunter:3000` por red interna | 4 flujos en `n8n/` — cuáles están activos solo se ve en el panel del VPS (§1) |
| Búsqueda de personas | **Unipile** (`lib/unipile.ts` → `buscarPersonas`) | 🟢 real desde el 03-08 (antes Apify, que dejó de servir en plan gratuito) |
| Envío/lectura de LinkedIn | **Unipile** (`lib/unipile.ts`) | 🟢 real |
| El cerebro conversacional | **Claude** (`lib/setter.ts`) | 🟢 real |
| La agenda | **Cal.com** (`lib/calcom.ts`) | 🟢 real |
| Datos | volumen Docker `leadhunter_datos` → `/datos` | 🟢 |

> ⚠️ **El `_datos.json` local NO es la producción.** El local tiene 30 leads de Google Maps e Instagram y **cero chats reales de LinkedIn**. Las corridas reales del 28–31 de julio viven en el volumen del VPS. Para ver el estado real hay que mirar allá, no en el repo.

---

## 1. El reloj (n8n)

| Flujo | Archivo | Cada | Llama a |
|---|---|---|---|
| **LeadHunter · Setter (respuestas reales)** | `n8n/leadhunter-setter.json` | 15 min | `POST /api/motor/sync` |
| **LeadHunter · Contacto (cadencia)** | `n8n/leadhunter-contacto.json` | 20 min | `POST /api/motor/contactar` |
| **LeadHunter · Conversación (paso a paso)** | `n8n/leadhunter-conversacion.json` | — | el motor partido en pasos visibles |
| **LeadHunter · Seguimiento (al que no contestó)** | `n8n/leadhunter-seguimiento.json` | — | `POST /api/motor/seguimiento` |
| **LeadHunter · Recordatorio (antes de la reunión)** | `n8n/leadhunter-recordatorio.json` | 15 min | `POST /api/motor/recordatorio` |

Todos autentican con `Authorization: Bearer <CRON_SECRET>` (la puerta la pone `proxy.ts`).

> ⚠️ **Los JSON del repo son plantillas de importación, no el estado del VPS.**
> Traen el token de ejemplo `CAMBIAR_POR_TU_CRON_SECRET` y `active: false` — eso
> es correcto para un archivo versionado (no se commitean secretos). **Qué está
> realmente activo solo se ve en el panel de n8n del VPS**, no acá. Verificado el
> 03-08: los 4 archivos existen; el estado real de cada flujo no se comprobó.

> ✅ Corregido el 03-08: `DEPLOY.md` decía que el flujo de contacto llama a
> `/api/contactar/real` (la ruta de simulación). El correcto es
> `/api/motor/contactar`, que es el que tiene la cadencia, el freno de mano y el
> tope por ciclo.

**Reparto de responsabilidades (a propósito):** n8n solo pregunta "¿toca?". La app decide **a quién y cuándo**, porque la cadencia se configura desde **In the loop → Cadencia** — si viviera en los nodos de n8n, cambiarla sería trabajo de desarrollador y el cliente no podría tocarla.

---

## 1b. De dónde salen los leads (búsqueda)

**Endpoint:** `app/api/search/route.ts`

| # | Nodo | Qué hace | Dónde |
|---|---|---|---|
| S1 | Resolver ubicación | "Colombia" → id interno de LinkedIn (`100876405`). Si no resuelve, busca **sin** filtro geográfico y lo avisa en el log | `resolverUbicacion()` |
| S2 | **Buscar personas** | Búsqueda clásica de LinkedIn vía **Unipile**, paginando de a ~10 con cursor hasta juntar el límite. Trae ya el `provider_id`, así que el contacto no tiene que resolverlo después | `buscarPersonas()` · `lib/unipile.ts` |
| S3 | **¿Persona o empresa?** | Marca los perfiles que son **cuentas de empresa** y no personas | `analizarTipoPerfil()` · `lib/tipo-perfil.ts` |
| S4 | Último post | 1 post por perfil vía Apify. Si falla, sigue igual: el mensaje se adapta y no inventa referencias | `traerUltimosPosts()` |
| S5 | Analizar + redactar | Claude escribe resumen, encaje y **los dos textos del primer contacto**, de a 5 en paralelo | `analizarPerfil()` |

> ✍️ **Dos textos, dos momentos** (desde el 03-08). `notaInvitacion` viaja dentro
> de la solicitud de conexión (**≤280 caracteres**, tope duro de LinkedIn) y su
> único trabajo es que el lead ACEPTE: saludo + una línea concreta de su perfil +
> por qué le escribís. Sin pedir la llamada, que nadie agenda con un desconocido.
> `mensaje` sale recién al aceptar, y está escrito como **continuación**: agradece
> la conexión, retoma lo insinuado y ahí sí desarrolla y pide la llamada.
>
> El prompt prohíbe repetir la nota en el mensaje — recibir dos veces el mismo
> texto es lo que delata al bot. `recortarNota()` es la red de seguridad: si el
> modelo se pasa de 280, corta en el último punto o espacio en vez de dejar que
> Unipile rechace la invitación entera.

> 🔍 **Por qué existe S3.** Buscando "agencia de marketing · Colombia" el 03-08,
> **10 de 15 resultados eran cuentas de empresa** ("3 Studio Agency", "Agencia
> Marketing", "Stv Content"). El generador tenía la orden fija de *"saluda por el
> nombre de pila"*, así que le habría escrito **"Hola Agencia"** a una marca:
> delata al instante que es un bot.
>
> **No se descartan** — detrás de esa cuenta hay una persona y es un lead igual de
> bueno. Lo que cambia es el trato: se saluda a la marca por su nombre y se
> pregunta **con quién se tiene el gusto**. Cuando contesta y se presenta, el
> setter guarda el nombre (`nombreContacto`) y de ahí en más lo trata por él.
>
> La señal es una **pista para el modelo, no un veredicto**: se le pasa junto al
> perfil y él decide. Por eso conviene pecar de marcar empresa — el costo es un
> "¿con quién tengo el gusto?" de más. Probada contra los 15 perfiles reales +
> 2 controles: 17/17.

---

## 2. Camino A — Contacto automático (Módulo 1)

**Endpoint:** `app/api/motor/contactar/route.ts`

| # | Nodo | Qué hace | Dónde |
|---|---|---|---|
| A1 | Candado de ciclo | Si ya hay un ciclo corriendo, devuelve `ciclo-en-curso` y no hace nada. Evita mensajes duplicados | `cicloEnCurso` |
| A2 | ¿Unipile configurado? | Sin credenciales → 400. El sistema nunca "simula" creyendo que envía | `unipileConfigurado()` |
| A3 | **Programar** | A cada lead `nuevos` sin hora le asigna un momento válido, según la cadencia configurada. Default desde el 03-08: máx **6/día**, **lunes a viernes**, **9:00–18:00**, espaciado irregular de **90 a 240 min** *(antes 2/día L-M-V; se subió al pasar la cuenta a Premium)* | `programarContacto()` · `lib/cadencia.ts` |
| A4 | 🛑 **Freno de mano** | Si el usuario no ha aprobado, **NADA sale a LinkedIn**: devuelve el plan de los primeros 5 para revisarlo en la app | `contactoAprobado()` |
| A5 | Cola | Leads `nuevos` + hora cumplida + sin contactar + con perfil de LinkedIn. **Tope duro de 5 por ciclo** (protege la cuenta pase lo que pase) | `TOPE_POR_CICLO` |
| A6 | Resolver identidad | URL `/in/xxx` → `provider_id` interno de LinkedIn | `resolverProviderId()` |
| A7 | **Invitar CON nota** | `POST /users/invite` con `message` = la `notaInvitacion` del lead (≤280). *Corregido el 03-08: este mapa decía que "LinkedIn no permite mensaje en la solicitud" — **es falso**, sí lo permite y el Premium ya estaba pagado sin usarse.* Si LinkedIn rechaza la nota, se reintenta sin ella para no perder el contacto. Si ya son conexión, falla y se ignora: el sync abrirá el chat igual | `enviarInvitacion()` |
| A8 | Mover kanban | `nuevos` → **`contactados`**, guarda `providerId` y `contactadoEn` | `actualizarLead()` |
| A9 | Fallidos → aviso | n8n evalúa `fallidos.length > 0` y dispara el nodo de aviso | flujo n8n |

---

## 3. Camino B — Apertura, setter y agenda (Módulos 2 y 4)

**Endpoint:** `app/api/motor/sync/route.ts` · cada 15 min

### Fase A — detectar quién aceptó y abrir el chat

| # | Nodo | Qué hace |
|---|---|---|
| B1 | Filtrar | Leads con `providerId`, **sin** `chatId`, **conversación vacía**, estado `contactados`, con mensaje listo |
| B2 | 🔒 Candado anti-repetición | La conversación vacía es obligatoria. **El 30-07 un lead que llevaba 16 mensajes negociando la hora recibió el pitch inicial otra vez** — para el lead es obvio que habla con un robot y la reunión se cae |
| B3 | Cortocircuito | Si no hay nada que abrir ni chats activos, **sale sin gastar llamadas** a Unipile/Cal.com |
| B4 | **Abrir chat** | `POST /chats` con el mensaje de apertura. **Si funciona, es que aceptó la invitación** → así se detecta la aceptación sin webhooks. Si falla, se reintenta el próximo ciclo |

### Fase B — conversar y agendar

| # | Nodo | Qué hace |
|---|---|---|
| B5 | Traer disponibilidad | Una sola vez por ciclo, no por lead: horarios reales de Cal.com para proponer días concretos en vez de tirar un link |
| B6 | Leer el chat | `traerMensajes(chatId)` desde Unipile, normalizado y ordenado |
| B7 | ¿Hay algo nuevo? | Si el último mensaje no es del lead o ya se procesó (`ultimoMsgUnipile`), solo sincroniza el hilo para el tablero |
| B8 | ⏳ **Tiempo de lectura** | Si el mensaje del lead tiene menos de **2 a 6 minutos aleatorios** (piso duro de 20 s para ráfagas), se deja para el próximo ciclo. Responder al instante es lo que más delata a un bot |
| B9 | **El setter** | `responderComoSetter()` → Claude con el historial completo + la disponibilidad real. Devuelve: respuesta, datos de cita, y las banderas `agendo` / `descarta` / `posponer` / `escala` |
| B10 | 🔧 Normalizar hora | "3:45" → **15:45**. Si la hora cae bajo el horario de atención y sumarle 12 la deja dentro, era PM. *(Bug real del 30-07)* |
| B11 | 🔧 Normalizar fecha | El modelo inventa el año: mandó `2025-08-04` para el martes 4 de agosto de **2026** y Cal.com respondió *"booking in the past"*. Se compara día/mes contra los cupos reales y se usa el ISO verdadero. *(Bug real del 31-07)* |
| B12 | **Reservar** | `crearReserva()` en Cal.com si hay fecha + hora + correo |
| B13 | Plan B si falla la reserva | Ofrece la hora válida más cercana (los slots van de 15 en 15) enmarcada como "me corrijo", **y nunca descarta la respuesta que el modelo ya había escrito** — el 31-07 el lead preguntó si se pierde la info de sus clientes y esa respuesta desapareció, tapada por el aviso de la hora |
| B14 | **Responder en LinkedIn** | `enviarEnChat()` |
| B15 | Mover kanban | `reunion` si hubo cita · `frio` si descarta · `futuro` si pospone · `respondieron` en otro caso. Guarda la nota del agente y los campos de escalado a humano |

---

## 4. Estados del kanban

```
nuevos ──(A7 invitación)──▶ contactados ──(B4 abre chat + B9 setter)──▶ respondieron
                                                                          │
                                        ┌─────────────────┬───────────────┤
                                        ▼                 ▼               ▼
                                    reunion            futuro           frio
                                  (cita real)     (re-contacto ~45d)  (descartado)
```

---

## 5. ✅ Seguimientos — cerrado el 31-07 (era el hueco)

**Módulo 3 del desafío.** Hasta el 31-07 la maquinaria existía pero solo corría
desde `/api/motor/tick` y `/api/seguimientos`, que son la ruta de SIMULACIÓN: se
redactaba el mensaje, se guardaba en el tablero y **no salía nunca a LinkedIn**.

**Ya no.** El endpoint propio `app/api/motor/seguimiento/route.ts` le escribe de
verdad por LinkedIn a quien aceptó la conexión y se quedó callado, a los días que
diga la cadencia. Trae candado de ciclo (para no mandar el mismo dos veces),
respeta la ventana horaria (un mensaje de trabajo a las 3 a.m. delata al bot) y
tiene dos modos de prueba: `adelantar` (ignora el reloj de días) y `soloRedactar`
(redacta y devuelve sin enviar, para revisar antes).

**Con esto los 4 módulos del desafío corren en real.** El alcance está completo.

Camino: `seguimientosParaEnviar()` arma la cola → `redactarSeguimiento()` escribe
→ `enviarSeguimiento()` manda por Unipile (todo en `lib/motor-pasos.ts`).

---

## 6. Otros cabos sueltos verificados

| Cabo | Detalle |
|---|---|
| Flujos n8n: verificar en el VPS | Los JSON del repo son plantillas (`active: false` + token de ejemplo). **Cuáles corren de verdad hay que mirarlo en el panel de n8n**, no en el repo (§1). Si el de contacto no está activo, el contacto no se dispara solo |
| ~~`DEPLOY.md` desactualizado~~ ✅ | Corregido el 03-08: apuntaba a `/api/contactar/real` en vez de `/api/motor/contactar` |
| La cadencia se cambia en la app, no en n8n | **In the loop → Cadencia** (presets 1/2/3/5/10 + campo numérico, días de la semana, horario). No está en Ajustes, que solo tiene nombre, oferta, link de agenda e idioma |
| El default de cadencia NO migra a producción | `lib/store.ts` solo aplica `CADENCIA_DEFAULT` **si no hay cadencia guardada**. Cambiar el default en código no toca un entorno que ya corrió: hay que cambiarlo en la UI |
| ~~El VPS caduca el 30-08-2026~~ **FALSO** | Verificado contra la API de Hostinger el **31-jul**: KVM 1, plan **mensual con renovación automática ACTIVA**, próximo cobro **30-ago-2026**, ~**$57.900 COP/mes**. **No caduca: se cobra.** Corregir también `DEPLOY.md`, que dice lo mismo mal |
| Riesgo n8n Cloud **resuelto** | El plan viejo temía que el trial de 14 días venciera el 5-ago. Ya no aplica: n8n corre en Docker en el VPS propio |
| Datos en archivo, no en base de datos | `lib/store.ts` sobre `_datos.json` en un volumen. Suficiente para la demo; es lo primero que se cambia si entra volumen real |

---

## 6. Recordatorio de la reunión (añadido 2026-08-04)

**Endpoint:** `app/api/motor/recordatorio/route.ts` · **Lógica:** `lib/motor-pasos.ts`

Por qué existe: `setter.ts` (línea ~263) le ordena al agente decirle al lead que *"le llegará un
recordatorio antes de la llamada"*. Hasta el 04-08 **esa promesa no la cumplía nadie** — no existía
ningún recordatorio en el código. El de Cal.com sí existía, pero con `action: email_host`: le llegaba
a Santiago, no al lead.

| # | Nodo | Qué hace | Dónde |
|---|---|---|---|
| R1 | ¿A quién le toca? | Leads en estado `reunion`, con `citaEn` futura dentro de **2 h**, sin `recordatorioEn` y con LinkedIn (`chatId` o `providerId`) | `recordatoriosParaEnviar()` |
| R2 | Redactar | Plantilla fija con día y hora reales en hora de Colombia. **No pasa por el modelo a propósito:** un recordatorio es una frase con un dato duro, y un LLM podría inventar una hora distinta a la agendada | `textoRecordatorio()` |
| R3 | Enviar y marcar | Manda por el mismo hilo de LinkedIn, lo agrega a la conversación y sella `recordatorioEn`. **Primero envía, después marca**: al revés, un fallo de red dejaría al lead sin recordatorio y sin reintento | `enviarRecordatorio()` |

**Campos nuevos en el lead:** `citaEn` (inicio de la reunión en ms, sale del `startUtc` que devuelve
Cal.com al reservar) y `recordatorioEn` (candado anti-repetición).

⚠️ **Los leads que agendaron antes del 04-08 no tienen `citaEn`** y quedan fuera a propósito: es
preferible que no reciban recordatorio a que reciban uno con hora inventada.

**Por qué 2 h y no 24:** Cal.com ya avisa por correo con un día. Este sale por el hilo donde el lead
conversó, que es donde lo lee. Y cuando alguien acepta una llamada para el día siguiente, un
recordatorio a 24 h nunca llegaría a dispararse.

**Probado el 04-08** con tres leads sintéticos (cita en 90 min → sale; en 8 h → fuera de ventana; ya
recordada → no repite). Los tres filtros se comportaron como debían. `tsc` y `eslint` limpios.
