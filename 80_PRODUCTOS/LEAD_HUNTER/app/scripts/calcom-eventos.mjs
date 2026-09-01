// Lista los event types de tu Cal.com para sacar el event type ID.
// Uso: node scripts/calcom-eventos.mjs
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
const KEY = process.env.CALCOM_API_KEY;
if (!KEY || KEY.includes("PEGA_AQUI")) {
  console.error("❌ Falta pegar tu CALCOM_API_KEY en .env.local (no en el chat).");
  process.exit(1);
}

function mostrar(lista) {
  for (const e of lista) {
    const min = e.lengthInMinutes ?? e.length ?? "?";
    console.log(` - id: ${e.id}  |  ${min} min  |  "${e.title}"  |  slug: ${e.slug}`);
  }
}

// Intento 1: API v2 (estándar actual).
let r = await fetch("https://api.cal.com/v2/event-types", {
  headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": "2024-06-14" },
});
if (r.ok) {
  const data = await r.json();
  const lista = data.data ?? data.event_types ?? [];
  console.log(`\n✅ Cal.com v2 OK. Event types: ${lista.length}`);
  mostrar(Array.isArray(lista) ? lista : []);
  process.exit(0);
}

// Intento 2: API v1 (query param).
console.log(`(v2 respondió ${r.status}, probando v1...)`);
r = await fetch(`https://api.cal.com/v1/event-types?apiKey=${KEY}`);
if (!r.ok) {
  console.error(`❌ v1 también falló (HTTP ${r.status}):\n${await r.text()}`);
  process.exit(1);
}
const data = await r.json();
const lista = data.event_types ?? [];
console.log(`\n✅ Cal.com v1 OK. Event types: ${lista.length}`);
mostrar(lista);
