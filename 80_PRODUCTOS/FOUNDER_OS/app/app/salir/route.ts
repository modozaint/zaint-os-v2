import { NextResponse } from 'next/server'
import { conectar } from '@/lib/supabase'

export async function POST(req: Request) {
  const db = await conectar()
  await db.auth.signOut()
  return NextResponse.redirect(new URL('/entrar', req.url), { status: 303 })
}
