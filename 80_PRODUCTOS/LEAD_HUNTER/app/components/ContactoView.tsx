"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, FastForward, Lock, Plus, Repeat, Send, Save } from "lucide-react";
import { diasQueTarda } from "@/lib/cadencia";
import { CADENCIA_DEFAULT, type ConfigCadencia, type EnvioLog, type Lead } from "@/lib/types";
import { PilotoAutomatico } from "./PilotoAutomatico";

const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function fmtFecha(ms: number): string {
  return new Date(ms).toLocaleString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtHora(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function ContactoView({
  leads,
  onRefrescarLeads,
  onToast,
}: {
  leads: Lead[];
  onRefrescarLeads: () => void;
  onToast: (t: string) => void;
}) {
  const [cadencia, setCadencia] = useState<ConfigCadencia>(CADENCIA_DEFAULT);
  const [envios, setEnvios] = useState<EnvioLog[]>([]);
  const [trabajando, setTrabajando] = useState(false);
  /** Freno del contacto REAL: hasta liberarlo, no sale ninguna invitación. */
  const [aprobado, setAprobado] = useState<boolean | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  /** Cuántos leads en cola saldrían con la solicitud pelada, sin nota. */
  const [sinNota, setSinNota] = useState(0);
  const [regenerando, setRegenerando] = useState(false);

  useEffect(() => {
    fetch("/api/motor/contactar")
      .then((r) => r.json())
      .then((d) => setAprobado(d?.aprobado === true))
      .catch(() => {});
  }, []);

  async function cambiarAprobacion(v: boolean) {
    const d = await fetch("/api/motor/contactar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aprobado: v }),
    })
      .then((r) => r.json())
      .catch(() => null);
    if (d) setAprobado(d.aprobado === true);
  }

  const cargarEstado = useCallback(async () => {
    const d = await fetch("/api/contactar").then((r) => r.json()).catch(() => null);
    if (d?.cadencia) setCadencia(d.cadencia);
    if (d?.envios) setEnvios(d.envios);
    const e = await fetch("/api/leads/regenerar-lote")
      .then((r) => r.json())
      .catch(() => null);
    if (typeof e?.sinNota === "number") setSinNota(e.sinNota);
  }, []);

  /**
   * Rehace los dos textos del primer contacto (la nota de la solicitud y el
   * mensaje que sale al aceptar) de los leads que todavía no salieron. Los
   * generados antes del 03-08 no tienen nota: su solicitud iría pelada. Los ya
   * contactados no se tocan, porque ese texto ya se envió.
   */
  async function regenerarTextos() {
    setRegenerando(true);
    try {
      const d = await fetch("/api/leads/regenerar-lote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filtro: "sin-nota" }),
      })
        .then((r) => r.json())
        .catch(() => null);

      if (!d?.ok) {
        onToast(d?.error ?? "No se pudieron reescribir los textos");
        return;
      }
      const fallidos = (d.resultados ?? []).filter(
        (r: { ok?: boolean }) => !r.ok,
      ).length;
      onToast(
        d.regenerados
          ? `${d.regenerados} leads con nota y mensaje nuevos${fallidos ? ` · ${fallidos} fallaron` : ""}`
          : "Todos los leads en cola ya tienen su nota",
      );
      onRefrescarLeads();
      cargarEstado();
    } finally {
      setRegenerando(false);
    }
  }

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const nuevos = leads.filter((l) => l.estado === "nuevos");
  const sinProgramar = nuevos.filter((l) => !l.programadoEn);
  const programados = nuevos
    .filter((l) => l.programadoEn)
    .sort((a, b) => (a.programadoEn ?? 0) - (b.programadoEn ?? 0));
  const contactados = leads.filter((l) => l.estado !== "nuevos");
  // Para seguimientos: contactados que aún no respondieron, y los ya fríos.
  const enSeguimiento = leads.filter((l) => l.estado === "contactados");
  const frios = leads.filter((l) => l.estado === "frio");
  const maxSeg = cadencia.diasSeguimiento.length;

  // Por defecto, todos los "sin programar" quedan seleccionados. Se re-ajusta
  // cuando cambia el conjunto (p.ej. tras programar una tanda).
  const idsSinProgramar = sinProgramar.map((l) => l.id).join(",");
  useEffect(() => {
    setSeleccion(new Set(idsSinProgramar ? idsSinProgramar.split(",") : []));
  }, [idsSinProgramar]);

  const toggleSel = (id: string) =>
    setSeleccion((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const todosSel = sinProgramar.length > 0 && seleccion.size === sinProgramar.length;
  const toggleTodos = () =>
    setSeleccion(todosSel ? new Set() : new Set(sinProgramar.map((l) => l.id)));

  const tarda = useMemo(
    () => diasQueTarda(sinProgramar.length || nuevos.length, cadencia),
    [sinProgramar.length, nuevos.length, cadencia],
  );

  function toggleDia(d: number) {
    setCadencia((c) => {
      const set = new Set(c.diasSemana);
      set.has(d) ? set.delete(d) : set.add(d);
      return { ...c, diasSemana: [...set].sort() };
    });
  }

  async function guardarCadencia() {
    setTrabajando(true);
    await fetch("/api/contactar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cadencia),
    }).catch(() => {});
    setTrabajando(false);
    onToast("Cadencia guardada");
  }

  /**
   * Rehace el calendario de los que ya tenían hora. Guardar la cadencia NO los
   * mueve: si estaban repartidos a 3 por día, suben a 6 y siguen igual de lejos.
   */
  async function reprogramarTodo() {
    setTrabajando(true);
    const d = await fetch("/api/contactar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reprogramar: true }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (d?.leads) onRefrescarLeads();
    onToast(
      d?.programados
        ? `${d.programados} leads reprogramados con la cadencia actual`
        : "No había leads pendientes por reprogramar",
    );
  }

  async function programar() {
    const ids = [...seleccion];
    if (!ids.length) return;
    setTrabajando(true);
    const d = await fetch("/api/contactar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadIds: ids }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    onRefrescarLeads();
    if (d?.programados) onToast(`${d.programados} leads programados`);
  }

  async function procesar(acelerar: boolean) {
    setTrabajando(true);
    const d = await fetch("/api/contactar/procesar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(acelerar ? { acelerar: true, cuantos: 3 } : {}),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (d?.envios) setEnvios(d.envios);
    onRefrescarLeads();
    onToast(
      d?.enviados
        ? `${d.enviados} mensaje(s) enviado(s) (simulación)`
        : "Ninguno vencido todavía — usá Acelerar demo",
    );
  }

  async function procesarSeguimientos(acelerar: boolean) {
    setTrabajando(true);
    const d = await fetch("/api/seguimientos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(acelerar ? { acelerar: true, cuantos: 3 } : {}),
    })
      .then((r) => r.json())
      .catch(() => null);
    setTrabajando(false);
    if (d?.envios) setEnvios(d.envios);
    onRefrescarLeads();
    onToast(
      d?.enviados
        ? `${d.enviados} seguimiento(s) enviado(s) (simulación)`
        : "Ninguno vencido todavía — usá Acelerar demo",
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-tight">Contacto automático</h1>
        <p className="mt-1 text-[15px] text-li-text-2">
          El sistema envía el primer mensaje solo, con la cadencia que vos definís.
        </p>
      </header>

      {/* Banner simulación */}
      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
        <Lock size={16} className="mt-0.5 shrink-0" />
        <p>
          <strong>Modo simulación.</strong> Nada sale a LinkedIn todavía (no hay cuenta
          conectada). Todo el motor funciona igual: verás los envíos programarse, dispararse
          con cadencia y mover las tarjetas del kanban. El envío real se conecta después.
        </p>
      </div>

      <PilotoAutomatico
        onRefrescarLeads={onRefrescarLeads}
        onEnvios={setEnvios}
        onToast={onToast}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { n: sinProgramar.length, l: "Sin programar" },
          { n: programados.length, l: "Programados" },
          { n: contactados.length, l: "Contactados" },
        ].map((s) => (
          <div key={s.l} className="card-li rounded-lg bg-li-surface p-4 text-center">
            <div className="text-[26px] font-semibold tabular-nums text-li-blue">{s.n}</div>
            <div className="text-[13px] text-li-text-2">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Config cadencia — simple: un preset de un clic para cada cosa, con la
          opción exacta siempre visible al lado (nadie se queda sin el detalle
          fino, pero el caso común se resuelve sin escribir nada). */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <CalendarClock size={18} className="text-li-blue" /> Cadencia
        </h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          Cuántos contactás por día, en qué horario, qué días y cuánto insistís
          a quien no responde.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <span className="text-[13.5px] font-medium">Máximo por día</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCadencia((c) => ({ ...c, maxPorDia: n }))}
                  className={`h-8 min-w-8 rounded-full px-2.5 text-[13px] font-semibold transition-colors ${
                    cadencia.maxPorDia === n
                      ? "bg-li-blue text-white"
                      : "border border-li-border text-li-text-2 hover:border-li-blue"
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={50}
                value={cadencia.maxPorDia}
                onChange={(e) =>
                  setCadencia((c) => ({ ...c, maxPorDia: Number(e.target.value) || 1 }))
                }
                aria-label="Otro máximo por día"
                className="h-8 w-16 rounded-md border border-li-border bg-li-surface px-2 text-[13px] outline-none focus:border-li-blue"
              />
            </div>
          </div>

          <div>
            <span className="text-[13.5px] font-medium">Horario de envío</span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="time"
                step={3600}
                value={`${String(cadencia.horaInicio).padStart(2, "0")}:00`}
                onChange={(e) =>
                  setCadencia((c) => ({
                    ...c,
                    horaInicio: Number(e.target.value.split(":")[0]) || 0,
                  }))
                }
                className="w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
              />
              <span className="text-li-text-2">a</span>
              <input
                type="time"
                step={3600}
                value={`${String(cadencia.horaFin).padStart(2, "0")}:00`}
                onChange={(e) =>
                  setCadencia((c) => ({
                    ...c,
                    horaFin: Number(e.target.value.split(":")[0]) || 18,
                  }))
                }
                className="w-full rounded-md border border-li-border bg-li-surface px-3 py-2 text-[15px] outline-none focus:border-li-blue"
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-medium">Días activos</span>
            <div className="flex gap-3 text-[12.5px] font-medium text-li-blue">
              <button type="button" onClick={() => setCadencia((c) => ({ ...c, diasSemana: [1, 2, 3, 4, 5] }))} className="hover:underline">
                Lun–vie
              </button>
              <button type="button" onClick={() => setCadencia((c) => ({ ...c, diasSemana: [0, 1, 2, 3, 4, 5, 6] }))} className="hover:underline">
                Todos
              </button>
            </div>
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {DIAS.map((d, i) => {
              const on = cadencia.diasSemana.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  title={DIAS_LARGO[i]}
                  onClick={() => toggleDia(i)}
                  className={`h-9 w-9 rounded-full text-[13px] font-semibold transition-colors ${
                    on
                      ? "bg-li-blue text-white"
                      : "border border-li-border text-li-text-2 hover:border-li-blue"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <span className="text-[13.5px] font-medium">Seguimientos</span>
          <p className="mt-0.5 text-[12px] text-li-text-2">
            A quien no responde, cuántos días después le insiste el sistema. Agotados, queda frío.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {cadencia.diasSeguimiento.map((dia, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-li-border bg-black/[0.02] py-1 pl-3 pr-1.5 text-[13px]"
              >
                Día {dia}
                <button
                  type="button"
                  aria-label={`Quitar seguimiento del día ${dia}`}
                  onClick={() =>
                    setCadencia((c) => ({
                      ...c,
                      diasSeguimiento: c.diasSeguimiento.filter((_, j) => j !== i),
                    }))
                  }
                  className="flex h-5 w-5 items-center justify-center rounded-full text-li-text-2 hover:bg-black/[0.06] hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
            {cadencia.diasSeguimiento.length < 5 && (
              <button
                type="button"
                onClick={() =>
                  setCadencia((c) => {
                    const ultimo = c.diasSeguimiento[c.diasSeguimiento.length - 1] ?? 0;
                    return { ...c, diasSeguimiento: [...c.diasSeguimiento, ultimo + 4] };
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-li-border px-3 py-1 text-[13px] font-medium text-li-blue hover:border-li-blue"
              >
                <Plus size={13} /> Añadir
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <span className="text-[13.5px] font-medium">
            Prospecto a futuro: re-contactar en
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {[15, 30, 45, 60, 90].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCadencia((c) => ({ ...c, diasReContacto: n }))}
                className={`h-8 rounded-full px-3 text-[13px] font-semibold transition-colors ${
                  cadencia.diasReContacto === n
                    ? "bg-li-blue text-white"
                    : "border border-li-border text-li-text-2 hover:border-li-blue"
                }`}
              >
                {n}d
              </button>
            ))}
          </div>
          <span className="mt-1.5 block text-[12px] text-li-text-2">
            Al lead interesado que pide tiempo, se aparta para re-contactarlo en{" "}
            <strong>{cadencia.diasReContacto} días</strong> (con calma, cuando ya haya
            visto beneficios).
          </span>
        </div>

        <p className="mt-5 rounded-lg bg-black/[0.02] px-3 py-2 text-[13px] text-li-text-2">
          Con esta cadencia, contactar <strong>{nuevos.length}</strong> leads toma ~
          <strong>{tarda} días</strong>. Espaciado irregular entre {cadencia.espaciadoMinMin}
          –{cadencia.espaciadoMaxMin} min para no parecer un robot.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={guardarCadencia}
            disabled={trabajando}
            className="inline-flex items-center gap-2 rounded-full border border-li-border px-4 py-2 text-[14px] font-medium text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue disabled:opacity-40"
          >
            <Save size={15} /> Guardar cadencia
          </button>
          <button
            onClick={reprogramarTodo}
            disabled={trabajando}
            className="inline-flex items-center gap-2 rounded-full border border-li-border px-4 py-2 text-[14px] font-medium text-li-text-2 transition-colors hover:border-li-blue hover:text-li-blue disabled:opacity-40"
          >
            <CalendarClock size={15} /> Aplicar a los ya programados
          </button>
        </div>
        {/* Guardar la cadencia no mueve a quien ya tenía hora asignada: hay que
            rehacerles el calendario a propósito. Sin este aviso, subir el máximo
            por día parece no hacer nada. */}
        <p className="mt-2 text-[12.5px] leading-snug text-li-text-2">
          Guardar la cadencia aplica a los leads <strong>nuevos</strong>. A los que
          ya tienen hora asignada hay que rehacerles el calendario con{" "}
          <strong>Aplicar a los ya programados</strong>, o siguen saliendo al
          ritmo viejo. Nunca toca a los ya contactados.
        </p>
      </div>

      {/* Selección de leads a contactar */}
      {sinProgramar.length > 0 && (
        <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">A quién contactar</h2>
            <button
              onClick={toggleTodos}
              className="text-[13px] font-medium text-li-blue hover:underline"
            >
              {todosSel ? "Quitar todos" : "Seleccionar todos"}
            </button>
          </div>
          <p className="mt-1 text-[13px] text-li-text-2">
            El primer mensaje sale solo a los que marques.
          </p>
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {sinProgramar.map((l) => (
              <li key={l.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-black/[0.03]">
                  <input
                    type="checkbox"
                    checked={seleccion.has(l.id)}
                    onChange={() => toggleSel(l.id)}
                    className="h-4 w-4 shrink-0 accent-[var(--color-li-blue)]"
                  />
                  <span className="min-w-0 flex-1 truncate text-[14px]">
                    {l.nombre}{" "}
                    <span className="text-li-text-2">· {l.empresa}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acciones */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="text-[15px] font-semibold">Motor</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={programar}
            disabled={trabajando || seleccion.size === 0}
            className="inline-flex items-center gap-2 rounded-full bg-li-blue px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CalendarClock size={16} /> Programar contacto ({seleccion.size})
          </button>
          <button
            onClick={() => procesar(false)}
            disabled={trabajando || programados.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-li-border px-5 py-2.5 text-[14px] font-semibold text-li-text transition-colors hover:border-li-blue disabled:opacity-40"
          >
            <Send size={16} /> Enviar los que ya toca
          </button>
          <button
            onClick={() => procesar(true)}
            disabled={trabajando || programados.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-li-blue/40 bg-li-blue/5 px-5 py-2.5 text-[14px] font-semibold text-li-blue transition-colors hover:bg-li-blue/10 disabled:opacity-40"
          >
            <FastForward size={16} /> Acelerar demo (próximos 3)
          </button>
        </div>
      </div>

      {/* Seguimientos (Módulo 3) */}
      <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Repeat size={17} className="text-li-blue" /> Seguimientos
        </h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          A quien no responde, el sistema insiste con cadencia de días (
          {cadencia.diasSeguimiento.join(", ")}) y luego lo deja frío para
          re-prospectar. Cada seguimiento aporta un ángulo nuevo, sin sonar a reclamo.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-li-border p-3 text-center">
            <div className="text-[22px] font-semibold tabular-nums text-li-blue">
              {enSeguimiento.length}
            </div>
            <div className="text-[12.5px] text-li-text-2">En seguimiento</div>
          </div>
          <div className="rounded-lg border border-li-border p-3 text-center">
            <div className="text-[22px] font-semibold tabular-nums text-li-text-2">
              {frios.length}
            </div>
            <div className="text-[12.5px] text-li-text-2">Fríos</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => procesarSeguimientos(false)}
            disabled={trabajando || enSeguimiento.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-li-border px-5 py-2.5 text-[14px] font-semibold text-li-text transition-colors hover:border-li-blue disabled:opacity-40"
          >
            <Send size={16} /> Enviar los que ya toca
          </button>
          <button
            onClick={() => procesarSeguimientos(true)}
            disabled={trabajando || enSeguimiento.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-li-blue/40 bg-li-blue/5 px-5 py-2.5 text-[14px] font-semibold text-li-blue transition-colors hover:bg-li-blue/10 disabled:opacity-40"
          >
            <FastForward size={16} /> Acelerar demo (próximos 3)
          </button>
        </div>
      </div>

      {/* Plan de envío */}
      {programados.length > 0 && (
        <div className="card-li mb-6 rounded-lg bg-li-surface p-6">
          <h2 className="text-[15px] font-semibold">
            Plan de envío ({programados.length})
          </h2>
          <p className="mt-1 text-[13px] text-li-text-2">
            Revisá los primeros {cadencia.revisarPrimeros}: si están bien, soltá el resto.
          </p>

          {/* Leads sin nota de invitación: su solicitud saldría pelada. Los
              textos se redactan al entrar el lead y quedan guardados, así que
              los de antes del 03-08 no tienen nota y hay que rehacerlos. */}
          {sinNota > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-amber-900">
                <strong>
                  {sinNota} {sinNota === 1 ? "lead saldría" : "leads saldrían"} con la
                  solicitud vacía.
                </strong>{" "}
                <span className="text-amber-900/80">
                  Se generaron antes de que la nota existiera, así que la
                  invitación va pelada y el lead decide si acepta viendo solo tu
                  foto. Reescribilos para que lleven nota corta ahora, y el
                  mensaje largo al aceptar.
                </span>
              </span>
              <button
                type="button"
                onClick={regenerarTextos}
                disabled={regenerando}
                className="rounded-full bg-amber-600 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
              >
                {regenerando ? "Reescribiendo…" : "Reescribir textos"}
              </button>
            </div>
          )}

          {/* Freno del envío REAL. Mientras está puesto, n8n corre pero no sale
              ninguna invitación: es el paso manual que permite la propuesta. */}
          {aprobado !== null && (
            <div
              className={`mt-3 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
                aprobado
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <span className="min-w-0 flex-1 text-[13px] leading-snug">
                {aprobado ? (
                  <>
                    <strong className="text-emerald-800">Envío liberado.</strong>{" "}
                    <span className="text-emerald-900/80">
                      Las invitaciones salen solas según tu cadencia.
                    </span>
                  </>
                ) : (
                  <>
                    <strong className="text-amber-900">Envío frenado.</strong>{" "}
                    <span className="text-amber-900/80">
                      No sale ninguna invitación hasta que lo liberes.
                    </span>
                  </>
                )}
              </span>
              <button
                onClick={() => cambiarAprobacion(!aprobado)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  aprobado
                    ? "border border-li-border bg-li-surface text-li-text-2 hover:border-red-300 hover:text-red-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {aprobado ? "Frenar envío" : "Están bien, soltar el resto"}
              </button>
            </div>
          )}
          <ul className="mt-3 divide-y divide-li-border">
            {programados.map((l, i) => (
              <li key={l.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 w-6 shrink-0 text-[13px] font-semibold tabular-nums text-li-text-2">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14px] font-medium">
                      {l.nombre} <span className="text-li-text-2">· {l.empresa}</span>
                    </span>
                    <span className="shrink-0 text-[12.5px] tabular-nums text-li-blue">
                      {l.programadoEn ? fmtFecha(l.programadoEn) : ""}
                    </span>
                  </div>
                  {i < cadencia.revisarPrimeros && (
                    <div className="mt-1 space-y-1.5">
                      {/* Los dos momentos, en el orden en que los va a leer. */}
                      <div className="rounded-md border border-li-blue/25 bg-li-blue/[0.06] px-3 py-2">
                        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-li-blue">
                          1 · Va en la solicitud
                          {l.notaInvitacion
                            ? ` (${l.notaInvitacion.length}/280)`
                            : ""}
                        </span>
                        <p className="mt-1 text-[13px] leading-relaxed text-li-text-2">
                          {l.notaInvitacion?.trim() || (
                            <em className="text-amber-700">
                              Sin nota: la solicitud saldría vacía.
                            </em>
                          )}
                        </p>
                      </div>
                      <div className="rounded-md bg-black/[0.03] px-3 py-2">
                        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-li-text-2">
                          2 · Cuando acepte
                        </span>
                        <p className="mt-1 text-[13px] leading-relaxed text-li-text-2">
                          {l.mensaje}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Registro de envíos */}
      {envios.length > 0 && (
        <div className="card-li rounded-lg bg-li-surface p-6">
          <h2 className="text-[15px] font-semibold">
            Registro de envíos ({envios.length})
          </h2>
          <ul className="mt-3 space-y-1.5">
            {envios.map((e, i) => (
              <li
                key={`${e.leadId}-${i}`}
                className="flex items-center gap-2 text-[13.5px] text-li-text-2"
              >
                <span className="tabular-nums text-li-text-2">{fmtHora(e.cuando)}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  SIMULADO
                </span>
                <span className="truncate text-li-text">
                  {e.nombre} · {e.empresa}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
