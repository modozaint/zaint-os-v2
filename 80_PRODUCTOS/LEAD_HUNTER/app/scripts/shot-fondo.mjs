/** Captura del fondo de Búsqueda en varios anchos y momentos. */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3200";
const SHOTS = "/tmp/lh-shots";
mkdirSync(SHOTS, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const errores = [];
page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
page.on("pageerror", (e) => errores.push(String(e)));

for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [1920, 1080, "1920"],
  [390, 844, "390"],
]) {
  await page.setViewport({ width: w, height: h });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await esperar(2500); // dejar que las partículas deriven un poco
  await page.screenshot({ path: `${SHOTS}/fondo-${tag}.png` });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  console.log(`${tag}px  overflow: ${overflow ? "❌ SÍ" : "✅ no"}`);
}

// Segundo cuadro a 1440 para confirmar que efectivamente se mueve
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(600);
const a = await page.screenshot({ encoding: "base64" });
await esperar(3000);
const b = await page.screenshot({ encoding: "base64" });
console.log(`animación: ${a === b ? "❌ cuadro idéntico (estático)" : "✅ se mueve"}`);

// Con reduced-motion tiene que quedar quieto pero visible
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(800);
const c = await page.screenshot({ encoding: "base64" });
await esperar(2200);
const d = await page.screenshot({ encoding: "base64" });
console.log(`reduced-motion: ${c === d ? "✅ estático" : "❌ sigue animando"}`);
await page.screenshot({ path: `${SHOTS}/fondo-reduced-motion.png` });

console.log(errores.length ? `❌ consola: ${errores[0]}` : "✅ cero errores de consola");
await browser.close();
