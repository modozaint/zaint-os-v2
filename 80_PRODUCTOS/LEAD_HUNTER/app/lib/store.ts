import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  AJUSTES_DEFAULT,
  CADENCIA_DEFAULT,
  CLIENTES_DEFAULT,
  COLOR_DEFAULT,
  type Ajustes,
  type Cliente,
  type ConfigCadencia,
  type EnvioLog,
  type Extraccion,
  type FuenteExtraccion,
  type Lead,
  type ResultadoLlamada,
  type Rol,
  type Usuario,
  USUARIOS_DEFAULT,
} from "./types";
import { programarEnvios } from "./cadencia";
import { sincronizarLead, sincronizarLeads } from "./airtable";

/**
 * Archivo de persistencia local: los datos sobreviven al reinicio del server.
 * En producción (Docker) se apunta a un volumen con DATOS_DIR, para que los
 * leads no se pierdan cada vez que se reconstruye la imagen.
 */
const ARCHIVO = join(process.env.DATOS_DIR?.trim() || process.cwd(), "_datos.json");

/**
 * Estado del tablero en memoria del servidor. Es una demo: no hay base de
 * datos y todo se pierde al reiniciar, que es exactamente lo que queremos
 * para grabar.
 *
 * Va colgado de globalThis porque en dev el hot-reload recarga los módulos
 * y si no, cada cambio de archivo vaciaría el tablero.
 */
interface EstadoGlobal {
  leads: Map<string, Lead>;
  ajustes: Ajustes;
  cadencia: ConfigCadencia;
  envios: EnvioLog[];
  clientes: Cliente[];
  clienteActivoId: string;
  /** Cuántas veces corrió el Orquestador (un ciclo del piloto automático). */
  ciclosMotor: number;
  /** Presupuesto tope propio (USD/mes) para el gasto en Apify. */
  presupuestoTopeUsd: number;
  /**
   * Contacto real liberado. Arranca en false: el usuario revisa los primeros
   * mensajes del plan y recién ahí suelta el envío automático. Es el paso
   * manual que la propuesta de Nexum permite ("revisá los primeros cinco y, si
   * están bien, un botón para mandar el resto").
   */
  contactoAprobado: boolean;
  /** Roster de usuarios de la app (login "¿Quién eres?" + roles). */
  usuarios: Usuario[];
  /** Historial de extracciones (auditoría de búsquedas hechas). */
  extracciones: Extraccion[];
}

/** Lee el estado del disco si existe (para sobrevivir a reinicios del server). */
function cargarDisco(): EstadoGlobal | null {
  try {
    if (!existsSync(ARCHIVO)) return null;
    const raw = JSON.parse(readFileSync(ARCHIVO, "utf8"));
    return {
      leads: new Map<string, Lead>(raw.leads ?? []),
      ajustes: { ...AJUSTES_DEFAULT, ...raw.ajustes },
      cadencia: { ...CADENCIA_DEFAULT, ...raw.cadencia },
      envios: Array.isArray(raw.envios) ? raw.envios : [],
      clientes: Array.isArray(raw.clientes) ? raw.clientes : [],
      clienteActivoId: typeof raw.clienteActivoId === "string" ? raw.clienteActivoId : "",
      ciclosMotor: typeof raw.ciclosMotor === "number" ? raw.ciclosMotor : 0,
      presupuestoTopeUsd:
        typeof raw.presupuestoTopeUsd === "number" ? raw.presupuestoTopeUsd : 5,
      contactoAprobado: raw.contactoAprobado === true,
      usuarios: Array.isArray(raw.usuarios) ? raw.usuarios : [],
      extracciones: Array.isArray(raw.extracciones) ? raw.extracciones : [],
    };
  } catch {
    return null;
  }
}

const g = globalThis as unknown as { __leadhunter?: EstadoGlobal };

if (!g.__leadhunter) {
  g.__leadhunter =
    cargarDisco() ?? {
      leads: new Map<string, Lead>(),
      ajustes: { ...AJUSTES_DEFAULT },
      cadencia: { ...CADENCIA_DEFAULT },
      envios: [],
      clientes: CLIENTES_DEFAULT.map((c) => ({ ...c })),
      clienteActivoId: CLIENTES_DEFAULT[0].id,
      ciclosMotor: 0,
      presupuestoTopeUsd: 5,
      contactoAprobado: false,
      usuarios: USUARIOS_DEFAULT.map((u) => ({ ...u })),
      extracciones: [],
    };
}

