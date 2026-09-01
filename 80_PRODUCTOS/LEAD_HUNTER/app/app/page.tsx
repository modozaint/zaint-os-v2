"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, HelpCircle, Menu } from "lucide-react";
import { AjustesView } from "@/components/AjustesView";
import { AyudaContextual } from "@/components/AyudaContextual";
import { BusquedaView } from "@/components/BusquedaView";
import { CargandoBusqueda } from "@/components/CargandoBusqueda";
import { ClientesView } from "@/components/ClientesView";
import {
  FuentesView,
  type ConsultaMulti,
  type Fuente,
} from "@/components/FuentesView";
import { IngestaView } from "@/components/IngestaView";
import { ChatsView } from "@/components/ChatsView";
import { PilotoView } from "@/components/PilotoView";
import { InTheLoopView } from "@/components/InTheLoopView";
import { LeadPanel } from "@/components/LeadPanel";
import { LoginUsuarios } from "@/components/LoginUsuarios";
import { LeadsView } from "@/components/LeadsView";
import { HistorialView } from "@/components/HistorialView";
import { PanelView } from "@/components/PanelView";
import { RutaView } from "@/components/RutaView";
import { Sidebar, type Seccion } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { TourGuiado } from "@/components/TourGuiado";
import {
  AJUSTES_DEFAULT,
  COLOR_DEFAULT,
  type Ajustes,
  type Canal,
  type EstadoLead,
  type Lead,
  type ParametrosBusqueda,
  type ParametrosNegocios,
  type Usuario,
} from "@/lib/types";

/** Secciones que puede ver un comercial (solo operación, sin config ni costos). */
const SECCIONES_COMERCIAL: Seccion[] = ["leads", "chats", "bandeja", "ruta"];

/** Título corto por sección, para la barra superior en celular. */
const TITULO_SECCION: Record<Seccion, string> = {
  clientes: "Clientes",
  panel: "Análisis",
  busqueda: "Extracción",
  leads: "Leads",
  chats: "Conversaciones",
  bandeja: "In the loop",
  piloto: "Piloto automático",
  contacto: "Contacto",
  ruta: "Ruta",
  historial: "Historial",
  ajustes: "Ajustes",
};

/** Cargos por defecto para la búsqueda combinada de LinkedIn (decisores). */
const CARGOS_MULTI = [
  "Founder",
  "CEO",
  "Director",
  "Head of Growth",
  "Marketing Director",
  "Gerente",
];

/** POST a un endpoint de búsqueda; devuelve los leads o lanza el error. */
async function fetchLeads(url: string, body: unknown): Promise<Lead[]> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falló la búsqueda.");
  return data.leads ?? [];
}

/** Oscurece un hex para el tono "dark" del botón (white-label). */
function oscurecer(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - f));
  const g = Math.round(((n >> 8) & 255) * (1 - f));
  const b = Math.round((n & 255) * (1 - f));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Re-tinta la app con el color del cliente activo (o el azul por defecto). */
function aplicarColorMarca(hex?: string) {
  const base = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : COLOR_DEFAULT;
  const root = document.documentElement;
  root.style.setProperty("--color-li-blue", base);
  root.style.setProperty("--color-li-blue-dark", oscurecer(base, 0.3));
}

