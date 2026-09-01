"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  Gauge,
  Rocket,
  Send,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { diasQueTarda } from "@/lib/cadencia";
import { CADENCIA_DEFAULT, type ConfigCadencia, type EnvioLog, type Lead } from "@/lib/types";
import { PilotoAutomatico } from "./PilotoAutomatico";
import { MarcaVideo } from "./MarcaVideo";

/**
 * PILOTO AUTOMÁTICO — el ritmo, en un clic.
 *
 * Por qué se rehizo: la cadencia tenía ocho campos sueltos (máximo por día,
 * horario, días activos, espaciado, cuántos revisar, días de seguimiento…) y
 * cada uno pedía una decisión que nadie sabe tomar la primera vez. La pregunta
 * real es una sola: **¿qué tan fuerte querés salir?**
 *
 * Así que ahora se elige un ritmo con nombre y el resto queda configurado —
 * horario, días, espaciado y los dos seguimientos incluidos. Lo de antes sigue
 * ahí, debajo de "Ajustar a mano", para quien quiera moverlo.
 */

const DIAS = ["D", "L", "M", "M", "J", "V", "S"];

interface Ritmo {
  id: string;
  nombre: string;
  /** El número que la persona reconoce: cuántos por día. */
  porDia: number;
  /** Para quién es, en una línea. */
  para: string;
  Icono: typeof Gauge;
  config: ConfigCadencia;
}

/**
 * Los tres ritmos. El tope real de LinkedIn son ~100 invitaciones por semana y
 * es de la plataforma: Premium no lo levanta. Por eso ni el más fuerte pasa de
 * 10/día (50 por semana), que deja margen de sobra.
 */
const RITMOS: Ritmo[] = [
  {
    id: "prudente",
    nombre: "Prudente",
    porDia: 3,
    para: "Cuenta nueva o recién suspendida. Lo más seguro.",
    Icono: Clock,
    config: {
      ...CADENCIA_DEFAULT,
      maxPorDia: 3,
      diasSemana: [1, 2, 3, 4, 5],
      horaInicio: 9,
      horaFin: 18,
      espaciadoMinMin: 120,
      espaciadoMaxMin: 300,
      revisarPrimeros: 3,
      diasSeguimiento: [4, 9],
    },
  },
  {
    id: "constante",
    nombre: "Constante",
    porDia: 6,
    para: "El ritmo de trabajo normal. Cuenta con actividad real.",
    Icono: Gauge,
    config: {
      ...CADENCIA_DEFAULT,
      maxPorDia: 6,
      diasSemana: [1, 2, 3, 4, 5],
      horaInicio: 9,
      horaFin: 18,
      espaciadoMinMin: 90,
      espaciadoMaxMin: 240,
      revisarPrimeros: 5,
      diasSeguimiento: [3, 7],
    },
  },
  {
    id: "fuerte",
    nombre: "Fuerte",
    porDia: 10,
    para: "Cuenta con historial y ganas de volumen. Sigue bajo el tope.",
    Icono: Rocket,
    config: {
      ...CADENCIA_DEFAULT,
      maxPorDia: 10,
      diasSemana: [1, 2, 3, 4, 5],
      horaInicio: 8,
      horaFin: 20,
      espaciadoMinMin: 45,
      espaciadoMaxMin: 150,
      revisarPrimeros: 5,
      diasSeguimiento: [2, 6],
    },
  },
];

