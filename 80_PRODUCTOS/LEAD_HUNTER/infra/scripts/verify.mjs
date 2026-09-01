/**
 * Verificación E2E headless. No abre nada: saca capturas a /tmp/lh-shots.
 *   node scripts/verify.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const SHOTS = "/tmp/lh-shots";
mkdirSync(SHOTS, { recursive: true });

const resultados = [];
const ok = (n, d = "") => resultados.push({ ok: true, n, d });
const fail = (n, d = "") => resultados.push({ ok: false, n, d });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--window-size=1440,900"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// Permiso de portapapeles para poder verificar "Copiar mensaje"
await browser
  .defaultBrowserContext()
  .overridePermissions(BASE, ["clipboard-read", "clipboard-write"]);

const erroresConsola = [];
page.on("console", (m) => {
  if (m.type() === "error") erroresConsola.push(m.text());
});
page.on("pageerror", (e) => erroresConsola.push(String(e)));

async function overflow() {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

// ---------- 1. Búsqueda ----------
await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(400);
await page.screenshot({ path: `${SHOTS}/1-busqueda.png` });
(await overflow()) ? fail("Búsqueda sin overflow") : ok("Búsqueda sin overflow");

const chips = await page.$$eval("form button[type=button]", (b) => b.length);
chips >= 5 ? ok("Chips de sugerencia", `${chips} botones`) : fail("Chips", `${chips}`);

const estados = await page.$$eval("select", (sels) => {
  const s = sels.find((x) => !x.disabled);
  return s ? s.options.length : 0;
});
estados === 51
  ? ok("50 estados + Todo EE.UU.", `${estados} opciones`)
  : fail("Estados", `${estados} opciones (esperaba 51)`);

// Coste en vivo: mover el slider tiene que cambiar el texto
const costoAntes = await page.$eval("form", (f) => f.textContent.match(/~\$[\d,]+/)?.[0]);
await page.$eval('input[type=range]', (el) => {
  const set = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, "value").set;
  set.call(el, "50");
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await esperar(200);
const costoDespues = await page.$eval("form", (f) => f.textContent.match(/~\$[\d,]+/)?.[0]);
costoAntes !== costoDespues
  ? ok("Coste estimado en vivo", `${costoAntes} -> ${costoDespues}`)
  : fail("Coste en vivo", `no cambió (${costoAntes})`);

// ---------- 2. Leads / Kanban ----------
await page.evaluate(() => {
  [...document.querySelectorAll("nav button")]
    .find((b) => b.textContent.includes("Leads"))?.click();
});
await esperar(600);
await page.screenshot({ path: `${SHOTS}/2-leads-kanban.png` });
(await overflow()) ? fail("Kanban sin overflow") : ok("Kanban sin overflow");

const columnas = await page.$$eval("main section h2", (h) => h.map((x) => x.textContent));
JSON.stringify(columnas) ===
JSON.stringify(["Nuevos", "Contactados", "Respondieron", "Reunión agendada"])
  ? ok("4 columnas del kanban", columnas.join(" | "))
  : fail("Columnas", columnas.join(" | "));

const tarjetas = await page.$$('main article[role=button]');
tarjetas.length > 0
  ? ok("Tarjetas en el tablero", `${tarjetas.length}`)
  : fail("Tarjetas", "ninguna");

// El store vive en memoria: si reiniciaste el server, no hay nada que probar.
if (!tarjetas.length) {
  console.log(
    "\n⚠️  Tablero vacío. Corré una búsqueda primero:\n" +
      `   curl -X POST ${BASE}/api/search -H 'content-type: application/json' \\\n` +
      `        -d '{"keyword":"marketing agency","titles":["Founder"],"state":"Texas","city":"","limit":3}'\n`,
  );
  await browser.close();
  process.exit(1);
}

// ---------- 3. Drag & drop ----------
const antesPorColumna = await page.$$eval("main section", (s) =>
  s.map((x) => x.querySelectorAll("article").length),
);
const origen = await page.$("main article[role=button]");
const destino = (await page.$$("main section"))[1]; // Contactados
if (origen && destino) {
  const a = await origen.boundingBox();
  const b = await destino.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + 120, { steps: 22 });
  await esperar(120);
  await page.mouse.up();
  await esperar(700);
  const despues = await page.$$eval("main section", (s) =>
    s.map((x) => x.querySelectorAll("article").length),
  );
  despues[1] > antesPorColumna[1]
    ? ok("Drag & drop mueve de columna", `${antesPorColumna.join("/")} -> ${despues.join("/")}`)
    : fail("Drag & drop", `${antesPorColumna.join("/")} -> ${despues.join("/")}`);
  await page.screenshot({ path: `${SHOTS}/3-kanban-tras-drag.png` });
} else fail("Drag & drop", "sin tarjeta u objetivo");

// ---------- 4. Panel de detalle ----------
await (await page.$("main article[role=button]")).click();
await esperar(800);
await page.screenshot({ path: `${SHOTS}/4-panel-detalle.png` });
(await overflow()) ? fail("Panel sin overflow") : ok("Panel sin overflow");

const panel = await page.$("aside[role=dialog]");
panel ? ok("Panel de detalle abre") : fail("Panel de detalle");

// "Ver perfil en LinkedIn" apunta a la URL real
const href = await page.$eval(
  'aside[role=dialog] a[target=_blank]',
  (a) => a.href,
);
/^https:\/\/(www\.)?linkedin\.com\/in\//.test(href)
  ? ok("Ver perfil apunta a LinkedIn", href)
  : fail("Ver perfil", href);

// Copiar mensaje -> portapapeles + toast
const textoTextarea = await page.$eval("aside[role=dialog] textarea", (t) => t.value);
await page.evaluate(() => {
  [...document.querySelectorAll("aside[role=dialog] button")]
    .find((b) => b.textContent.includes("Copiar mensaje"))?.click();
});
await esperar(600);
const portapapeles = await page.evaluate(() => navigator.clipboard.readText());
portapapeles.trim() === textoTextarea.trim()
  ? ok("Copiar mensaje al portapapeles", `${portapapeles.length} chars`)
  : fail("Copiar mensaje", `pegado ${portapapeles.length} vs textarea ${textoTextarea.length}`);

const toast = await page.$('[role=status]');
toast ? ok("Toast 'Copiado' visible") : fail("Toast");
await page.screenshot({ path: `${SHOTS}/5-copiado-toast.png` });

// ---------- 5. Ajustes ----------
await page.keyboard.press("Escape");
await esperar(500);
await page.evaluate(() => {
  [...document.querySelectorAll("nav button")]
    .find((b) => b.textContent.includes("Ajustes"))?.click();
});
await esperar(500);
await page.screenshot({ path: `${SHOTS}/6-ajustes.png` });
(await overflow()) ? fail("Ajustes sin overflow") : ok("Ajustes sin overflow");
const nombreDefault = await page.$eval("#nombre", (i) => i.value);
nombreDefault === "Tu Nombre"
  ? ok("Ajustes: nombre por defecto", nombreDefault)
  : fail("Ajustes nombre", nombreDefault);

// ---------- 6. Reduced motion ----------
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(400);
await page.evaluate(() => {
  [...document.querySelectorAll("nav button")]
    .find((b) => b.textContent.includes("Leads"))?.click();
});
await esperar(500);
const vivoConRM = await page.$$eval("main section", (s) => s.length);
vivoConRM === 4
  ? ok("Reduced-motion no rompe", "kanban sigue con 4 columnas")
  : fail("Reduced-motion", `${vivoConRM} columnas`);
await page.screenshot({ path: `${SHOTS}/7-reduced-motion.png` });

// ---------- 7. Mobile ----------
await page.setViewport({ width: 390, height: 844 });
await esperar(400);
await page.screenshot({ path: `${SHOTS}/8-mobile-390.png` });

erroresConsola.length === 0
  ? ok("Cero errores de consola")
  : fail("Errores de consola", erroresConsola.slice(0, 3).join(" || "));

await browser.close();

console.log("\n" + "=".repeat(70));
for (const r of resultados) {
  console.log(`${r.ok ? "✅" : "❌"} ${r.n}${r.d ? `  — ${r.d}` : ""}`);
}
const pasaron = resultados.filter((r) => r.ok).length;
console.log("=".repeat(70));
console.log(`${pasaron}/${resultados.length} verificaciones OK`);
console.log(`capturas en ${SHOTS}`);
process.exit(pasaron === resultados.length ? 0 : 1);
