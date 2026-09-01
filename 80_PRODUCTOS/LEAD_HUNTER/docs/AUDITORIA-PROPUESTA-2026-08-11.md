# Auditoría de la propuesta comercial contra el sistema real

> **Sección E de [[ESTANDARES-ENTREGA]].** Regla 14 del vault: *nada sale hacia afuera con un dato que no puedas señalar en un sistema vivo.*
> Hecha el **2026-08-11** contra el código en `app/` y `MAPA-SISTEMA.md`. Cierre: viernes 14.

## Veredicto

**2 afirmaciones falsas · 1 a medias · 4 verdaderas pero indocumentadas.** Ninguna es fatal; las dos falsas se arreglan cambiando una palabra cada una, y **las dos aparecen en la lista de 9 puntos del desafío** — que es justo lo que Juan Pablo va a leer con más atención.

---

## 🔴 FALSAS — corregir antes de enviar

### 1. §3.1 — «Búsqueda que trae leads reales con datos correctos **(Apify)**»
**La búsqueda NO usa Apify.** Usa **Unipile** desde el 2026-08-03, porque el actor de Apify dejó de correr en plan gratuito (terminaba en SUCCEEDED con dataset vacío y costó ~2 h de diagnóstico).
- Evidencia: `MAPA-SISTEMA.md:14` → *«Búsqueda de personas | **Unipile** (`lib/unipile.ts` → `buscarPersonas`) | 🟢 real desde el 03-08»*
- Apify **sí** se sigue usando, pero solo para traer el último post del perfil (`traerUltimosPosts()`, nodo S4).
- **Corrección:** cambiar «(Apify)» por «(Unipile)». Y si se quiere sumar argumento: el cambio **bajó el costo a cero** (va en la suscripción ya pagada) y **evitó ~USD 39/mes** de plan Apify. Eso vende mejor que el error.

### 2. §3.7 — «Recordatorio pre-reunión **(Cal.com nativo)**»
**El recordatorio nativo de Cal.com era exactamente lo que NO funcionaba:** estaba con `action: email_host`, así que le llegaba **a Santiago, no al lead**. El 2026-08-04 se construyó uno propio que sale **por el hilo de LinkedIn** donde el lead conversó, 2 h antes, con día y hora reales de Colombia.
- Evidencia: `MAPA-SISTEMA.md:189-194` y `app/api/motor/recordatorio/route.ts`.
- **Corrección:** decir la verdad, que además es mejor: *«Recordatorio propio 2 h antes, por el mismo chat donde el lead conversó — no un correo que se pierde.»* El texto no pasa por el modelo a propósito, para que no invente una hora distinta a la agendada.

---

## 🟠 A MEDIAS — matizar, no borrar

### 3. §4 — «Multi-fuente universal: también **Google Maps** (negocios de cualquier nicho)»
Google Maps **sí trae leads**, pero **el sistema no les puede escribir por LinkedIn**: sin `providerId` no hay a quién abrirle chat, y los tres caminos de envío filtran por él.
- Evidencia: `app/lib/motor-pasos.ts:141, 526, 735` y `app/app/api/motor/sync/route.ts:196` → todos exigen `providerId || chatId`.
- Consecuencia real ya observada: **11 leads quedaron inertes** (9 de ellos laboratorios de cosmética traídos de Google Maps). Están en el tablero y el motor ni los intenta.
- **Cómo se sostiene la afirmación sin mentir:** los leads de Google Maps se contactan por la **ruta manual** (llamada / WhatsApp con mensaje precargado), que sí existe. Multi-fuente es cierto; **multi-fuente automática no**. Decirlo así evita la pregunta incómoda en vivo.

---

## ✅ VERDADERAS — están construidas, pero no en `MAPA-SISTEMA.md`

Verificadas en el código, no en la documentación:

| Afirmación de §4 | Dónde vive |
|---|---|
| Ruta de contacto por llamada y WhatsApp | `app/components/RutaView.tsx`, `FuentesView.tsx` |
| Control de gasto con tope que bloquea | `app/components/FuentesView.tsx` |
| CRM externo Airtable sincronizado | `app/lib/airtable.ts`, `app/app/api/airtable/sync/route.ts` |
| White-label por cliente | `app/components/ClientesView.tsx`, `PilotoAutomatico.tsx` |

⚠️ **Deuda documental, no mentira.** Pero `MAPA-SISTEMA.md` dice de sí mismo *«si tocas el flujo, actualiza este mapa en el mismo commit»* — y estas cuatro no entraron. Si alguien audita el sistema por el mapa, concluye que la propuesta promete de más.

