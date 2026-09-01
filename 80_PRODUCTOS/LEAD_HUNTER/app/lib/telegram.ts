/**
 * AVISOS AL CELULAR.
 *
 * Por qué existe: el sistema ya sabe cuándo necesita a una persona —el agente
 * escala cuando no sabe responder— pero ese aviso moría en una pantalla que
 * nadie está mirando. Y peor: cuando LinkedIn se cayó (dos veces en la misma
 * semana) el sistema siguió como si nada durante horas, porque un envío que
 * falla se ve igual que un lead que no contestó.
 *
 * Telegram es el canal porque llega al bolsillo sin instalar nada, y porque el
 * mensaje puede traer el link directo al chat del lead: se entra y se responde
 * desde el mismo celular.
 *
 * Sin `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` esto no hace nada y no molesta:
 * el sistema funciona igual, solo que en silencio.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const CHAT = process.env.TELEGRAM_CHAT_ID?.trim();

/** ¿Están las credenciales del bot? */
export function telegramConfigurado(): boolean {
  return Boolean(TOKEN && CHAT);
}

/**
 * Manda un aviso. Nunca lanza: un aviso que no sale no puede romper el ciclo
 * del motor, que es lo que de verdad importa.
 *
 * Devuelve true si se envió, para que quien llama pueda registrar el aviso y
 * no repetirlo en el próximo ciclo.
 */
export async function avisar(texto: string): Promise<boolean> {
  if (!telegramConfigurado()) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT,
        text: texto,
        parse_mode: "HTML",
        // Sin vista previa: el link al panel ocuparía media pantalla del celular.
        link_preview_options: { is_disabled: true },
      }),
    });
    if (!r.ok) {
      console.warn(`[telegram] no se pudo avisar: HTTP ${r.status} ${await r.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[telegram] no se pudo avisar:", (e as Error).message);
    return false;
  }
}

/** La app en internet, para armar los links de los avisos. */
function urlApp(): string {
  const h = process.env.LEADHUNTER_HOST?.trim();
  return h ? (h.startsWith("http") ? h : `https://${h}`) : "";
}

/**
 * Aviso de lead trabado: el agente pidió ayuda y hay una persona esperando.
 * Lleva el motivo y el link para entrar a responder desde el celular.
 */
export function textoEscalado(nombre: string, motivo: string, empresa?: string): string {
  const quien = empresa?.trim() ? `${nombre} · ${empresa}` : nombre;
  const url = urlApp();
  return [
    `⚠️ <b>El agente se trabó</b>`,
    ``,
    `<b>${escapar(quien)}</b>`,
    escapar(motivo || "No supo cómo seguir."),
    url ? `\nEntrá a responderle: ${url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Aviso de servicio caído. Es el que más falta hacía: sin esto, LinkedIn se
 * desconecta y el tablero sigue mostrando actividad normal durante horas.
 */
export function textoServicioCaido(detalle: string): string {
  return [
    `🔴 <b>LinkedIn desconectado</b>`,
    ``,
    `No está saliendo ninguna solicitud ni respuesta.`,
    escapar(detalle),
    ``,
    `Revisá la cuenta en Unipile.`,
  ].join("\n");
}

/** Aviso de que volvió, para no dejar a nadie con la duda. */
export function textoServicioVuelto(): string {
  // No dice «todo normal» a propósito: al caerse el servicio el envío de
  // invitaciones queda frenado, y reanudarlo es decisión de una persona. Un
  // aviso que diga que todo sigue igual haría que nadie entre a mirar, y la
  // cola quedaría detenida en silencio.
  return (
    `🟢 <b>LinkedIn reconectado</b>\n\n` +
    `Las conversaciones y los seguimientos siguen andando.\n\n` +
    `⚠️ <b>El envío de invitaciones quedó en pausa</b> desde la caída, para que la ` +
    `cola acumulada no salga toda junta al volver. Cuando quieras reanudarlo, se ` +
    `enciende desde el Piloto automático.`
  );
}

/** Telegram interpreta HTML: hay que escapar lo que venga de afuera. */
function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
