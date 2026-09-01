/**
 * Cliente real de Cal.com — agendamiento automático.
 * Consulta disponibilidad y crea reservas. Ported de los scripts ya validados
 * (crear/cancelar probado 201/200).
 */
const KEY = process.env.CALCOM_API_KEY;
const EVENT = process.env.CALCOM_EVENT_TYPE_ID;
const TZ = process.env.CALCOM_TIMEZONE || "America/Bogota";

/** ¿Está Cal.com configurado? Si no, el setter no ofrece agendar automático. */
export function calcomConfigurado(): boolean {
  return Boolean(KEY && EVENT && !KEY.includes("PEGA_AQUI"));
}

export interface Disponibilidad {
  fechas: { iso: string; legible: string }[];
  horaMin: string;
  horaMax: string;
}

/** Fechas y horas reales disponibles del evento (próximos ~21 días, 5 días con cupo). */
export async function disponibilidad(): Promise<Disponibilidad> {
  const hoy = new Date();
  const fmtIso = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const start = fmtIso(new Date(hoy.getTime() + 86400000));
  const end = fmtIso(new Date(hoy.getTime() + 21 * 86400000));
  const r = await fetch(
    `https://api.cal.com/v2/slots?eventTypeId=${EVENT}&start=${start}&end=${end}&timeZone=${encodeURIComponent(TZ)}`,
    { headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": "2024-09-04" } },
  );
  const data = (((await r.json()) as { data?: Record<string, { start: string }[]> }).data) ?? {};
  const dias = Object.keys(data).sort();
  const fechas = dias.slice(0, 5).map((iso) => {
    const d = new Date(`${iso}T12:00:00-05:00`);
    return {
      iso,
      legible: new Intl.DateTimeFormat("es-CO", {
        timeZone: TZ, weekday: "long", day: "numeric", month: "long",
      }).format(d),
    };
  });
  const hhmm = (s: { start: string }) =>
    new Intl.DateTimeFormat("es-CO", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(s.start));
  const d0 = dias[0] ? data[dias[0]] : undefined;
  return {
    fechas,
    horaMin: d0?.length ? hhmm(d0[0]) : "09:00",
    horaMax: d0?.length ? hhmm(d0[d0.length - 1]) : "17:00",
  };
}

export interface ResultadoReserva {
  ok: boolean;
  status: number;
  uid?: string;
  startUtc: string;
  error?: string;
}

/** Crea una reserva. fecha=YYYY-MM-DD, hora=HH:MM (hora local Bogotá, UTC-5 fijo). */
export async function crearReserva(p: {
  fecha: string;
  hora: string;
  correo: string;
  nombre: string;
}): Promise<ResultadoReserva> {
  const startUtc = new Date(`${p.fecha}T${p.hora}:00-05:00`).toISOString();
  const r = await fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "cal-api-version": "2024-08-13",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      start: startUtc,
      eventTypeId: Number(EVENT),
      attendee: { name: p.nombre, email: p.correo, timeZone: TZ, language: "es" },
    }),
  });
  const txt = await r.text();
  let uid: string | undefined;
  try {
    uid = (JSON.parse(txt) as { data?: { uid?: string } })?.data?.uid;
  } catch {
    // respuesta no-JSON: dejamos uid vacío
  }
  return { ok: r.ok, status: r.status, uid, startUtc, error: r.ok ? undefined : txt };
}
