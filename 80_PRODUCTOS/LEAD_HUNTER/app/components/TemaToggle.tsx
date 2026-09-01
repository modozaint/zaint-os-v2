"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "light" | "dark";

/** Botón de claro/oscuro. Persiste en localStorage; el flash inicial lo evita el script en layout.tsx. */
export function TemaToggle() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const actual = document.documentElement.dataset.theme as Tema | undefined;
    setTema(actual === "dark" ? "dark" : "light");
  }, []);

  function alternar() {
    const siguiente: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = siguiente;
    try {
      localStorage.setItem("lh_tema", siguiente);
    } catch {}
    setTema(siguiente);
  }

  if (tema === null) return <span className="h-8 w-8" aria-hidden />; // reserva el espacio, evita saltos

  return (
    <button
      onClick={alternar}
      aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={tema === "dark" ? "Modo claro" : "Modo oscuro"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
    >
      {tema === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
