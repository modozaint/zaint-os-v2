"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CalendarCheck,
  CircleSlash,
  Loader2,
  Play,
  Send,
  Snowflake,
  TriangleAlert,
  Zap,
} from "lucide-react";
import type { EnvioLog } from "@/lib/types";

interface Entrada {
  id: string;
  icono: "contacto" | "seguimiento" | "agendo" | "posponer" | "descarta" | "escala";
  texto: string;
  cuando: number;
}

const ICONOS: Record<Entrada["icono"], typeof Send> = {
  contacto: Send,
  seguimiento: Send,
  agendo: CalendarCheck,
  posponer: Loader2,
  descarta: Snowflake,
  escala: TriangleAlert,
};
const COLORES: Record<Entrada["icono"], string> = {
  contacto: "text-li-blue",
  seguimiento: "text-li-blue",
  agendo: "text-emerald-600",
  posponer: "text-violet-600",
  descarta: "text-li-text-2",
  escala: "text-amber-600",
};

function fmtHora(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function PilotoAutomatico({
  onRefrescarLeads,
  onEnvios,
  onToast,
}: {
  onRefrescarLeads: () => void;
  onEnvios: (envios: EnvioLog[]) => void;
  onToast: (t: string) => void;
}) {
  const [activo, setActivo] = useState(false);
  const [corriendo, setCorriendo] = useState(false);
  const [intervaloMin, setIntervaloMin] = useState(15);
  const [acelerar, setAcelerar] = useState(true);
  const [cuantosContacto, setCuantosContacto] = useState(3);
  const [cuantosSeguimientos, setCuantosSeguimientos] = useState(2);
  const [avanzarConversaciones, setAvanzarConversaciones] = useState(true);
  const [cuantasConversaciones, setCuantasConversaciones] = useState(2);
  const [log, setLog] = useState<Entrada[]>([]);
  const [demoCorriendo, setDemoCorriendo] = useState(false);
  const corriendoRef = useRef(false);

  /** Corre UN tick del motor, vuelca al feed y dice si movió algo. */
  async function procesarTick(body: Record<string, unknown>): Promise<boolean> {
    const d = await fetch("/api/motor/tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .catch(() => null);

    if (!d) {
      onToast("El ciclo falló, se reintenta en el próximo");
      return false;
    }

    const nuevas: Entrada[] = [];
    const ahora = Date.now();
    if (d.contactados > 0) {
      nuevas.push({ id: `c-${ahora}`, icono: "contacto", texto: `${d.contactados} primer mensaje enviado`, cuando: ahora });
    }
    if (d.seguimientos > 0) {
      nuevas.push({ id: `s-${ahora}`, icono: "seguimiento", texto: `${d.seguimientos} seguimiento(s) enviado(s)`, cuando: ahora });
    }
    for (const c of d.cerradas ?? []) {
      const icono: Entrada["icono"] =
        c.resultado === "agendo" ? "agendo"
          : c.resultado === "posponer" ? "posponer"
            : c.resultado === "escala" ? "escala"
              : "descarta";
      const texto =
        c.resultado === "agendo" ? `${c.nombre} — reunión agendada`
          : c.resultado === "posponer" ? `${c.nombre} — interesado, para después`
            : c.resultado === "escala" ? `${c.nombre} — escalado a humano`
              : c.resultado === "descarta" ? `${c.nombre} — no le interesó`
                : `${c.nombre} — conversación avanzada`;
      nuevas.push({ id: `k-${c.leadId}-${ahora}`, icono, texto, cuando: ahora });
    }

    if (nuevas.length) {
      setLog((l) => [...nuevas, ...l].slice(0, 60));
      onEnvios(d.envios ?? []);
      onRefrescarLeads();
    }
    return (d.contactados ?? 0) > 0 || (d.seguimientos ?? 0) > 0 || (d.cerradas?.length ?? 0) > 0;
  }

  async function correrCiclo() {
    if (corriendoRef.current) return;
    corriendoRef.current = true;
    setCorriendo(true);
    try {
      await procesarTick({
        acelerarContacto: acelerar,
        cuantosContacto,
        acelerarSeguimientos: acelerar,
        cuantosSeguimientos,
        avanzarConversaciones,
        cuantasConversaciones,
      });
    } finally {
      corriendoRef.current = false;
      setCorriendo(false);
    }
  }

  /** Demo completa: corre el flujo solo, ciclo tras ciclo, hasta resolver todo. */
  async function correrDemoCompleta() {
    if (corriendoRef.current) return;
    corriendoRef.current = true;
    setDemoCorriendo(true);
    onToast("Demo automática: corriendo el flujo completo…");
    try {
      for (let n = 0; n < 6; n++) {
        const hizo = await procesarTick({
          acelerarContacto: true,
          cuantosContacto: 6,
          acelerarSeguimientos: true,
          cuantosSeguimientos: 4,
          avanzarConversaciones: true,
          cuantasConversaciones: 6,
        });
        if (!hizo) break; // ya no queda nada que procesar
      }
      onToast("Demo completa: el flujo corrió solo hasta resolver los leads");
    } finally {
      corriendoRef.current = false;
      setDemoCorriendo(false);
    }
  }

  // Loop del piloto: mientras está activo, corre un ciclo cada N minutos.
  useEffect(() => {
    if (!activo) return;
    const ms = Math.max(1, intervaloMin) * 60_000;
    const id = setInterval(correrCiclo, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, intervaloMin, acelerar, cuantosContacto, cuantosSeguimientos, avanzarConversaciones, cuantasConversaciones]);

  function activarPiloto() {
    setActivo(true);
    onToast("Piloto automático encendido");
    correrCiclo(); // primer ciclo ya mismo, no esperar el intervalo
  }
  function apagarPiloto() {
    setActivo(false);
    onToast("Piloto automático apagado");
  }

  return (
    <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Bot size={18} className="text-li-blue" /> Piloto automático
          </h2>
          <p className="mt-1 text-[13px] text-li-text-2">
            Un solo ciclo que encadena los tres motores: contactar → seguir → dejar
            que el setter cierre solo (agenda o negativa). Vos decidís cuántos y cada
            cuánto — no corre nada sin que lo enciendas.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
            activo ? "bg-emerald-100 text-emerald-700" : "bg-black/[0.06] text-li-text-2"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${activo ? "bg-emerald-500" : "bg-li-text-2"}`} />
          {activo ? "Encendido" : "Apagado"}
        </span>
      </div>

      {/* Config */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-medium">Contactos por ciclo</span>
          <input
            type="number"
            min={0}
            max={20}
            value={cuantosContacto}
            onChange={(e) => setCuantosContacto(Number(e.target.value) || 0)}
            className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium">Seguimientos por ciclo</span>
          <input
            type="number"
            min={0}
            max={20}
            value={cuantosSeguimientos}
            onChange={(e) => setCuantosSeguimientos(Number(e.target.value) || 0)}
            className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium">Conversaciones a cerrar por ciclo</span>
          <input
            type="number"
            min={0}
            max={20}
            value={cuantasConversaciones}
            onChange={(e) => setCuantasConversaciones(Number(e.target.value) || 0)}
            disabled={!avanzarConversaciones}
            className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue disabled:opacity-40"
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium">Cada cuántos minutos</span>
          <input
            type="number"
            min={1}
            max={180}
            value={intervaloMin}
            onChange={(e) => setIntervaloMin(Number(e.target.value) || 15)}
            className="mt-1.5 w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px]">
          <input
            type="checkbox"
            checked={avanzarConversaciones}
            onChange={(e) => setAvanzarConversaciones(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-li-blue)]"
          />
          El setter sigue la conversación hasta agendar o descartar
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-li-text-2">
          <input
            type="checkbox"
            checked={acelerar}
            onChange={(e) => setAcelerar(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-li-blue)]"
          />
          <Zap size={13} /> Modo demo: ignora el reloj de la cadencia
        </label>
      </div>

      {/* Acciones */}
      <div className="mt-5 flex flex-wrap gap-3">
        {!activo ? (
          <button
            onClick={activarPiloto}
            className="inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark"
          >
            <Play size={16} /> Encender piloto
          </button>
        ) : (
          <button
            onClick={apagarPiloto}
            className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-5 py-2.5 text-[14px] font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <CircleSlash size={16} /> Apagar piloto
          </button>
        )}
        <button
          onClick={correrCiclo}
          disabled={corriendo || demoCorriendo}
          className="inline-flex items-center gap-2 rounded-full border border-li-border px-5 py-2.5 text-[14px] font-semibold text-li-text transition-colors hover:border-li-blue disabled:opacity-40"
        >
          {corriendo ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          Correr un ciclo ahora
        </button>
        <button
          onClick={correrDemoCompleta}
          disabled={corriendo || demoCorriendo}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
        >
          {demoCorriendo ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {demoCorriendo ? "Corriendo todo el flujo…" : "Demo completa (todo solo)"}
        </button>
      </div>
      <p className="mt-2 text-[12px] text-li-text-2">
        <strong>Demo completa</strong> corre el flujo solo, ciclo tras ciclo —
        contacta, conversa y cierra— hasta dejar cada lead resuelto en el tablero.
      </p>

      {/* Feed de actividad */}
      {log.length > 0 && (
        <div className="mt-5 max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-li-border bg-black/[0.015] p-3">
          {log.map((e) => {
            const Icono = ICONOS[e.icono];
            return (
              <div key={e.id} className="flex items-center gap-2 text-[13px]">
                <span className="w-11 shrink-0 tabular-nums text-li-text-2">
                  {fmtHora(e.cuando)}
                </span>
                <Icono size={14} className={`shrink-0 ${COLORES[e.icono]}`} />
                <span className="truncate text-li-text">{e.texto}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
