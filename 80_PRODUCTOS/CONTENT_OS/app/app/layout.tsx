import type { Metadata, Viewport } from "next"
import { JetBrains_Mono, DM_Sans, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/layout/AppShell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { UsuarioProvider } from "@/components/providers/UsuarioProvider"
import { SplashScreen } from "@/components/shared/SplashScreen"
import { GeminiAlertBanner } from "@/components/layout/GeminiAlert"

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
})

export const metadata: Metadata = {
  // iPhone no lee el manifiesto para decidir el modo app — usa estas metas.
  // Sin ellas, "Añadir a pantalla de inicio" abre con la barra de Safari.
  appleWebApp: { capable: true, title: "Content OS", statusBarStyle: "black-translucent" },
  manifest: "/manifest.webmanifest",
  title: "MODOZAINT — Content OS",
  description: "Inteligencia de contenido para la marca personal MODOZAINT",
  // Verificacion de propiedad del sitio por meta tag. Va por variable de entorno
  // a proposito: la cadena la genera TikTok en el momento, y asi verificar
  // cuesta pegar una variable en Vercel en vez de un cambio de codigo y un
  // deploy por cada intento.
  ...(process.env.TIKTOK_SITE_VERIFICATION
    ? { other: { "tiktok-developers-site-verification": process.env.TIKTOK_SITE_VERIFICATION } }
    : {}),
}

// viewport-fit=cover hace funcionar env(safe-area-inset-*) en iPhone (MobileNav)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${jetbrainsMono.variable} ${dmSans.variable} ${cormorant.variable}`}>
      <body className="antialiased">
        {/* Anti-flash: runs before React hydration, sets data-theme from localStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        <ThemeProvider>
          <UsuarioProvider>
            <SplashScreen />
            <GeminiAlertBanner />
            <TooltipProvider>
              <AppShell>{children}</AppShell>
            </TooltipProvider>
          </UsuarioProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
