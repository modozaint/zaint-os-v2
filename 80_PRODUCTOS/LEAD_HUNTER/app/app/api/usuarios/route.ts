import { NextResponse } from "next/server";
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
} from "@/lib/store";
import type { Rol } from "@/lib/types";

/** Roster de usuarios de la app (para el login "¿Quién eres?"). */
export async function GET() {
  return NextResponse.json({ usuarios: listarUsuarios() });
}

/** Crea un usuario nuevo (por defecto comercial). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nombre = String(b.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
  }
  const rol: Rol = b.rol === "admin" ? "admin" : "comercial";
  const usuario = crearUsuario(nombre, rol);
  return NextResponse.json({ usuario });
}

/** Cambia el nombre o el rol de un usuario. */
export async function PATCH(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "Falta 'id'." }, { status: 400 });
  const cambios: { nombre?: string; rol?: Rol } = {};
  if (typeof b.nombre === "string") cambios.nombre = b.nombre.trim();
  if (b.rol === "admin" || b.rol === "comercial") cambios.rol = b.rol;
  const usuario = actualizarUsuario(id, cambios);
  if (!usuario) return NextResponse.json({ error: "No existe ese usuario." }, { status: 404 });
  return NextResponse.json({ usuario });
}

/** Elimina un usuario (nunca el último admin). */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Falta 'id'." }, { status: 400 });
  const ok = eliminarUsuario(id);
  if (!ok) {
    return NextResponse.json(
      { error: "No se pudo eliminar (no existe o es el último admin)." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
