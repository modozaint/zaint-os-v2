// Muestra los horarios disponibles del evento en Cal.com (para saber qué puede
// proponer el setter y validar la creación de reserva en un slot real).
// Uso: node scripts/calcom-slots.mjs
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
const EVENT = process.env.CALCOM_EVENT_TYPE_ID;
const TZ = process.env.CALCOM_TIMEZONE || "America/Bogota";

const hoy = new Date();
const start = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(hoy.getTime() + 86400000));
const end = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(hoy.getTime() + 8 * 86400000));

for (const ver of ["2024-09-04", "2024-08-13"]) {
  const url = `https://api.cal.com/v2/slots?eventTypeId=${EVENT}&start=${start}&end=${end}&timeZone=${encodeURIComponent(TZ)}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": ver },
  });
  console.log(`\n=== cal-api-version ${ver} → HTTP ${r.status} ===`);
  const txt = await r.text();
  console.log(txt.slice(0, 2000));
  if (r.ok) break;
}
