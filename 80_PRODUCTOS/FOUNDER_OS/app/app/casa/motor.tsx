'use client'

/* ============================================================
   EL MOTOR DE LA CASA — lo que sirve para CUALQUIER habitación.

   Salió tal cual de `app/cuarto/escena.tsx`, donde vivía mezclado con el
   dibujo del cuarto. **No se reescribió: se separó.** La geometría, las
   primitivas y el muñequito son los mismos que llevan funcionando desde el
   23-ago.

   🔑 LA REGLA QUE JUSTIFICA ESTE ARCHIVO: una habitación tiene que ser una
   LISTA, no un componente. Si para añadir el taller hubiera que tocar algo de
   aquí, la separación habría fallado. Por eso el vocabulario de dibujo
   (`caja`, `pared`, `poli`, `circulo`, `elipse`, `linea`) cubre TODO lo que
   usaba el cuarto: se comprobó transcribiéndolo entero y comparando la
   pantalla contra un screenshot de antes.

   ⚠️ LAS DOS CONVENCIONES QUE HAY QUE ENTENDER ANTES DE DECLARAR NADA:

   1. **El piso son dos números (u, v).** u crece hacia la pared derecha, v
      hacia la izquierda. Los muebles se apoyan ahí, no en píxeles.
   2. **La `y` de todo dibujo suelto es RELATIVA a `oy`**, la esquina del
      fondo. Nunca un número absoluto: el lienzo cambia de alto y lo que esté
      clavado a un píxel se despega. Ya pasó una vez con las etiquetas.
   ============================================================ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export const ANCHO = 320
export const TX = 30, TY = 15      // media baldosa: 30 de ancho, 15 de alto
export const BALDOSAS = 5
const OX = 160                     // la esquina del fondo, en horizontal

/** Lo que ocupa el piso por debajo de la esquina del fondo, más un margen. */
const PISO = BALDOSAS * 2 * TY + 8   // 158

/**
 * El alto de la pared: la mitad del ancho del piso.
 *
 * ⚠️ POR QUÉ NO SUBE HASTA EL BORDE, que fue lo primero que se probó: una
 * habitación isométrica vista desde una esquina es **apaisada** y un teléfono
 * es 19.5:9. Estirar la pared para llenar la convierte en un pozo. Se dibujó,
 * se miró y se descartó. Lo que llena la pantalla es que la habitación se
 * dibuje lo más grande que quepa, y que lo que sobre sea penumbra.
 */
const PARED = BALDOSAS * TX        // 150
const BLOQUE = PARED + PISO        // 308
export const ALTO = BLOQUE

/**
 * ⭐ LA PLANTA DE LA CASA — cuántas habitaciones caben en una fila.
 *
 * Santiago (2026-08-28): *«que se vean todas en la interfaz como tal... que se
 * pueda ir explorando, como todas las habitaciones»*. Antes la casa era UNA
 * FILA y la cámara enseñaba una habitación a la vez; ahora es una **planta**,
 * y se ven todas.
 *
 * 🔑 POR QUÉ DOS COLUMNAS Y NO UNA FILA LARGA, con el número que lo decide:
 * una habitación mide 320×308, o sea casi cuadrada (proporción 1.04). Tres en
 * fila dan 960×308 —una tira -, y en un teléfono de 390 de ancho cada
 * habitación quedaría en 130 px. En cuadrícula 2×2 el mundo mide 640×616,
 * **la misma proporción 1.04 que una habitación sola**, así que ocupa
 * exactamente el mismo hueco en pantalla y cada habitación conserva 195 px.
 * La casa entera cabe donde antes cabía un cuarto.
 *
 * Y si algún día son 5, 6 o 9: la fila 3 aparece sola. Nadie toca el motor.
 */
export const COLUMNAS = 2

/** En el servidor no hay layout que medir. Es el mismo hook, según dónde corra. */
const useMedir = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export type Punto = [number, number]

export const sube = ([x, y]: Punto, h: number): Punto => [x, y - h]
export const pts = (lista: Punto[]) => lista.map(([x, y]) => x + ',' + y).join(' ')

export function geometria(alto: number) {
  const oy = Math.round((alto - BLOQUE) / 2) + PARED
  const P = (u: number, v: number): Punto => [OX + TX * (u - v), oy + TY * (u + v)]
  return {
    alto, oy,
    hPared: PARED,
    P,
    pct: ([x, y]: Punto) => ({ left: (x / ANCHO) * 100 + '%', top: (y / alto) * 100 + '%' }),
  }
}
export type Geo = ReturnType<typeof geometria>

// ─────────────────── EL VOCABULARIO DE DIBUJO ───────────────────
// Con esto se declara cualquier habitación. Si algún día falta una forma, se
// añade AQUÍ una vez — nunca un componente por habitación.

export type Trazo =
  | { t: 'caja'; u: number; v: number; a: number; b: number; h: number; z?: number
      top: string; der: string; izq: string }
  | { t: 'pared'; lado: 'izq' | 'der'; en: number; alto: number; ancho: number; h: number; fill: string }
  | { t: 'poli'; p: Punto[]; fill: string; opacidad?: number; borde?: string; grosor?: number }
  /** Un polígono en coordenadas de PISO (u,v). El tapete, una alfombra. */
  | { t: 'piso'; p: Punto[]; fill: string; borde?: string; grosor?: number }
  | { t: 'circulo'; c: Punto; r: number; fill: string; opacidad?: number }
  | { t: 'elipse'; c: Punto; rx: number; ry: number; fill: string }
  | { t: 'linea'; a: Punto; b: Punto; color: string; grosor?: number }

/**
 * QUÉ BALDOSAS SE PUEDEN PISAR — y sale de los propios muebles.
 *
 * No hay una lista de baldosas ocupadas por habitación, y es a propósito: una
 * lista paralela se desincroniza el día que alguien mueva un mueble medio
 * metro, y el error resultante —caminar dentro de la cama— no lo caza ningún
 * compilador. Aquí se leen las `caja` del dibujo, que es lo que de verdad se
 * ve, así que mover un mueble mueve el piso.
 *
 * Las cajas bajas no cuentan: un tapete o un escalón se pisan.
 */
