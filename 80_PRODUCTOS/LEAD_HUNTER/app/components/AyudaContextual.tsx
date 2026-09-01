"use client";

import { AnimatePresence, motion } from "motion/react";
import { Route, X } from "lucide-react";
import type { Seccion } from "./Sidebar";

const AYUDA: Record<string, { titulo: string; puntos: string[] }> = {
  clientes: {
    titulo: "Clientes",
    puntos: [
      "Cada cliente es un perfil: su oferta, su canal y su color.",
      "Al activar uno, TODA la app se re-configura (y se re-tinta) para él.",
      "Creá uno nuevo con el botón de arriba a la derecha.",
    ],
  },
  panel: {
    titulo: "Panel",
    puntos: [
      "El embudo en vivo: encontrados → contactados → interesados → reunión.",
      "Qué trabajó cada agente (analista, setter, seguidor, orquestador).",
      "El gasto real de Apify, con un presupuesto tope que bloquea antes de pasarse.",
    ],
  },
  busqueda: {
    titulo: "Búsqueda / Ingesta",
    puntos: [
      "Qué buscás: el rubro o nicho, primero (ej: barberías, clínicas dentales).",
      "Fuentes: marcá una o varias (Google Maps, LinkedIn, Instagram), con el precio por lead a la vista.",
      "'Más información (opcional)': país, ciudad (lista) y departamento/provincia si necesitás afinar.",
      "La barra te muestra resultados y costo estimado vs. tu presupuesto tope ANTES de gastar.",
    ],
  },
  leads: {
    titulo: "Leads",
    puntos: [
      "Tus prospectos en Kanban (arrastrá entre columnas) o en Tabla (con el toggle de arriba).",
      "En Tabla: buscador + filtros por estado (con color), fuente y cargo.",
      "Abrí una tarjeta/fila para ver su análisis, el mensaje y conversar con el setter.",
      "Borrá con la X de la tarjeta o limpiá el tablero desde arriba.",
    ],
  },
  bandeja: {
    titulo: "In the loop",
    puntos: [
      "Los contactos que necesitan tu decisión, con los escalados (urgentes) primero.",
      "Abrí la ficha (ventana emergente): contexto, notas del agente y acciones.",
      "En la pestaña Info agente: qué hizo cada agente, el piloto automático y el freno para revisar los primeros mensajes antes de soltar el envío real.",
    ],
  },
  ruta: {
    titulo: "Ruta",
    puntos: [
      "Dos colas: 'Traer para llamar' (nuevos) y 'Traer escalados' (urgente, el agente pidió ayuda).",
      "Llamá o escribí por WhatsApp con el número grande; el mensaje ya va cargado.",
      "Marcá cómo quedó (no contestó / contactado / descartar). Si escribís algo como 'en 23 días', el sistema reagenda exactamente eso — queda de nota para la próxima vez que le hablen.",
      "Arriba, tu objetivo del día; abajo, tus tareas (con barra de progreso).",
    ],
  },
  historial: {
    titulo: "Historial",
    puntos: [
      "El registro de cada EXTRACCIÓN (búsqueda hecha), no de personas.",
      "Navegá por mes y filtrá por fuente.",
      "Cada corrida muestra cuántos leads entraron y cuánto costó.",
      "Para buscar personas concretas, usá la sección Leads.",
    ],
  },
  ajustes: {
    titulo: "Ajustes",
    puntos: [
      "Tu nombre y la oferta base con la que el setter conversa.",
      "El idioma y el link de tu agenda (Cal.com) para las reuniones.",
    ],
  },
};

export function AyudaContextual({
  abierta,
  seccion,
  onRecorrido,
  onCerrar,
}: {
  abierta: boolean;
  seccion: Seccion;
  onRecorrido: () => void;
  onCerrar: () => void;
}) {
  const a = AYUDA[seccion] ?? AYUDA.leads;
  return (
    <AnimatePresence>
      {abierta && (
        <>
          <div onClick={onCerrar} className="fixed inset-0 z-[45]" />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed bottom-[76px] right-5 z-[46] w-[320px] rounded-2xl bg-li-surface p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-li-blue">
                  Cómo funciona esta pantalla
                </p>
                <h3 className="mt-0.5 text-[16px] font-semibold">{a.titulo}</h3>
              </div>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="rounded-full p-1 text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
              >
                <X size={16} />
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {a.puntos.map((p, i) => (
                <li key={i} className="flex gap-2 text-[13.5px] leading-snug text-li-text-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-li-blue/10 text-[10px] font-bold text-li-blue">
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ul>

            <button
              onClick={onRecorrido}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-li-border py-2 text-[13.5px] font-semibold text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
            >
              <Route size={15} /> Ver el recorrido completo
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
