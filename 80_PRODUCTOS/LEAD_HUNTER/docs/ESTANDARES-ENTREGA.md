# LeadHunter · Estándares de entrega — Nexum

> **Para qué:** definir por escrito qué significa «listo para presentar», **antes** de trabajar contra ello. Sin esto, «listo» es una sensación a las 2 a.m. del viernes.
>
> **Plazo:** presentación **sábado 15-ago**. Santiago trabaja 7am-7pm ese día → **el cierre real es el viernes 14 en la noche**. Capacidad hasta ahí: ~12 h.
>
> **Cómo se usa:** se corre el ciclo **verificar → arreglar → volver a verificar** hasta que todo pase. Escrito el 2026-08-07 desde el estado real de `MAPA-SISTEMA.md` y `_USO_LOG.md`.

## La regla que gobierna todas las comprobaciones

> **Ningún ítem se marca ✅ sin una comprobación que pudiera haber fallado, con su salida a la vista.**
> Estándar fijado por Santiago el 2026-08-03, después de que tres bugs invisibles desde la interfaz llegaran a producción. Corolarios que ya costaron tiempo real:
> - **Un log de intento no es un log de resultado.** Quince líneas de «apertura → Daniel Martinez» eran quince reintentos fallidos, no un éxito.
> - **Un resultado vacío se investiga, no se acepta.** Una corrida en SUCCEEDED con dataset vacío se vio como «no se encontraron perfiles» y costó ~2 h.
> - **No truncar la evidencia antes de juzgarla.** Cortar un mensaje a 150 caracteres llevó a reportar como roto un flujo que estaba bien.

---

## A · Que el sistema corra solo el día de la demo

| # | Estándar | Cómo se comprueba | Estado |
|---|---|---|---|
| A1 | **Los flujos de n8n que importan están ACTIVOS en el VPS** | Panel de n8n del VPS, no el repo. Los JSON versionados traen `active: false` y token de ejemplo a propósito | 🔴 **Sin verificar desde el 03-08.** Es el cabo suelto más peligroso: si el flujo de contacto no está activo, **nada se dispara solo el día de la demo** |
| A2 | Contacto, setter, seguimiento y recordatorio se disparan sin intervención | Dejar correr un ciclo completo y mostrar el movimiento en el tablero con hora | 🔴 Pendiente |
| A3 | La cadencia vigente en producción es la que se quiere mostrar | `In the loop → Cadencia` (no Ajustes). Ojo: el default del código **no migra** a un entorno que ya corrió | 🟡 Verificado el 03-08: 6/día L-V 9-20h, seguimientos día 1 y 3 |

## B · Que no le escriba basura a un lead real

| # | Estándar | Cómo se comprueba | Estado |
|---|---|---|---|
| B1 | **Cero mensajes rotos enviados** | Puerta de calidad (`lib/calidad-mensaje.ts`) en los tres caminos que escriben: sync, motor por pasos y seguimientos | 🟢 Desplegada (commit `e09a390`), probada contra los textos reales que sí se enviaron: 5 malos rechazados, 5 buenos pasan |
| B2 | **Correos y URLs no se marcan como texto roto** | El filtro tumbó una confirmación real de cita por normalizar `wellnessbarber360@gmail.com`. Debe pasar 9/9 en el set de prueba | 🟢 Arreglado el 04-08 |
| B3 | **100% de las notas de invitación ≤280 caracteres** | Recorrer los leads pendientes y medir. `recortarNota()` es la red, no la primera línea | 🟢 15/15 con nota (202-230) al 03-08 · **re-verificar antes del 14** |
| B4 | **A una cuenta de empresa nunca se le dice «Hola \<nombre\>»** | `lib/tipo-perfil.ts` sobre perfiles reales. Debe saludar a la marca y preguntar con quién tiene el gusto | 🟢 17/17 en la prueba del 03-08 |
| B5 | La nota y el primer mensaje **no repiten el mismo texto** | Leer un hilo real completo: el mensaje debe retomar, no repetir | 🟢 Validado con Pablo el 04-08 |

## C · Que los cuatro módulos del desafío corran en REAL

