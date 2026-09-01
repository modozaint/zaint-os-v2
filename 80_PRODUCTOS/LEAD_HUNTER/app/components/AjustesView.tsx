"use client";

import { useState } from "react";
import { MarcaVideo } from "@/components/MarcaVideo";
import { Check, Loader2 } from "lucide-react";
import type { Ajustes } from "@/lib/types";

export function AjustesView({
  ajustes,
  onGuardar,
}: {
  ajustes: Ajustes;
  onGuardar: (a: Ajustes) => Promise<void>;
}) {
  const [local, setLocal] = useState<Ajustes>(ajustes);
  const [estado, setEstado] = useState<"listo" | "guardando" | "guardado">("listo");

  async function guardar() {
    setEstado("guardando");
    await onGuardar(local);
    setEstado("guardado");
    setTimeout(() => setEstado("listo"), 1800);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-[26px] font-semibold tracking-tight">Ajustes
          <MarcaVideo escena={7} />
        </h1>
      <p className="mt-1 text-[15px] text-li-text-2">
        Esto alimenta a la IA cuando redacta los mensajes.
      </p>

      <div className="card-li mt-6 rounded-lg bg-li-surface p-6">
        <label htmlFor="nombre" className="block text-[14px] font-semibold">
          Mi nombre
        </label>
        <p className="mt-0.5 text-[13px] text-li-text-2">
          Se usa para firmar los mensajes.
        </p>
        <input
          id="nombre"
          value={local.nombre}
          onChange={(e) => setLocal({ ...local, nombre: e.target.value })}
          className="mt-2 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
        />

        <label htmlFor="empresa" className="mt-7 block text-[14px] font-semibold">
          Mi empresa / oferta
        </label>
        <p className="mt-0.5 text-[13px] text-li-text-2">
          Se le pasa a la IA como contexto para redactar.
        </p>
        <textarea
          id="empresa"
          value={local.empresa}
          onChange={(e) => setLocal({ ...local, empresa: e.target.value })}
          rows={3}
          className="mt-2 w-full resize-y rounded-md border border-li-border bg-li-surface p-3.5 text-[15px] leading-relaxed outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
        />

        <label htmlFor="agenda" className="mt-7 block text-[14px] font-semibold">
          Link de agenda (Cal.com)
        </label>
        <p className="mt-0.5 text-[13px] text-li-text-2">
          El setter lo comparte para que el lead reserve la llamada en un hueco real.
        </p>
        <input
          id="agenda"
          value={local.agendaUrl}
          onChange={(e) => setLocal({ ...local, agendaUrl: e.target.value })}
          placeholder="https://cal.com/tu-usuario/llamada-15-min"
          className="mt-2 w-full rounded-md border border-li-border bg-li-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
        />

        <label htmlFor="idioma" className="mt-7 block text-[14px] font-semibold">
          Idioma de los mensajes
        </label>
        <select
          id="idioma"
          value={local.idioma}
          onChange={(e) =>
            setLocal({ ...local, idioma: e.target.value as Ajustes["idioma"] })
          }
          className="mt-2 w-full rounded-md border border-li-border bg-li-surface px-3 py-2.5 text-[15px] outline-none focus:border-li-blue focus:ring-1 focus:ring-li-blue"
        >
          <option value="en">Inglés</option>
          <option value="es">Español</option>
        </select>

        <button
          onClick={guardar}
          disabled={estado === "guardando"}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-li-blue px-6 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:opacity-50"
        >
          {estado === "guardando" && <Loader2 size={16} className="animate-spin" />}
          {estado === "guardado" && <Check size={16} strokeWidth={3} />}
          {estado === "guardado" ? "Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
