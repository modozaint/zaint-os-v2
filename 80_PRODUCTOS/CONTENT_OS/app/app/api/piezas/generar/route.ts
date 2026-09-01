import { NextRequest, NextResponse } from 'next/server'
import { generarPieza, type Respuestas } from '@/lib/generarPieza'
import {
  crearPieza, actualizarPieza, obtenerPieza, FaltaMigracion, type TipoPieza,
} from '@/lib/piezas'
import { esMarca } from '@/lib/marcas'
import { COOKIE_USUARIO, esUsuario } from '@/lib/usuarios'

// Generar tarda unos segundos: nunca prerenderizar ni cachear.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { marca, tipo, idea, piezaId, respuestas } = await req.json()
    if (!esMarca(marca)) return NextResponse.json({ error: 'Marca inválida' }, { status: 400 })

    const cookieUsuario = req.cookies.get(COOKIE_USUARIO)?.value
    const autor = esUsuario(cookieUsuario) ? cookieUsuario : null
    const formato = (tipo ?? 'reel') as TipoPieza

    // Las tres preguntas de §4.4. Se limpian aquí y no en el cliente: si un
    // día se llama a esta ruta desde otro sitio, el contrato es el mismo.
    const r = (respuestas ?? {}) as Record<string, unknown>
    const dichas: Respuestas = {}
    for (const k of ['publico', 'verdad', 'material'] as const) {
      const v = typeof r[k] === 'string' ? (r[k] as string).trim() : ''
      if (v) dichas[k] = v
    }

    const generada = await generarPieza(marca, formato, idea ?? '', dichas)

    // Lo que la IA produjo, en los campos que le corresponden. Se arma una
    // sola vez porque los dos caminos —idea guardada y pieza nueva— guardan
    // exactamente lo mismo; si se escribiera dos veces, un día divergirían.
    const escrito = {
      titulo: generada.titulo,
      idea,
      tipo: formato,
      eje: generada.eje,
      // Ya tiene guion: dejarla en "idea" sería mentir sobre su estado.
      estado: 'guionizada' as const,
      // Las tres rejillas de Converzzo: es lo que el calendario mide después.
      funcion: generada.funcion,
      angulo: generada.angulo,
      rotacion: generada.rotacion,
      // ⭐ Lo contestado se GUARDA, no solo se usa para generar. El plan lo
      // pide explícito: «al volver a la ficha meses después, saber a quién le
      // hablaba y qué hecho tenía adentro es lo que permite reescribirla».
      brief: { ...generada.brief, ...dichas },
      hooks: generada.hooks,
      guion: generada.guion,
      escenas: generada.escenas,
    }

    if (piezaId) {
      // ---- Analizar una IDEA YA GUARDADA ----
      //
      // Se ACTUALIZA la misma fila. No se crea una nueva y se borra la vieja:
      // eso duplicaría la pieza durante un instante y perdería su `created_at`
      // —cuándo se le ocurrió— que es justo lo que dice si el banco de ideas
      // se está usando.
      //
      // El `autor` NO se toca: la idea es de quien la pensó, no de quien
      // apretó el botón de analizarla.
      const antes = await obtenerPieza(piezaId)
      if (!antes) return NextResponse.json({ error: 'Esa idea ya no existe' }, { status: 404 })

      await actualizarPieza(piezaId, escrito)
      const despues = await obtenerPieza(piezaId)
      return NextResponse.json({ pieza: { ...despues, ...generada } }, { status: 200 })
    }

    // ---- Pieza nueva, escrita en el momento ----
    const pieza = await crearPieza({
      titulo: escrito.titulo,
      marca_id: marca,
      tipo: formato,
      idea,
      eje: escrito.eje,
      estado: escrito.estado,
      funcion: escrito.funcion,
      angulo: escrito.angulo,
      rotacion: escrito.rotacion,
      autor,
    })
    await actualizarPieza(pieza.id, {
      brief: escrito.brief,
      hooks: escrito.hooks,
      guion: escrito.guion,
      escenas: escrito.escenas,
    })

    return NextResponse.json({ pieza: { ...pieza, ...generada } }, { status: 201 })
  } catch (e) {
    if (e instanceof FaltaMigracion) {
      return NextResponse.json({ error: e.message, faltaMigracion: true }, { status: 503 })
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
