import { Suspense } from "react"
import { PlanTablero } from "@/components/plan/PlanTablero"

export default function PlanPage() {
  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={null}>
        <PlanTablero />
      </Suspense>
    </div>
  )
}
