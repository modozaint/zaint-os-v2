import fs from 'fs'
import os from 'os'
import path from 'path'

// tmp del sistema — único directorio escribible en serverless (Vercel)
const ALERTS_FILE = path.join(os.tmpdir(), 'gemini-alerts.json')

export interface GeminiAlert {
  id: string
  caller: string
  timestamp: string
}

function writeAlert(caller: string) {
  let alerts: GeminiAlert[] = []
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'))
    }
  } catch { /* ignorar */ }

  alerts.push({
    id: Math.random().toString(36).slice(2),
    caller,
    timestamp: new Date().toISOString(),
  })

  try {
    fs.mkdirSync(path.dirname(ALERTS_FILE), { recursive: true })
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2))
  } catch {
    // sin registro de alerta — no es crítico
  }
}

export function getGeminiModel(caller = 'desconocido', model = 'gemini-2.5-flash') {
  writeAlert(caller)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(`[GEMINI_ALERT] Se intentó usar Gemini (${caller}) pero GEMINI_API_KEY no está configurada. Usá Groq en su lugar.`)
  }

  // Solo importar si hay key — evita crash en build
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model })
}

export function readAndClearAlerts(): GeminiAlert[] {
  if (!fs.existsSync(ALERTS_FILE)) return []
  try {
    const alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'))
    fs.unlinkSync(ALERTS_FILE)
    return alerts
  } catch {
    return []
  }
}
