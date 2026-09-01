export type EstadoLead =
  | "nuevos"
  | "contactados"
  | "respondieron"
  | "reunion"
  | "futuro"
  | "frio";

export const ESTADOS: { id: EstadoLead; label: string }[] = [
  { id: "nuevos", label: "Nuevos" },
  { id: "contactados", label: "Contactados" },
  { id: "respondieron", label: "Respondieron" },
  { id: "reunion", label: "Reunión agendada" },
  { id: "futuro", label: "Contactar después" },
  { id: "frio", label: "Frío · Re-prospección" },
];

/**
 * Un color por estado, igual en toda la app (tabla, kanban, bandeja): el color
 * dice el estado sin leer la etiqueta. Gris = sin tocar · azul = en juego ·
 * verde = ganado · violeta = en pausa · rojo apagado = cerrado.
 */
export const ESTADO_COLOR: Record<EstadoLead, string> = {
  nuevos: "border-slate-300 bg-slate-100 text-slate-700",
  contactados: "border-sky-300 bg-sky-50 text-sky-800",
  respondieron: "border-blue-400 bg-blue-100 text-blue-800",
  reunion: "border-emerald-300 bg-emerald-50 text-emerald-800",
  futuro: "border-violet-300 bg-violet-50 text-violet-800",
  frio: "border-rose-200 bg-rose-50 text-rose-700",
};

/** Punto de color sólido del mismo estado (para el borde de fila y los chips). */
export const ESTADO_PUNTO: Record<EstadoLead, string> = {
  nuevos: "bg-slate-400",
  contactados: "bg-sky-500",
  respondieron: "bg-blue-600",
  reunion: "bg-emerald-500",
  futuro: "bg-violet-500",
  frio: "bg-rose-400",
};

/**
 * Canal del perfil de cliente. Define de dónde salen los leads y qué hace el
 * setter:
 * - linkedin: prospección fría B2B → el objetivo es agendar una llamada.
 * - ecommerce: post-venta / inbound → seguimiento de calidad para recompra o
 *   suscripción (no agenda llamada).
 */
export type Canal = "linkedin" | "ecommerce";

/** De dónde entró el lead. Para ecommerce, el trigger del seguimiento. */
export type OrigenLead =
  | "linkedin_busqueda"
  | "negocio_maps"
  | "instagram"
  | "compra"
  | "visita_producto"
  | "interaccion_post";

/** Parámetros de la búsqueda de NEGOCIOS locales (Google Maps vía Apify). */
export interface ParametrosNegocios {
  /** Rubro / término: "taller mecánico", "clínica dental", etc. */
  keyword: string;
  /** Ubicación en una línea: "Medellín, Colombia". Una por corrida. */
  ubicacion: string;
  cantidad: number;
  /** Solo negocios con página web activa. */
  soloConWeb: boolean;
  /** Omitir negocios cerrados permanentemente. */
  omitirCerrados: boolean;
  /** Rating mínimo (0 = sin filtro). */
  minEstrellas: number;
}

export const ORIGENES: { id: OrigenLead; label: string }[] = [
  { id: "compra", label: "Compró" },
  { id: "visita_producto", label: "Visitó producto" },
  { id: "interaccion_post", label: "Interactuó con post" },
];

