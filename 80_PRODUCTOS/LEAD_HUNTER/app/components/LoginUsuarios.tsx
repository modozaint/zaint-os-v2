"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck, UserRound, X } from "lucide-react";
import type { Usuario } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";

/**
 * Pantalla de entrada "¿Quién eres?": cada quien elige su usuario para empezar
 * la jornada. El rol (admin / comercial) decide qué puede ver y tocar después.
 * No es login con contraseña (es una herramienta interna de equipo, igual que la
 * referencia); el endurecimiento con credenciales reales es Capa 2.
 */
export function LoginUsuarios({
  onElegir,
}: {
  onElegir: (u: Usuario) => void;
}) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [gestion, setGestion] = useState(false);

  async function refrescar() {
    const d = await fetch("/api/usuarios").then((r) => r.json()).catch(() => null);
    setUsuarios(d?.usuarios ?? []);
    setCargando(false);
  }

  useEffect(() => {
    refrescar();
  }, []);

  async function crear() {
    const n = nombre.trim();
    if (!n) return;
    await fetch("/api/usuarios", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nombre: n, rol: "comercial" }),
    }).catch(() => {});
    setNombre("");
    setAgregando(false);
    refrescar();
  }

  async function eliminar(id: string) {
    await fetch(`/api/usuarios?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {});
    refrescar();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <h1 className="text-[26px] font-bold tracking-tight text-li-text">
        ¿Quién eres?
      </h1>
      <p className="mt-1 text-[14px] text-li-text-2">
        Elige tu nombre para empezar tu jornada.
      </p>

      {cargando ? (
        <p className="mt-10 text-[14px] text-li-text-2">Cargando…</p>
      ) : (
        <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {usuarios.map((u) => (
            <div key={u.id} className="group relative">
              <button
                onClick={() => onElegir(u)}
                className="flex w-full flex-col items-center gap-2.5 rounded-xl border border-li-border bg-li-surface px-4 py-6 transition-colors hover:border-li-blue"
              >
                <Avatar nombre={u.nombre} fotoUrl={null} size={44} />
                <span className="truncate text-[14px] font-semibold text-li-text">
                  {u.nombre}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                    u.rol === "admin"
                      ? "bg-li-blue/10 text-li-blue"
                      : "bg-black/[0.06] text-li-text-2"
                  }`}
                >
                  {u.rol === "admin" ? (
                    <>
                      <ShieldCheck size={11} /> Admin
                    </>
                  ) : (
                    <>
                      <UserRound size={11} /> Comercial
                    </>
                  )}
                </span>
              </button>
              {gestion && u.rol !== "admin" && (
                <button
                  onClick={() => eliminar(u.id)}
                  aria-label={`Eliminar ${u.nombre}`}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}

          {/* Añadir comercial */}
          {agregando ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-li-border bg-li-surface px-3 py-5">
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crear()}
                placeholder="Nombre"
                className="w-full rounded-lg border border-li-border bg-transparent px-2.5 py-1.5 text-center text-[13px] text-li-text outline-none focus:border-li-blue"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={crear}
                  className="rounded-lg bg-li-blue px-3 py-1 text-[12px] font-semibold text-white"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setAgregando(false);
                    setNombre("");
                  }}
                  className="rounded-lg px-3 py-1 text-[12px] font-semibold text-li-text-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAgregando(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-li-border px-4 py-6 text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current">
                <Plus size={20} />
              </span>
              <span className="text-[13px] font-semibold">Añadir comercial</span>
            </button>
          )}
        </div>
      )}

      {!cargando && usuarios.length > 0 && (
        <button
          onClick={() => setGestion((v) => !v)}
          className="mt-8 text-[12px] font-medium text-li-text-2 underline decoration-dotted underline-offset-2 hover:text-li-text"
        >
          {gestion ? "Listo" : "Gestionar usuarios"}
        </button>
      )}
    </div>
  );
}
