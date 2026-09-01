import { Suspense } from "react"
import { BancoReferentes } from "@/components/referentes/BancoReferentes"

export default function ReferentesPage() {
  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={null}>
        <BancoReferentes />
      </Suspense>
    </div>
  )
}
