"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Briefcase, Plus, ShoppingBag, UserPlus } from "lucide-react";
import type { Canal, Cliente } from "@/lib/types";

const CANALES: { id: Canal; label: string; desc: string; Icono: typeof Briefcase }[] = [
  {
    id: "linkedin",
    label: "LinkedIn (B2B)",
    desc: "Prospección fría. El setter agenda una llamada.",
    Icono: Briefcase,
  },
  {
    id: "ecommerce",
    label: "Ecommerce (post-venta)",
    desc: "Seguimiento a quien compró, visitó o interactuó. Busca recompra o suscripción.",
    Icono: ShoppingBag,
  },
];

function BadgeCanal({ canal }: { canal: Canal }) {
  const es = canal === "ecommerce";
  const Icono = es ? ShoppingBag : Briefcase;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
        es ? "bg-emerald-100 text-emerald-700" : "bg-li-blue/10 text-li-blue"
      }`}
    >
      <Icono size={12} /> {es ? "Ecommerce" : "LinkedIn"}
    </span>
  );
}

export function ClientesView({
  onCambio,
  onToast,
}: {
  onCambio: () => void;
  onToast: (t: string) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [activoId, setActivoId] = useState("");
  const [creando, setCreando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [canal, setCanal] = useState<Canal>("linkedin");
  const [nicho, setNicho] = useState("");
  const [remitente, setRemitente] = useState("");
  const [oferta, setOferta] = useState("");
  const [agendaUrl, setAgendaUrl] = useState("");
  const [colorMarca, setColorMarca] = useState("#0a66c2");

  const cargar = useCallback(async () => {
    const d = await fetch("/api/clientes").then((r) => r.json()).catch(() => null);
    if (d?.clientes) {
      setClientes(d.clientes);
      setActivoId(d.activoId);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function activar(id: string) {
    setTrabajando(true);
    const d = await fetch("/api/clientes", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activar: id }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (d?.cliente) {
      setActivoId(id);
      onToast(`Cliente activo: ${d.cliente.nombre}`);
      onCambio();
    }
  }

  async function crear() {
    if (!nombre.trim()) return;
    setTrabajando(true);
    const d = await fetch("/api/clientes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nombre,
        canal,
        nicho,
        remitente,
        oferta,
        agendaUrl,
        colorMarca,
      }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (d?.cliente) {
      onToast(`Cliente creado: ${d.cliente.nombre}`);
      setNombre("");
      setNicho("");
      setRemitente("");
      setOferta("");
      setAgendaUrl("");
      setColorMarca("#0a66c2");
      setCreando(false);
      cargar();
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-[15px] text-li-text-2">
            Cada perfil configura el sistema para un cliente y su canal. Activás uno
            y todo se re-configura solo, sin tocar código.
          </p>
        </div>
        <button
          onClick={() => setCreando((v) => !v)}
          className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full bg-li-blue px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
        >
          <UserPlus size={15} /> Nuevo cliente
        </button>
      </header>

      {/* Formulario de creación */}
      {creando && (
        <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
          <h2 className="text-[15px] font-semibold">Nuevo perfil de cliente</h2>

          <label className="mt-4 block">
            <span className="text-[13.5px] font-medium">Nombre / marca</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Barbería El Rey"
              className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
            />
          </label>

          <div className="mt-4">
            <span className="text-[13.5px] font-medium">Canal</span>
            <div className="mt-1.5 grid gap-2.5 sm:grid-cols-2">
              {CANALES.map((c) => {
                const on = canal === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCanal(c.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      on ? "border-li-blue bg-li-blue/5" : "border-li-border hover:border-li-blue/50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-semibold">
                      <c.Icono size={16} className={on ? "text-li-blue" : "text-li-text-2"} />
                      {c.label}
                    </span>
                    <span className="mt-1 block text-[12.5px] text-li-text-2">{c.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[13.5px] font-medium">Nicho</span>
              <input
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
                placeholder="Ej: Barberías, Skincare D2C"
                className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
              />
            </label>
            <label className="block">
              <span className="text-[13.5px] font-medium">Quién firma los mensajes</span>
              <input
                value={remitente}
                onChange={(e) => setRemitente(e.target.value)}
                placeholder="Ej: Santiago / Equipo de la marca"
                className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-[13.5px] font-medium">Oferta / contexto (lo usa el setter)</span>
            <textarea
              value={oferta}
              onChange={(e) => setOferta(e.target.value)}
              rows={3}
              placeholder="Qué ofrece el cliente, en 1-2 frases. El setter conversa con esto."
              className="mt-1.5 w-full resize-none rounded-md border border-li-border bg-li-surface px-3 py-2 text-[14px] outline-none focus:border-li-blue"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[13.5px] font-medium">
              Link de agenda {canal === "ecommerce" ? "o de compra (opcional)" : "Cal.com (opcional)"}
            </span>
            <input
              value={agendaUrl}
              onChange={(e) => setAgendaUrl(e.target.value)}
              placeholder="https://cal.com/tu-usuario/llamada"
              className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
            />
          </label>

          <div className="mt-4">
            <span className="text-[13.5px] font-medium">Color de marca (white-label)</span>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={colorMarca}
                onChange={(e) => setColorMarca(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-li-border bg-li-surface"
              />
              <span className="font-mono text-[13px] text-li-text-2">{colorMarca}</span>
              <span className="text-[12px] text-li-text-2">
                Al activar el cliente, toda la app se re-tinta con este color.
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={crear}
              disabled={trabajando || !nombre.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:opacity-40"
            >
              <Plus size={16} /> Crear cliente
            </button>
            <button
              onClick={() => setCreando(false)}
              className="rounded-full border border-li-border px-5 py-2.5 text-[14px] font-medium text-li-text-2 transition-colors hover:border-li-blue"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="space-y-3">
        {clientes.map((c) => {
          const activo = c.id === activoId;
          return (
            <div
              key={c.id}
              className={`card-li rounded-lg p-5 ${
                activo ? "border-li-blue bg-li-blue/[0.03] ring-1 ring-li-blue/30" : "bg-li-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="truncate text-[16px] font-semibold">{c.nombre}</h3>
                    <BadgeCanal canal={c.canal} />
                  </div>
                  {c.nicho && (
                    <p className="mt-0.5 text-[13px] text-li-text-2">{c.nicho}</p>
                  )}
                  {c.oferta && (
                    <p className="mt-2 line-clamp-2 text-[13px] text-li-text-2">{c.oferta}</p>
                  )}
                </div>
                {activo ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-li-blue px-3 py-1.5 text-[13px] font-semibold text-white">
                    <Check size={14} /> Activo
                  </span>
                ) : (
                  <button
                    onClick={() => activar(c.id)}
                    disabled={trabajando}
                    className="shrink-0 rounded-full border border-li-border px-4 py-1.5 text-[13px] font-semibold text-li-text transition-colors hover:border-li-blue hover:text-li-blue disabled:opacity-40"
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
