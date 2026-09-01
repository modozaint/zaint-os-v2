import { Suspense } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileNav } from "./MobileNav"
import { TemaDeMarca } from "./TemaDeMarca"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex h-dvh overflow-hidden" style={{ backgroundColor: "transparent" }}>
      {/* Sidebar y MobileNav leen la marca activa de la URL para conservarla al
          navegar, y useSearchParams obliga a un límite de Suspense: sin esto la
          página 404 —que sí se prerenderiza— tumba el build entero. */}
      {/* Pinta el acento de la app con la identidad de la marca activa */}
      <Suspense fallback={null}>
        <TemaDeMarca />
      </Suspense>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {/* pb en móvil reserva el espacio de la MobileNav (60px + safe area del iPhone) */}
        <main className="flex-1 overflow-y-auto pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