const estado = g.__leadhunter;

/** Guarda el estado en disco. Silencioso: nunca rompe la operación. */
function persistir(): void {
  try {
    writeFileSync(
      ARCHIVO,
      JSON.stringify({
        leads: [...estado.leads.entries()],
        ajustes: estado.ajustes,
        cadencia: estado.cadencia,
        envios: estado.envios,
        clientes: estado.clientes,
        clienteActivoId: estado.clienteActivoId,
        ciclosMotor: estado.ciclosMotor,
        presupuestoTopeUsd: estado.presupuestoTopeUsd,
        contactoAprobado: estado.contactoAprobado,
        usuarios: estado.usuarios,
        extracciones: estado.extracciones,
      }),
    );
  } catch {
    // Si falla el guardado, seguimos: la operación en memoria ya se hizo.
  }
}

// Migración en caliente: si el estado global venía de una sesión anterior sin
// estos campos (los leads ya estaban cargados), los rellenamos sin borrar nada.
if (!estado.cadencia) estado.cadencia = { ...CADENCIA_DEFAULT };
if (!Array.isArray(estado.cadencia.diasSeguimiento)) {
  estado.cadencia.diasSeguimiento = [...CADENCIA_DEFAULT.diasSeguimiento];
}
if (typeof estado.cadencia.diasReContacto !== "number") {
  estado.cadencia.diasReContacto = CADENCIA_DEFAULT.diasReContacto;
}
if (typeof estado.ajustes.agendaUrl !== "string") estado.ajustes.agendaUrl = "";
if (!Array.isArray(estado.envios)) estado.envios = [];
// Perfiles por cliente: si el estado venía de antes, sembramos los de ejemplo.
if (!Array.isArray(estado.clientes) || estado.clientes.length === 0) {
  estado.clientes = CLIENTES_DEFAULT.map((c) => ({ ...c }));
}
if (!estado.clienteActivoId || !estado.clientes.some((c) => c.id === estado.clienteActivoId)) {
  estado.clienteActivoId = estado.clientes[0].id;
}
// White-label: clientes viejos sin color de marca reciben el suyo (o el default).
for (const c of estado.clientes) {
  if (typeof c.colorMarca !== "string" || !c.colorMarca) {
    c.colorMarca = CLIENTES_DEFAULT.find((d) => d.id === c.id)?.colorMarca ?? COLOR_DEFAULT;
  }
}
// Cada lead pertenece a un cliente. Los viejos sin dueño se asignan por su
// origen: los de ecommerce al cliente ecommerce; el resto, al de LinkedIn.
{
  const cliLinkedin =
    estado.clientes.find((c) => c.canal === "linkedin") ?? estado.clientes[0];
  const cliEcom =
    estado.clientes.find((c) => c.canal === "ecommerce") ?? estado.clientes[0];
  const esEcom = (o?: string) =>
    o === "compra" || o === "visita_producto" || o === "interaccion_post";
  for (const l of estado.leads.values()) {
    if (!l.clienteId) l.clienteId = (esEcom(l.origen) ? cliEcom : cliLinkedin).id;
  }
}
if (estado.ajustes.canal !== "linkedin" && estado.ajustes.canal !== "ecommerce") {
  estado.ajustes.canal = "linkedin";
}
if (typeof estado.ciclosMotor !== "number") estado.ciclosMotor = 0;
if (typeof estado.presupuestoTopeUsd !== "number") estado.presupuestoTopeUsd = 5;
// Por seguridad, un estado viejo arranca SIN contacto liberado.
if (typeof estado.contactoAprobado !== "boolean") estado.contactoAprobado = false;
// Roster de usuarios: si venía vacío, sembramos los de ejemplo; y garantizamos
// que SIEMPRE haya al menos un admin (nadie se queda sin acceso a la config).
if (!Array.isArray(estado.usuarios) || estado.usuarios.length === 0) {
  estado.usuarios = USUARIOS_DEFAULT.map((u) => ({ ...u }));
}
if (!estado.usuarios.some((u) => u.rol === "admin")) {
  estado.usuarios[0].rol = "admin";
}
if (!Array.isArray(estado.extracciones)) estado.extracciones = [];

export function listarLeads(): Lead[] {
  return [...estado.leads.values()].sort((a, b) => a.creadoEn - b.creadoEn);
}

export function obtenerLead(id: string): Lead | undefined {
  return estado.leads.get(id);
}

