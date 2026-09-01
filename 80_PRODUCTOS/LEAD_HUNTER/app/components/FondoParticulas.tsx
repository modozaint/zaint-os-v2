"use client";

import { useEffect, useRef } from "react";

/**
 * Campo de partículas para el fondo de Búsqueda.
 *
 * Decisiones deliberadas:
 * - Canvas propio, sin librería ni CDN. Son ~80 líneas y evita 25KB de
 *   particles.js (sin mantenimiento desde 2016).
 * - CERO interacción con el mouse. La profundidad sale del paralaje entre
 *   tres capas de z que derivan a distinta velocidad, no de perseguir el
 *   cursor: eso último se lee como gadget, no como herramienta.
 * - Paleta de la casa (#0A66C2 sobre el crema #F4F2EE), opacidades bajas.
 * - Respeta prefers-reduced-motion (dibuja un cuadro estático) y se pausa
 *   cuando la pestaña no está visible.
 */

const AZUL = "10, 102, 194"; // --color-li-blue en RGB

/**
 * Multiplicador global de presencia. Es la única perilla que hace falta tocar.
 *   0.6 = discreto (se pierde al comprimir para video)
 *   1.0 = calibrado para YouTube  <- actual
 *   1.3 = agresivo, empieza a competir con el formulario
 *
 * Calibrado para video a propósito: VP9/H.264 arrasan con las líneas finas de
 * bajo contraste sobre fondo plano, así que acá pesan más el grosor y el
 * contraste que la cantidad de partículas.
 */
const INTENSIDAD = 1;

/**
 * Repulsión del cursor. NO es el "grab" de particles.js (donde las partículas
 * se pegan al mouse con líneas): acá las partículas se apartan al pasar el
 * cursor y vuelven solas a su deriva con retorno elástico. Las del frente
 * reaccionan más que las del fondo, así que el paralaje se refuerza en vez de
 * romperse.
 *
 * Para apagarlo del todo: REPULSION_RADIO = 0.
 */
const REPULSION_RADIO = 260; // px de alcance alrededor del cursor
const REPULSION_FUERZA = 9; // cuánto empuja por frame
const RETORNO = 0.05; // qué tan rápido vuelve a su lugar (0.02 lento, 0.1 seco)
const AMORTIGUACION = 0.85; // frena el rebote para que no oscile

/**
 * OJO con el equilibrio: NO es FUERZA / RETORNO. La fuerza cae con `caida²`
 * a medida que la partícula se aleja, así que se auto-limita. El radio real
 * del vacío sale de resolver:
 *
 *     (1 - ox/RADIO)² · FUERZA = ox · RETORNO
 *
 * Con estos valores da ~83px, que es lo que se ve. Medido: la partícula más
 * cercana al cursor pasa de ~45px a ~85px. Por debajo de 60px la dispersión
 * no se percibe; por encima de ~120px se ve elástico y falso.
 */

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  z: number; // 0.35 (fondo) .. 1 (frente)
  /** Desplazamiento por el mouse. Vuelve a 0 solo. */
  ox: number;
  oy: number;
  /** Velocidad del desplazamiento, para que el retorno sea elástico. */
  ovx: number;
  ovy: number;
}

