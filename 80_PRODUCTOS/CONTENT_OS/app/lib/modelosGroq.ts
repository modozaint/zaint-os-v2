/**
 * QUÉ MODELO DE GROQ USA CADA COSA — escrito en un solo sitio.
 *
 * ⚠️ Groq retira modelos sin avisar. `llama-3.3-70b-versatile` y
 * `llama-3.1-8b-instant` dejaron de existir entre el 16 y el 17 de agosto de
 * 2026: el chat y la generación de guiones empezaron a devolver 404 sin que
 * nada del código hubiera cambiado.
 *
 * Estaban escritos a mano en cuatro archivos distintos, así que arreglar uno
 * dejaba los otros rotos. Ahora es un cambio en un sitio.
 *
 * 🔑 La lista viva NO se adivina: se consulta.
 *    GET https://api.groq.com/openai/v1/models
 */

/** Escribir guiones y responder en el chat: el más capaz disponible. */
export const MODELO_RAZONAMIENTO = 'openai/gpt-oss-120b'

/** Limpiar transcripciones: es mecánico, con el chico alcanza y es más rápido. */
export const MODELO_RAPIDO = 'openai/gpt-oss-20b'

export const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