const ALTO_QUE_ESTORBA = 8

export function pisables(lista: Trazo[]): Set<string> {
  const ocupadas = new Set<string>()
  for (const t of lista) {
    if (t.t !== 'caja' || t.h < ALTO_QUE_ESTORBA) continue
    for (let u = Math.floor(t.u); u < Math.ceil(t.u + t.a); u++)
      for (let v = Math.floor(t.v); v < Math.ceil(t.v + t.b); v++)
        ocupadas.add(u + ',' + v)
  }
  return ocupadas
}

/**
 * La baldosa libre más cercana a donde se tocó.
 *
 * Sirve para lo que pidió el plan: *«si el destino está ocupado, que se pare
 * en el borde del mueble en vez de ignorar el toque — que no pase nada al
 * tocar se siente roto»*. Tocar la cama camina hasta el borde de la cama.
 */
export function baldosaLibre(u: number, v: number, ocupadas: Set<string>): [number, number] | null {
  const dentro = (a: number, b: number) => a >= 0 && b >= 0 && a < BALDOSAS && b < BALDOSAS
  const libre = (a: number, b: number) => dentro(a, b) && !ocupadas.has(a + ',' + b)
  if (libre(u, v)) return [u, v]

  // Anillos crecientes alrededor del toque. Con 5×5 baldosas esto es una
  // decena de comprobaciones: no hace falta nada más listo que esto.
  for (let r = 1; r < BALDOSAS; r++) {
    let mejor: [number, number] | null = null
    let mejorD = Infinity
    for (let a = u - r; a <= u + r; a++)
      for (let b = v - r; b <= v + r; b++) {
        if (Math.max(Math.abs(a - u), Math.abs(b - v)) !== r) continue
        if (!libre(a, b)) continue
        const d = Math.hypot(a - u, b - v)
        if (d < mejorD) { mejorD = d; mejor = [a, b] }
      }
    if (mejor) return mejor
  }
  return null
}

/** Lo que se toca: lleva a una pantalla, a otra habitación, o hace algo aquí. */
export type Objeto = {
  id: string
  etiqueta: string
  /** 'ir' navega · 'puerta' cambia de habitación · 'accion' la maneja la
   *  pantalla · 'fuera' SALE de la app (otra app, otro repo, otra base). */
  tipo: 'ir' | 'puerta' | 'accion' | 'fuera'
  href?: string
  /** Para 'puerta': el id de la habitación de destino. */
  hacia?: string
  /** Dónde toca el dedo: `[x, dy]`, dy relativo a `oy`. */
  centro: Punto
  etqAbajo: boolean
  /**
   * Aleja la etiqueta del objeto, en vez de pegarla.
   *
   * Existe por un caso concreto y se queda porque volverá: en el cuarto hay
   * TRES objetos —Hoy, Cuaderno y Días— dentro de 58 px de la pantalla, con
   * etiquetas de 40 a 77 px. Arriba y abajo no bastan para tres: hace falta
   * un segundo nivel de altura. Es la sexta vez que dos etiquetas se pisan en
   * esta casa; esta es la primera que se arregla con un mecanismo y no
   * moviendo una cosa a ojo.
   */
  etqLejos?: boolean
  /** La baldosa donde se para a mirarlo. */
  parada: [number, number]
  /** Al llegar se sienta (el escritorio con el cuaderno). */
  sienta?: boolean
}

export type Habitacion = {
  id: string
  nombre: string
  /** De qué marca es. Es lo que hace que la casa cuente algo y no sea metros. */
  marca: string
  /** La clase que le pone su paleta. Una habitación = un skin. */
  clase: string
  /** Dónde aparece el muñequito la primera vez que entra. */
  entrada: [number, number]
  /** Lo que se dibuja, en orden: lo primero queda detrás. */
  trazos: (d: Datos) => Trazo[]
  objetos: Objeto[]
  /** Lo que dice cada objeto del estado real, si dice algo. */
  datos?: (d: Datos) => Record<string, string | null>
  /**
   * Qué objetos están PIDIENDO algo ahora mismo (Ola 3).
   *
   * Distinto de `datos`: ese dice el estado, este dice si urge. El corcho con
   * «2» y el corcho con «0» hoy se ven igual salvo por el número — y el número
   * hay que leerlo. Un objeto que late se ve desde el otro lado del cuarto,
   * que es de donde se mira cuando se abre la app a las once de la noche.
   */
  alerta?: (d: Datos) => Record<string, boolean>
  pista: string
}

/** Lo que la app le pasa a la casa. Cada habitación toma lo que le sirve. */
export type Datos = {
  faltanHabitos: boolean
  racha: number
  protegido: boolean
  pendientesTareas: number
  areaFloja: { nombre: string; color: string } | null
  sinLlenar: number
  apunteHoy: string
}

// ─────────────────── LAS PRIMITIVAS, DIBUJADAS ───────────────────

