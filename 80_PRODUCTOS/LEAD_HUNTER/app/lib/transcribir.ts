/**
 * Transcripción de notas de voz (OpenAI Whisper).
 *
 * Por qué existe: en LinkedIn mucha gente contesta con audio, sobre todo desde
 * el celular. Hasta el 31-07 esos mensajes llegaban vacíos y el agente se
 * quedaba mudo ese turno: para el lead parecía que lo habían dejado en visto.
 *
 * Es OPCIONAL a propósito. Sin `OPENAI_API_KEY` el sistema no se rompe: el
 * agente detecta que fue un audio y pide amablemente que se lo escriban. Así
 * un cliente puede instalar todo sin cuenta de OpenAI y activarlo después.
 */
const KEY = process.env.OPENAI_API_KEY;

/** ¿Se pueden transcribir audios? Si no, el agente pide el mensaje por texto. */
export function transcripcionConfigurada(): boolean {
  return Boolean(KEY && !KEY.includes("PEGA_AQUI"));
}

/**
 * Manda el audio a Whisper y devuelve el texto. Si algo falla devuelve "" para
 * que el ciclo siga: una nota de voz sin transcribir no puede tumbar el motor.
 *
 * `idioma` se fija en español a propósito: sin pista, Whisper a veces "detecta"
 * portugués o italiano en audios cortos con ruido y devuelve una traducción.
 */
export async function transcribirAudio(
  audio: ArrayBuffer,
  nombreArchivo = "nota.m4a",
  idioma = "es",
): Promise<string> {
  if (!transcripcionConfigurada()) return "";
  try {
    const form = new FormData();
    form.append("file", new Blob([audio]), nombreArchivo);
    form.append("model", "whisper-1");
    form.append("language", idioma);
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}` },
      body: form,
    });
    if (!r.ok) {
      console.log(`[transcribir] Whisper HTTP ${r.status}: ${await r.text()}`);
      return "";
    }
    const d = (await r.json()) as { text?: string };
    return d.text?.trim() ?? "";
  } catch (e) {
    console.log(`[transcribir] error: ${e instanceof Error ? e.message : e}`);
    return "";
  }
}
