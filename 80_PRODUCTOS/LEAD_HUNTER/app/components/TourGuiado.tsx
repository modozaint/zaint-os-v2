"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Seccion } from "./Sidebar";

interface Paso {
  tour: string; // valor de data-tour del elemento a resaltar
  seccion: Seccion; // a qué sección navegar
  titulo: string;
  texto: string;
  soloAdmin?: boolean; // el comercial no ve estas secciones
}

const PASOS: Paso[] = [
  {
    tour: "cliente-activo",
    seccion: "clientes",
    titulo: "Cliente activo",
    texto:
      "Acá ves para quién estás trabajando. Todo el sistema se configura por cliente: al cambiarlo, la app se re-configura y hasta cambia de color.",
    soloAdmin: true,
  },
  {
    tour: "clientes",
    seccion: "clientes",
    titulo: "Clientes",
    texto:
      "Creá o activá un cliente. Definís su oferta, su canal y su color, sin tocar código.",
    soloAdmin: true,
  },
  {
    tour: "busqueda",
    seccion: "busqueda",
    titulo: "Búsqueda",
    texto:
      "Marcá una o varias fuentes (Google Maps, LinkedIn, Instagram) y traé leads de todas juntas. Ves el costo antes de gastar.",
    soloAdmin: true,
  },
  {
    tour: "leads",
    seccion: "leads",
    titulo: "Leads",
    texto:
      "Todos tus prospectos en Kanban o Tabla, cada uno con su análisis y su mensaje listo. Los movés entre estados o los borrás con la X.",
  },
  {
    tour: "bandeja",
    seccion: "bandeja",
    titulo: "In the loop",
    texto:
      "Tu workspace: los contactos que necesitan tu decisión, con los escalados primero. Abrís la ficha para trabajarlos y los agendados quedan aparte. En la pestaña Info agente está el piloto automático (y la Demo completa).",
  },
  {
    tour: "ruta",
    seccion: "ruta",
    titulo: "Ruta",
    texto:
      "Tu jornada de llamadas: traés 20 contactos de la bandeja y los trabajás de a uno. Llamás o escribís por WhatsApp y marcás cómo quedó; avanza solo al siguiente.",
  },
  {
    tour: "panel",
    seccion: "panel",
    titulo: "Panel",
    texto:
      "El embudo en vivo, cuánto trabajó cada agente y el gasto real de Apify, con un presupuesto tope que te protege.",
    soloAdmin: true,
  },
];

export function TourGuiado({
  activo,
  esAdmin,
  onNavegar,
  onCerrar,
}: {
  activo: boolean;
  esAdmin: boolean;
  onNavegar: (s: Seccion) => void;
  onCerrar: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  // El comercial solo ve los pasos de las secciones que puede operar.
  const pasos = useMemo(
    () => PASOS.filter((p) => esAdmin || !p.soloAdmin),
    [esAdmin],
  );
  const paso = pasos[i];

  // Reiniciar al abrir.
  useEffect(() => {
    if (activo) setI(0);
  }, [activo]);

  // Navegar a la sección del paso actual.
  useEffect(() => {
    if (activo && paso) onNavegar(paso.seccion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, i]);

  // Medir el elemento a resaltar (tras el render de la sección).
  useLayoutEffect(() => {
    if (!activo || !paso) return;
    const medir = () => {
      const el = document.querySelector(`[data-tour="${paso.tour}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(medir));
    window.addEventListener("resize", medir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", medir);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, i]);

  if (!activo || !paso) return null;

  const esUltimo = i === pasos.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  // Tooltip a la derecha del elemento resaltado (el sidebar está a la izquierda).
  const tipW = 320;
  const left = rect
    ? Math.min(rect.right + 16, vw - tipW - 12)
    : vw / 2 - tipW / 2;
  const top = rect ? Math.max(12, Math.min(rect.top, vh - 230)) : vh / 2 - 100;

  return (
    <>
      {/* Bloquea la interacción con la app durante el tour. */}
      <div className="fixed inset-0 z-[78]" />

      {/* Recorte que resalta el elemento (oscurece el resto). */}
      {rect && (
        <div
          className="pointer-events-none fixed z-[79] rounded-lg"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(15,17,22,0.55)",
            border: "2px solid var(--color-li-blue)",
            transition: "all 0.2s ease",
          }}
        />
      )}

      {/* Tooltip del paso */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          style={{ left, top, width: tipW }}
          className="fixed z-[80] rounded-xl bg-li-surface p-4 shadow-2xl"
        >
          <div className="flex items-center gap-1.5">
            {pasos.map((_, k) => (
              <span
                key={k}
                className={`h-1.5 rounded-full transition-all ${
                  k === i ? "w-5 bg-li-blue" : "w-1.5 bg-li-border"
                }`}
              />
            ))}
          </div>
          <h3 className="mt-3 text-[15.5px] font-semibold">{paso.titulo}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-li-text-2">
            {paso.texto}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={onCerrar}
              className="text-[13px] font-medium text-li-text-2 hover:underline"
            >
              Saltar
            </button>
            <div className="flex gap-2">
              {i > 0 && (
                <button
                  onClick={() => setI((v) => v - 1)}
                  className="rounded-full border border-li-border px-4 py-1.5 text-[13px] font-semibold text-li-text-2 transition-colors hover:border-li-blue"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={() => (esUltimo ? onCerrar() : setI((v) => v + 1))}
                className="rounded-full bg-li-blue px-5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
              >
                {esUltimo ? "Listo, empezar" : "Siguiente"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
