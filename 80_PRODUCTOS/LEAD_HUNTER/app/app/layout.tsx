import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadHunter — Nexus Reach",
  description:
    "Encontrá profesionales en LinkedIn por rubro y ubicación, analizalos con IA y llevate un mensaje de contacto listo para copiar.",
  robots: { index: false, follow: false },
};

/**
 * Aplica el tema ANTES de que React pinte nada. Sin esto, la página carga en
 * claro y "parpadea" a oscuro medio segundo después — se nota mucho y se ve
 * mal. Corre en el navegador, nunca en el servidor (por eso es un script
 * inline, no un componente).
 */
const SCRIPT_TEMA = `
try {
  var t = localStorage.getItem("lh_tema");
  if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
