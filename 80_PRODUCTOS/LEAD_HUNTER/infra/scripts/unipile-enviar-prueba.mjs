// PASO 2: envía UN mensaje real por LinkedIn a un contacto tuyo (prueba end-to-end).
// En LinkedIn solo puedes escribirle por chat a tus CONTACTOS de 1er grado (Relaciones).
//
// Uso:  node scripts/unipile-enviar-prueba.mjs <perfil-o-url> "<mensaje>"
//   <perfil-o-url> = la URL del perfil (https://www.linkedin.com/in/xxxx) o solo "xxxx".
//   <mensaje>      = el texto a enviar (entre comillas).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function cargarEnv() {
  const txt = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const linea of txt.split(/\r?\n/)) {
    const l = linea.trim();
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    if (i === -1) continue;
    const k = l.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = l.slice(i + 1).trim();
  }
}
cargarEnv();

const { UNIPILE_DSN: DSN, UNIPILE_TOKEN: TOKEN, UNIPILE_ACCOUNT_ID: ACCOUNT_ID } = process.env;
const fallar = (m) => {
  console.error("\n❌ " + m + "\n");
  process.exit(1);
};

if (!TOKEN || TOKEN.includes("PEGA_AQUI")) fallar("Falta pegar el token real en .env.local.");

const [rawPerfil, mensaje] = process.argv.slice(2);
if (!rawPerfil || !mensaje)
  fallar('Uso: node scripts/unipile-enviar-prueba.mjs <perfil-o-url> "<mensaje>"');

// Extrae el identificador público desde una URL de LinkedIn o lo usa tal cual.
let identificador = rawPerfil.trim();
const m = identificador.match(/\/in\/([^/?#]+)/);
if (m) identificador = m[1];

const base = `https://${DSN}/api/v1`;
const headers = { "X-API-KEY": TOKEN, accept: "application/json" };

// 1) Resolver el provider_id del contacto a partir de su perfil.
console.log("→ Buscando el perfil:", identificador);
const rp = await fetch(
  `${base}/users/${encodeURIComponent(identificador)}?account_id=${ACCOUNT_ID}`,
  { headers },
);
const perfilTxt = await rp.text();
if (!rp.ok) fallar(`No pude leer el perfil (HTTP ${rp.status}):\n${perfilTxt}`);
const perfil = JSON.parse(perfilTxt);
const providerId = perfil.provider_id ?? perfil.id ?? perfil.member_id;
if (!providerId) fallar("El perfil no trajo provider_id. Respuesta:\n" + perfilTxt);
console.log(`   Encontrado: ${perfil.name ?? perfil.first_name ?? ""} (provider_id: ${providerId})`);

// 2) Enviar el mensaje (POST /chats, multipart).
const form = new FormData();
form.append("account_id", ACCOUNT_ID);
form.append("attendees_ids", providerId);
form.append("text", mensaje);
form.append("linkedin[api]", "classic");

console.log("→ Enviando mensaje...");
const re = await fetch(`${base}/chats`, { method: "POST", headers: { "X-API-KEY": TOKEN }, body: form });
const envioTxt = await re.text();
console.log("   HTTP", re.status);
if (!re.ok) fallar(`Unipile rechazó el envío (HTTP ${re.status}):\n${envioTxt}`);

console.log("\n🎉 ¡Mensaje enviado de verdad por LinkedIn! Respuesta de Unipile:\n" + envioTxt);
console.log("\n→ Revisa tu LinkedIn (Mensajes) para confirmar que salió.");
