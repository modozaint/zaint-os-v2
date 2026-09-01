export interface Goal {
  label: string
  current: number  // viene de la API — solo lectura en settings
  target: number   // editable manualmente
  unit?: string
}

// Targets por defecto — el usuario los ajusta en Settings.
// Los "current" son placeholder hasta que la API esté conectada.
export const DEFAULT_GOALS: Goal[] = [
  { label: "Seguidores Instagram", current: 0, target: 50000 },
  { label: "Views Orgánicas / mes", current: 0, target: 300000 },
]

const STORAGE_KEY = "dashboard-goal-targets"

// Solo persistimos los targets — los currents siempre vienen de la API
export function loadTargets(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

export function saveTargets(targets: Record<string, number>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
}

// Merge goals con targets guardados
export function loadGoals(): Goal[] {
  const saved = loadTargets()
  return DEFAULT_GOALS.map((g) => ({
    ...g,
    target: saved[g.label] ?? g.target,
  }))
}
