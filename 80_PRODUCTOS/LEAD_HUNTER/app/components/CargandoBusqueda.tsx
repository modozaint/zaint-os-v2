"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";

const ETAPAS = [
  { texto: "Buscando perfiles en LinkedIn…", segs: 0 },
  { texto: "Analizando cada perfil con IA…", segs: 14 },
  { texto: "Redactando mensajes…", segs: 26 },
];

/**
 * La búsqueda es una sola request larga, así que las etapas avanzan por
 * tiempo estimado. Los umbrales salen de los tiempos medidos en el smoke
 * test; si una etapa se pasa, se queda en la última hasta que responde.
 */
export function CargandoBusqueda() {
  const [transcurrido, setTranscurrido] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTranscurrido((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const actual = ETAPAS.reduce(
    (acc, e, i) => (transcurrido >= e.segs ? i : acc),
    0,
  );

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="card-li w-full max-w-md rounded-lg bg-li-surface p-8">
        <div className="flex items-center gap-3">
          <Loader2 size={22} className="animate-spin text-li-blue" />
          <h2 className="text-[18px] font-semibold">Rastreando leads</h2>
        </div>

        <ul className="mt-7 space-y-4">
          {ETAPAS.map((e, i) => {
            const hecha = i < actual;
            const activa = i === actual;
            return (
              <li key={e.texto} className="flex items-center gap-3">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                    hecha
                      ? "bg-li-green text-white"
                      : activa
                        ? "bg-li-blue/15 text-li-blue"
                        : "bg-black/[0.06] text-li-text-2"
                  }`}
                >
                  {hecha ? (
                    <Check size={14} strokeWidth={3} />
                  ) : activa ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span
                  className={`text-[15px] ${
                    activa
                      ? "font-medium text-li-text"
                      : hecha
                        ? "text-li-text-2"
                        : "text-li-text-2/60"
                  }`}
                >
                  {e.texto}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-7 h-1 overflow-hidden rounded-full bg-black/[0.06]">
          <motion.div
            className="h-full bg-li-blue"
            initial={{ width: "4%" }}
            animate={{ width: `${Math.min(6 + transcurrido * 2.4, 94)}%` }}
            transition={{ ease: "linear", duration: 1 }}
          />
        </div>
        <p className="mt-3 text-center text-[12px] tabular-nums text-li-text-2">
          {transcurrido}s
        </p>
      </div>
    </div>
  );
}
