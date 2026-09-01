'use client'

/**
 * Achica la foto ANTES de subirla.
 *
 * Una foto de celular pesa 3-5 MB. Por datos moviles eso se demora tanto que
 * parece colgado — que es justo como se veia el bug: "Subiendo..." para
 * siempre. A 1600 px de lado y calidad 0.82 baja a ~300 KB y en la pantalla
 * se ve igual.
 *
 * Si el navegador no puede decodificarla (pasa con HEIC fuera de Safari), se
 * devuelve el archivo original: mejor subir pesado que no subir.
 */
export async function achicar(archivo: File, ladoMax = 1600): Promise<File> {
  try {
    const foto = await createImageBitmap(archivo)
    const escala = Math.min(1, ladoMax / Math.max(foto.width, foto.height))

    // Ya es pequena y liviana: no vale la pena recomprimirla.
    if (escala === 1 && archivo.size < 900_000) { foto.close(); return archivo }

    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(foto.width * escala)
    lienzo.height = Math.round(foto.height * escala)

    const ctx = lienzo.getContext('2d')
    if (!ctx) { foto.close(); return archivo }
    ctx.drawImage(foto, 0, 0, lienzo.width, lienzo.height)
    foto.close()

    const blob = await new Promise<Blob | null>(r => lienzo.toBlob(r, 'image/jpeg', 0.82))
    if (!blob || blob.size >= archivo.size) return archivo

    const nombre = archivo.name.replace(/\.[^.]+$/, '') || 'foto'
    return new File([blob], nombre + '.jpg', { type: 'image/jpeg' })
  } catch {
    return archivo
  }
}
