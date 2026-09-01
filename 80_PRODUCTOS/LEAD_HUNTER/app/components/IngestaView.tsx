"use client";

import { useState } from "react";
import { Plus, Sparkles, Upload, X } from "lucide-react";
import { ORIGENES, type Lead, type OrigenLead } from "@/lib/types";

interface Evento {
  nombre: string;
  producto: string;
  tipo: OrigenLead;
}

export function IngestaView({
  clienteNombre,
  onIngresado,
  onToast,
  onVolver,
}: {
  clienteNombre: string;
  onIngresado: (leads: Lead[]) => void;
  onToast: (t: string) => void;
  onVolver?: () => void;
}) {
  const [lista, setLista] = useState<Evento[]>([]);
  const [nombre, setNombre] = useState("");
  const [producto, setProducto] = useState("");
  const [tipo, setTipo] = useState<OrigenLead>("compra");
  const [trabajando, setTrabajando] = useState(false);

  function agregar() {
    if (!nombre.trim() || !producto.trim()) return;
    setLista((l) => [...l, { nombre: nombre.trim(), producto: producto.trim(), tipo }]);
    setNombre("");
    setProducto("");
  }

  async function ingresar(body: Record<string, unknown>, exito: (n: number) => string) {
    setTrabajando(true);
    const d = await fetch("/api/ingesta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (d?.leads) {
      onIngresado(d.leads);
      onToast(exito(d.ingresados));
    } else {
      onToast(d?.error ?? "No se pudo ingresar");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      {onVolver && (
        <button
          onClick={onVolver}
          className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-li-text-2 transition-colors hover:text-li-blue"
        >
          ← Elegir otra fuente
        </button>
      )}
      <header className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight">Ingesta de ecommerce</h1>
        <p className="mt-1 text-[15px] text-li-text-2">
          Los leads de <strong>{clienteNombre}</strong> entran por quién compró, visitó
          un producto o interactuó con una publicación. El sistema les hace seguimiento
          de calidad para recompra o suscripción.
        </p>
      </header>

      {/* Demo rápida */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Sparkles size={17} className="text-li-blue" /> Demo rápida
        </h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          Genera compradores y visitantes de ejemplo para ver el flujo completo al instante.
        </p>
        <button
          onClick={() =>
            ingresar({ demo: true, cuantos: 5 }, (n) => `${n} eventos de ejemplo ingresados`)
          }
          disabled={trabajando}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:opacity-40"
        >
          <Sparkles size={16} /> Generar 5 de ejemplo
        </button>
      </div>

      {/* Carga manual */}
      <div className="card-li rounded-lg bg-li-surface p-6">
        <h2 className="text-[15px] font-semibold">Cargar eventos manualmente</h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          Así entrarían de una tienda real (compra, visita a producto o interacción con post).
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del cliente"
            className="rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
          />
          <input
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregar())}
            placeholder="Producto"
            className="rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ORIGENES.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setTipo(o.id)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                tipo === o.id
                  ? "bg-li-blue text-white"
                  : "border border-li-border text-li-text-2 hover:border-li-blue"
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={agregar}
            disabled={!nombre.trim() || !producto.trim()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-li-border px-3 py-2 text-[14px] font-medium text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue disabled:opacity-40"
          >
            <Plus size={15} /> Añadir
          </button>
        </div>

        {lista.length > 0 && (
          <>
            <ul className="mt-4 divide-y divide-li-border">
              {lista.map((ev, i) => (
                <li key={i} className="flex items-center gap-2 py-2.5 text-[14px]">
                  <span className="flex-1 truncate">
                    {ev.nombre} <span className="text-li-text-2">· {ev.producto}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[11.5px] text-li-text-2">
                    {ORIGENES.find((o) => o.id === ev.tipo)?.label}
                  </span>
                  <button
                    onClick={() => setLista((l) => l.filter((_, j) => j !== i))}
                    className="rounded-full p-1 text-li-text-2 hover:bg-black/[0.05]"
                    aria-label="Quitar"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                ingresar({ eventos: lista }, (n) => `${n} leads ingresados`).then(() =>
                  setLista([]),
                )
              }
              disabled={trabajando}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:opacity-40"
            >
              <Upload size={16} /> Ingresar {lista.length} evento(s)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
