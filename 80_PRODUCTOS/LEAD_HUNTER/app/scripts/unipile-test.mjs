// Verifica que Unipile está conectado y listo para enviar. PASO 1: cero riesgo,
// NO envía ningún mensaje — solo pregunta a Unipile qué cuentas tienes conectadas.
// Uso:  node scripts/unipile-test.mjs   (desde la carpeta app/)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carga .env.local sin dependencias externas.
function cargarEnv() {
  const ruta = join(__dirname, "..", ".env.local");
  const txt = readFileSync(ruta, "utf8");
  for (const linea of txt.split(/\r?\n/)) {
    const l = linea.trim();
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    if (i === -1) continue;
    const k = l.slice(0, i).trim();
    const v = l.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}
cargarEnv();

const { UNIPILE_DSN: DSN, UNIPILE_TOKEN: TOKEN, UNIPILE_ACCOUNT_ID: ACCOUNT_ID } = process.env;

function fallar(msg) {
  console.error("\n❌ " + msg + "\n");
  process.exit(1);
}

if (!DSN) fallar("Falta UNIPILE_DSN en .env.local");
if (!TOKEN || TOKEN.includes("PEGA_AQUI"))
  fallar("Todavía no pegaste tu token real en UNIPILE_TOKEN (.env.local). Pégalo en el archivo — NUNCA en el chat.");
if (!ACCOUNT_ID) fallar("Falta UNIPILE_ACCOUNT_ID en .env.local");

const base = `https://${DSN}/api/v1`;
console.log("→ Consultando:", base + "/accounts");

const res = await fetch(base + "/accounts", {
  headers: { "X-API-KEY": TOKEN, accept: "application/json" },
});

console.log("   HTTP", res.status);
const cuerpo = await res.text();
if (!res.ok) fallar(`Unipile respondió ${res.status}:\n${cuerpo}`);

let data;
try {
  data = JSON.parse(cuerpo);
} catch {
  fallar("La respuesta no fue JSON:\n" + cuerpo);
}

const cuentas = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
console.log(`\n✅ Token OK. Cuentas conectadas: ${cuentas.length}`);
for (const c of cuentas) {
  const estrella = c.id === ACCOUNT_ID ? "   ⭐ (la de tu .env)" : "";
  console.log(` - ${c.id}  |  ${c.type ?? c.provider ?? "?"}  |  ${c.name ?? c.username ?? ""}${estrella}`);
}

const laMia = cuentas.find((c) => c.id === ACCOUNT_ID);
if (!laMia) {
  console.log(`\n⚠️  El UNIPILE_ACCOUNT_ID (${ACCOUNT_ID}) no aparece en la lista. Revisa que sea el correcto.`);
} else {
  console.log(
    `\n🎉 Pipe verificado: la cuenta ${ACCOUNT_ID} está conectada y el token la puede usar.\n   Siguiente paso: enviar 1 mensaje real de prueba (a un contacto tuyo de confianza).`,
  );
}
