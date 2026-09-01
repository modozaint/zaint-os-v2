import type { Habitacion, Trazo } from '../motor'

/* ============================================================
   EL TALLER — la habitación de House of Kaizen.

   Lo que se ve en `referencias/cuarto-real-03.jpg` y `-05`: el bastidor de
   tufting con una pieza a medio hacer, la máquina con su cono de hilo, y las
   alfombras terminadas colgadas.

   🔑 SUS OBJETOS NO LLEVAN A NINGUNA PANTALLA, Y ESTÁ BIEN. Una habitación
   puede existir solo porque es suya — es la mitad del punto de la casa. El
   día que HK tenga pantallas propias, se le cuelgan aquí.

   ⚠️ Lo que delata la marca sin un rótulo: el **naranja racing** de House of
   Kaizen (`#FF4D00`, el de su identidad) en la pieza del bastidor y en la
   alfombra grande, contra el negro taller del piso. En el cuarto no hay
   naranja en ninguna parte.
   ============================================================ */

const MADERA = { top: '#6B4F2A', der: '#543D20', izq: '#3E2C17' }
const METAL = { top: '#4A5568', der: '#3A4453', izq: '#2A323D' }

/** El bastidor: dos patas, el marco y la tela tensada con la pieza a medias. */
const BASTIDOR: Trazo[] = [
  { t: 'caja', u: 0.25, v: 1.1, a: 0.18, b: 0.18, h: 58, ...MADERA },
  { t: 'caja', u: 0.25, v: 2.9, a: 0.18, b: 0.18, h: 58, ...MADERA },
  // la tela tensada, colgada de la pared izquierda
  { t: 'pared', lado: 'izq', en: 1.1, alto: 22, ancho: 1.85, h: 52, fill: '#E8E2D4' },
  // la pieza a medio hacer: naranja racing, y se ve que le falta
  { t: 'pared', lado: 'izq', en: 1.35, alto: 30, ancho: 0.75, h: 26, fill: '#FF4D00' },
  { t: 'pared', lado: 'izq', en: 2.2, alto: 30, ancho: 0.45, h: 16, fill: '#7C3AED' },
  { t: 'pared', lado: 'izq', en: 1.35, alto: 30, ancho: 1.3, h: 3, fill: '#C9C2B0' },
]

/** La máquina de tufting sobre su mesa, con el cono de hilo amarillo. */
const MAQUINA: Trazo[] = [
  { t: 'caja', u: 2.5, v: 3.5, a: 1.1, b: 0.9, h: 24, ...MADERA },
  { t: 'caja', u: 2.7, v: 3.7, a: 0.55, b: 0.5, h: 14, z: 24, ...METAL },
  // el cono de hilo
  { t: 'poli', p: [[148, 60], [162, 60], [158, 40], [152, 40]], fill: '#E8C044' },
  { t: 'elipse', c: [155, 60], rx: 7, ry: 2.6, fill: '#C9A32F' },
  // el hilo que baja a la máquina
  { t: 'linea', a: [155, 40], b: [140, 62], color: '#E8C044', grosor: 1.2 },
]

/** Las alfombras terminadas, colgadas de la pared derecha. */
const ALFOMBRAS: Trazo[] = [
  { t: 'pared', lado: 'der', en: 1.0, alto: 40, ancho: 1.0, h: 42, fill: '#FF4D00' },
  { t: 'pared', lado: 'der', en: 1.15, alto: 52, ancho: 0.7, h: 18, fill: '#141210' },
  { t: 'pared', lado: 'der', en: 2.4, alto: 44, ancho: 0.85, h: 34, fill: '#7C3AED' },
  { t: 'pared', lado: 'der', en: 2.55, alto: 54, ancho: 0.55, h: 12, fill: '#E8C044' },
  { t: 'pared', lado: 'der', en: 3.6, alto: 42, ancho: 0.8, h: 30, fill: '#E8E2D4' },
]

export const TALLER: Habitacion = {
  id: 'taller',
  nombre: 'El taller',
  marca: 'House of Kaizen',
  clase: 'hab-taller',
  entrada: [3.2, 2.5],
  pista: 'el taller de House of Kaizen',

  trazos: () => [
    // La alfombra del piso: una pieza terminada, puesta donde se camina.
    { t: 'piso', p: [[1.5, 1.5], [3.4, 1.5], [3.4, 3.3], [1.5, 3.3]],
      fill: 'rgba(255,77,0,0.14)', borde: 'rgba(255,77,0,0.45)', grosor: 1.2 },

    ...ALFOMBRAS,
    ...BASTIDOR,
    ...MAQUINA,

    // ---- la puerta de vuelta al cuarto (pared derecha) ----
    { t: 'pared', lado: 'der', en: 4.1, alto: 0, ancho: 0.8, h: 64, fill: '#241E18' },
    { t: 'pared', lado: 'der', en: 4.18, alto: 4, ancho: 0.64, h: 56, fill: '#383026' },
    { t: 'circulo', c: [303, 44], r: 2.4, fill: '#E8C044' },
  ],

  objetos: [
    { id: 'bastidor', etiqueta: 'Bastidor', tipo: 'accion', centro: [70, -18], etqAbajo: true, parada: [1.15, 2.0] },
    { id: 'maquina',  etiqueta: 'Máquina',  tipo: 'accion', centro: [155, 48], etqAbajo: true, parada: [2.4, 3.0] },
    { id: 'alfombras', etiqueta: 'Alfombras', tipo: 'accion', centro: [215, -18], etqAbajo: true, parada: [1.6, 0.9] },
    { id: 'al-cuarto', etiqueta: 'al cuarto', tipo: 'puerta', hacia: 'cuarto', centro: [292, 12], etqAbajo: true, parada: [3.9, 1.4] },
  ],

  datos: () => ({
    bastidor: 'a medio hacer',
    maquina: null,
    alfombras: '3 hechas',
    'al-cuarto': 'MODOZAINT',
  }),
}
