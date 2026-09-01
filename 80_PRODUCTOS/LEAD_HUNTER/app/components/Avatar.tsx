"use client";

import { useState } from "react";

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Foto del perfil con fallback a iniciales sobre azul. Se usa <img> plano a
 * propósito: las URLs del CDN de LinkedIn firman y expiran, y el optimizador
 * de next/image devuelve 400 con varias de ellas.
 */
export function Avatar({
  nombre,
  fotoUrl,
  size = 48,
}: {
  nombre: string;
  fotoUrl: string | null;
  size?: number;
}) {
  const [falló, setFalló] = useState(false);
  const mostrarFoto = fotoUrl && !falló;

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-li-blue"
      style={{ width: size, height: size }}
    >
      {mostrarFoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setFalló(true)}
          className="size-full object-cover"
        />
      ) : (
        <span
          className="flex size-full items-center justify-center font-semibold text-white"
          style={{ fontSize: size * 0.38 }}
          aria-hidden="true"
        >
          {iniciales(nombre)}
        </span>
      )}
    </div>
  );
}
