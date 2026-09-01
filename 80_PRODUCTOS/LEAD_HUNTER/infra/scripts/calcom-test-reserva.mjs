// Valida crear + cancelar una reserva en Cal.com sobre un slot REAL disponible.
// No deja rastro (la cancela al final). Uso: node scripts/calcom-test-reserva.mjs
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
const VER = "2024-08-13";

// 1) Traer el primer slot realmente disponible.
const hoy = new Date();
const start = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(hoy.getTime() + 86400000));
const end = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(hoy.getTime() + 14 * 86400000));
const rs = await fetch(
  `https://api.cal.com/v2/slots?eventTypeId=${EVENT}&start=${start}&end=${end}&timeZone=${encodeURIComponent(TZ)}`,
  { headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": "2024-09-04" } },
);
const slots = (await rs.json()).data ?? {};
const primerDia = Object.keys(slots).sort()[0];
const primerSlot = slots[primerDia]?.[0]?.start;
if (!primerSlot) { console.error("No hay slots disponibles."); process.exit(1); }
console.log("Slot de prueba:", primerSlot);

// 2) Crear la reserva.
const rc = await fetch("https://api.cal.com/v2/bookings", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": VER, "content-type": "application/json" },
  body: JSON.stringify({
    start: new Date(primerSlot).toISOString(),
    eventTypeId: Number(EVENT),
    attendee: { name: "Prueba Santiago", email: "kayzenlanas@gmail.com", timeZone: TZ, language: "es" },
  }),
});
console.log("CREAR → HTTP", rc.status);
const creado = await rc.json();
console.log(JSON.stringify(creado).slice(0, 500));
const uid = creado?.data?.uid;
if (!uid) { console.error("No vino uid; no puedo cancelar. Revisa arriba."); process.exit(1); }

// 3) Cancelar (para no dejar rastro).
const rx = await fetch(`https://api.cal.com/v2/bookings/${uid}/cancel`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": VER, "content-type": "application/json" },
  body: JSON.stringify({ cancellationReason: "prueba automatica" }),
});
console.log("CANCELAR → HTTP", rx.status, "(la cita de prueba quedó cancelada)");
