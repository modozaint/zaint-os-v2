// Cancela la(s) cita(s) de prueba de Julio (jalmeidapaez@gmail.com) en Cal.com.
// Uso: node scripts/calcom-cancelar-julio.mjs
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
const VER = "2024-08-13";
const EMAIL = "jalmeidapaez@gmail.com";
const h = { Authorization: `Bearer ${KEY}`, "cal-api-version": VER, "content-type": "application/json" };

const r = await fetch(
  `https://api.cal.com/v2/bookings?attendeeEmail=${encodeURIComponent(EMAIL)}`,
  { headers: h },
);
console.log("LIST HTTP", r.status);
const txt = await r.text();
let data;
try {
  data = JSON.parse(txt);
} catch {
  console.log(txt.slice(0, 500));
}
const bookings = Array.isArray(data?.data) ? data.data : [];
console.log(`Reservas de ${EMAIL}: ${bookings.length}`);
for (const b of bookings) {
  console.log(` - ${b.uid} | ${b.title} | ${b.start} | ${b.status}`);
  if (b.status === "cancelled") {
    console.log("   (ya estaba cancelada)");
    continue;
  }
  const rc = await fetch(`https://api.cal.com/v2/bookings/${b.uid}/cancel`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ cancellationReason: "Cita de prueba del test de Nexum" }),
  });
  console.log(`   CANCELAR → HTTP ${rc.status}`);
}