export function guardarLeads(nuevos: Lead[]): void {
  for (const lead of nuevos) {
    // El lead nace del cliente activo: hereda su contexto para siempre.
    if (!lead.clienteId) lead.clienteId = estado.clienteActivoId;
    estado.leads.set(lead.id, lead);
  }
  persistir();
  sincronizarLeads(nuevos).catch(() => {}); // CRM Airtable, fire-and-forget
}

export function actualizarLead(
  id: string,
  cambios: Partial<
    Pick<
      Lead,
      | "estado"
      | "nota"
      | "mensaje"
      | "notaInvitacion"
      | "encaje"
      | "porQueEncaje"
      | "nombreContacto"
      | "conversacion"
      | "escalado"
      | "escaladoEn"
      | "motivoEscalado"
      | "escaladoAvisadoEn"
      | "recontactarEn"
      | "programadoEn"
      | "notaAgente"
      | "providerId"
      | "chatId"
      | "ultimoMsgUnipile"
      | "citaUid"
      | "citaEn"
      | "recordatorioEn"
      | "contactadoEn"
      | "aceptadoEn"
    >
  >,
): Lead | undefined {
  const lead = estado.leads.get(id);
  if (!lead) return undefined;
  const actualizado = { ...lead, ...cambios };
  estado.leads.set(id, actualizado);
  persistir();
  sincronizarLead(actualizado); // CRM Airtable, fire-and-forget
  return actualizado;
}

/** Elimina un lead del tablero. Devuelve true si existía. */
export function eliminarLead(id: string): boolean {
  const ok = estado.leads.delete(id);
  if (ok) persistir();
  return ok;
}

export type ModoLimpieza = "todos" | "reunion" | "cerrados";

/**
 * Limpia el tablero del CLIENTE ACTIVO (no toca otros clientes):
 * - todos: borra todos sus leads.
 * - reunion: borra solo los que ya agendaron reunión.
 * - cerrados: borra los cerrados (reunión agendada + fríos).
 * Devuelve cuántos borró.
 */
export function limpiarLeads(modo: ModoLimpieza): number {
  const activo = estado.clienteActivoId;
  let n = 0;
  for (const [id, l] of [...estado.leads.entries()]) {
    if (l.clienteId && l.clienteId !== activo) continue;
    const match =
      modo === "todos"
        ? true
        : modo === "reunion"
          ? l.estado === "reunion"
          : l.estado === "reunion" || l.estado === "frio";
    if (match) {
      estado.leads.delete(id);
      n++;
    }
  }
  if (n) persistir();
  return n;
}

export function obtenerAjustes(): Ajustes {
  return estado.ajustes;
}

export function guardarAjustes(cambios: Partial<Ajustes>): Ajustes {
  estado.ajustes = { ...estado.ajustes, ...cambios };
  persistir();
  return estado.ajustes;
}

// ─── Perfiles por cliente (config sin código) ───────────────────────────────

export function listarClientes(): Cliente[] {
  return estado.clientes;
}

export function obtenerClienteActivo(): Cliente | undefined {
  return estado.clientes.find((c) => c.id === estado.clienteActivoId);
}

/**
 * Config (Ajustes) del cliente DUEÑO del lead — no la del cliente activo. Es la
 * clave para que el setter use SIEMPRE el contexto correcto del lead (su oferta,
 * canal y remitente), y nunca mezcle un lead de un cliente con la oferta de otro.
 */
/**
 * Ajustes efectivos del CLIENTE ACTIVO, sin depender de que alguien haya
 * pulsado "Activar" en esta instalación.
 *
 * Por qué existe: `estado.ajustes` guarda una copia que solo se refresca al
 * activar un cliente. En una instalación nueva quedaban los valores de fábrica
 * ("Nexus Reach", firma "Tu Nombre") y cualquier mensaje generado antes de
 * tocar esa pantalla salía con la oferta equivocada.
 */
export function ajustesActivos(): Ajustes {
  const c = estado.clientes.find((x) => x.id === estado.clienteActivoId);
  if (!c) return estado.ajustes;
  return {
    nombre: c.remitente,
    empresa: c.oferta,
    idioma: estado.ajustes.idioma,
    agendaUrl: c.agendaUrl,
    canal: c.canal,
  };
}

