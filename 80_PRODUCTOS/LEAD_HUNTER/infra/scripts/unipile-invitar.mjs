// Envía una INVITACIÓN de conexión real por LinkedIn (el flujo de prospección en frío).
// Resuelve el provider_id del perfil y llama POST /users/invite.
//
// Uso:  node scripts/unipile-invitar.mjs <perfil-o-url> ["nota opcional"]
//   <perfil-o-url> = URL del perfil (https://www.linkedin.com/in/xxxx) o solo "xxxx".
//   "nota opcional" = mensaje corto de la invitación. Sin nota = invitación sin texto
//                     (más segura para cuentas gratis, que tienen las notas limitadas).
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

const [rawPerfil, nota] = process.argv.slice(2);
if (!rawPerfil) fallar('Uso: node scripts/unipile-invitar.mjs <perfil-o-url> ["nota opcional"]');

let identificador = rawPerfil.trim();
const m = identificador.match(/\/in\/([^/?#]+)/);
if (m) identificador = m[1];

const base = `https://${DSN}/api/v1`;
const headers = { "X-API-KEY": TOKEN, accept: "application/json" };

// 1) Resolver el provider_id del perfil.
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

// 2) Enviar la invitación.
const cuerpo = { account_id: ACCOUNT_ID, provider_id: providerId };
if (nota) cuerpo.message = nota;

console.log("→ Enviando invitación de conexión...");
const re = await fetch(`${base}/users/invite`, {
  method: "POST",
  headers: { "X-API-KEY": TOKEN, "content-type": "application/json" },
  body: JSON.stringify(cuerpo),
});
const envioTxt = await re.text();
console.log("   HTTP", re.status);
if (!re.ok) fallar(`Unipile rechazó la invitación (HTTP ${re.status}):\n${envioTxt}`);

console.log("\n🎉 ¡Invitación enviada de verdad por LinkedIn!\n" + envioTxt);
console.log("\n→ Revisa LinkedIn (Mi red → Invitaciones enviadas) para confirmarla.");