function Trazos({ g, lista }: { g: Geo; lista: Trazo[] }) {
  const y = (p: Punto): Punto => [p[0], g.oy + p[1]]
  return (
    <>
      {lista.map((d, i) => {
        switch (d.t) {
          case 'caja': {
            const z = d.z ?? 0
            const N = sube(g.P(d.u, d.v), z), E = sube(g.P(d.u + d.a, d.v), z)
            const S = sube(g.P(d.u + d.a, d.v + d.b), z), W = sube(g.P(d.u, d.v + d.b), z)
            const s = (p: Punto) => sube(p, d.h)
            return (
              <g key={i}>
                <polygon points={pts([W, S, s(S), s(W)])} fill={d.izq} />
                <polygon points={pts([S, E, s(E), s(S)])} fill={d.der} />
                <polygon points={pts([s(N), s(E), s(S), s(W)])} fill={d.top} />
              </g>
            )
          }
          case 'pared': {
            const A = sube(d.lado === 'der' ? g.P(d.en, 0) : g.P(0, d.en), d.alto)
            const paso: Punto = d.lado === 'der'
              ? [TX * d.ancho, TY * d.ancho] : [-TX * d.ancho, TY * d.ancho]
            const B: Punto = [A[0] + paso[0], A[1] + paso[1]]
            return <polygon key={i} points={pts([A, B, sube(B, d.h), sube(A, d.h)])} fill={d.fill} />
          }
          case 'poli':
            return (
              <polygon key={i} points={pts(d.p.map(y))} fill={d.fill} opacity={d.opacidad}
                       stroke={d.borde} strokeWidth={d.borde ? (d.grosor ?? 1) : undefined} />
            )
          case 'piso':
            return (
              <polygon key={i} points={pts(d.p.map(([u, v]) => g.P(u, v)))} fill={d.fill}
                       stroke={d.borde} strokeWidth={d.borde ? (d.grosor ?? 1) : undefined} />
            )
          case 'circulo':
            return <circle key={i} cx={y(d.c)[0]} cy={y(d.c)[1]} r={d.r} fill={d.fill} opacity={d.opacidad} />
          case 'elipse':
            return <ellipse key={i} cx={y(d.c)[0]} cy={y(d.c)[1]} rx={d.rx} ry={d.ry} fill={d.fill} />
          case 'linea':
            return (
              <line key={i} x1={y(d.a)[0]} y1={y(d.a)[1]} x2={y(d.b)[0]} y2={y(d.b)[1]}
                    stroke={d.color} strokeWidth={d.grosor ?? 1.5} strokeLinecap="round" />
            )
        }
      })}
    </>
  )
}

/** Paredes, techo, zócalo y piso. Iguales en toda la casa; la paleta las cambia. */
function Caparazon({ g }: { g: Geo }) {
  const B = BALDOSAS
  return (
    <>
      <polygon fill="var(--cu-pared-der)"
               points={pts([g.P(0, 0), g.P(B, 0), sube(g.P(B, 0), g.hPared), sube(g.P(0, 0), g.hPared)])} />
      <polygon fill="var(--cu-pared-izq)"
               points={pts([g.P(0, 0), g.P(0, B), sube(g.P(0, B), g.hPared), sube(g.P(0, 0), g.hPared)])} />
      <polygon fill="url(#cu-luz)"
               points={pts([g.P(0, 0), g.P(B, 0), sube(g.P(B, 0), g.hPared), sube(g.P(0, 0), g.hPared)])} />

      {/* remate del techo: sin él la pared se corta en seco y parece un recorte */}
      <polygon fill="var(--cu-techo)"
               points={pts([sube(g.P(0, 0), g.hPared), sube(g.P(B, 0), g.hPared),
                            sube(g.P(B, 0), g.hPared - 7), sube(g.P(0, 0), g.hPared - 7)])} />
      <polygon fill="var(--cu-techo)"
               points={pts([sube(g.P(0, 0), g.hPared), sube(g.P(0, B), g.hPared),
                            sube(g.P(0, B), g.hPared - 7), sube(g.P(0, 0), g.hPared - 7)])} />

      {/* guardaescoba: separa pared y piso sin una línea dura */}
      <polygon fill="var(--cu-zocalo)"
               points={pts([g.P(0, 0), g.P(B, 0), sube(g.P(B, 0), 5), sube(g.P(0, 0), 5)])} />
      <polygon fill="var(--cu-zocalo)"
               points={pts([g.P(0, 0), g.P(0, B), sube(g.P(0, B), 5), sube(g.P(0, 0), 5)])} />

      {Array.from({ length: B }).map((_, i) =>
        Array.from({ length: B }).map((_, j) => (
          <polygon
            key={i + '-' + j}
            points={pts([g.P(i, j), g.P(i + 1, j), g.P(i + 1, j + 1), g.P(i, j + 1)])}
            fill={(i + j) % 2 === 0 ? 'var(--cu-piso-a)' : 'var(--cu-piso-b)'}
            stroke="var(--cu-piso-linea)" strokeWidth="0.4"
          />
        ))
      )}
    </>
  )
}


// ─────────────────── LOS GATOS ───────────────────

/**
 * 🐈 Dos gatos que andan por la casa.
 *
 * Santiago los pidió *«andando por toda la casa»*, y por eso entran ahora y no
 * con el cuarto: en una sola habitación serían un adorno; en una casa son lo
 * que la hace sentir habitada.
 *
 * 🔑 **No hacen nada más, y está bien.** No llevan a ninguna pantalla ni
 * cuentan nada: no son un botón disfrazado de gato. Se les puede acariciar y
 * ya. Es la única cosa de esta app que existe solo porque sí.
 *
 * Cambian de habitación por su cuenta, así que a veces no están — que es
 * exactamente lo que hace un gato.
 */
type Gato = { id: string; hab: string; pos: [number, number]; color: string; mirandoIzq: boolean }

const CADA_GATO = 4200   // cada cuánto se le ocurre moverse

