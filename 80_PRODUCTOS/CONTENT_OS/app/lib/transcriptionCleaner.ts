import { GROQ_CHAT_URL, MODELO_RAPIDO } from './modelosGroq'

const CLEAN_SYSTEM_PROMPT = `Sos un corrector de transcripciones de audio en español.
Tu tarea es recibir una transcripción cruda generada por speech-to-text y devolverla corregida, sin cambiar el contenido ni parafrasear.

Reglas de corrección:
- Corregí errores ortográficos producidos por el STT usando contexto semántico de la frase
- Nombres propios conocidos que el STT suele malescribir:
  "Claude Code" (nunca "cloud code", "clod code", "claud code" ni variantes)
  "[TU NOMBRE] — reemplazá esta línea con los nombres propios que el STT suele malescribir en tu caso"
  "Instagram", "YouTube", "Meta", "WhatsApp", "TikTok"
  "Groq", "Gemini", "LLaMA", "ChatGPT", "OpenAI", "Anthropic"
  "Next.js", "Tailwind", "TypeScript", "JavaScript"
- Si una palabra suena incoherente en su contexto, reemplazala por la que tenga más sentido semánticamente
- Corregí puntuación básica donde falte (comas, puntos)
- NO resumas, NO parafrasees, NO agregues ni quites ideas
- Devolvé únicamente el texto corregido, sin comentarios ni explicaciones adicionales`

export async function cleanTranscription(rawText: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('GROQ_API_KEY no configurada — transcripción guardada sin limpiar')
    return rawText
  }

  try {
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELO_RAPIDO,
        messages: [
          { role: 'system', content: CLEAN_SYSTEM_PROMPT },
          { role: 'user', content: rawText },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    if (!res.ok) {
      console.warn(`Groq cleaner HTTP ${res.status} — usando transcripción original`)
      return rawText
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? rawText
  } catch (err) {
    console.warn('Groq cleaner error:', err, '— usando transcripción original')
    return rawText
  }
}
