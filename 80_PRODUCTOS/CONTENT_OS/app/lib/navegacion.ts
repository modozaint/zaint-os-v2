import { LayoutDashboard, Instagram, MessageSquare, Users, CalendarRange, Layers3 } from 'lucide-react'

/**
 * La navegación, escrita UNA vez.
 *
 * Antes vivía duplicada en `Sidebar` y en `MobileNav`, así que renombrar una
 * pestaña la dejaba con dos nombres según el dispositivo.
 *
 * Los nombres siguen el ciclo de trabajo, no la herramienta de origen:
 * miro cómo va → analizo lo que publiqué → miro a quién estudio → pregunto.
 * («Ideas» entra aquí cuando exista su pantalla: un enlace a una página que
 * no está es peor que no tener el enlace.)
 */
export const NAV = [
  { href: '/dashboard',  label: 'Overview',    icon: LayoutDashboard },
  { href: '/instagram',  label: 'Analizar',    icon: Instagram },
  { href: '/estrategia', label: 'Brújula',     icon: Layers3 },
  { href: '/plan',       label: 'Plan',        icon: CalendarRange },
  { href: '/referentes', label: 'Referentes',  icon: Users },
  { href: '/chat',       label: 'AI Chat',     icon: MessageSquare },
] as const

/**
 * Conserva la marca activa al navegar. Sin esto, cambiar de pestaña te
 * devuelve a Dermatinta y hay que volver a elegir en cada clic.
 */
export function conMarca(href: string, marca: string | null): string {
  return marca ? `${href}?marca=${marca}` : href
}