function useGatos(habitaciones: Habitacion[], habActual: string) {
  const [gatos, setGatos] = useState<Gato[]>(() => [
    { id: 'g1', hab: habitaciones[0]?.id ?? '', pos: [1.2, 3.4], color: 'var(--gato-uno)', mirandoIzq: false },
    { id: 'g2', hab: habitaciones[0]?.id ?? '', pos: [3.6, 1.2], color: 'var(--gato-dos)', mirandoIzq: true },
  ])

  useEffect(() => {
    const t = setInterval(() => {
      setGatos(prev => prev.map(g => {
        // Una de cada seis veces se va a otra habitación.
        if (Math.random() < 1 / 6 && habitaciones.length > 1) {
          const otras = habitaciones.filter(h => h.id !== g.hab)
          const destino = otras[Math.floor(Math.random() * otras.length)]
          return { ...g, hab: destino.id, pos: [1 + Math.random() * 3, 1 + Math.random() * 3] }
        }
        const u = Math.min(4.6, Math.max(0.4, g.pos[0] + (Math.random() - 0.5) * 1.8))
        const v = Math.min(4.6, Math.max(0.4, g.pos[1] + (Math.random() - 0.5) * 1.8))
        return { ...g, pos: [u, v], mirandoIzq: u - v < g.pos[0] - g.pos[1] }
      }))
    }, CADA_GATO)
    return () => clearInterval(t)
  }, [habitaciones])

  return { gatos, aqui: gatos.filter(g => g.hab === habActual) }
}

// ─────────────────── LA CASA ───────────────────

const CLAVE = 'casa_donde'
/** Si el dueño pidió ver todos los nombres, aunque estorben. */
const CLAVE_NOMBRES = 'casa_nombres'

/** Lo que dice el pie al acariciar un gato. Es lo único que hacen. */
const RONRONEOS = ['ronronea', 'se estira', 'te mira y sigue en lo suyo', 'ronronea fuerte']

/** Dónde se quedó: habitación Y posición. Guardar solo la posición hacía que
 *  al volver apareciera en el cuarto parado donde estaba en el taller. */
type Donde = { hab: string; pos: [number, number] }

/**
 * LA LUZ DE LA CASA, SEGÚN LA HORA — y según si el día es protegido.
 *
 * Devuelve el velo que se pinta encima de todo. No cambia el dibujo: lo tiñe.
 * Es la diferencia entre abrir la app a las 7 de la mañana y a las 2 de la
 * madrugada, que hoy se ven idénticas aunque sean dos vidas distintas.
 *
 * ⚠️ Un día PROTEGIDO se ve más cálido a cualquier hora. Es el único dato del
 * turno que ya llegaba a la casa y no se estaba usando para nada visual.
 */
export function luzDe(hora: number, protegido: boolean) {
  const tramos: { hasta: number; color: string; fuerza: number; nombre: string }[] = [
    { hasta: 5,  color: '18,24,42',   fuerza: 0.46, nombre: 'madrugada' },
    { hasta: 8,  color: '58,44,74',   fuerza: 0.22, nombre: 'amaneciendo' },
    { hasta: 12, color: '255,238,196', fuerza: 0.10, nombre: 'mañana' },
    { hasta: 17, color: '255,244,214', fuerza: 0.06, nombre: 'tarde' },
    { hasta: 20, color: '242,150,86',  fuerza: 0.16, nombre: 'atardecer' },
    { hasta: 24, color: '20,28,50',    fuerza: 0.34, nombre: 'noche' },
  ]
  const t = tramos.find(x => hora < x.hasta) ?? tramos[tramos.length - 1]
  // Protegido: se le quita frío y se le pone un punto de calidez.
  const color = protegido ? '236,198,132' : t.color
  const fuerza = protegido ? Math.min(t.fuerza, 0.18) : t.fuerza
  return { fondo: `rgba(${color},${fuerza})`, nombre: t.nombre }
}

