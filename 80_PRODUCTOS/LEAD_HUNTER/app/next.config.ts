import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El badge de dev de Next se planta abajo a la izquierda y tapa el sello
  // "Datos vía LinkedIn" del sidebar. Como esto se graba en pantalla, lo
  // ocultamos: los errores de compilación se siguen mostrando igual.
  devIndicators: false,

  // Cabeceras de seguridad para TODA la app. Traefik ya fuerza HTTPS (ver
  // DEPLOY.md), pero estas van en la respuesta misma: si el día de mañana la
  // app se sirve detrás de otro proxy (o de ninguno), sigue protegida igual.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Nadie puede meter la app en un <iframe> ajeno (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // El navegador no "adivina" el tipo de un archivo servido.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No se filtra la URL completa (con el nombre del lead, etc.) al
          // salir a un link externo (ej. LinkedIn, WhatsApp).
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Apaga permisos de hardware que esta app nunca pide.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // 1 año, avisa a los navegadores que memoricen "siempre HTTPS" para
          // este dominio (protege contra un downgrade a HTTP en el futuro).
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
