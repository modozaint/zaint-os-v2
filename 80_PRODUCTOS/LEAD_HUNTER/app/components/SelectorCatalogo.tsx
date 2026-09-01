"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

export interface OpcionCatalogo {
  id: string;
  title: string;
}

/**
 * Elegir del vocabulario REAL de LinkedIn en vez de escribirlo.
 *
 * Por qué: hasta el 03-08 los cargos se escribían a mano y se mandaban como
 * texto suelto. Si escribías "Dueño de ecommerce" y LinkedIn lo llama "Dueño de
 * tienda", la búsqueda salía peor sin que nadie se enterara. Acá se escribe para
 * BUSCAR, pero solo entra lo que se elige de la lista: lo que viaja siempre es
 * un término que LinkedIn reconoce.
 */
export function SelectorCatalogo({
  tipo,
  etiqueta,
  ayuda,
  placeholder,
  seleccionadas,
  onChange,
  unico = false,
  icono,
}: {
  tipo: "LOCATION" | "INDUSTRY" | "JOB_TITLE" | "COMPANY" | "SERVICE";
  etiqueta: string;
  ayuda?: string;
  placeholder: string;
  seleccionadas: OpcionCatalogo[];
  onChange: (v: OpcionCatalogo[]) => void;
  /** true = solo se puede elegir una (ubicación). */
  unico?: boolean;
  icono?: React.ReactNode;
}) {
  const [texto, setTexto] = useState("");
  const [opciones, setOpciones] = useState<OpcionCatalogo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Autocompletado con espera: no se consulta en cada tecla, sino cuando la
  // persona deja de escribir. Menos llamadas y menos parpadeo en la lista.
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) return; // lo que se muestra se deriva del texto, más abajo
    let vigente = true;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(
          `/api/linkedin/catalogo?tipo=${tipo}&q=${encodeURIComponent(q)}`,
        ).then((x) => x.json());
        if (vigente) {
          setOpciones(r.opciones ?? []);
          setAbierto(true);
        }
      } catch {
        if (vigente) setOpciones([]);
      } finally {
        if (vigente) setBuscando(false);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [texto, tipo]);

  // Cerrar la lista al hacer clic afuera.
  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  // Derivado, no estado: con menos de 2 letras no hay lista que mostrar. Así se
  // evita limpiar el estado dentro del efecto (cascada de renders).
  const visibles = texto.trim().length >= 2 ? opciones : [];

  function elegir(o: OpcionCatalogo) {
    if (unico) {
      onChange([o]);
    } else if (!seleccionadas.some((s) => s.id === o.id)) {
      onChange([...seleccionadas, o]);
    }
    setTexto("");
    setOpciones([]);
    setAbierto(false);
  }

  return (
    <div className="mb-5" ref={caja}>
      <span className="flex items-center gap-1.5 text-[13.5px] font-medium">
        {icono}
        {etiqueta}
      </span>
      {ayuda && <p className="mt-0.5 text-[12.5px] text-li-text-2">{ayuda}</p>}

      {seleccionadas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {seleccionadas.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-li-blue/10 py-1 pl-3 pr-1.5 text-[13px] font-medium text-li-blue"
            >
              {s.title}
              <button
                type="button"
                onClick={() => onChange(seleccionadas.filter((x) => x.id !== s.id))}
                aria-label={`Quitar ${s.title}`}
                className="rounded-full p-0.5 transition-colors hover:bg-li-blue/20"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => visibles.length > 0 && setAbierto(true)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-li-border bg-li-surface px-3 text-[14px] outline-none focus:border-li-blue"
        />
        {buscando && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-li-text-2"
          />
        )}

        {abierto && visibles.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-li-border bg-li-surface py-1 shadow-lg">
            {visibles.map((o) => {
              const ya = seleccionadas.some((s) => s.id === o.id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => elegir(o)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-li-blue/10"
                  >
                    <span className="truncate">{o.title}</span>
                    {ya && <Check size={14} className="shrink-0 text-li-blue" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {abierto && !buscando && !visibles.length && texto.trim().length >= 2 && (
          <p className="absolute z-20 mt-1 w-full rounded-lg border border-li-border bg-li-surface px-3 py-2 text-[13px] text-li-text-2">
            LinkedIn no tiene nada con ese nombre. Probá otra palabra.
          </p>
        )}
      </div>
    </div>
  );
}
