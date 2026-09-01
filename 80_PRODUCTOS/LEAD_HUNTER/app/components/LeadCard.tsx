"use client";

import { MapPin, Sparkles, X } from "lucide-react";
import type { Lead } from "@/lib/types";
import { Avatar } from "./Avatar";

export function LeadCard({
  lead,
  onAbrir,
  onEliminar,
  onDragStart,
  onDragEnd,
  arrastrando,
}: {
  lead: Lead;
  onAbrir: () => void;
  onEliminar: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  arrastrando: boolean;
}) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", lead.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir ${lead.nombre}`}
      className={`group card-li card-li-hover relative cursor-pointer rounded-lg bg-li-surface p-3.5 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-li-blue ${
        arrastrando ? "opacity-40" : ""
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEliminar(lead.id);
        }}
        aria-label={`Eliminar ${lead.nombre}`}
        title="Eliminar lead"
        className="absolute right-1.5 top-1.5 z-10 rounded-full p-1 text-li-text-2 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
      >
        <X size={14} />
      </button>

      <div className="flex gap-3">
        <Avatar nombre={lead.nombre} fotoUrl={lead.fotoUrl} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-tight">
            {lead.nombre}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-li-text-2">
            {[lead.cargo, lead.empresa].filter(Boolean).join(" · ") ||
              lead.headline}
          </p>
          {lead.ubicacion && (
            <p className="mt-1.5 flex items-center gap-1 truncate text-[12px] text-li-text-2">
              <MapPin size={12} className="shrink-0" />
              {lead.ubicacion}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {/* Qué tan buen cliente es, según la IA que le leyó el perfil.
                Solo se muestra cuando dice algo: "medio" es el caso normal y
                no aporta nada verlo en cada tarjeta. */}
            {lead.encaje === "alto" && (
              <span
                title={lead.porQueEncaje}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
              >
                Encaje alto
              </span>
            )}
            {lead.encaje === "bajo" && (
              <span
                title={lead.porQueEncaje}
                className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700"
              >
                Encaje bajo
              </span>
            )}
            {lead.sinPost && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Sin post reciente
              </span>
            )}
          </div>
        </div>
      </div>

      {lead.porQueBuenLead && (
        <div className="mt-3 flex items-start gap-1.5 rounded-md bg-li-blue/[0.07] px-2.5 py-2">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-li-blue" />
          <p className="line-clamp-2 text-[12px] leading-snug text-li-text">
            {lead.porQueBuenLead}
          </p>
        </div>
      )}
    </article>
  );
}