export function FondoParticulas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let ancho = 0;
    let alto = 0;
    let particulas: Particula[] = [];
    let raf = 0;

    // Posición del cursor en coordenadas del canvas. null = fuera.
    let mouseX: number | null = null;
    let mouseY: number | null = null;

    // En touch no hay hover: la repulsión solo aplica con puntero fino, y
    // nunca con reduced-motion.
    const conPuntero =
      !reducido && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function crear() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      ancho = rect.width;
      alto = rect.height;
      canvas!.width = ancho * dpr;
      canvas!.height = alto * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Densidad por área, con techo. Subimos poco la cantidad: lo que hace
      // visible el campo en video es el tamaño y el contraste, no el número.
      const cantidad = Math.min(Math.round((ancho * alto) / 11000), 96);

      particulas = Array.from({ length: cantidad }, () => {
        const z = 0.4 + Math.random() * 0.6;
        // Las del fondo son más chicas y más lentas: eso es el paralaje.
        const velocidad = (0.055 + Math.random() * 0.09) * z;
        const angulo = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * ancho,
          y: Math.random() * alto,
          vx: Math.cos(angulo) * velocidad,
          vy: Math.sin(angulo) * velocidad,
          r: (1.5 + Math.random() * 2.1) * z,
          z,
          ox: 0,
          oy: 0,
          ovx: 0,
          ovy: 0,
        };
      });
    }

    // Posición dibujada = deriva natural + desplazamiento por el mouse.
    const px = (p: Particula) => p.x + p.ox;
    const py = (p: Particula) => p.y + p.oy;

    function dibujar() {
      ctx!.clearRect(0, 0, ancho, alto);

      // Líneas primero, para que los puntos queden por encima.
      const MAX = 168;
      for (let i = 0; i < particulas.length; i++) {
        for (let j = i + 1; j < particulas.length; j++) {
          const a = particulas[i];
          const b = particulas[j];
          const dx = px(a) - px(b);
          const dy = py(a) - py(b);
          const d2 = dx * dx + dy * dy;
          if (d2 > MAX * MAX) continue;
          const d = Math.sqrt(d2);
          // Se desvanece con la distancia y con la profundidad del par.
          const alfa = (1 - d / MAX) * 0.62 * INTENSIDAD * Math.min(a.z, b.z);
          ctx!.strokeStyle = `rgba(${AZUL}, ${alfa})`;
          // 1.4px es el piso para que el encoder de video no se la coma.
          ctx!.lineWidth = 1.4 * Math.min(a.z, b.z) + 0.4;
          ctx!.beginPath();
          ctx!.moveTo(px(a), py(a));
          ctx!.lineTo(px(b), py(b));
          ctx!.stroke();
        }
      }

      for (const p of particulas) {
        // Halo suave detrás del punto: le da volumen y, sobre todo, sobrevive
        // a la compresión mucho mejor que un círculo plano de 2px.
        ctx!.fillStyle = `rgba(${AZUL}, ${0.1 * p.z * INTENSIDAD})`;
        ctx!.beginPath();
        ctx!.arc(px(p), py(p), p.r * 3.2, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = `rgba(${AZUL}, ${Math.min(0.22 + p.z * 0.72 * INTENSIDAD, 0.95)})`;
        ctx!.beginPath();
        ctx!.arc(px(p), py(p), p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function animar() {
      for (const p of particulas) {
        p.x += p.vx;
        p.y += p.vy;
        // Envolvente en vez de rebote: el rebote se nota y se siente "pelotita".
        const m = 12;
        if (p.x < -m) p.x = ancho + m;
        if (p.x > ancho + m) p.x = -m;
        if (p.y < -m) p.y = alto + m;
        if (p.y > alto + m) p.y = -m;

        // --- Repulsión del cursor ---
        if (mouseX !== null && mouseY !== null && REPULSION_RADIO > 0) {
          const dx = px(p) - mouseX;
          const dy = py(p) - mouseY;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPULSION_RADIO * REPULSION_RADIO) {
            const d = Math.sqrt(d2) || 0.001;
            // Caída cuadrática: fuerte cerca del cursor, casi nula en el borde
            // del radio. Sin esto el campo entero se mueve en bloque y se ve mal.
            const caida = 1 - d / REPULSION_RADIO;
            // Las del frente reaccionan más: refuerza el paralaje.
            const fuerza = caida * caida * REPULSION_FUERZA * p.z;
            p.ovx += (dx / d) * fuerza;
            p.ovy += (dy / d) * fuerza;
          }
        }

        // Retorno elástico a su lugar, amortiguado para que no oscile.
        p.ovx = (p.ovx - p.ox * RETORNO) * AMORTIGUACION;
        p.ovy = (p.ovy - p.oy * RETORNO) * AMORTIGUACION;
        p.ox += p.ovx;
        p.oy += p.ovy;
      }
      dibujar();
      raf = requestAnimationFrame(animar);
    }

    function arrancar() {
      cancelAnimationFrame(raf);
      if (reducido) dibujar();
      else raf = requestAnimationFrame(animar);
    }

    crear();
    arrancar();

    const alRedimensionar = () => {
      crear();
      arrancar();
    };
    const alCambiarVisibilidad = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else arrancar();
    };
    // El contenedor es pointer-events-none para no bloquear el formulario, así
    // que el canvas nunca recibe eventos: escuchamos en window y convertimos.
    const alMover = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const fuera = x < 0 || y < 0 || x > rect.width || y > rect.height;
      mouseX = fuera ? null : x;
      mouseY = fuera ? null : y;
    };
    const alSalir = () => {
      mouseX = null;
      mouseY = null;
    };

    window.addEventListener("resize", alRedimensionar);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    if (conPuntero) {
      window.addEventListener("mousemove", alMover, { passive: true });
      document.addEventListener("mouseleave", alSalir);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", alRedimensionar);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("mousemove", alMover);
      document.removeEventListener("mouseleave", alSalir);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Halo frío, anclado arriba: da aire y profundidad sin lavar el crema
          de la marca, que tiene que seguir leyéndose. */}
      <div className="absolute inset-0 bg-[radial-gradient(95%_60%_at_50%_-12%,rgba(10,102,194,0.16),transparent_72%)]" />
      <canvas
        ref={ref}
        className="size-full"
        // Se apagan hacia el centro para que la tarjeta blanca no pelee con
        // el fondo. El hueco es chico: el campo tiene que llegar cerca de la
        // tarjeta, si no se lee como sobra en vez de profundidad.
        style={{
          maskImage:
            "radial-gradient(circle at 50% 44%, transparent 0%, transparent 7%, black 34%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 44%, transparent 0%, transparent 7%, black 34%)",
        }}
      />
    </div>
  );
}
