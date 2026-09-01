import { ProgressBar } from "@/components/shared/ProgressBar"

interface Goal {
  label: string
  current: number
  target: number
  unit?: string
}

export function GoalsSection({ goals }: { goals: Goal[] }) {
  return (
    <div className="flex flex-col gap-5">
      {goals.map((g) => (
        <ProgressBar
          key={g.label}
          label={g.label}
          current={g.current}
          target={g.target}
          unit={g.unit}
        />
      ))}
    </div>
  )
}