export function ajustesDeLead(lead: Lead): Ajustes {
  const c = lead.clienteId
    ? estado.clientes.find((x) => x.id === lead.clienteId)
    : undefined;
  // Sin cliente propio, se usa el del cliente ACTIVO — nunca `estado.ajustes`
  // a secas, que en una instalación nueva son los valores de fábrica
  // ("Nexus Reach", firma "Tu Nombre") y salieron a un lead real el 30-07.
  if (!c) return ajustesActivos();
  return {
    nombre: c.remitente,
    empresa: c.oferta,
    idioma: estado.ajustes.idioma,
    agendaUrl: c.agendaUrl,
    canal: c.canal,
  };
}

/** Copia la config del cliente a los ajustes/cadencia vivos del sistema. */
function aplicarConfig(c: Cliente): void {
  estado.ajustes = {
    ...estado.ajustes,
    nombre: c.remitente,
    empresa: c.oferta,
    agendaUrl: c.agendaUrl,
    canal: c.canal,
  };
  estado.cadencia = { ...c.cadencia };
}

/** Cambia el cliente activo y re-configura TODO el sistema con su perfil. */
export function activarCliente(id: string): Cliente | undefined {
  const c = estado.clientes.find((x) => x.id === id);
  if (!c) return undefined;
  estado.clienteActivoId = id;
  aplicarConfig(c);
  persistir();
  return c;
}

export function crearCliente(datos: Omit<Cliente, "id" | "creadoEn" | "cadencia"> & {
  cadencia?: ConfigCadencia;
}): Cliente {
  const c: Cliente = {
    id: `cli-${Date.now()}`,
    creadoEn: Date.now(),
    cadencia: datos.cadencia ?? { ...CADENCIA_DEFAULT },
    nombre: datos.nombre,
    canal: datos.canal,
    nicho: datos.nicho,
    remitente: datos.remitente,
    oferta: datos.oferta,
    agendaUrl: datos.agendaUrl,
    colorMarca: datos.colorMarca,
  };
  estado.clientes.push(c);
  persistir();
  return c;
}

export function actualizarCliente(
  id: string,
  cambios: Partial<Omit<Cliente, "id" | "creadoEn">>,
): Cliente | undefined {
  const i = estado.clientes.findIndex((c) => c.id === id);
  if (i < 0) return undefined;
  estado.clientes[i] = { ...estado.clientes[i], ...cambios };
  // Si es el activo, re-aplicamos su config al sistema.
  if (id === estado.clienteActivoId) aplicarConfig(estado.clientes[i]);
  persistir();
  return estado.clientes[i];
}

// ─── Contacto automático (Capa 1, modo simulación) ──────────────────────────

export function obtenerCadencia(): ConfigCadencia {
  return estado.cadencia;
}

export function guardarCadencia(cambios: Partial<ConfigCadencia>): ConfigCadencia {
  estado.cadencia = { ...estado.cadencia, ...cambios };
  persistir();
  return estado.cadencia;
}

export function obtenerEnvios(): EnvioLog[] {
  return [...estado.envios].sort((a, b) => b.cuando - a.cuando);
}

/** Registra que el Orquestador corrió un ciclo. Devuelve el nuevo total. */
export function registrarCicloMotor(): number {
  estado.ciclosMotor += 1;
  persistir();
  return estado.ciclosMotor;
}

export function obtenerCiclosMotor(): number {
  return estado.ciclosMotor;
}

/** ¿Está liberado el contacto automático real? */
export function contactoAprobado(): boolean {
  return estado.contactoAprobado === true;
}

/** Libera (o vuelve a frenar) el envío automático de invitaciones. */
export function aprobarContacto(v: boolean): boolean {
  estado.contactoAprobado = v;
  persistir();
  return estado.contactoAprobado;
}

export function obtenerPresupuestoTope(): number {
  return estado.presupuestoTopeUsd;
}

export function guardarPresupuestoTope(usd: number): number {
  estado.presupuestoTopeUsd = Math.max(0, usd);
  persistir();
  return estado.presupuestoTopeUsd;
}

// ─── Historial de extracciones ──────────────────────────────────────────────

