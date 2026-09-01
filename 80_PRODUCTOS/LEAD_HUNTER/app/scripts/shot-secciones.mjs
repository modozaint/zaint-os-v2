/** Confirma que el fondo de partículas vive SOLO en Búsqueda. */
import puppeteer from "puppeteer-core";
const BASE = process.env.BASE ?? "http://localhost:3200";
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(700);

const contarCanvas = () => page.$$eval("canvas", (c) => c.length);

console.log(`Búsqueda  canvas: ${await contarCanvas()}  ${(await contarCanvas()) === 1 ? "✅" : "❌"}`);
await page.screenshot({ path: "/tmp/lh-shots/sec-busqueda.png" });

for (const nombre of ["Leads", "Ajustes"]) {
  await page.evaluate((n) => {
    [...document.querySelectorAll("nav button")]
      .find((b) => b.textContent.includes(n))?.click();
  }, nombre);
  await esperar(600);
  const n = await contarCanvas();
  console.log(`${nombre.padEnd(9)} canvas: ${n}  ${n === 0 ? "✅ limpio" : "❌ se filtró"}`);
  await page.screenshot({ path: `/tmp/lh-shots/sec-${nombre.toLowerCase()}.png` });
}
await browser.close();
