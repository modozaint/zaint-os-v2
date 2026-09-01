// Muestra los mensajes crudos de un chat (para conocer el formato de Unipile).
// Uso: node scripts/unipile-ver-chat.mjs <chat_id>
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
function cargarEnv() {
  const t = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const l of t.split(/\r?\n/)) {
    const s = l.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 0) continue;
    const k = s.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = s.slice(i + 1).trim();
  }
}
cargarEnv();
const { UNIPILE_DSN: DSN, UNIPILE_TOKEN: TOKEN } = process.env;
const chatId = process.argv[2];
if (!chatId) {
  console.error("Uso: node scripts/unipile-ver-chat.mjs <chat_id>");
  process.exit(1);
}
const base = `https://${DSN}/api/v1`;
const r = await fetch(`${base}/chats/${chatId}/messages`, {
  headers: { "X-API-KEY": TOKEN, accept: "application/json" },
});
console.log("HTTP", r.status);
console.log(await r.text());
