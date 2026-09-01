import { NextResponse } from "next/server";
import {
  activarCliente,
  actualizarCliente,
  crearCliente,
  listarClientes,
  obtenerClienteActivo,
} from "@/lib/store";
import type { Canal } from "@/lib/types";

/** Lista de clientes + cuál está activo (para que la UI sepa el canal). */
export async function GET() {
  const activo = obtenerClienteActivo();
  return NextResponse.json({
    clientes: listarClientes(),
    activoId: activo?.id ?? "",
    canal: activo?.canal ?? "linkedin",
  });
}

/** Crea un nuevo perfil de cliente. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nombre = String(b.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre del cliente." }, { status: 400 });
  }
  const canal: Canal = b.canal === "ecommerce" ? "ecommerce" : "linkedin";
  const cliente = crearCliente({
    nombre,
    canal,
    nicho: String(b.nicho ?? "").trim(),
    remitente: String(b.remitente ?? "").trim() || "Equipo",
    oferta: String(b.oferta ?? "").trim(),
    agendaUrl: String(b.agendaUrl ?? "").trim(),
    colorMarca: typeof b.colorMarca === "string" ? b.colorMarca : undefined,
  });
  return NextResponse.json({ cliente });
}

/** Activa un cliente (?activar) o actualiza sus campos. */
export async function PATCH(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.activar === "string") {
    const cliente = activarCliente(b.activar);
    if (!cliente) return NextResponse.json({ error: "No existe ese cliente." }, { status: 404 });
    return NextResponse.json({ cliente });
  }
  if (typeof b.id === "string") {
    const cliente = actualizarCliente(b.id, (b.cambios ?? {}) as Record<string, never>);
    if (!cliente) return NextResponse.json({ error: "No existe ese cliente." }, { status: 404 });
    return NextResponse.json({ cliente });
  }
  return NextResponse.json({ error: "Falta 'activar' o 'id'." }, { status: 400 });
}
