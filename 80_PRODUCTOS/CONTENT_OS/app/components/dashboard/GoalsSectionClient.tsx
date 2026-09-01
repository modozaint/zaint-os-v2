"use client"

import { useEffect, useState } from "react"
import { GoalsSection } from "./GoalsSection"
import { loadGoals, type Goal } from "@/lib/goals"

interface Props {
  followerCount: number
  currentMonthReach: number
}

export function GoalsSectionClient({ followerCount, currentMonthReach }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    const saved = loadGoals()
    setGoals(
      saved.map((g) => ({
        ...g,
        current:
          g.label === "Seguidores Instagram"
            ? followerCount
            : g.label === "Views Orgánicas / mes"
            ? currentMonthReach
            : g.current,
      }))
    )
  }, [followerCount, currentMonthReach])

  return <GoalsSection goals={goals} />
}
