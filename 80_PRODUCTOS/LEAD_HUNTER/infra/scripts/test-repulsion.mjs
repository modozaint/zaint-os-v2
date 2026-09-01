/** Verifica la repulsión del cursor: dispersa, vuelve, y no bloquea el form. */
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
await page.setViewport({ width: 1440, height: 900 });
const errores = [];
page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
page.on("pageerror", (e) => errores.push(String(e)));

await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(1200);

/**
 * Distancia (px) del punto dado a la partícula más cercana.
 *
 * Es la métrica correcta para esto: la repulsión abre un vacío alrededor del
 * cursor, así que lo que hay que medir es el radio de ese vacío. Medir
 * densidad en una caja no servía — el desplazamiento (~30-70px) deja a la
 * mayoría dentro de la caja, y encima depende de dónde caigan las partículas
 * al azar en cada carga.
 */
async function distanciaAlMasCercano(pageX, pageY, radioBusqueda = 200) {
  return page.evaluate(
    ([pageX, pageY, R]) => {
      const c = document.querySelector("canvas");
      const g = c.getContext("2d");
      const rect = c.getBoundingClientRect();
      const dpr = c.width / rect.width;
      // CLAVE: los puntos vienen en coordenadas de PÁGINA y el canvas arranca
      // después del sidebar. Sin esta conversión se mide 240px al costado de
      // donde está el cursor y todo el test miente.
      const cx = pageX - rect.left;
      const cy = pageY - rect.top;
      const x0 = Math.max(0, Math.round((cx - R) * dpr));
      const y0 = Math.max(0, Math.round((cy - R) * dpr));
      const w = Math.min(c.width - x0, Math.round(2 * R * dpr));
      const h = Math.min(c.height - y0, Math.round(2 * R * dpr));
      if (w <= 0 || h <= 0) return R;

      const d = g.getImageData(x0, y0, w, h).data;
      let mejor = Infinity;
      // Umbral alto A PROPÓSITO: solo el núcleo opaco de una partícula llega
      // acá. Con un umbral bajo se colaban las líneas de conexión, que cruzan
      // el vacío y hacían parecer que no había dispersión.
      const UMBRAL = 200;
      for (let py = 0; py < h; py += 2) {
        for (let pxi = 0; pxi < w; pxi += 2) {
          const a = d[(py * w + pxi) * 4 + 3];
          if (a < UMBRAL) continue;
          const dx = (x0 + pxi) / dpr - cx;
          const dy = (y0 + py) / dpr - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mejor) mejor = dist;
        }
      }
      return mejor === Infinity ? R : mejor;
    },
    [pageX, pageY, radioBusqueda],
  );
}

// Varias posiciones: una sola depende de dónde caigan las partículas al azar.
const PUNTOS = [
  { x: 330, y: 300 },
  { x: 330, y: 560 },
  { x: 1300, y: 400 },
  { x: 1300, y: 700 },
];
const LEJOS = { x: 720, y: 890 };

const sinCursor = [];
const conCursor = [];

for (const p of PUNTOS) {
  // Sin cursor cerca: ¿qué tan cerca llega naturalmente una partícula?
  await page.mouse.move(LEJOS.x, LEJOS.y, { steps: 8 });
  await esperar(1400);
  sinCursor.push(await distanciaAlMasCercano(p.x, p.y));

  // Con el cursor encima: debería abrirse un vacío
  await page.mouse.move(p.x, p.y, { steps: 12 });
  await esperar(900);
  conCursor.push(await distanciaAlMasCercano(p.x, p.y));
}
await page.mouse.move(PUNTOS[1].x, PUNTOS[1].y, { steps: 8 });
await esperar(700);
await page.screenshot({ path: `${SHOTS}/repulsion-con-mouse.png` });

const prom = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const base = prom(sinCursor);
const conM = prom(conCursor);

console.log(
  `distancia a la partícula más cercana, sin cursor: ${base.toFixed(0)}px ` +
    `[${sinCursor.map((v) => v.toFixed(0)).join(", ")}]`,
);
console.log(
  `distancia a la partícula más cercana, con cursor: ${conM.toFixed(0)}px ` +
    `[${conCursor.map((v) => v.toFixed(0)).join(", ")}]`,
);
console.log(
  conM > base + 25
    ? `✅ el cursor abre un vacío de ~${conM.toFixed(0)}px (+${(conM - base).toFixed(0)}px)`
    : `❌ apenas dispersa (+${(conM - base).toFixed(0)}px)`,
);

// Retorno: al retirar el cursor, la zona se vuelve a poblar
await page.mouse.move(LEJOS.x, LEJOS.y, { steps: 12 });
await esperar(2600);
const trasVolver = await distanciaAlMasCercano(PUNTOS[1].x, PUNTOS[1].y);
await page.screenshot({ path: `${SHOTS}/repulsion-tras-volver.png` });
console.log(
  trasVolver < conCursor[1] - 15
    ? `✅ se repuebla al retirar el cursor (${conCursor[1].toFixed(0)}px -> ${trasVolver.toFixed(0)}px)`
    : `❌ el vacío no se cierra (${conCursor[1].toFixed(0)}px -> ${trasVolver.toFixed(0)}px)`,
);

// 4. El fondo NO debe bloquear el formulario
await page.click("#keyword");
await page.type("#keyword", "growth");
const escrito = await page.$eval("#keyword", (i) => i.value);
console.log(
  escrito === "growth"
    ? "✅ el formulario sigue clickeable (pointer-events)"
    : `❌ el fondo bloquea el input (valor: "${escrito}")`,
);

// 5. Con reduced-motion no debe haber repulsión
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await page.goto(BASE, { waitUntil: "networkidle0" });
await esperar(900);
const rmAntes = await distanciaAlMasCercano(PUNTOS[1].x, PUNTOS[1].y);
await page.mouse.move(PUNTOS[1].x, PUNTOS[1].y, { steps: 12 });
await esperar(900);
const rmDespues = await distanciaAlMasCercano(PUNTOS[1].x, PUNTOS[1].y);
console.log(
  Math.abs(rmAntes - rmDespues) < 8
    ? "✅ reduced-motion: el cursor no lo afecta"
    : `❌ reduced-motion: sigue reaccionando (${rmAntes.toFixed(2)} -> ${rmDespues.toFixed(2)})`,
);

console.log(errores.length ? `❌ consola: ${errores[0]}` : "✅ cero errores de consola");
await browser.close();