/** Registra una corrida de extracción (para el Historial). */
export function registrarExtraccion(datos: {
  fuente: FuenteExtraccion;
  termino: string;
  ubicacion: string;
  solicitados: number;
  resultados: number;
  costoUsd: number;
}): Extraccion {
  const estadoCorrida: Extraccion["estado"] =
    datos.resultados <= 0
      ? "sin_resultados"
      : datos.resultados >= datos.solicitados
        ? "completa"
        : "parcial";
  const e: Extraccion = {
    id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fuente: datos.fuente,
    termino: datos.termino.trim(),
    ubicacion: datos.ubicacion.trim(),
    solicitados: Math.max(0, Math.round(datos.solicitados)),
    resultados: Math.max(0, Math.round(datos.resultados)),
    costoUsd: Math.max(0, datos.costoUsd),
    cuando: Date.now(),
    clienteId: estado.clienteActivoId,
    estado: estadoCorrida,
  };
  estado.extracciones.push(e);
  persistir();
  return e;
}

/** Lista todas las extracciones, de la más reciente a la más vieja. */
export function listarExtracciones(): Extraccion[] {
  return [...estado.extracciones].sort((a, b) => b.cuando - a.cuando);
}

// ─── Usuarios y roles ───────────────────────────────────────────────────────

export function listarUsuarios(): Usuario[] {
  return [...estado.usuarios].sort((a, b) => a.creadoEn - b.creadoEn);
}

export function crearUsuario(nombre: string, rol: Rol): Usuario {
  const u: Usuario = {
    id: `usr-${Date.now()}`,
    nombre: nombre.trim() || "Comercial",
    rol: rol === "admin" ? "admin" : "comercial",
    creadoEn: Date.now(),
  };
  estado.usuarios.push(u);
  persistir();
  return u;
}

export function actualizarUsuario(
  id: string,
  cambios: Partial<Pick<Usuario, "nombre" | "rol">>,
): Usuario | undefined {
  const i = estado.usuarios.findIndex((u) => u.id === id);
  if (i < 0) return undefined;
  const siguiente = { ...estado.usuarios[i], ...cambios };
  // Nunca dejar el sistema sin ningún admin.
  const soloUnAdmin =
    estado.usuarios.filter((u) => u.rol === "admin").length <= 1;
  if (estado.usuarios[i].rol === "admin" && siguiente.rol !== "admin" && soloUnAdmin) {
    return estado.usuarios[i];
  }
  estado.usuarios[i] = siguiente;
  persistir();
  return estado.usuarios[i];
}

export function eliminarUsuario(id: string): boolean {
  const u = estado.usuarios.find((x) => x.id === id);
  if (!u) return false;
  // No borrar el último admin: alguien tiene que poder configurar el sistema.
  const soloUnAdmin =
    estado.usuarios.filter((x) => x.rol === "admin").length <= 1;
  if (u.rol === "admin" && soloUnAdmin) return false;
  estado.usuarios = estado.usuarios.filter((x) => x.id !== id);
  persistir();
  return true;
}

/**
 * Programa el contacto: a cada lead SELECCIONADO en "nuevos" sin programar le
 * asigna un horario según la cadencia. Si no se pasan ids, programa todos los
 * nuevos sin programar. Devuelve cuántos quedaron programados.
 */
export function programarContacto(leadIds?: string[]): number {
  const set = leadIds && leadIds.length ? new Set(leadIds) : null;
  const activo = estado.clienteActivoId;
  const pendientes = [...estado.leads.values()]
    .filter(
      (l) =>
        l.estado === "nuevos" &&
        !l.programadoEn &&
        (!l.clienteId || l.clienteId === activo) &&
        (!set || set.has(l.id)),
    )
    .sort((a, b) => a.creadoEn - b.creadoEn);

  const tiempos = programarEnvios(pendientes.length, estado.cadencia);
  pendientes.forEach((l, i) => {
    estado.leads.set(l.id, { ...l, programadoEn: tiempos[i] });
  });
  persistir();
  return pendientes.length;
}

/**
 * REPROGRAMA los que ya tenían hora, con la cadencia que rige AHORA.
 *
 * Por qué existe: `programarContacto()` solo le pone hora a quien no la tiene,
 * así que cambiar la cadencia no movía a los ya programados. El 03-08, con 27
 * leads repartidos bajo una cadencia de 3/día, subirla a 6 no adelantó ni uno:
 * el último seguía agendado para el 31 de agosto.
 *
 * NO toca a los ya contactados: esos mensajes ya salieron a LinkedIn.
 * Devuelve cuántos se reprogramaron.
 */