| # | Estándar | Cómo se comprueba | Estado |
|---|---|---|---|
| C1 | Contacto en frío con nota | Una invitación real enviada, visible en LinkedIn | 🟢 Validado en producción |
| C2 | Setter que responde de verdad | Un hilo real donde el lead pregunta algo específico y la respuesta contesta **esa** pregunta | 🟢 Validado con Pablo el 04-08 |
| C3 | Seguimientos automáticos | Endpoint propio, no la ruta de simulación. Modo `soloRedactar` para revisar sin enviar | 🟢 Cerrado el 31-07 |
| C4 | Agendamiento real en Cal.com | Una cita creada de punta a punta | 🟢 Validado el 04-08 (con plan B correcto cuando la hora pedida estaba ocupada) |
| C5 | Recordatorio antes de la reunión | Sale por el hilo de LinkedIn, con hora real de Colombia | 🟢 Probado el 04-08 con 3 leads sintéticos |

## D · Que el tablero no mienta en la demo

| # | Estándar | Cómo se comprueba | Estado |
|---|---|---|---|
| D1 | **Ningún lead figura como «contactado» si el sistema no puede escribirle** | Al 04-08 hay **11 leads sin `providerId`** (9 son laboratorios que vienen de Google Maps y nunca tuvieron LinkedIn). Están inertes y el filtro del sync ni los intenta | 🔴 **Abierto.** Decisión de Santiago: no se borran. Pero **no pueden verse como contactados** en la pantalla que va a mirar Juan Pablo |
| D2 | Los números del tablero cuadran con lo que pasó | Contar leads por estado y contrastar contra las conversaciones reales | 🔴 Pendiente |
| D3 | El horario que ofrece el setter existe de verdad | Hoy ofrece «entre 9:00 am y 4:45 pm» como rango continuo cuando la disponibilidad tiene huecos | 🟡 **Mejora conocida, no bloqueante.** Si no da el tiempo, se dice en la demo antes de que lo pregunten |

## E · Que exista la propuesta, no solo el sistema

| # | Estándar | Cómo se comprueba | Estado |
|---|---|---|---|
| E1 | Propuesta comercial lista y coherente con lo que el sistema hace hoy | `SOLUCIONES_IA/BANCO_SOLUCIONES/nexum-propuesta-comercial.md` — **cada capacidad que promete debe existir y poder mostrarse** (regla 14) | 🟠 **AUDITADA el 11-08** → [[AUDITORIA-PROPUESTA-2026-08-11]]. 2 afirmaciones falsas y 1 a medias, todas corregibles. **Falta aplicar las correcciones** |
| E2 | Presentación con el hilo de la demo | `nexum-presentacion.md`. Debe poder correrse aunque falle internet: capturas de respaldo de un hilo real | 🔴 **AUDITADA el 11-08** → [[AUDITORIA-PROPUESTA-2026-08-11]] parte 2. **Se SUBVENDE:** dice que falta el envío real de DMs y funciona desde el 03-08. Además manda correr la demo desde `localhost` habiendo producción |
| E3 | Ningún dato de la propuesta sin fuente viva | Regla 14 del vault. Si una cifra no se puede señalar en el sistema, sale de la propuesta | 🔴 Pendiente |

---

## Qué NO entra en esta entrega

Escrito para no ampliar el alcance en la última semana:

- Base de datos real (hoy es `_datos.json` sobre un volumen — suficiente para la demo; es lo primero que se cambia si entra volumen real).
- Los 11 leads inertes: **no se borran** (decisión de Santiago). Solo se corrige que no se vean como contactados.
- La mejora de horarios concretos vs. rango (D3), salvo que sobre tiempo.

## Sobre correr esto «en loop» — honestidad (regla 7)

Santiago pidió que esto trabaje en un loop contra los estándares hasta cumplirlos. Lo que se puede y lo que no:

- ✅ **Sí:** correr el ciclo verificar → arreglar → volver a verificar en sesiones de trabajo, con la salida real de cada comprobación a la vista, y dejar el estado escrito aquí después de cada vuelta.
- ✅ **Sí:** una tarea programada explícita, si Santiago la pide (`/loop`, cron, routine).
- ❌ **No:** un agente trabajando solo durante días sin que nadie lo mire. **El vault prohíbe prometer autonomía 24/7** y varios de estos ítems (A1 el primero) exigen mirar un panel del VPS con credenciales.

**El orden recomendado por rentabilidad de las ~12 h:** A1 primero (si el reloj no corre, no hay demo), luego D1 (el tablero es lo que Juan Pablo va a mirar), luego E1-E3 (la propuesta es la mitad de la entrega y hoy es la sección más roja).
