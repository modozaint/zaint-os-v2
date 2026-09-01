import { NextResponse } from 'next/server'
import { readAndClearAlerts } from '@/lib/gemini'

export async function GET() {
  const alerts = readAndClearAlerts()
  return NextResponse.json({ alerts })
}
