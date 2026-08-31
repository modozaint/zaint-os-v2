---
name: feedback-chats-especializados
description: "Santiago separa el trabajo en chats especializados, uno por funcion y con nombre. Este chat es MODOZAINT: donde coordina y opera todo."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 910f2e49-47f6-4855-a175-30fc6a248403
  modified: 2026-08-26T15:34:02.621Z
---

Decidido por Santiago el **2026-08-23**: en vez de un chat que hace todo, **un chat por especialidad,
cada uno con nombre y funcion**.

- ⭐ **Este chat = «MODOZAINT»**, en sus palabras: *«donde zaint coordina y opera todo»*. Coordina
  **y opera** — aca si se ejecuta, no solo se planea.
  *(Correccion del 23-ago por la tarde: antes esta memoria decia que este chat era «JUAN», el
  analizador de video. Lo dijo el mismo dia, mas temprano, y despues lo cambio.)*
- **JUAN** = analisis de video. Corre `/video`, destila e indexa. **No escribe guiones.**
- **Creacion de contenido** = chat aparte, con `CONTENIDO/PROMPT_CHAT_CONTENIDO.md`.
- ⭐ **MARCOS** = planeacion de apps, soluciones IA y proyectos. Nace el **2026-08-23**.
  Santiago suelta la idea en bruto (hablada, a medias) y MARCOS devuelve el plan en `planes/`,
  la linea de arranque para Sonnet y el prompt del revisor. **No ejecuta.** Su prompt vive en
  `SISTEMA/PROMPT_CHAT_MARCOS.md`. En sus palabras: *«tu te encargas de empezar las bases
  perfectas para que ellos ejecuten y no gastar tanto como solo yo escribiendo o hablando»* —
  el input suyo es minimo por diseno: preguntar poco es parte del oficio, no un atajo.
- ⭐ **JOSSE** = **lector y analista de libros**. Nace el **2026-08-26** con *Control* de Freddy Vega.
  Lee el PDF completo y prepara el material del **club de lectura**. 🔑 **El club NO se prepara con
  un resumen:** son 13 personas, modera **Samir Orozco**, 90 min, y los 50 min centrales son
  compartir **un post-it por color** (verde = idea del autor · azul = frase que sacudio · amarillo =
  tip que *el* decide usar · **naranja = accion que se cobra en la siguiente sesion** · rosado =
  para buscar). Documentos del club en `planes/criterios_club_lectura.pdf` y
  `planes/guia_postits_club_lectura.pdf`. **No elijas sus post-its**: la guia dice que cada quien
  marca lo suyo — se entregan **candidatos con la pagina detras**. Santiago ademas graba **un video
  diario** de lo que va leyendo, asi que pide tambien ganchos en crudo (no guiones: eso es
  `/contenido`). Salida en `KNOWLEDGE_PACKS/FOUNDER/LECTURA_<libro>.md`.
  🔒 **Dos reglas que Santiago fijo el mismo dia y valen para TODO libro:**
  **(1) lo que se saque tiene que aplicar o identificarse con nosotros como ZAINT** — una seccion
  por cuenta (Dermatinta, HK, MODOZAINT, SOLUCIONES_IA, como trabajamos), no solo el resumen del
  autor; **(2) el entregable tiene que ser legible en computador Y en celular, o venir en PDF.**
  Receta que funciono: pagina publicada + **PDF generado con Chrome headless**
  (`chrome --headless=new --no-pdf-header-footer --print-to-pdf`) guardado junto al `.md`.
- **Informes / investigacion** = pedido el 23-ago, **todavia no existe**.

**Why:** mezclar funciones en un chat impide que ninguna se especialice — cada chat acumula criterio
propio con el uso. Los tres agentes de marca (`/dermatinta` `/modozaint` `/kaizen`) ya funcionan asi
desde el 21-ago, con memoria propia en `AGENTES/`.

**Y la queja de fondo, que ya se volvio trabajo:** el 23-ago pidio **replantear todas las
prohibiciones del proyecto** porque sentia que le costaban potencial. Se conto: **554 prohibiciones
en 165 archivos**. Eligio **crearlas de nuevo desde cero** y autorizo que la Constitucion del Founder
entrara al replanteo. Resultado en `SISTEMA/PROTECCIONES.md` (propuesta) y
`planes/replanteo-prohibiciones-2026-08-23.md` (migracion, sin aplicar).

**How to apply:** trabaja contra `PROTECCIONES.md`, no contra las reglas viejas. **No cites numeros
de regla en las respuestas** y no moralices: si algo se frena, una linea con el porque. Lo unico que
sigue siendo suyo es **publicar y gastar dinero**. Relacionado: [[feedback-rol-planeador]],
[[feedback-mr-zaint-marcador]].