export interface Lead {
  id: string;
  nombre: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  fotoUrl: string | null;
  perfilUrl: string;
  headline: string;
  ultimoPost: string | null;
  /** true si el perfil no tenía posts recientes (personalización más floja). */
  sinPost?: boolean;
  /**
   * true si el perfil es una CUENTA DE EMPRESA y no una persona ("3 Studio
   * Agency"). No se descarta: detrás la administra alguien. Lo que cambia es el
   * trato — no se le saluda por "nombre de pila", se le pregunta con quién se
   * tiene el gusto. Lo decide `lib/tipo-perfil.ts`.
   */
  esEmpresa?: boolean;
  /** Por qué se lo clasificó como empresa (para poder auditar la señal). */
  motivoEmpresa?: string;
  /** Nombre real de quien administra la cuenta, cuando se presenta en el chat. */
  nombreContacto?: string;
  /** Qué hace esta persona, en 1-2 líneas. Lo deduce la IA del perfil. */
  resumen: string;
  /** Por qué encaja como lead para Nexus Reach. */
  porQueBuenLead: string;
  /**
   * Qué tan buen cliente es para la oferta configurada, según la IA que le leyó
   * el perfil. LinkedIn no deja filtrar por cargo ni por seniority, así que la
   * calidad del lead se juzga DESPUÉS de traerlo: es la única forma de no
   * gastar solicitudes (que son limitadas) en estudiantes, gente de otra área
   * o perfiles sin decisión de compra.
   */
  encaje?: "alto" | "medio" | "bajo";
  /** Por qué se le puso ese encaje, en una línea. */
  porQueEncaje?: string;
  /**
   * Mensaje de apertura del chat. Sale cuando el lead YA aceptó la solicitud,
   * y está escrito como continuación de `notaInvitacion` (no la repite).
   */
  mensaje: string;
  /**
   * Nota corta (≤280) que viaja DENTRO de la solicitud de conexión. Es lo
   * primero que ve el lead. Vacía en los leads anteriores al 03-08, que se
   * invitaban sin nota: en ese caso la solicitud sale pelada, como antes.
   */
  notaInvitacion?: string;
  estado: EstadoLead;
  nota: string;
  creadoEn: number;
  /** A qué cliente/perfil pertenece este lead (define su oferta, canal y contexto). */
  clienteId?: string;
  /** Momento en que el motor lo tiene programado para contactar (ms). */
  programadoEn?: number | null;
  /** Momento en que se "envió" el primer mensaje (ms). */
  contactadoEn?: number | null;
  /**
   * Cuándo se detectó que aceptó la solicitud (ms), preguntando por el grado de
   * conexión. Marca el arranque de la espera antes de escribirle: saltar encima
   * en el mismo minuto en que alguien te acepta delata que hay una máquina.
   */
  aceptadoEn?: number | null;
  /** Cuántos seguimientos se le enviaron (sin respuesta). */
  seguimientos?: number;
  /** Prospecto a futuro: cuándo volver a contactarlo (ms). */
  recontactarEn?: number | null;
  /** Hilo de conversación con el setter de IA. */
  conversacion?: MensajeChat[];
  /**
   * Marcado true SOLO cuando el agente ya conversó con el lead (no en el primer
   * intento) y aun así no puede responder con certeza. Es una alerta urgente:
   * hay una persona esperando respuesta que el agente no supo dar.
   */
  escalado?: boolean;
  /** Cuándo se escaló (ms). Ordena la cola de escalados: el más viejo, primero. */
  escaladoEn?: number | null;
  /** Qué necesita el humano para destrabarlo, en una frase (lo escribe el agente). */
  motivoEscalado?: string;
  /**
   * Cuándo se avisó al celular de este escalado (ms). Existe para no repetir el
   * mismo aviso en cada ciclo: un bot que insiste cada 15 minutos se silencia,
   * y entonces no sirve para nada cuando de verdad importa.
   */
  escaladoAvisadoEn?: number | null;
  /** Nota que el agente IA va escribiendo solo con lo importante del lead. */
  notaAgente?: string;
  /** Cómo entró el lead (LinkedIn por defecto; para ecommerce, el trigger). */
  origen?: OrigenLead;
  /** Ecommerce: producto que compró / visitó / con el que interactuó. */
  producto?: string;
  /** Contacto directo (email/teléfono) cuando la fuente lo trae (ecommerce/maps). */
  contacto?: string;
  /** Cuántas veces se intentó llamar sin que contestaran. */
  intentosLlamada?: number;
  /** Última vez que se registró una llamada/contacto por la Ruta (ms). */
  ultimaLlamada?: number;
  // ─── Capa 2: LinkedIn real vía Unipile ───
  /** id interno del contacto en LinkedIn (provider_id de Unipile). */
  providerId?: string;
  /** id del chat de Unipile (existe una vez enviado el primer mensaje real). */
  chatId?: string;
  /** id del último mensaje de Unipile ya respondido (para no responder dos veces). */
  ultimoMsgUnipile?: string;
  /** uid de la reserva creada en Cal.com cuando el lead agendó. */
  citaUid?: string;
  /**
   * Cuándo empieza la reunión agendada (ms). Sale del `startUtc` que devuelve
   * Cal.com al reservar. Sin esto no hay forma de saber cuándo recordar.
   */
  citaEn?: number | null;
  /**
   * Cuándo se le mandó el recordatorio por LinkedIn (ms). Es el candado que
   * impide que el cron lo repita en cada ciclo.
   */
  recordatorioEn?: number | null;
}

/** Resultado de un contacto por teléfono/WhatsApp desde la Ruta. */
export type ResultadoLlamada =
  | "no_contesto"
  | "interesado"
  | "llamar_despues"
  | "no_interesa";

/** Un mensaje del hilo de conversación (setter ↔ lead). */
export interface MensajeChat {
  de: "setter" | "lead";
  texto: string;
  cuando: number;
}

