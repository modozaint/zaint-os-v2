/**
 * EL MARCO CONVERZZO — el oficio que se le pone delante al modelo.
 *
 * Antes de esto el prompt decía la identidad de la marca y "escribí un guion".
 * No le daba ni una técnica: era pedirle a alguien que escriba sin haberle
 * enseñado a escribir. Este archivo es lo que faltaba.
 *
 * ⚠️ Todo lo de aquí sale del curso, ya destilado en el vault
 * (`CONTENIDO/CURSO_CONVERZZO/`). **No se inventa criterio aquí.** Si el curso
 * cambia, se cambia allá primero y se refleja acá.
 */

/**
 * Las cuatro capas del hook.
 *
 * El módulo 4 lo dice sin rodeos: **hook cada ~3 segundos, combinando tipos —
 * Visual, Verbal, Textual y Auditivo.** No una frase al principio.
 *
 * La capa textual no es decoración: buena parte del formato corto se ve en
 * mudo, así que un hook que vive solo en la voz se pierde para esa gente.
 */
export const CUATRO_CAPAS = `<las_cuatro_capas_del_hook>
Un hook NO es una frase. Son cuatro cosas pasando a la vez en el mismo segundo,
y las cuatro tienen que apuntar a la misma idea:

- VISUAL    — qué se VE en ese frame. El resultado, el conflicto, un antes/después,
              una mano entrando en cuadro. Nunca una cara quieta esperando empezar.
- VERBAL    — qué se DICE, palabra por palabra.
- TEXTUAL   — qué se LEE en pantalla. Va aparte del subtítulo automático: es la
              frase que sostiene el hook para quien mira SIN SONIDO.
- AUDITIVO  — qué se OYE: un corte seco, un silencio, el sonido real del proceso,
              un audio en tendencia. Es el pulso que sincroniza las otras tres.

Una frase ingeniosa sobre un primer frame plano es medio hook.

🔴 Y no va una sola vez: **cada ~3 segundos entra un hook nuevo** combinando
capas distintas. Eso es lo que sostiene la retención después del segundo 3.
</las_cuatro_capas_del_hook>`

/** Estructura, duración, CTA y loop — todo del módulo 4. */
export const ESTRUCTURA = `<como_se_arma_el_video>
ARCO: inicio – nudo – desenlace. El foco de todo es que **el que mira se
identifique**: "esto me pasa a mí".

DURACIÓN, según qué es la pieza:
- Trend o con música  → 0-20 s
- Contenido útil      → ~30 s
- Storytelling        → 60-90 s
Elegí una y respetala: las escenas tienen que sumar esa duración.

CTA: va **en el centro del video, no solo al final**. Pedir algo concreto —
que guarden, que compartan, que dejen una palabra. Y va otra vez al cierre si
la pieza lo aguanta.

LOOP: el cierre tiene que enganchar con el arranque, para que el video se
repita sin que se note el corte. Es retención regalada.

PORTADA: importa, y mucho. Decí qué frame es la portada.
</como_se_arma_el_video>`

/** Las tres rejillas que el calendario después mide. */
export const REJILLAS = `<clasificacion_obligatoria>
Toda pieza se clasifica en tres ejes. Elegí UNO de cada lista, exactamente con
el identificador que aparece entre comillas:

FUNCIÓN — para qué existe la pieza:
  "adquisicion" → trae gente nueva. Storytelling, proceso, aspiracional
  "autoridad"   → demuestra criterio. Tutorial, desmitificar, comparar
  "conversion"  → mueve a comprar. Producto, prueba, oferta

ÁNGULO — el enfoque (lista cerrada de 9):
  "tutorial" · "comparacion" · "desmitificacion" · "correcto_incorrecto" ·
  "consejo" · "transformacion" · "reto" · "storytelling" · "review"

ROTACIÓN — cuánta apuesta es:
  "probado"      → formato que ya funcionó
  "prueba"       → variación de algo que funcionó
  "experimental" → distinto de verdad. Anti-hooks, formatos nuevos
</clasificacion_obligatoria>`

/** El formato exacto de salida. Se pide JSON para poder guardarlo estructurado. */
export const FORMATO_SALIDA = `{
  "titulo": "nombre corto, máximo 8 palabras",
  "funcion": "adquisicion | autoridad | conversion",
  "angulo": "uno de los 9 identificadores exactos",
  "rotacion": "probado | prueba | experimental",
  "duracion_objetivo": "0-20 s | ~30 s | 60-90 s",
  "eje": "el ángulo específico de ESTA pieza, en 2-4 palabras",
  "portada": "qué frame se usa de portada y por qué frena el scroll",
  "brief": {
    "que_es": "una frase",
    "para_que_cuenta": "el nombre de la marca",
    "horas": "cuánto cuesta producirla, con un número",
    "como_sabremos": "la señal concreta de que quedó bien"
  },
  "hooks": [
    {
      "visual": "qué se ve en el frame del segundo 0",
      "verbal": "la frase, palabra por palabra",
      "textual": "el texto en pantalla que sostiene el hook sin sonido",
      "auditivo": "qué se oye: corte, silencio, sonido real, audio en tendencia",
      "arquetipo": "qué patrón usa"
    }
  ],
  "escenas": [
    {
      "segundos": "0-3",
      "se_ve": "...",
      "se_dice": "...",
      "texto_pantalla": "...",
      "sonido": "..."
    }
  ],
  "cta": { "momento": "en qué segundo entra", "que_pide": "la frase exacta" },
  "loop": "cómo cierra para que enganche con el arranque"
}`

/** Los tres hooks completos deben entrar por puertas distintas de verdad. */
export const REGLAS_DURAS = `<reglas_duras>
- 🔴 CERO CIFRAS INVENTADAS. Ni horas, ni precios, ni porcentajes, ni "el 90 % de
  la gente", ni estudios, ni testimonios. Si hace falta un número que NO aparece
  textualmente arriba, escribilo así: [VERIFICAR: 50 horas].
- 🔴 CERO AFIRMACIONES TÉCNICAS INVENTADAS. Nada de química, biología ni
  mecanismos ("el pigmento reacciona con el oxígeno") si no está arriba.
  Marcalo igual: [VERIFICAR: por qué se vira a verde].
  Ya pasó: se escribió un mecanismo químico que nadie había dicho. Publicado,
  eso es una afirmación falsa de la marca.
- Los 3 hooks entran por puertas DISTINTAS de verdad: una pregunta incómoda, una
  afirmación que molesta, una escena concreta. No la misma frase reescrita.
- El guion EMPIEZA con el hook 1, literal, en el segundo 0. Sin saludo, sin
  presentación, sin "hoy les voy a hablar de". Prohibido abrir con: "Hola",
  "Qué más", "Bienvenidos", "En este video", "Les quiero contar".
- CONCRETO, NO BONITO: "la tinta se vira a verde" sirve; "pierde su brillo y su
  belleza" no dice nada.
- Español colombiano hablado. Nada de "¡Descubre!" ni lenguaje de anuncio.
- Si la marca tiene una historia propia arriba, usala: es lo único incopiable.
</reglas_duras>`