export function reprogramarContacto(): number {
  const activo = estado.clienteActivoId;
  const pendientes = [...estado.leads.values()]
    .filter(
      (l) =>
        l.estado === "nuevos" &&
        !l.contactadoEn &&
        !l.chatId &&
        (!l.clienteId || l.clienteId === activo),
    )
    // Se respeta el orden en que entraron: el que llevaba más esperando, primero.
    .sort((a, b) => (a.programadoEn ?? a.creadoEn) - (b.programadoEn ?? b.creadoEn));

  const tiempos = programarEnvios(pendientes.length, estado.cadencia);
  pendientes.forEach((l, i) => {
    estado.leads.set(l.id, { ...l, programadoEn: tiempos[i] });
  });
  persistir();
  return pendientes.length;
}

/**
 * "Envía" (en simulación) los mensajes que ya toca. Registra en el log, marca
 * el lead como contactado y lo mueve del kanban. `acelerar` ignora el reloj y
 * dispara los próximos `cuantos` — es para poder ver la demo sin esperar días.
 */
export function procesarContacto(opts: {
  acelerar?: boolean;
  cuantos?: number;
}): EnvioLog[] {
  const ahora = Date.now();
  const activo = estado.clienteActivoId;
  let cola = [...estado.leads.values()]
    .filter(
      (l) =>
        l.estado === "nuevos" &&
        l.programadoEn &&
        (!l.clienteId || l.clienteId === activo),
    )
    .sort((a, b) => (a.programadoEn ?? 0) - (b.programadoEn ?? 0));

  cola = opts.acelerar
    ? cola.slice(0, opts.cuantos ?? 3)
    : cola.filter((l) => (l.programadoEn ?? 0) <= ahora);

  const hechos: EnvioLog[] = [];
  for (const l of cola) {
    const log: EnvioLog = {
      leadId: l.id,
      nombre: l.nombre,
      empresa: l.empresa,
      cuando: Date.now(),
      modo: "simulado",
      tipo: "primero",
    };
    estado.envios.push(log);
    const act: Lead = { ...l, estado: "contactados", contactadoEn: Date.now() };
    estado.leads.set(l.id, act);
    sincronizarLead(act);
    hechos.push(log);
  }
  persistir();
  return hechos;
}

/**
 * Candidatos para que el setter cierre solo (piloto automático / demo en
 * lote): leads ya contactados que esperan una respuesta y todavía no
 * llegaron a un cierre. Los más viejos primero.
 */
export function leadsParaAutoConversar(limite: number): Lead[] {
  const activo = estado.clienteActivoId;
  return [...estado.leads.values()]
    .filter(
      (l) =>
        l.estado === "contactados" && (!l.clienteId || l.clienteId === activo),
    )
    .sort((a, b) => (a.contactadoEn ?? 0) - (b.contactadoEn ?? 0))
    .slice(0, Math.max(0, limite));
}

// ─── Bandeja del operador (triage tipo Tinder) ──────────────────────────────

/**
 * Leads del cliente activo que necesitan una decisión humana, ordenados por
 * prioridad: primero los ESCALADOS (la IA pidió ayuda), luego las reuniones
 * agendadas (confirmar / anotar datos finales), luego los nuevos (decidir si
 * se trabajan). Es la cola de la Bandeja.
 */
export function leadsBandeja(): Lead[] {
  const activo = estado.clienteActivoId;
  const prioridad = (l: Lead): number => {
    if (l.escalado) return 0; // la IA pidió ayuda: primero
    if (l.estado === "respondieron") return 1; // conversación activa
    if (l.estado === "reunion") return 2; // agendado, confirmar
    if (l.estado === "futuro") return 3;
    if (l.estado === "contactados") return 4;
    return 5; // nuevos
  };
  return [...estado.leads.values()]
    .filter((l) => {
      if (l.clienteId && l.clienteId !== activo) return false;
      return l.estado !== "frio"; // todo lo accionable + agendados (frío = descartado)
    })
    .sort((a, b) => prioridad(a) - prioridad(b) || a.creadoEn - b.creadoEn);
}

// ─── Ruta de contacto (cockpit llamar / WhatsApp) ───────────────────────────

/**
 * Leads para la Ruta de llamadas: los que tienen teléfono y siguen accionables
 * (no cerrados: ni reunión ni frío). Prioriza los que menos se han intentado y,
 * a igualdad, los más viejos.
 */
export function leadsParaRuta(): Lead[] {
  return [...estado.leads.values()]
    .filter(
      (l) =>
        (!l.clienteId || l.clienteId === estado.clienteActivoId) &&
        !l.escalado && // los escalados son su propia cola (urgente)
        !!l.contacto?.trim() &&
        l.estado !== "reunion" &&
        l.estado !== "frio",
    )
    .sort(
      (a, b) =>
        (a.intentosLlamada ?? 0) - (b.intentosLlamada ?? 0) ||
        (a.creadoEn ?? 0) - (b.creadoEn ?? 0),
    );
}

