import { NextResponse } from "next/server";
import { guardarLeads, obtenerClienteActivo } from "@/lib/store";
import type { Lead, OrigenLead } from "@/lib/types";

/** Eventos de ejemplo para la demo (nombres LatAm + productos de skincare). */
const NOMBRES = [
  "Valentina Ríos",
  "Mateo Restrepo",
  "Camila Ospina",
  "Sebastián Duque",
  "Isabella Marín",
  "Samuel Cardona",
  "Luciana Vélez",
  "Tomás Herrera",
  "Mariana Gil",
  "Emiliano Soto",
];
const PRODUCTOS = [
  "Sérum de vitamina C",
  "Protector solar FPS 50",
  "Crema hidratante con ácido hialurónico",
  "Limpiador facial en gel",
  "Contorno de ojos",
];
const TIPOS: OrigenLead[] = ["compra", "visita_producto", "interaccion_post"];

function elegir<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function resumenDe(origen: OrigenLead, producto: string): string {
  if (origen === "compra") return `Compró ${producto}.`;
  if (origen === "visita_producto") return `Visitó la página de ${producto} sin comprar.`;
  return `Interactuó con una publicación sobre ${producto}.`;
}

function porQueDe(origen: OrigenLead): string {
  if (origen === "compra")
    return "Ya confió y compró: momento ideal para asegurar buena experiencia y abrir la recompra o suscripción.";
  if (origen === "visita_producto")
    return "Mostró intención de compra; un seguimiento de calidad puede cerrar la venta.";
  return "Está en el radar de la marca; buen momento para nutrir la relación.";
}

function mensajeDe(
  origen: OrigenLead,
  nombre: string,
  producto: string,
  marca: string,
): string {
  const pila = nombre.split(" ")[0];
  if (origen === "compra")
    return `Hola ${pila}, te escribo de ${marca}. Vi que te llevaste ${producto}. ¿Te llegó bien y ya lo pudiste probar? Cualquier duda para sacarle el máximo, me dices.`;
  if (origen === "visita_producto")
    return `Hola ${pila}, te escribo de ${marca}. Vi que estuviste mirando ${producto}. ¿Te quedó alguna duda? Con gusto te ayudo a ver si es lo que buscas.`;
  return `Hola ${pila}, te escribo de ${marca}. Gracias por pasarte por nuestra publicación de ${producto}. ¿Te cuento algo más o te resuelvo alguna duda?`;
}

interface EventoEntrada {
  nombre: string;
  producto: string;
  tipo: OrigenLead;
  contacto?: string;
}

function crearLead(ev: EventoEntrada, marca: string, i: number): Lead {
  const origen = TIPOS.includes(ev.tipo) ? ev.tipo : "compra";
  return {
    id: `ec-${Date.now()}-${i}`,
    nombre: ev.nombre,
    cargo: "",
    empresa: marca,
    ubicacion: "",
    fotoUrl: null,
    perfilUrl: "",
    headline: resumenDe(origen, ev.producto),
    ultimoPost: null,
    resumen: resumenDe(origen, ev.producto),
    porQueBuenLead: porQueDe(origen),
    mensaje: mensajeDe(origen, ev.nombre, ev.producto, marca),
    estado: "nuevos",
    nota: "",
    creadoEn: Date.now() + i,
    origen,
    producto: ev.producto,
    contacto: ev.contacto ?? "",
  };
}

/** Ingesta de eventos de ecommerce (compras/visitas/interacciones) como leads. */
export async function POST(req: Request) {
  const cli = obtenerClienteActivo();
  if (!cli || cli.canal !== "ecommerce") {
    return NextResponse.json(
      { error: "La ingesta de ecommerce requiere un cliente de canal ecommerce activo." },
      { status: 400 },
    );
  }
  const marca = cli.nombre;

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  let eventos: EventoEntrada[] = [];
  if (b.demo) {
    const n = Math.min(Math.max(Number(b.cuantos) || 5, 1), 20);
    eventos = Array.from({ length: n }, (_, i) => ({
      nombre: elegir(NOMBRES, i),
      producto: elegir(PRODUCTOS, i + 1),
      tipo: elegir(TIPOS, i),
    }));
  } else if (Array.isArray(b.eventos)) {
    eventos = (b.eventos as Record<string, unknown>[])
      .map((e) => ({
        nombre: String(e.nombre ?? "").trim(),
        producto: String(e.producto ?? "").trim(),
        tipo: (TIPOS.includes(e.tipo as OrigenLead) ? e.tipo : "compra") as OrigenLead,
        contacto: String(e.contacto ?? "").trim(),
      }))
      .filter((e) => e.nombre && e.producto);
  }

  if (!eventos.length) {
    return NextResponse.json({ error: "No hay eventos válidos para ingresar." }, { status: 400 });
  }

  const leads = eventos.map((ev, i) => crearLead(ev, marca, i));
  guardarLeads(leads);
  return NextResponse.json({ leads, ingresados: leads.length });
}
