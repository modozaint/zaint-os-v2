import type { MetadataRoute } from 'next'

/**
 * EL MANIFIESTO — lo que hace que el celular pueda INSTALAR la app.
 *
 * Sin este archivo, Android intenta crear un "WebAPK" al darle a Instalar,
 * no encuentra manifiesto y falla con un error de APK inválido. Es la causa
 * exacta de que no se pudiera instalar desde el celular.
 *
 * Con esto, "Añadir a pantalla de inicio" en Chrome (Android) o en Safari
 * (iPhone) deja un icono real, y la app abre sin barra de direcciones.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Content OS — ZAINT',
    short_name: 'Content OS',
    description: 'El sistema de contenido de ZAINT: análisis, referentes, plan y guiones.',
    // El celular entra directo al tablero, no a la raíz que solo redirige.
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0D3D34',
    theme_color: '#0D3D34',
    lang: 'es',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // `maskable` deja que Android recorte el icono a su forma sin comerse
      // el logo: por eso los iconos llevan margen y fondo solido.
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
