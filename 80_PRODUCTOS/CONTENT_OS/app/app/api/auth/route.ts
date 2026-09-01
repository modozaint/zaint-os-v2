import { NextResponse } from "next/server"
import { COOKIE_SESION, DIAS_DE_SESION, tokenDe } from "@/lib/sesion"

export async function POST(req: Request) {
  const expected = process.env.DASHBOARD_PASSWORD
  if (!expected) {
    return NextResponse.json({ ok: false, error: "Login no configurado" }, { status: 500 })
  }

  let password = ""
  try {
    const body = await req.json()
    password = typeof body?.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_SESION, await tokenDe(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * DIAS_DE_SESION,
    path: "/",
  })
  return res
}
