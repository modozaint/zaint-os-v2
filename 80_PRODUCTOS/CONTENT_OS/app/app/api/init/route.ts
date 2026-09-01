import { NextResponse } from "next/server"

export interface ModuleCheck {
  id: string
  label: string
  status: "ok" | "not_configured" | "error"
  detail?: string
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  )
  return Promise.race([promise, timeout])
}

async function checkInstagram(): Promise<ModuleCheck> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID

  if (!token || !userId) {
    return { id: "instagram", label: "Instagram Intelligence", status: "not_configured", detail: "Token o User ID no configurado" }
  }

  try {
    const res = await withTimeout(
      fetch(`https://graph.facebook.com/v21.0/${userId}?fields=name&access_token=${token}`),
      3000
    )
    if (res.ok) return { id: "instagram", label: "Instagram Intelligence", status: "ok" }
    const body = await res.json().catch(() => ({}))
    return { id: "instagram", label: "Instagram Intelligence", status: "error", detail: body?.error?.message ?? "Error de API" }
  } catch {
    return { id: "instagram", label: "Instagram Intelligence", status: "error", detail: "No se pudo conectar" }
  }
}

async function checkAI(): Promise<ModuleCheck> {
  const key = process.env.GEMINI_API_KEY

  if (!key) {
    return { id: "ai", label: "AI Chat", status: "not_configured", detail: "Gemini API Key no configurada" }
  }

  // Minimal check: validate key format (no cost, no real call needed for now)
  const looksValid = key.length > 20
  if (looksValid) return { id: "ai", label: "AI Chat", status: "ok" }
  return { id: "ai", label: "AI Chat", status: "error", detail: "API Key con formato inválido" }
}

export async function GET() {
  const results = await Promise.all([
    checkInstagram(),
    checkAI(),
  ])

  return NextResponse.json(results)
}