function fmtFecha(ms: number): string {
  return new Date(ms).toLocaleString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PilotoView({
  leads,
  onRefrescarLeads,
  onToast,
}: {
  leads: Lead[];
  onRefrescarLeads: () => void;
  onToast: (t: string) => void;
}) {
  const [cadencia, setCadencia] = useState<ConfigCadencia>(CADENCIA_DEFAULT);
  const [, setEnvios] = useState<EnvioLog[]>([]);
  const [trabajando, setTrabajando] = useState(false);
  const [aMano, setAMano] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cargarEstado = useCallback(async () => {
    const d = await fetch("/api/contactar").then((r) => r.json()).catch(() => null);
    if (d?.cadencia) setCadencia(d.cadencia);
    if (d?.envios) setEnvios(d.envios);
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const nuevos = leads.filter((l) => l.estado === "nuevos");
  const sinProgramar = nuevos.filter((l) => !l.programadoEn);
  const programados = nuevos
    .filter((l) => l.programadoEn)
    .sort((a, b) => (a.programadoEn ?? 0) - (b.programadoEn ?? 0));
  const contactados = leads.filter((l) => l.estado !== "nuevos");

  /** Qué ritmo está puesto: se reconoce por el máximo por día. */
  const ritmoActual = RITMOS.find((r) => r.config.maxPorDia === cadencia.maxPorDia);

  const tarda = useMemo(
    () => diasQueTarda(nuevos.length, cadencia),
    [nuevos.length, cadencia],
  );

  /** Elegir un ritmo lo guarda y reacomoda a todos: un clic, no tres. */
  async function elegirRitmo(r: Ritmo) {
    setCadencia(r.config);
    setTrabajando(true);
    await fetch("/api/contactar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(r.config),
    }).catch(() => {});
    // Guardar la cadencia no mueve a quien ya tenía hora: hay que rehacer el
    // calendario, si no el cambio no se nota hasta la próxima tanda.
    const d = await fetch("/api/contactar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reprogramar: true }),
    })
      .then((x) => x.json())
      .catch(() => null);
    setTrabajando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2200);
    onRefrescarLeads();
    onToast(
      `Ritmo ${r.nombre.toLowerCase()}: ${r.porDia} por día` +
        (d?.programados ? ` · ${d.programados} leads reacomodados` : ""),
    );
  }

  async function guardarAMano() {
    setTrabajando(true);
    await fetch("/api/contactar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cadencia),
    }).catch(() => {});
    await fetch("/api/contactar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reprogramar: true }),
    }).catch(() => {});
    setTrabajando(false);
    onRefrescarLeads();
    onToast("Cadencia guardada y leads reacomodados");
  }

  /** Programa a los que todavía no tienen hora asignada. */
  async function programarTodos() {
    const ids = sinProgramar.map((l) => l.id);
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
    onToast(d?.programados ? `${d.programados} leads en cola` : "No se pudo programar");
  }

  function toggleDia(d: number) {
    setCadencia((c) => {
      const set = new Set(c.diasSemana);
      set.has(d) ? set.delete(d) : set.add(d);
      return { ...c, diasSemana: [...set].sort() };
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-9">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          <Sparkles size={22} className="text-li-blue" /> Piloto automático
          <MarcaVideo escena={4} />
        </h1>
        <p className="mt-1 text-[15px] text-li-text-2">
          Elegí a qué ritmo salir. Todo lo demás —horario, espaciado y los dos
          seguimientos— queda configurado solo.
        </p>
      </header>

      {/* Los tres números de la operación */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { n: sinProgramar.length, t: "Sin programar", Icono: Users, color: "text-li-text-2" },
          { n: programados.length, t: "En cola", Icono: CalendarClock, color: "text-li-blue" },
          { n: contactados.length, t: "Contactados", Icono: Send, color: "text-emerald-600" },
        ].map(({ n, t, Icono, color }) => (
          <div key={t} className="card-li rounded-lg bg-li-surface px-4 py-3.5">
            <Icono size={15} className={color} />
            <div className={`mt-1.5 text-[26px] font-bold tabular-nums ${color}`}>{n}</div>
            <div className="text-[12px] text-li-text-2">{t}</div>
          </div>
        ))}
      </div>

      {/* RITMO — la única decisión que hay que tomar */}
      <section className="card-li rounded-lg bg-li-surface p-5">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <Gauge size={17} className="text-li-blue" /> Ritmo de salida
          {guardado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Check size={11} strokeWidth={3} /> Guardado
            </span>
          )}
        </h2>
        <p className="mt-1 text-[13px] text-li-text-2">
          Un clic configura la cadencia completa y reacomoda a los que ya estaban en cola.
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {RITMOS.map((r) => {
            const on = ritmoActual?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => elegirRitmo(r)}
                disabled={trabajando}
                className={`rounded-lg border p-3.5 text-left transition-all disabled:opacity-50 ${
                  on
                    ? "border-li-blue bg-li-blue/[0.07] ring-1 ring-li-blue"
                    : "border-li-border hover:border-li-blue hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <r.Icono size={15} className={on ? "text-li-blue" : "text-li-text-2"} />
                  <span className="text-[14px] font-semibold">{r.nombre}</span>
                  {on && <Check size={14} strokeWidth={3} className="ml-auto text-li-blue" />}
                </div>
                <div className="mt-1.5 text-[21px] font-bold tabular-nums text-li-blue">
                  {r.porDia}
                  <span className="ml-1 text-[12px] font-medium text-li-text-2">
                    por día
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-li-text-2">{r.para}</p>
              </button>
            );
          })}
        </div>

        {/* Qué implica el ritmo elegido, en lenguaje de persona */}
        {ritmoActual && (
          <div className="mt-4 rounded-lg border border-li-border bg-black/[0.02] px-4 py-3 text-[12.5px] leading-relaxed text-li-text-2">
            Con <strong className="text-li-text">{ritmoActual.nombre.toLowerCase()}</strong>:
            hasta <strong className="text-li-text">{cadencia.maxPorDia} solicitudes al día</strong>,
            de lunes a viernes entre las {cadencia.horaInicio}:00 y las {cadencia.horaFin}:00,
            separadas entre {Math.round(cadencia.espaciadoMinMin / 60)} y{" "}
            {Math.round(cadencia.espaciadoMaxMin / 60)} horas —{" "}
            <strong className="text-li-text">nunca en ráfaga</strong>. A quien no responde se
            le insiste al día {cadencia.diasSeguimiento[0]} y al día{" "}
            {cadencia.diasSeguimiento[1]}; después queda frío.
            {nuevos.length > 0 && (
              <>
                {" "}
                Los {nuevos.length} leads de la cola salen en{" "}
                <strong className="text-li-text">~{tarda} días</strong>.
              </>
            )}
          </div>
        )}

        {/* Lo de antes, para quien lo quiera */}
        <button
          onClick={() => setAMano((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-li-blue"
        >
          <ChevronDown size={15} className={`transition-transform ${aMano ? "rotate-180" : ""}`} />
          <Settings2 size={14} /> Ajustar a mano
        </button>

        {aMano && (
          <div className="mt-3 space-y-4 rounded-lg border border-dashed border-li-border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[13px] font-semibold">Máximo por día</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={cadencia.maxPorDia}
                  onChange={(e) =>
                    setCadencia((c) => ({ ...c, maxPorDia: Number(e.target.value) || 1 }))
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-li-border bg-li-surface px-3 text-[14px] outline-none focus:border-li-blue"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold">Horario</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={cadencia.horaInicio}
                    onChange={(e) =>
                      setCadencia((c) => ({ ...c, horaInicio: Number(e.target.value) || 0 }))
                    }
                    className="h-10 w-full rounded-md border border-li-border bg-li-surface px-3 text-[14px] outline-none focus:border-li-blue"
                  />
                  <span className="text-[13px] text-li-text-2">a</span>
                  <input
                    type="number"
                    min={1}
                    max={23}
                    value={cadencia.horaFin}
                    onChange={(e) =>
                      setCadencia((c) => ({ ...c, horaFin: Number(e.target.value) || 18 }))
                    }
                    className="h-10 w-full rounded-md border border-li-border bg-li-surface px-3 text-[14px] outline-none focus:border-li-blue"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold">Días activos</label>
              <div className="mt-1.5 flex gap-1.5">
                {DIAS.map((d, i) => {
                  const on = cadencia.diasSemana.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDia(i)}
                      className={`h-9 w-9 rounded-md border text-[13px] font-semibold transition-colors ${
                        on
                          ? "border-li-blue bg-li-blue text-white"
                          : "border-li-border text-li-text-2"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold">
                Seguimientos: días después del contacto
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                {cadencia.diasSeguimiento.map((d, i) => (
                  <input
                    key={i}
                    type="number"
                    min={1}
                    value={d}
                    onChange={(e) =>
                      setCadencia((c) => {
                        const n = [...c.diasSeguimiento];
                        n[i] = Number(e.target.value) || 1;
                        return { ...c, diasSeguimiento: n };
                      })
                    }
                    className="h-10 w-20 rounded-md border border-li-border bg-li-surface px-3 text-[14px] outline-none focus:border-li-blue"
                  />
                ))}
                <span className="text-[12px] text-li-text-2">
                  después, el lead queda frío
                </span>
              </div>
            </div>

            <button
              onClick={guardarAMano}
              disabled={trabajando}
              className="rounded-full bg-li-blue px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              Guardar y reacomodar
            </button>
          </div>
        )}
      </section>

      {/* Poner en cola a los que todavía no tienen hora */}
      {sinProgramar.length > 0 && (
        <button
          onClick={programarTodos}
          disabled={trabajando}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-li-blue py-3 text-[15px] font-semibold text-white transition-colors hover:bg-li-blue-dark disabled:opacity-50"
        >
          <CalendarClock size={17} />
          Poner en cola los {sinProgramar.length} leads sin programar
        </button>
      )}

      {/* El motor */}
      <div className="mt-6">
        <PilotoAutomatico
          onRefrescarLeads={onRefrescarLeads}
          onEnvios={setEnvios}
          onToast={onToast}
        />
      </div>

      {/* Próximas salidas: la prueba de que el calendario existe */}
      {programados.length > 0 && (
        <section className="card-li mt-6 rounded-lg bg-li-surface p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <CalendarClock size={16} className="text-li-blue" /> Próximas salidas
          </h2>
          <ul className="mt-3 divide-y divide-li-border">
            {programados.slice(0, 8).map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                  {l.nombre}
                </span>
                <span className="shrink-0 text-[12.5px] tabular-nums text-li-text-2">
                  {fmtFecha(l.programadoEn ?? 0)}
                </span>
              </li>
            ))}
          </ul>
          {programados.length > 8 && (
            <p className="mt-2 text-[12px] text-li-text-2">
              y {programados.length - 8} más en cola
            </p>
          )}
        </section>
      )}
    </div>
  );
}
