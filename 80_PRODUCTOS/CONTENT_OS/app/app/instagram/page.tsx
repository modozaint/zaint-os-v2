import { Suspense } from "react"
import { ReelsFeed } from "@/components/instagram/ReelsFeed"

export default function InstagramPage() {
  return (
    <div className="p-4 md:p-6">
      {/* ReelsFeed lee la marca activa de la URL con useSearchParams, y eso
          obliga a un límite de Suspense en Next 16. */}
      <Suspense fallback={null}>
        <ReelsFeed />
      </Suspense>
    </div>
  )
}