/**
 * Cola URGENTE de la Ruta: leads donde el agente ya conversó, se trabó y pidió
 * ayuda. Hay una persona esperando respuesta, así que van por antigüedad del
 * escalado (el que lleva más rato esperando, primero) y NO exigen teléfono:
 * un escalado de Instagram se atiende por DM.
 */
export function leadsEscalados(): Lead[] {
  return [...estado.leads.values()]
    .filter(
      (l) =>
        (!l.clienteId || l.clienteId === estado.clienteActivoId) &&
        !!l.escalado &&
        l.estado !== "frio",
    )
    .sort((a, b) => (a.escaladoEn ?? a.creadoEn) - (b.escaladoEn ?? b.creadoEn));
}

const MS_DIA_RUTA = 24 * 60 * 60 * 1000;

/**
 * Lee un plazo escrito a mano en la nota ("en 23 días", "en 3 semanas", "en un
 * mes") y lo convierte a días.
 *
 * Por qué existe: si el comercial habló con la persona y anotó cuándo volver,
 * ese dato es más fresco y más cierto que el default de la cadencia. Antes se
 * escribía la nota y el sistema igual reagendaba a 45 días: la información que
 * el humano capturó se perdía.
 */
export function diasDeLaNota(nota?: string): number | null {
  if (!nota?.trim()) return null;
  const m = nota
    .toLowerCase()
    .match(/\ben\s+(un|una|\d{1,3})\s*(d[ií]as?|semanas?|mes(?:es)?)\b/);
  if (!m) return null;
  const n = m[1] === "un" || m[1] === "una" ? 1 : Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (m[2].startsWith("semana")) return n * 7;
  if (m[2].startsWith("mes")) return n * 30;
  return n;
}

/** Registra el resultado de un contacto por teléfono/WhatsApp y mueve el kanban. */
export function registrarLlamada(
  id: string,
  resultado: ResultadoLlamada,
  nota?: string,
): Lead | undefined {
  const lead = estado.leads.get(id);
  if (!lead) return undefined;

  const ahora = Date.now();
  const etiqueta: Record<ResultadoLlamada, string> = {
    no_contesto: "No contestó",
    interesado: "Interesado",
    llamar_despues: "Llamar después",
    no_interesa: "No le interesa",
  };
  const linea = `[${new Date(ahora).toLocaleDateString("es-CO")}] Contacto: ${etiqueta[resultado]}${nota?.trim() ? ` — ${nota.trim()}` : ""}`;
  const notaFinal = lead.nota?.trim() ? `${lead.nota.trim()}\n${linea}` : linea;

  const act: Lead = {
    ...lead,
    nota: notaFinal,
    ultimaLlamada: ahora,
    intentosLlamada:
      resultado === "no_contesto"
        ? (lead.intentosLlamada ?? 0) + 1
        : lead.intentosLlamada ?? 0,
    // Si venía escalado, un humano acaba de atenderlo: se cierra la alerta.
    escalado: false,
    escaladoEn: null,
    motivoEscalado: "",
  };

  if (resultado === "interesado") act.estado = "respondieron";
  else if (resultado === "no_interesa") act.estado = "frio";
  else if (resultado === "llamar_despues") {
    act.estado = "futuro";
    // Si el comercial escribió "en 23 días", se respeta eso; si no, la cadencia.
    const dias = diasDeLaNota(nota) ?? estado.cadencia.diasReContacto;
    act.recontactarEn = ahora + dias * MS_DIA_RUTA;
  } else {
    // no_contesto: se intentó pero no cerró; queda contactado y sigue en ruta.
    if (act.estado === "nuevos") act.estado = "contactados";
  }

  estado.leads.set(id, act);
  persistir();
  sincronizarLead(act);
  return act;
}

// ─── Seguimientos (Módulo 3, cadencia de días) ──────────────────────────────

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Leads en "contactados" que no respondieron y a los que les toca (o, con
 * acelerar, los próximos `cuantos`) un seguimiento. Se ordenan por antigüedad.
 */