export default function Home() {
  const [seccion, setSeccion] = useState<Seccion>("clientes");
  /**
   * Modo desarrollador (variable MODO_DEV del servidor). Off = instalación de
   * un cliente: los perfiles de cliente y las notas técnicas no se muestran.
   */
  const [modoDev, setModoDev] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_DEFAULT);
  const [canal, setCanal] = useState<Canal>("linkedin");
  const [clienteNombre, setClienteNombre] = useState("Cliente");
  const [clienteActivoId, setClienteActivoId] = useState("");
  const [fuenteElegida, setFuenteElegida] = useState<Fuente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tutorialAbierto, setTutorialAbierto] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [authListo, setAuthListo] = useState(false);

  // Sesión: recordamos el usuario elegido (login "¿Quién eres?").
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lh_usuario");
      if (raw) setUsuario(JSON.parse(raw));
    } catch {}
    setAuthListo(true);
  }, []);

  // Un comercial nunca queda parado en una sección de admin.
  useEffect(() => {
    if (usuario?.rol === "comercial" && !SECCIONES_COMERCIAL.includes(seccion)) {
      setSeccion("leads");
    }
  }, [usuario, seccion]);

  function elegirUsuario(u: Usuario) {
    try {
      localStorage.setItem("lh_usuario", JSON.stringify(u));
    } catch {}
    setUsuario(u);
    // Sin modo dev no existe la pantalla de perfiles: el admin entra al Panel.
    setSeccion(u.rol !== "admin" ? "leads" : "busqueda");
  }

  function cerrarSesion() {
    try {
      localStorage.removeItem("lh_usuario");
    } catch {}
    setUsuario(null);
  }

  // Tutorial: se muestra en la primera visita (luego con el botón del sidebar).
  useEffect(() => {
    try {
      if (!localStorage.getItem("lh_tutorial")) setTutorialAbierto(true);
    } catch {}
  }, []);

  function cerrarTutorial() {
    setTutorialAbierto(false);
    try {
      localStorage.setItem("lh_tutorial", "1");
    } catch {}
  }

  const refrescarLeads = useCallback(async () => {
    const d = await fetch("/api/leads").then((r) => r.json()).catch(() => null);
    if (d?.leads) setLeads(d.leads);
  }, []);

  const refrescarCliente = useCallback(async () => {
    const [c, a] = await Promise.all([
      fetch("/api/clientes").then((r) => r.json()).catch(() => null),
      fetch("/api/ajustes").then((r) => r.json()).catch(() => null),
    ]);
    if (c) {
      setCanal(c.canal ?? "linkedin");
      setClienteActivoId(c.activoId ?? "");
      const activo = (c.clientes ?? []).find(
        (x: { id: string; nombre: string; colorMarca?: string }) =>
          x.id === c.activoId,
      );
      if (activo) setClienteNombre(activo.nombre);
      aplicarColorMarca(activo?.colorMarca); // white-label: re-tinta la app
    }
    if (a?.ajustes) setAjustes(a.ajustes);
    if (typeof a?.modoDev === "boolean") setModoDev(a.modoDev);
  }, []);

  // Hidratar el estado del servidor al montar
  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => {});
    refrescarCliente();
  }, [refrescarCliente]);

  // Sync REAL de LinkedIn (Capa 2): el tablero se mueve solo cada 25s cuando hay
  // conversaciones vivas (aceptación → apertura → respuesta → agendamiento).
  useEffect(() => {
    let vivo = true;
    const tick = async () => {
      try {
        const d = await fetch("/api/motor/sync", { method: "POST" }).then((r) => r.json());
        if (vivo && Array.isArray(d?.leads)) setLeads(d.leads);
      } catch {
        /* un tick que falla no rompe la UI */
      }
    };
    const id = setInterval(tick, 25000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  const mostrarToast = useCallback((t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2200);
  }, []);

  async function buscar(p: ParametrosBusqueda) {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló la búsqueda.");

      const nuevos: Lead[] = data.leads ?? [];
      // Cuando el filtro de calidad descarta gente, se dice cuántos y por qué:
      // si no, parece que la búsqueda trajo menos de lo que trajo.
      const cal = data.calidad;
      if (cal?.descartados > 0) {
        mostrarToast(
          `${nuevos.length} leads cualificados · ${cal.descartados} descartados por no encajar`,
        );
      }
      if (!nuevos.length) {
        // El backend explica QUÉ se buscó y qué aflojar; un "no se encontró
        // nada" a secas hace perder horas probando al azar.
        setError(
          data.diagnostico ??
            "No se encontraron perfiles con esos filtros. Probá ampliarlos.",
        );
        return;
      }
      // Los leads entran automáticamente a "Nuevos" y saltamos a Leads.
      setLeads((prev) => [...prev, ...nuevos]);
      setSeccion("leads");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function buscarNegocios(p: ParametrosNegocios) {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/buscar-negocios", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló la búsqueda de negocios.");
      const nuevos: Lead[] = data.leads ?? [];
      // Cuando el filtro de calidad descarta gente, se dice cuántos y por qué:
      // si no, parece que la búsqueda trajo menos de lo que trajo.
      const cal = data.calidad;
      if (cal?.descartados > 0) {
        mostrarToast(
          `${nuevos.length} leads cualificados · ${cal.descartados} descartados por no encajar`,
        );
      }
      if (!nuevos.length) {
        setError("No se encontraron negocios con esos filtros. Probá ampliarlos.");
        return;
      }
      setLeads((prev) => [...prev, ...nuevos]);
      setSeccion("leads");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function buscarMulti(q: ConsultaMulti) {
    setCargando(true);
    setError(null);
    const tareas: Promise<Lead[]>[] = [];
    if (q.fuentes.includes("linkedin")) {
      tareas.push(
        fetchLeads("/api/search", {
          keyword: q.keyword,
          titles: CARGOS_MULTI,
          country: q.country,
          regiones: q.departamento ? [q.departamento] : [],
          city: q.city,
          limit: q.cantidad,
        }),
      );
    }
    if (q.fuentes.includes("negocios")) {
      const ubicacion = [q.city.trim(), q.departamento.trim(), q.country]
        .filter(Boolean)
        .join(", ");
      tareas.push(
        fetchLeads("/api/buscar-negocios", {
          keyword: q.keyword,
          ubicacion,
          cantidad: q.cantidad,
          soloConWeb: false,
          omitirCerrados: true,
          minEstrellas: 0,
        }),
      );
    }
    if (q.fuentes.includes("instagram")) {
      tareas.push(
        fetchLeads("/api/buscar-instagram", {
          hashtags: [q.keyword],
          cantidad: q.cantidad,
        }),
      );
    }
    try {
      const res = await Promise.allSettled(tareas);
      const nuevos = res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      const errs = res.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      if (nuevos.length) {
        setLeads((prev) => [...prev, ...nuevos]);
        setSeccion("leads");
        if (errs.length) mostrarToast("Una fuente falló; traje las demás");
      } else {
        setError(
          errs[0]
            ? (errs[0].reason as Error).message
            : "No se encontraron leads con esos filtros. Probá ampliarlos.",
        );
      }
    } finally {
      setCargando(false);
    }
  }

  async function mover(id: string, estado: EstadoLead) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ estado }),
    }).catch(() => {});
  }

  async function cambiarNota(id: string, nota: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, nota } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nota }),
    }).catch(() => {});
  }

  async function guardarAjustes(a: Ajustes) {
    setAjustes(a);
    await fetch("/api/ajustes", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(a),
    }).catch(() => {});
  }

  async function eliminarLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setAbierto(null);
    await fetch(`/api/leads/${id}`, { method: "DELETE" }).catch(() => {});
    mostrarToast("Lead eliminado");
  }

  async function limpiarTablero(modo: "todos" | "reunion" | "cerrados") {
    const d = await fetch("/api/leads/limpiar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modo }),
    })
      .then((r) => r.json())
      .catch(() => null);
    await refrescarLeads();
    if (d) mostrarToast(`${d.borrados} lead(s) eliminados`);
  }

  const leadAbierto = leads.find((l) => l.id === abierto) ?? null;
  // El tablero muestra SOLO los leads del cliente activo (no se mezclan clientes).
  const leadsCliente = leads.filter(
    (l) => !l.clienteId || l.clienteId === clienteActivoId,
  );
  const esAdmin = usuario?.rol === "admin";

  // Gate de sesión: sin usuario elegido, se muestra el login "¿Quién eres?".
  if (!authListo) return null;
  if (!usuario) return <LoginUsuarios onElegir={elegirUsuario} />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        seccion={seccion}
        onCambiar={setSeccion}
        totalLeads={leadsCliente.length}
        canal={canal}
        clienteNombre={clienteNombre}
        usuario={usuario}
        modoDev={modoDev}
        onCerrarSesion={cerrarSesion}
        abiertoMovil={menuMovilAbierto}
        onCerrarMovil={() => setMenuMovilAbierto(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Barra superior: solo en celular. En escritorio el sidebar ya está
            siempre visible, así que esta barra sobra. */}
        <header className="flex shrink-0 items-center gap-3 border-b border-li-border bg-li-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setMenuMovilAbierto(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-li-text-2 transition-colors hover:bg-black/[0.06] hover:text-li-text"
          >
            <Menu size={20} />
          </button>
          <h1 className="truncate text-[16px] font-semibold">{TITULO_SECCION[seccion]}</h1>
        </header>

        <main className="scroll-fino min-w-0 flex-1 overflow-y-auto">
        {cargando ? (
          <CargandoBusqueda />
        ) : (
          <>
            {error && (
              <div className="mx-auto mt-6 flex max-w-2xl items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <p className="flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-[13px] font-semibold underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            {false && esAdmin && seccion === "clientes" && (
              <ClientesView
                onCambio={() => {
                  refrescarCliente();
                  refrescarLeads();
                  setFuenteElegida(null); // al cambiar de cliente, re-elegir fuente
                }}
                onToast={mostrarToast}
              />
            )}
            {esAdmin && seccion === "panel" && <PanelView onToast={mostrarToast} />}
            {esAdmin && seccion === "busqueda" &&
              (fuenteElegida === null ? (
                <FuentesView
                  canal={canal}
                  clienteNombre={clienteNombre}
                  cargando={cargando}
                  modoDev={modoDev}
                  onBuscarMulti={buscarMulti}
                  onAvanzada={(f) => setFuenteElegida(f)}
                  onElegirEcommerce={() => setFuenteElegida("ecommerce")}
                />
              ) : fuenteElegida === "ecommerce" ? (
                <IngestaView
                  clienteNombre={clienteNombre}
                  onIngresado={(nuevos) => {
                    setLeads((prev) => [...prev, ...nuevos]);
                    setSeccion("leads");
                  }}
                  onToast={mostrarToast}
                  onVolver={() => setFuenteElegida(null)}
                />
              ) : (
                <BusquedaView
                  fuenteInicial={fuenteElegida}
                  onBuscar={buscar}
                  onBuscarNegocios={buscarNegocios}
                  cargando={cargando}
                  onVolver={() => setFuenteElegida(null)}
                />
              ))}
            {seccion === "leads" && (
              <LeadsView
                leads={leadsCliente}
                onAbrir={(l) => setAbierto(l.id)}
                onMover={mover}
                onEliminar={eliminarLead}
                onIrABusqueda={() => setSeccion("busqueda")}
                onLimpiar={limpiarTablero}
              />
            )}
            {seccion === "chats" && (
              <ChatsView
                leads={leadsCliente}
                onRefrescar={refrescarLeads}
                onToast={mostrarToast}
              />
            )}
            {esAdmin && seccion === "piloto" && (
              <PilotoView
                leads={leadsCliente}
                onRefrescarLeads={refrescarLeads}
                onToast={mostrarToast}
              />
            )}
            {seccion === "bandeja" && (
              <InTheLoopView
                leads={leadsCliente}
                onAbrir={(id) => setAbierto(id)}
                onToast={mostrarToast}
                onRefrescarLeads={refrescarLeads}
              />
            )}
            {seccion === "ruta" && (
              <RutaView onToast={mostrarToast} onRefrescarLeads={refrescarLeads} />
            )}
            {esAdmin && seccion === "historial" && <HistorialView />}
            {esAdmin && seccion === "ajustes" && (
              <AjustesView ajustes={ajustes} onGuardar={guardarAjustes} />
            )}
          </>
        )}
        </main>
      </div>

      <LeadPanel
        lead={leadAbierto}
        agendaUrl={ajustes.agendaUrl}
        onCerrar={() => setAbierto(null)}
        onCambiarEstado={mover}
        onCambiarNota={cambiarNota}
        onMensajeRegenerado={(id, mensaje) =>
          setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, mensaje } : l)))
        }
        onActualizarLead={(actualizado) =>
          setLeads((prev) =>
            prev.map((l) => (l.id === actualizado.id ? actualizado : l)),
          )
        }
        onEliminar={eliminarLead}
        onToast={mostrarToast}
      />

      <Toast texto={toast} />

      {/* Botón flotante de ayuda (esquina inferior derecha). Oculto mientras
          el cajón móvil está abierto: si no, queda flotando encima del fondo
          oscuro del cajón, fuera de lugar. */}
      {!tutorialAbierto && !menuMovilAbierto && (
        <button
          onClick={() => setAyudaAbierta((v) => !v)}
          aria-label="Ayuda"
          title="¿Cómo funciona esta pantalla?"
          className="fixed bottom-5 right-5 z-[47] flex h-12 w-12 items-center justify-center rounded-full bg-li-blue text-white shadow-lg transition-transform hover:scale-105"
        >
          <HelpCircle size={22} />
        </button>
      )}
      <AyudaContextual
        abierta={ayudaAbierta}
        seccion={seccion}
        onRecorrido={() => {
          setAyudaAbierta(false);
          setTutorialAbierto(true);
        }}
        onCerrar={() => setAyudaAbierta(false)}
      />
      <TourGuiado
        activo={tutorialAbierto}
        esAdmin={esAdmin}
        onNavegar={setSeccion}
        onCerrar={cerrarTutorial}
      />
    </div>
  );
}