/**
 * Reglas de cadencia del contacto automático. Todo configurable por el usuario:
 * el desafío exige "cadencia que vos definís". Defaults conservadores para no
 * quemar la cuenta.
 */
export interface ConfigCadencia {
  /** Máximo de primeros mensajes por día. */
  maxPorDia: number;
  /** Días activos de la semana. 0=Domingo … 6=Sábado. */
  diasSemana: number[];
  /** Ventana horaria en la que se envía (24h). */
  horaInicio: number;
  horaFin: number;
  /** Espaciado irregular entre mensajes, en minutos (para no parecer robot). */
  espaciadoMinMin: number;
  espaciadoMaxMin: number;
  /** Cuántos mensajes revisás a mano antes de liberar el resto. */
  revisarPrimeros: number;
  /**
   * Cadencia de SEGUIMIENTOS: días después del contacto en que sale cada uno.
   * [3, 7] = seguimiento 1 al día 3, seguimiento 2 (cierre) al día 7. Agotados,
   * el lead queda frío. La cantidad de números = máximo de seguimientos.
   */
  diasSeguimiento: number[];
  /**
   * Prospectos a futuro: cuántos días esperar antes de re-contactar a un lead
   * interesado que pidió tiempo. Default 45 (~1 mes y medio): darle espacio
   * para que analice y vea beneficios, no presionarlo.
   */
  diasReContacto: number;
}

export const CADENCIA_DEFAULT: ConfigCadencia = {
  // Subido de 2 a 6 el 03-08 (Santiago) al pasar la cuenta a LinkedIn Premium.
  // El arranque conservador (2/día, L-M-V = 6 por semana) tardaba casi 3 semanas
  // en contactar 15 leads. Con 6/día de lunes a viernes son 30 por semana, que
  // sigue MUY por debajo del tope de invitaciones de LinkedIn (~100/semana, que
  // es de la plataforma y Premium NO levanta: lo que Premium da es búsqueda sin
  // límite comercial e InMail). Ajustable desde Ajustes sin tocar código.
  maxPorDia: 6,
  diasSemana: [1, 2, 3, 4, 5], // Lunes a viernes
  horaInicio: 9,
  horaFin: 18,
  espaciadoMinMin: 90,
  espaciadoMaxMin: 240,
  revisarPrimeros: 5,
  diasSeguimiento: [3, 7], // máximo 2 seguimientos, como pide la propuesta
  diasReContacto: 45, // ~1 mes y medio para prospectos a futuro
};

/** Una línea del registro de envíos (por ahora siempre en simulación). */
export interface EnvioLog {
  leadId: string;
  nombre: string;
  empresa: string;
  cuando: number;
  modo: "simulado" | "real";
  tipo?: "primero" | "seguimiento";
}

export interface Ajustes {
  nombre: string;
  empresa: string;
  idioma: "es" | "en";
  /** Link de Cal.com (u otra agenda) para que el lead reserve la llamada. */
  agendaUrl: string;
  /** Canal del cliente activo: cambia el comportamiento del setter. */
  canal: Canal;
}

export const AJUSTES_DEFAULT: Ajustes = {
  nombre: "Tu Nombre",
  empresa:
    "Nexus Reach — ayudamos a agencias a automatizar tareas y reporting con inteligencia artificial.",
  idioma: "en",
  agendaUrl: "",
  canal: "linkedin",
};

/**
 * Perfil por cliente: TODO lo que cambia entre un cliente y otro, en un solo
 * objeto que se activa de un clic — sin tocar código. Es el requisito de
 * "configurable por cliente" del desafío y lo que hace el sistema replicable.
 */
export interface Cliente {
  id: string;
  /** Marca / negocio del cliente. */
  nombre: string;
  /** Canal de prospección (define búsqueda vs ingesta y el rol del setter). */
  canal: Canal;
  /** Nicho, para orientar la búsqueda y el tono. */
  nicho: string;
  /** Quién firma los mensajes (identidad del setter). */
  remitente: string;
  /** Qué ofrece / contexto que usa el setter para conversar. */
  oferta: string;
  /** Link de agenda (Cal.com) para el canal LinkedIn. */
  agendaUrl: string;
  /** Color de marca (hex) para el white-label: re-tinta la app con lo del cliente. */
  colorMarca?: string;
  cadencia: ConfigCadencia;
  creadoEn: number;
}

/** Color por defecto de la app (azul LinkedIn), para volver cuando no hay marca. */
export const COLOR_DEFAULT = "#0a66c2";