/**
 * Cuántos días se espera a que alguien acepte la solicitud antes de darla por
 * perdida. Pasado eso, el lead se enfría: la invitación queda en LinkedIn (no
 * se puede cancelar desde acá), pero deja de ocupar lugar en el embudo y queda
 * disponible para re-prospectar más adelante con otro ángulo.
 */
const DIAS_PARA_DARLA_POR_PERDIDA = 14;

/**
 * Los que recibieron la solicitud hace mucho y nunca la aceptaron.
 *
 * Son un caso distinto del "no me contestó": a estos ni siquiera se les pudo
 * escribir. Mientras figuren como "contactados" ensucian la cuenta del embudo
 * y hacen que el tablero parezca más activo de lo que está.
 */
export function invitacionesSinRespuesta(): Lead[] {
  const limite = Date.now() - DIAS_PARA_DARLA_POR_PERDIDA * MS_DIA;
  return [...estado.leads.values()].filter(
    (l) =>
      l.estado === "contactados" &&
      !l.chatId &&
      !l.aceptadoEn &&
      (l.contactadoEn ?? 0) > 0 &&
      (l.contactadoEn ?? 0) < limite,
  );
}

/** Los enfría y devuelve cuántos. La invitación en LinkedIn no se toca. */
export function enfriarInvitacionesVencidas(): number {
  const vencidas = invitacionesSinRespuesta();
  for (const l of vencidas) {
    estado.leads.set(l.id, {
      ...l,
      estado: "frio",
      nota: [l.nota, `No aceptó la solicitud en ${DIAS_PARA_DARLA_POR_PERDIDA} días.`]
        .filter(Boolean)
        .join(" · "),
      recontactarEn: Date.now() + estado.cadencia.diasReContacto * MS_DIA,
    });
  }
  if (vencidas.length) persistir();
  return vencidas.length;
}

export function seguimientosPendientes(
  acelerar: boolean,
  cuantos: number,
): Lead[] {
  const cfg = estado.cadencia;
  const ahora = Date.now();
  let cola = [...estado.leads.values()].filter((l) => {
    if (l.estado !== "contactados") return false;
    // 🔴 Solo se le puede hacer seguimiento a quien ACEPTÓ la solicitud.
    //
    // LinkedIn no deja escribirle a alguien que no es contacto tuyo, así que
    // insistirle a quien nunca aceptó es pedirle a la API algo imposible: falla
    // en silencio y se reintenta cada 4 horas para siempre. Daniel y Jhoan
    // llevaban desde el 3 de agosto en ese bucle.
    //
    // A quien no aceptó no le corresponde un seguimiento por mensaje: le
    // corresponde otra cosa (esperar, o volver a invitar). Ver `sinAceptar()`.
    if (!l.chatId && !l.aceptadoEn) return false;
    return (l.seguimientos ?? 0) < cfg.diasSeguimiento.length;
  });

  if (acelerar) {
    cola = cola.slice(0, cuantos);
  } else {
    cola = cola.filter((l) => {
      const n = l.seguimientos ?? 0;
      const vence = (l.contactadoEn ?? 0) + cfg.diasSeguimiento[n] * MS_DIA;
      return ahora >= vence;
    });
  }
  return cola.sort((a, b) => (a.contactadoEn ?? 0) - (b.contactadoEn ?? 0));
}

/**
 * Registra un seguimiento ya generado: lo agrega al hilo, sube el contador y,
 * si se agotaron los intentos, marca el lead como frío.
 */
export function registrarSeguimiento(id: string, mensaje: string): EnvioLog | null {
  const lead = estado.leads.get(id);
  if (!lead) return null;

  const n = (lead.seguimientos ?? 0) + 1;
  const conv = [...(lead.conversacion ?? [])];
  if (conv.length === 0 && lead.mensaje) {
    conv.push({ de: "setter", texto: lead.mensaje, cuando: lead.contactadoEn ?? Date.now() });
  }
  conv.push({ de: "setter", texto: mensaje, cuando: Date.now() });

  const agotado = n >= estado.cadencia.diasSeguimiento.length;
  const act: Lead = {
    ...lead,
    seguimientos: n,
    conversacion: conv,
    estado: agotado ? "frio" : "contactados",
  };
  estado.leads.set(id, act);
  sincronizarLead(act);

  const log: EnvioLog = {
    leadId: id,
    nombre: lead.nombre,
    empresa: lead.empresa,
    cuando: Date.now(),
    modo: "simulado",
    tipo: "seguimiento",
  };
  estado.envios.push(log);
  persistir();
  return log;
}