---

## Lo que NO se auditó aquí

- **Las cifras de pricing** (§5 y notas): están correctamente marcadas como rango a negociar en la llamada, con fuentes de mercado citadas y enlazadas. Sin cifras inventadas de resultados. **Cumple la regla 14.**
- **`nexum-presentacion.md`** — pendiente de la misma pasada.
- **Si los 4 flujos de n8n están activos en el VPS** (ítem A1) — no se puede desde aquí, requiere el panel.

---

# Parte 2 — `nexum-presentacion.md` (auditada el 2026-08-11)

**El estado del doc dice «🟢 listo para presentar». No lo está:** fue escrita el **24-jul**, y entre el 31-jul y el 04-ago cambió lo más importante del sistema.

## 🔴 EL HALLAZGO — la presentación se SUBVENDE en lo que más vale

**§3 dice, textual:**
> *«El cerebro entero corre en **simulación real**. Lo único que falta conectar es el **envío automático de DMs de LinkedIn** — eso necesita una cuenta calentada + un proveedor (Unipile). Es la "Capa 2", 2-3 semanas de calentamiento.»*

**Eso dejó de ser cierto hace más de una semana.** El sistema **envía DMs reales por LinkedIn desde el 03-08** vía Unipile, con nota en la solicitud. Y el **04-08 hubo validación end-to-end completa con un lead real (Pablo)**: solicitud con nota → aceptó → el motor detectó la aceptación sin webhooks → abrió el chat con el mensaje encadenado → el lead preguntó algo específico → el setter respondió *esa* pregunta y propuso dos fechas de Cal.com → cita agendada.

> **Si Santiago dice esa frase en la demo, está anunciando que falta lo difícil — cuando lo difícil ya está hecho y probado con una persona real.** Es el error más caro del documento, y es justo el punto que Juan Pablo marcó como lo complicado del reto.

**Reemplazo:** *«Corre en producción. El 4 de agosto le escribió a un lead real por LinkedIn, sostuvo la conversación y le agendó una llamada, sin que yo tocara nada. Se los muestro en el hilo.»*

## 🔴 La demo debe correr desde PRODUCCIÓN, no desde `localhost`

§2 y el checklist de §6 dicen `npm run dev` + `localhost:3000`. Pero el sistema está **desplegado y corriendo en `leads.modozaint.online`** desde el 03-08.

Presentar desde local es innecesariamente débil (*«es un prototipo en mi máquina»* vs *«está en producción»*) y además **riesgoso**: el `.next` local ya se corrompió una vez y devolvía 404 en todos los endpoints con la página raíz en 200 — 20 minutos de diagnóstico. En una demo, eso es la demo perdida.

## 🟠 Mostrar la conversación REAL, no la simulada

§2 Momento 4 manda apretar *«Simular conversación completa»* con **un lead simulado**. Existiendo un hilo real con Pablo de punta a punta, mostrar una simulación es peor demo y resta credibilidad.
**Orden sugerido:** primero el hilo real (la prueba), después el simulador (la capacidad de repetirlo cuando quieras).

## 🟠 «Ya lo probé con un par de la comunidad» — verificar antes de decirlo

§4, versión corta del mensaje de contacto. Lo documentado es: **Pablo** (barbero, contacto personal de Santiago, **no** de la comunidad Nexum) y leads reales de LinkedIn (agencias de marketing de Antioquia). **Si no hubo nadie de la comunidad, la frase es falsa** — regla 14, y es del tipo que se cae en dos preguntas.
**Alternativa cierta y más fuerte:** *«ya corrió con leads reales y agendó una llamada de verdad»*.

## ✅ Lo que está bien y no hay que tocar

- La estructura de 8 momentos, con el white-label de primero como gancho.
- La regla de oro repetida en dos sitios: **cero cifras inventadas**.
- Las 5 preguntas de §5 — el objetivo real de la reunión es escuchar, y está bien puesto.
- El cierre: *«del scraping a la reunión agendada, sin mover una tarjeta a mano»*.

## Resumen de las dos partes

| Documento | Problema |
|---|---|
| **Propuesta** | Promete **de más** en 2 puntos (Apify, Cal.com nativo) y 1 a medias (Google Maps) |
| **Presentación** | Promete **de menos** en el punto que más vale (dice que falta el envío real, y ya funciona) |

**Las dos se arreglan el mismo día.** Son ediciones de texto, no de código.