/** Clientes de ejemplo: uno por canal, para que la demo funcione al instante. */
export const CLIENTES_DEFAULT: Cliente[] = [
  {
    id: "cli-linkedin-demo",
    nombre: "ModoZaint · IA para negocios",
    canal: "linkedin",
    nicho: "Agencias y consultores",
    remitente: "Santiago",
    oferta:
      "Ayudo a agencias y consultores a automatizar su prospección y el seguimiento de leads con IA, para que no se les caiga ningún contacto y ahorren horas de trabajo manual.",
    agendaUrl: "https://cal.com/zaint-oq07wo/llamada-15-min-diagnostico-ia",
    colorMarca: "#0a66c2",
    cadencia: { ...CADENCIA_DEFAULT },
    creadoEn: Date.now(),
  },
  {
    id: "cli-ecommerce-demo",
    nombre: "Marca D2C (ejemplo skincare)",
    canal: "ecommerce",
    nicho: "Ecommerce / D2C",
    remitente: "Equipo de la marca",
    oferta:
      "Marca de skincare que vende online. Hacemos seguimiento post-compra para que el cliente use bien el producto, quede feliz y vuelva a comprar o se suscriba.",
    agendaUrl: "",
    colorMarca: "#059669",
    // Ecommerce: seguimiento más ágil (día 2 y 6) por naturaleza del canal.
    cadencia: { ...CADENCIA_DEFAULT, diasSeguimiento: [2, 6], diasReContacto: 30 },
    creadoEn: Date.now(),
  },
];

// ─── Usuarios y roles (login "¿Quién eres?") ────────────────────────────────

/**
 * Rol del usuario que opera la app:
 * - admin: ve y modifica TODO (clientes, ajustes, presupuesto, costos, gasto),
 *   lanza extracciones pagas. Es el único que ve los "datos importantes".
 * - comercial: solo opera los leads ya extraídos (Leads, In the loop, Ruta).
 *   No ve costos ni gasto, no toca la configuración ni lanza extracciones.
 */
export type Rol = "admin" | "comercial";

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  creadoEn: number;
}

/** Roster inicial: un admin (el dueño de la cuenta) + comerciales de ejemplo. */
export const USUARIOS_DEFAULT: Usuario[] = [
  { id: "usr-admin", nombre: "Santiago", rol: "admin", creadoEn: Date.now() },
  { id: "usr-com-1", nombre: "Comercial 1", rol: "comercial", creadoEn: Date.now() },
  { id: "usr-com-2", nombre: "Comercial 2", rol: "comercial", creadoEn: Date.now() },
];

// ─── Historial de extracciones (auditoría de búsquedas) ─────────────────────

export type FuenteExtraccion = "linkedin" | "negocios" | "instagram" | "ecommerce";

export const FUENTE_EXTRACCION_LABEL: Record<FuenteExtraccion, string> = {
  linkedin: "LinkedIn",
  negocios: "Google Maps",
  instagram: "Instagram",
  ecommerce: "Ecommerce",
};

/**
 * Una corrida de extracción (no una persona): qué se buscó, dónde, cuántos se
 * pidieron vs. cuántos entraron, y cuánto costó. Es el registro del Historial.
 */
export interface Extraccion {
  id: string;
  fuente: FuenteExtraccion;
  /** Término / rubro / hashtag buscado. */
  termino: string;
  /** Ubicación de la corrida (ciudad, país o región). */
  ubicacion: string;
  /** Cuántos se pidieron. */
  solicitados: number;
  /** Cuántos leads nuevos entraron. */
  resultados: number;
  /** Costo estimado de la corrida (USD). */
  costoUsd: number;
  cuando: number;
  clienteId?: string;
  estado: "completa" | "parcial" | "sin_resultados";
}

export interface ParametrosBusqueda {
  keyword: string;
  titles: string[];
  /** País del filtro de ubicación (ej. "Colombia", "United States"). */
  country: string;
  /**
   * Departamentos / provincias / estados. Vacío = todo el país. Se pueden
   * elegir varios: cada uno se busca "suelto" como su propia ubicación.
   */
  regiones: string[];
  city: string;
  limit: number;
  /**
   * Industrias de LinkedIn elegidas de su catálogo (se guarda id y nombre).
   * Es el filtro que MÁS sube la calidad del lead, y el único —además de la
   * ubicación— que LinkedIn aplica de verdad en la búsqueda normal.
   */
  industrias?: { id: string; title: string }[];
  /** Ubicación elegida del catálogo. Si viene, no hay que resolverla por texto. */
  ubicacion?: { id: string; title: string } | null;
  /**
   * Descartar los perfiles que la IA juzgue de encaje BAJO en vez de guardarlos.
   * Sube mucho la calidad del embudo a cambio de traer menos leads por búsqueda.
   */
  soloCualificados?: boolean;
}