export function Casa({
  habitaciones, inicial, datos, onAccion, accionAbierta, extra, resumen,
}: {
  habitaciones: Habitacion[]
  inicial: string
  datos: Datos
  /** Lo que la pantalla hace con un objeto de tipo 'accion' (el cuaderno). */
  onAccion?: (id: string) => void
  /** Qué acción tiene abierta la pantalla. Al cerrarse, el muñequito se para. */
  accionAbierta?: string | null
  /** Algo que la pantalla quiera montar dentro de la habitación activa. */
  extra?: React.ReactNode
  /** Lo que va a la derecha del título (ej. «3/8 hoy»). */
  resumen?: React.ReactNode
}) {
  const router = useRouter()
  const [habId, setHabId] = useState(inicial)
  const hab = habitaciones.find(h => h.id === habId) ?? habitaciones[0]

  const [pos, setPos] = useState<[number, number]>(hab.entrada)
  const [mirandoIzq, setMirandoIzq] = useState(false)
  const [caminando, setCaminando] = useState(false)
  const [sentado, setSentado] = useState(false)
  const [dice, setDice] = useState<string | null>(null)
  const [ms, setMs] = useState(700)
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null)

  const caja = useRef<HTMLDivElement>(null)
  const [altoPx, setAltoPx] = useState(0)

  useMedir(() => {
    const nodo = caja.current
    if (!nodo) return
    const medir = () => setAltoPx(nodo.clientHeight)
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(medir)
    ro.observe(nodo)
    return () => ro.disconnect()
  }, [])

  const g = geometria(ALTO)
  const { P, pct } = g

  const { gatos } = useGatos(habitaciones, hab.id)
  const [ronroneo, setRonroneo] = useState<string | null>(null)

  /**
   * LA HORA, LEÍDA EN EL CLIENTE (Ola 3).
   *
   * Empieza en null y se llena después de montar. No es un rodeo: leer el
   * reloj durante el render haría que el servidor pintara una luz y el
   * navegador otra, y React lo canta como error de hidratación. Con null la
   * casa nace sin velo y lo gana medio segundo después, que nadie nota.
   */
  /**
   * El contador del ocio. Existe por un fallo que se vio midiendo, no
   * compilando: en 26 segundos quieto hacía UNA sola cosa y se apagaba.
   * Mirar alrededor no cambia `pos` ni `caminando`, así que el efecto no
   * se volvía a disparar y no había un segundo tic. Cada acción de ocio
   * sube este número, y eso es lo que rearma el reloj.
   */
  /**
   * ¿SE VEN TODOS LOS NOMBRES?
   *
   * Nace de un número medido, no de una preferencia: con la casa entera en un
   * teléfono cada habitación mide 195 px, y las 11 etiquetas del cuarto **se
   * pisaban 8 veces** entre ellas. Contadas en el DOM, no a ojo.
   *
   * Así que en pantalla angosta solo se leen las de los objetos que están
   * PIDIENDO algo, y este interruptor enseña el resto cuando hace falta
   * buscar. En pantalla ancha sobra sitio y se ven todas sin pedirlo.
   *
   * 🔑 Lo que hizo esto posible sin perder nada: **las etiquetas de las
   * puertas dejaron de hacer falta.** Antes «al taller» era la única forma de
   * saber que había un taller; ahora el taller se ve, y se camina hasta él.
   */
  const [nombres, setNombres] = useState(false)
  useEffect(() => {
    try { setNombres(localStorage.getItem(CLAVE_NOMBRES) === '1') } catch {}
  }, [])
  function alternarNombres() {
    setNombres(v => {
      try { localStorage.setItem(CLAVE_NOMBRES, v ? '0' : '1') } catch {}
      return !v
    })
  }

  const [tic, setTic] = useState(0)
  const [hora, setHora] = useState<number | null>(null)
  useEffect(() => {
    const leer = () => setHora(new Date().getHours() + new Date().getMinutes() / 60)
    leer()
    // Cada cinco minutos alcanza: la luz cambia por tramos, no por minuto.
    const id = setInterval(leer, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  const luz = hora === null ? null : luzDe(hora, datos.protegido)

  /** Las baldosas ocupadas de cada habitación, calculadas una vez. */
  const ocupadasPorHab = useRef(new Map<string, Set<string>>())
  const ocupadasDe = (h: Habitacion) => {
    const cache = ocupadasPorHab.current
    if (!cache.has(h.id)) cache.set(h.id, pisables(h.trazos(datos)))
    return cache.get(h.id)!
  }

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE)
      if (!guardado) return
      const d = JSON.parse(guardado) as Donde
      if (typeof d?.hab === 'string' && habitaciones.some(h => h.id === d.hab)) {
        setHabId(d.hab)
        const [u, v] = d.pos ?? []
        if (Number.isFinite(u) && Number.isFinite(v)) setPos([u, v])
      }
    } catch {}
  }, [habitaciones])

  useEffect(() => () => { if (reloj.current) clearTimeout(reloj.current) }, [])

  // La pantalla cerró el cuaderno: se levanta.
  useEffect(() => { if (!accionAbierta) setSentado(false) }, [accionAbierta])

  function recordar(h: string, p: [number, number]) {
    try { localStorage.setItem(CLAVE, JSON.stringify({ hab: h, pos: p })) } catch {}
  }

  /**
   * CAMINAR A UNA BALDOSA CUALQUIERA (Ola 2).
   *
   * Es el mismo movimiento de `irA`, sin destino ni pantalla al final: se
   * toca el piso y va. Tres cosas que el plan pedía explícitas:
   *
   *   · **No atraviesa muebles.** Si la baldosa está ocupada, se para en la
   *     libre más cercana — el borde del mueble. Nunca se ignora el toque.
   *   · **No sale de la casa.** Las baldosas solo existen de 0 a 4.
   *   · **Se recuerda dónde quedó**, igual que al ir a un objeto.
   */
  function irABaldosa(u: number, v: number, iHab: number) {
    const destinoHab = habitaciones[iHab]
    if (!destinoHab) return
    const donde = baldosaLibre(u, v, ocupadasDe(destinoHab))
    if (!donde) return

    if (reloj.current) clearTimeout(reloj.current)
    const iAhora = Math.max(0, habitaciones.findIndex(h => h.id === hab.id))
    const [x1, y1] = P(pos[0], pos[1])
    const [x2, y2] = P(donde[0], donde[1])
    const saltos = Math.abs(iHab - iAhora)
    const duracion = Math.round(
      Math.min(1400, Math.max(300, Math.hypot(x2 - x1, y2 - y1) * 5 + saltos * 520))
    )

    setMs(duracion)
    setMirandoIzq(iHab < iAhora || (iHab === iAhora && x2 < x1))
    setSentado(false)
    setCaminando(true)
    // Sin etiqueta: caminar por caminar no anuncia nada. El pie vuelve a la
    // pista de la habitación, que es la información útil cuando no se va a
    // ningún sitio concreto.
    setDice(null)
    setHabId(destinoHab.id)
    setPos(donde)
    recordar(destinoHab.id, donde)
    reloj.current = setTimeout(() => setCaminando(false), duracion)
  }

  /** Lo manda, no lo controla: se toca el objeto y él camina solo. Un toque
   *  nuevo mientras camina REDIRIGE — encolarlos haría que se sintiera trabado. */
  function irA(o: Objeto, iHab: number) {
    if (reloj.current) clearTimeout(reloj.current)
    const iAhora = Math.max(0, habitaciones.findIndex(h => h.id === hab.id))

    // Si el objeto está en OTRA habitación, primero hay que llegar hasta ella:
    // el muñequito se planta en la puerta que lleva allá y sigue. Tocar algo de
    // lejos no puede teletransportar.
    const saltos = Math.abs(iHab - iAhora)
    const [x1, y1] = P(pos[0], pos[1])
    const [x2, y2] = P(o.parada[0], o.parada[1])
    const duracion = Math.round(
      Math.min(1400, Math.max(320, Math.hypot(x2 - x1, y2 - y1) * 5 + saltos * 520))
    )

    setMs(duracion)
    setMirandoIzq(iHab < iAhora || (iHab === iAhora && x2 < x1))
    setSentado(false)
    setCaminando(true)
    setDice(o.etiqueta)
    // El objeto vive en `iHab`: caminar hacia él es estar en esa habitación.
    const destinoHab = habitaciones[iHab] ?? hab
    setHabId(destinoHab.id)
    setPos(o.parada)
    recordar(destinoHab.id, o.parada)

    reloj.current = setTimeout(() => {
      setCaminando(false)
      if (o.tipo === 'puerta' && o.hacia) {
        // ⚠️ Una puerta ya NO cambia de habitación: la casa es una sola y el
        // muñequito ya caminó hasta aquí. Lo único que hace es seguir hacia la
        // habitación de al lado, y la cámara va detrás.
        const iDestino = habitaciones.findIndex(h => h.id === o.hacia)
        const destino = habitaciones[iDestino]
        if (destino) {
          const vuelta = destino.objetos.find(x => x.tipo === 'puerta' && x.hacia === hab.id)
          const donde = vuelta ? vuelta.parada : destino.entrada
          setMirandoIzq(iDestino < iHab)
          setCaminando(true)
          setMs(720)
          setHabId(destino.id)
          setPos(donde)
          setDice(destino.nombre)
          recordar(destino.id, donde)
          setTimeout(() => setCaminando(false), 720)
        }
      } else if (o.tipo === 'fuera' && o.href) {
        // Otra app: se SALE, no se navega por dentro. `router.push` no sirve.
        window.open(o.href, '_blank', 'noopener,noreferrer')
      } else if (o.tipo === 'accion') {
        if (o.sienta) setSentado(true)
        onAccion?.(o.id)
      }
      else if (o.href) router.push(o.href)
    }, duracion)
  }

  /**
   * QUE NO SE VEA APAGADO CUANDO NADIE LO TOCA (Ola 3).
   *
   * Cada 7-14 segundos quieto hace una de dos: mira para el otro lado, o da un
   * paso a una baldosa de al lado. Nada más — un personaje que se pasea solo
   * por todo el cuarto estorba cuando lo que se quiere es tocar un objeto.
   *
   * ⚠️ Se rearma con `pos` y `caminando` en las dependencias, así que cualquier
   * toque reinicia la cuenta: nunca se mueve solo justo encima de un toque.
   * Y no corre si está sentado (está escribiendo) ni si hay algo abierto.
   */
  useEffect(() => {
    if (caminando || sentado || accionAbierta) return
    const espera = 7000 + Math.random() * 7000
    const id = setTimeout(() => {
      // Mirar alrededor: la mitad de las veces, y no cuesta nada.
      if (Math.random() < 0.5) { setMirandoIzq(m => !m); setTic(n => n + 1); return }

      const ocupadas = ocupadasDe(hab)
      const u0 = Math.round(pos[0]), v0 = Math.round(pos[1])
      const vecinas = ([
        [u0 + 1, v0], [u0 - 1, v0], [u0, v0 + 1], [u0, v0 - 1],
      ] as [number, number][]).filter(([u, v]) =>
        u >= 0 && v >= 0 && u < BALDOSAS && v < BALDOSAS && !ocupadas.has(u + ',' + v)
      )
      if (!vecinas.length) { setTic(n => n + 1); return }
      const [u, v] = vecinas[Math.floor(Math.random() * vecinas.length)]
      const [x1] = P(pos[0], pos[1])
      const [x2] = P(u, v)
      setMs(900)
      setMirandoIzq(x2 < x1)
      setCaminando(true)
      setPos([u, v])
      recordar(hab.id, [u, v])
      setTimeout(() => setCaminando(false), 900)
    }, espera)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, tic, caminando, sentado, accionAbierta, hab.id])

  const info = hab.datos?.(datos) ?? {}
  const urge = hab.alerta?.(datos) ?? {}
  const [px, py] = P(pos[0], pos[1])

  const N = habitaciones.length
  const indice = Math.max(0, habitaciones.findIndex(h => h.id === hab.id))

  /**
   * LA CASA EN PLANTA. Las columnas son fijas, las filas salen de cuántas
   * habitaciones haya: con 3 son dos filas y sobra un hueco — y ese hueco
   * vacío es correcto, es el sitio donde va la siguiente.
   */
  const COLS = Math.min(COLUMNAS, N)
  const FILAS = Math.ceil(N / COLS)
  const ANCHO_MUNDO = ANCHO * COLS
  const ALTO_MUNDO = ALTO * FILAS

  /** En qué celda de la planta vive la habitación número i. */
  const celda = (i: number): [number, number] => [i % COLS, Math.floor(i / COLS)]

  /** De coordenadas de UNA habitación a coordenadas de LA CASA. */
  const global = ([x, y]: Punto, iHab: number) => {
    const [c, f] = celda(iHab)
    return [x + c * ANCHO, y + f * ALTO] as Punto
  }
  /** Posición en % dentro del mundo entero, no dentro de una habitación. */
  const pctMundo = ([x, y]: Punto) =>
    ({ left: (x / ANCHO_MUNDO) * 100 + '%', top: (y / ALTO_MUNDO) * 100 + '%' })

  return (
    <>
      {/* ⚠️ El título vive AQUÍ y no en la página: es la casa la que sabe en qué
          habitación está parado. Fuera, decía «TU CUARTO» estando en el taller. */}
      {/* ⚠️ El título dice LA CASA, no la habitación: ahora se ven todas a la
          vez, y cada una lleva su propio rótulo dibujado encima. Poner aquí el
          nombre de una sola volvía a sugerir que las demás no están. */}
      <div className="cuarto-titulo">
        <span className="titulo mono cursor">LA CASA</span>
        {resumen}
      </div>

      <div
        className={'cuarto' + (nombres ? ' con-nombres' : '')}
        ref={caja}
        style={{
          // La caja toma la proporción del MUNDO ENTERO, no la de una
          // habitación: es lo que hace que la casa completa quepa en pantalla.
          ['--cu-ancho' as string]: String(ANCHO_MUNDO),
          ['--cu-alto' as string]: String(ALTO_MUNDO),
          ['--cu-h' as string]: altoPx ? altoPx + 'px' : '100dvh',
          /**
           * Columnas y filas de la planta.
           *
           * ⚠️ LAS DOS HACEN FALTA, y la segunda es nueva por una razón que ya
           * costó un fallo: el muñequito y los gatos miden su ancho Y SU ALTO
           * en % del contenedor. Cuando el mundo se hizo 3 veces más ancho
           * salieron 3 veces más grandes; ahora el mundo también es más ALTO,
           * así que sin `--casa-filas` saldrían el doble de altos.
           */
          ['--casa-n' as string]: String(COLS),
          ['--casa-filas' as string]: String(FILAS),
        }}
      >
        <div className="cuarto-caja">
          {/*
            ⭐ LA CASA ES UNA SOLA, Y LA CÁMARA SE MUEVE.

            Santiago (2026-08-26): *«que sea en la misma interfaz, solo que el
            personaje se vaya para la derecha; que no cambie de habitación sino
            que se vaya moviendo por toda la casa, como en Habbo»*.

            Antes esto cambiaba de habitación: se desmontaba una y se montaba
            otra. Se sentía como cambiar de pantalla, no como caminar.

            Ahora **las habitaciones se dibujan todas, una al lado de la otra**,
            en un mundo de `ANCHO × N` de ancho. Lo que se mueve es este div:
            la ventana enseña una habitación y la cámara se desliza. El
            muñequito camina de verdad de una a otra — su posición nunca salta
            de sistema de coordenadas, solo cruza.
          */}
          {/*
            ⭐ YA NO HAY CÁMARA. El mundo llena la caja y se ve entero.

            Hasta el 27-ago esto medía `N * 100%` y se trasladaba con
            translateX para enseñar UNA habitación. Santiago lo pidió al revés:
            *«que se vean todas en la interfaz como tal»*. Ahora la caja tiene
            la proporción del mundo, el mundo la llena, y no se mueve nada:
            lo único que se desplaza por la casa es el muñequito.
          */}
          <div className="casa-mundo">
            <svg className="cuarto-svg" viewBox={'0 0 ' + ANCHO_MUNDO + ' ' + ALTO_MUNDO} aria-hidden="true">
              <defs>
                <linearGradient id="cu-luz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(234,240,246,0.08)" />
                  <stop offset="100%" stopColor="rgba(234,240,246,0)" />
                </linearGradient>
                <radialGradient id="cu-lampara" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(232,196,120,0.30)" />
                  <stop offset="55%" stopColor="rgba(232,196,120,0.10)" />
                  <stop offset="100%" stopColor="rgba(232,196,120,0)" />
                </radialGradient>
              </defs>

              {/* Cada habitación en su sitio. La clase le pone SU paleta: las
                  variables CSS se heredan dentro del <g> igual que en HTML. */}
              {habitaciones.map((h, i) => {
                const [c, f] = celda(i)
                return (
                  <g key={h.id} className={h.clase} transform={`translate(${c * ANCHO},${f * ALTO})`}>
                    <Caparazon g={g} />
                    <Trazos g={g} lista={h.trazos(datos)} />
                  </g>
                )
              })}
            </svg>

            {/* ---- la capa que sí se toca ---- */}
            <div className="cuarto-toques">
              {/*
                EL RÓTULO DE CADA HABITACIÓN.
                Antes el nombre vivía solo en el título de arriba, y decía el de
                la habitación activa — servía porque solo se veía una. Ahora se
                ven todas: cada una tiene que decir qué es sin que haya que
                entrar.

                ⚠️ Va en la esquina superior DERECHA de su celda, y las dos
                cosas están medidas: NO centrado porque el centro es donde
                cuelga la lámpara, y a la derecha porque en la izquierda se
                montaba con la etiqueta de HOY, que sube a un segundo nivel
                justo ahí.
              */}
              {habitaciones.map((h, i) => {
                const [c, f] = celda(i)
                return (
                  <span
                    key={h.id + '-rotulo'}
                    className={'casa-rotulo mono' + (h.id === hab.id ? ' aqui' : '')}
                    style={pctMundo([c * ANCHO + ANCHO - 10, f * ALTO + 13])}
                  >
                    {h.nombre}
                    <em>{h.marca}</em>
                  </span>
                )
              })}

              {/*
                EL PISO, ANTES QUE LOS OBJETOS.

                Va primero en el DOM a propósito: sin z-index, lo que se pinta
                después queda encima, así que los objetos siguen ganando el
                toque cuando se solapan con su baldosa. Si el piso fuera
                después, tocar el computador caminaría al piso de al lado.
              */}
              {habitaciones.flatMap((h, i) => {
                const ocupadas = ocupadasDe(h)
                const baldosas: React.ReactNode[] = []
                for (let u = 0; u < BALDOSAS; u++)
                  for (let v = 0; v < BALDOSAS; v++) {
                    /**
                     * ⚠️ LAS OCUPADAS TAMBIÉN SE PINTAN, y esto no es un olvido.
                     *
                     * La primera versión las saltaba, y el resultado fue el
                     * error que el plan nombra con todas las letras: tocar la
                     * cómoda no hacía nada, y *«que no pase nada al tocar se
                     * siente roto»*. Ahora tocar un mueble camina hasta su
                     * borde — `irABaldosa` resuelve a la libre más cercana.
                     */
                    const tapada = ocupadas.has(u + ',' + v)
                    baldosas.push(
                      <button
                        key={h.id + '-piso-' + u + '-' + v}
                        className={'cu-baldosa' + (tapada ? ' tapada' : '')}
                        data-baldosa={h.id + ':' + u + ',' + v}
                        style={pctMundo(global(P(u + 0.5, v + 0.5), i))}
                        onClick={() => irABaldosa(u, v, i)}
                        aria-label={
                          (tapada ? 'Caminar al borde de un mueble en ' : 'Caminar a ')
                          + h.nombre + ', baldosa ' + (u + 1) + '-' + (v + 1)
                        }
                      />
                    )
                  }
                return baldosas
              })}

              {habitaciones.flatMap((h, i) => {
                const suInfo = h.datos?.(datos) ?? {}
                const suUrge = h.alerta?.(datos) ?? {}
                return h.objetos.map(o => (
                  <button
                    key={h.id + '-' + o.id}
                    /**
                     * ⚠️ `lejos` ES LO QUE HACE POSIBLE VER TODA LA CASA, y sale
                     * de un número medido: las etiquetas de UNA habitación ya
                     * suman el 305% de su ancho (la más ancha, «al taller /
                     * House of Kaizen», mide 93 px sobre 390). Al partir la
                     * habitación a la mitad para que quepan cuatro, esa cifra
                     * pasa al 611%: enseñarlas todas a la vez es ilegible, y
                     * además sus áreas de toque de 42 px taparían el piso por
                     * el que hay que caminar.
                     *
                     * Así que la habitación donde estás muestra sus etiquetas y
                     * las demás solo un punto. Se sigue pudiendo tocar —el
                     * `aria-label` no cambia— y al llegar allá aparecen. Eso ES
                     * explorar: ver que hay algo y acercarse a mirar qué.
                     */
                    className={'cu-obj' + (dice === o.etiqueta ? ' activo' : '')
                      + (suUrge[o.id] ? ' urge' : '')
                      + (h.id === hab.id ? '' : ' lejos')
                      /**
                       * ⚠️ LA ETIQUETA SE ARRIMA AL BORDE EN VEZ DE CENTRARSE.
                       *
                       * Con la casa entera en un teléfono, «Días · 2 sin
                       * llenar» —77 px de etiqueta sobre un objeto que vive a
                       * 32 de 320 del borde— **se salía 19 px por la
                       * izquierda**, medido contra el rectángulo de la caja.
                       * Centrar una etiqueta ancha sobre un objeto pegado a la
                       * pared no cabe, y la habitación mide ahora la mitad.
                       *
                       * El umbral no es a ojo: 70 de 320 es el punto donde una
                       * etiqueta típica deja de caber centrada.
                       */
                      + (o.centro[0] < 70 ? ' al-borde-izq'
                         : o.centro[0] > ANCHO - 70 ? ' al-borde-der' : '')
                      /**
                       * ⭐ UNA PUERTA YA NO NECESITA DECIR ADÓNDE VA.
                       *
                       * «al taller · House of Kaizen» existía porque el taller
                       * no se veía: era la única forma de saber que estaba. Con
                       * la casa entera en pantalla el taller SE VE, con su
                       * rótulo puesto, así que la etiqueta pasó de informar a
                       * estorbar — chocaba 45×21 px con la de HOY, medido.
                       *
                       * La puerta sigue estando, sigue tocándose y sigue
                       * llevando allá. Lo que se calla es lo que ya se ve.
                       */
                      + (o.tipo === 'puerta' ? ' es-puerta' : '')}
                    /* `centro` viene medido desde la esquina del fondo de SU
                       habitación: se le suma `oy` y el desplazamiento de la
                       habitación dentro de la casa. */
                    style={pctMundo(global([o.centro[0], g.oy + o.centro[1]], i))}
                    onClick={() => irA(o, i)}
                    aria-label={
                      o.tipo === 'puerta' ? 'Ir ' + o.etiqueta
                      : o.tipo === 'fuera' ? 'Abrir ' + o.etiqueta + ' en otra pestaña'
                      : o.tipo === 'accion' ? o.etiqueta
                      : 'Ir a ' + o.etiqueta
                    }
                  >
                    <span className={'cu-etq mono ' + (o.etqAbajo ? 'abajo' : 'arriba')
                      + (o.etqLejos ? ' lejos-del-objeto' : '')}>
                      {o.etiqueta}
                      {suInfo[o.id] && <em className="cu-dato">{suInfo[o.id]}</em>}
                    </span>
                  </button>
                ))
              })}

              {gatos.map(gato => {
                const iG = habitaciones.findIndex(h => h.id === gato.hab)
                if (iG < 0) return null
                return (
                  <button
                    key={gato.id}
                    className={'cu-gato' + (gato.mirandoIzq ? ' izq' : '')}
                    style={{
                      ...pctMundo(global(P(gato.pos[0], gato.pos[1]), iG)),
                      color: gato.color,
                    }}
                    onClick={() => {
                      setRonroneo(RONRONEOS[Math.floor(Math.random() * RONRONEOS.length)])
                      setTimeout(() => setRonroneo(null), 2600)
                    }}
                    aria-label="Acariciar al gato"
                  />
                )
              })}

              <div
                className={'cu-yo' + (caminando ? ' camina' : '') + (sentado ? ' sentado' : '')
                  + (mirandoIzq ? ' izq' : '')}
                style={{ ...pctMundo(global([px, py], indice)), transitionDuration: ms + 'ms' }}
                aria-hidden="true"
              >
                <span className="cu-sombra" />
                <span className="cu-cabeza" />
                <span className="cu-torso" />
                <span className="cu-piernas" />
              </div>
            </div>

            {/* El velo de la hora. Va al final para quedar encima del dibujo y
                del muñequito, y no recibe toques: es luz, no un objeto. */}
            {luz && <div className="casa-luz" style={{ background: luz.fondo }} aria-hidden="true" />}
          </div>
        </div>

        <button
          className={'casa-nombres mono' + (nombres ? ' si' : '')}
          onClick={alternarNombres}
          aria-pressed={nombres}
          aria-label={nombres ? 'Ocultar los nombres de los objetos' : 'Ver los nombres de todos los objetos'}
        >
          {nombres ? 'nombres ·' : 'nombres'}
        </button>

        <p className="cuarto-pie mono">
          {ronroneo ? ronroneo
            : sentado ? 'sentado en el escritorio'
            : dice ? dice.toLowerCase() : hab.pista}
        </p>

        {extra}
      </div>
    </>
  )
}
