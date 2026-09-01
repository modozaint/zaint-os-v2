"use client";

import {
  BarChart3,
  History,
  Inbox,
  KanbanSquare,
  LogOut,
  MessagesSquare,
  Radar,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { Canal, Usuario } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { MarcaVideo, type NumEscena } from "./MarcaVideo";
import { TemaToggle } from "./TemaToggle";

export type Seccion =
  | "clientes"
  | "panel"
  | "busqueda"
  | "leads"
  | "chats"
  | "bandeja"
  | "piloto"
  | "contacto"
  | "ruta"
  | "historial"
  | "ajustes";

export function Sidebar({
  seccion,
  onCambiar,
  totalLeads,
  usuario,
  onCerrarSesion,
  abiertoMovil,
  onCerrarMovil,
}: {
  seccion: Seccion;
  onCambiar: (s: Seccion) => void;
  totalLeads: number;
  canal?: Canal;
  clienteNombre?: string;
  usuario: Usuario;
  modoDev?: boolean;
  onCerrarSesion: () => void;
  /** En celular, el sidebar es un cajón (drawer): abierto/cerrado por el topbar. */
  abiertoMovil: boolean;
  onCerrarMovil: () => void;
}) {
  const esAdmin = usuario.rol === "admin";

  /**
   * El menú, en el orden real del trabajo: de dónde salen los leads → dónde
   * caen → cómo se conversan → quién los mueve solo → qué necesita a una
   * persona → cómo va. `soloAdmin`: config y costos son del admin; el comercial
   * solo opera.
   */
  const todos: {
    id: Seccion;
    label: string;
    Icono: typeof Radar;
    escena?: NumEscena;
    soloAdmin?: boolean;
  }[] = [
    { id: "busqueda", label: "Extracción", Icono: Radar, escena: 1, soloAdmin: true },
    { id: "leads", label: "Leads", Icono: KanbanSquare, escena: 2 },
    { id: "chats", label: "Conversaciones", Icono: MessagesSquare, escena: 3 },
    { id: "piloto", label: "Piloto automático", Icono: Sparkles, escena: 4, soloAdmin: true },
    { id: "bandeja", label: "In the loop", Icono: Inbox, escena: 6 },
    { id: "panel", label: "Análisis", Icono: BarChart3, escena: 5, soloAdmin: true },
    { id: "ajustes", label: "Ajustes", Icono: Settings, escena: 7, soloAdmin: true },
    { id: "historial", label: "Historial", Icono: History, soloAdmin: true },
  ];
  const items = todos.filter((i) => esAdmin || !i.soloAdmin);

  return (
    <>
      {/* Fondo del cajón: solo en celular, solo si está abierto. */}
      {abiertoMovil && (
        <div
          onClick={onCerrarMovil}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-li-border bg-li-surface transition-transform duration-200 md:static md:z-auto md:w-[15.5rem] md:translate-x-0 ${
          abiertoMovil ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <TemaToggle />
        </div>

        {/* Qué es esto, fijo: un solo sistema, un solo canal. Antes acá se
            elegía "cliente activo" — sobra cuando el producto es uno. */}
        <div className="mx-3 mb-3 rounded-lg border border-li-border bg-li-blue/[0.05] px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-li-blue opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-li-blue" />
            </span>
            <span className="text-[12.5px] font-semibold">Prospección LinkedIn</span>
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-li-text-2">
            Extrae, escribe, conversa y agenda solo
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {items.map(({ id, label, Icono, escena }) => {
            const activo = seccion === id;
            return (
              <button
                key={id}
                data-tour={id}
                onClick={() => {
                  onCambiar(id);
                  onCerrarMovil(); // en celular, elegir una sección cierra el cajón
                }}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14.5px] transition-colors ${
                  activo
                    ? "bg-li-blue/10 font-semibold text-li-blue"
                    : "text-li-text-2 hover:bg-black/[0.04] hover:text-li-text"
                }`}
              >
                <Icono size={18} strokeWidth={activo ? 2.4 : 2} />
                <span className="flex-1">{label}</span>
                {id === "leads" && totalLeads > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      activo ? "bg-li-blue text-white" : "bg-black/[0.06] text-li-text-2"
                    }`}
                  >
                    {totalLeads}
                  </span>
                )}
                {escena && <MarcaVideo escena={escena} />}
              </button>
            );
          })}
        </nav>

        {/* Usuario en sesión + cambiar */}
        <div className="mt-auto border-t border-li-border px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar nombre={usuario.nombre} fotoUrl={null} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-li-text">
                {usuario.nombre}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-li-text-2">
                {esAdmin ? <ShieldCheck size={11} /> : <UserRound size={11} />}
                {esAdmin ? "Admin" : "Comercial"}
              </div>
            </div>
            <button
              onClick={onCerrarSesion}
              aria-label="Cambiar de usuario"
              title="Cambiar de usuario"
              className="shrink-0 rounded-md p-1.5 text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
