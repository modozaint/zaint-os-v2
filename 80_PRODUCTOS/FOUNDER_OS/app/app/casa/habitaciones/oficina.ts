import type { Habitacion, Trazo } from '../motor'

/* ============================================================
   LA OFICINA — la habitación de Dermatinta. Su bodega y su setup.

   ⚠️ DE ESTA HABITACIÓN NO HAY FOTOS, y el plan lo marcó como lo que la
   bloqueaba (§7.1). Se dibuja igual, pero **no genérica**: se dibuja con lo
   que el vault SÍ sabe de la marca, que es bastante.

   Lo que la delata sin un rótulo, y todo sale de `BRANDS/DERMATINTA.md` §1:
     · **verde bosque** `#0D3D34` — su color primario
     · **dorado** `#C49A52` — su acento, el de los precios y los CTA
     · **crema** `#FBF8F1` — su fondo claro
   Y sus dos productos reales: **la crema y la espuma**. No hay un tercero:
   el Kit es esos dos juntos.

   🔴 Y LA HABITACIÓN DICE LA VERDAD DE LA CUENTA, que es lo que el plan
   quería dejar abierto (§3.3): **las cajas están apiladas y cerradas.**
   Dermatinta lleva meses con 0 ventas verificadas en Shopify — una bodega
   llena no es decoración, es el estado real. El día que salga producto, se
   le quitan cajas.
   ============================================================ */

const VERDE = { top: '#14544A', der: '#0D3D34', izq: '#0A2A23' }
const CARTON = { top: '#8A7A5E', der: '#6E6049', izq: '#544935' }

/** El estante de la bodega: tres baldas con producto. */
const ESTANTE: Trazo[] = [
  { t: 'pared', lado: 'der', en: 0.9, alto: 26, ancho: 2.6, h: 4, fill: '#3A3226' },
  { t: 'pared', lado: 'der', en: 0.9, alto: 60, ancho: 2.6, h: 4, fill: '#3A3226' },
  { t: 'pared', lado: 'der', en: 0.9, alto: 94, ancho: 2.6, h: 4, fill: '#3A3226' },
  // la crema y la espuma, alineadas en las baldas
  ...[0, 1, 2].flatMap((fila): Trazo[] =>
    [0, 1, 2, 3].map((col): Trazo => ({
      t: 'pared', lado: 'der', en: 1.05 + col * 0.55, alto: 26 + fila * 34 + 4,
      ancho: 0.34, h: 16,
      fill: (col + fila) % 2 === 0 ? '#FBF8F1' : '#C49A52',
    }))
  ),
]

/** Las cajas de la bodega. Cerradas, y son las que cuentan la verdad. */
const CAJAS: Trazo[] = [
  { t: 'caja', u: 0.15, v: 0.15, a: 0.9, b: 0.9, h: 26, ...CARTON },
  { t: 'caja', u: 0.15, v: 0.15, a: 0.9, b: 0.9, h: 24, z: 26, ...CARTON },
  { t: 'caja', u: 0.2, v: 1.2, a: 0.85, b: 0.85, h: 25, ...CARTON },
  // la cinta dorada que las sella
  { t: 'linea', a: [133, -18], b: [160, -4], color: '#C49A52', grosor: 1.6 },
  { t: 'linea', a: [136, 14], b: [162, 27], color: '#C49A52', grosor: 1.6 },
]

/** La mesa de empaque: donde se arma un pedido. Vacía, porque no hay pedidos. */
const MESA: Trazo[] = [
  { t: 'caja', u: 2.4, v: 3.2, a: 1.5, b: 1.1, h: 24, ...VERDE },
  // un rollo de cinta y una pila de bolsas
  { t: 'elipse', c: [152, 76], rx: 8, ry: 3.2, fill: '#C49A52' },
  { t: 'poli', p: [[172, 74], [196, 86], [196, 78], [172, 66]], fill: '#FBF8F1' },
]

export const OFICINA: Habitacion = {
  id: 'oficina',
  nombre: 'La oficina',
  marca: 'Dermatinta',
  clase: 'hab-oficina',
  entrada: [1.2, 2.6],
  pista: 'la bodega de Dermatinta',

  trazos: () => [
    // el logo en la pared: el verde bosque con el dorado encima
    { t: 'pared', lado: 'izq', en: 1.5, alto: 62, ancho: 1.5, h: 34, fill: '#0A2A23' },
    { t: 'pared', lado: 'izq', en: 1.75, alto: 74, ancho: 1.0, h: 8, fill: '#C49A52' },

    ...ESTANTE,
    ...CAJAS,
    ...MESA,

    // la puerta de vuelta al cuarto (pared izquierda, al frente)
    { t: 'pared', lado: 'izq', en: 3.9, alto: 0, ancho: 0.8, h: 64, fill: '#071C17' },
    { t: 'pared', lado: 'izq', en: 3.98, alto: 4, ancho: 0.64, h: 56, fill: '#0F2E27' },
    { t: 'circulo', c: [42, 56], r: 2.4, fill: '#C49A52' },
  ],

  objetos: [
    { id: 'estante', etiqueta: 'Producto', tipo: 'accion', centro: [250, -44], etqAbajo: true, parada: [2.2, 0.9] },
    { id: 'cajas', etiqueta: 'Bodega', tipo: 'accion', centro: [148, -30], etqAbajo: false, parada: [1.3, 1.0] },
    { id: 'mesa', etiqueta: 'Empaque', tipo: 'accion', centro: [172, 88], etqAbajo: true, parada: [2.4, 2.6] },
    { id: 'al-cuarto', etiqueta: 'al cuarto', tipo: 'puerta', hacia: 'cuarto', centro: [50, 30], etqAbajo: true, parada: [0.9, 4.0] },
  ],

  datos: () => ({
    estante: 'crema y espuma',
    // No es un adorno: es el estado de la cuenta, dicho sin un número.
    cajas: 'sin salir',
    mesa: null,
    'al-cuarto': 'MODOZAINT',
  }),
}
