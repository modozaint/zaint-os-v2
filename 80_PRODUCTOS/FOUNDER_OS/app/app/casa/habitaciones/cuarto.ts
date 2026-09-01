import type { Habitacion, Punto, Trazo } from '../motor'

/* ============================================================
   EL CUARTO — la habitación de MODOZAINT. Y desde el 2026-08-27, SU cuarto.

   Su marca personal, así que aquí van sus hábitos, su día, su dinero, sus
   turnos y el cuaderno. Es la primera habitación y la de entrada.

   ⭐ OLA 4 — LO QUE HAY ACÁ SALE DE LAS FOTOS, no de un cuarto genérico.
   Fuente: `referencias/cuarto-real-01.jpg` … `-05.jpg` (2026-08-26).

   Lo que se ve en ellas y ahora está dibujado:
     · **Pared verde lima con zócalo crema** y **techo de madera** machihembrada
     · **Todo el mobiliario en caoba**: escritorio con estantería de nichos,
       cama de cabecero tallado, mecedora y un armario grande
     · **La cajonera plástica verde lima de tres cajones con marco azul**
     · **La colcha ocre de rombos** con sus flecos
     · **La ventana con cortina roja**, que es de donde entra la única luz
     · **El diploma enmarcado** y el afiche, los dos en la pared
     · ⭐ **El keyboard rug morado con la K amarilla de K Studio**, tirado al
       lado de la cama — es literalmente una pieza suya, hecha con sus manos,
       y es lo único del cuarto que no compró nadie
     · **La pistola de tufting sobre el armario**, con su cono de hilo

   🔒 LO QUE NO CAMBIÓ, Y ES A PROPÓSITO: **ni un solo objeto se movió.** Los
   `centro`, las `parada` y los `href` son los mismos de antes — si se hubieran
   movido, las etiquetas volverían a chocar entre ellas y ese chequeo ya se
   pagó una vez (ver el comentario de `al-taller`). Cambió lo que se DIBUJA
   debajo, no dónde se toca.

   Las coordenadas sueltas van con la `y` RELATIVA a `oy`, la esquina del
   fondo.
   ============================================================ */

const MUEBLE = { top: 'var(--cu-mueble-top)', der: 'var(--cu-mueble-der)', izq: 'var(--cu-mueble-izq)' }
const PAPEL = { top: 'var(--cu-papel)', der: 'var(--cu-papel-der)', izq: 'var(--cu-papel-der)' }

/** Las rayitas de los días del calendario. Salen de `P(0, 3.9 + k*0.18)`:
 *  x = 160 − 30t, y = 15t, y la raya va de y−62 a y−50. */
const RAYAS_CALENDARIO: Trazo[] = [0, 1, 2, 3].map(k => {
  const t = 3.9 + k * 0.18
  const x = 160 - 30 * t, y = 15 * t
  return { t: 'linea', a: [x, y - 62] as Punto, b: [x, y - 50] as Punto,
           color: 'var(--cu-tinta)', grosor: 1.6 }
})

/** La lámpara cuelga sobre el tapete, en P(2.5,2.5) = [160, 75]. */
const LAMPARA: Trazo[] = [
  { t: 'linea', a: [160, -146], b: [160, -87], color: 'var(--cu-zocalo)', grosor: 1.4 },
  { t: 'elipse', c: [160, 41], rx: 92, ry: 78, fill: 'url(#cu-lampara)' },
  { t: 'poli', p: [[143, -73], [177, -73], [167, -87], [153, -87]], fill: 'var(--cu-lampara-pantalla)' },
  { t: 'elipse', c: [160, -73], rx: 17, ry: 4.5, fill: 'var(--cu-lampara-luz)' },
]

/**
 * LA ALFOMBRA OCRE DE ROMBOS.
 *
 * En las fotos cubre casi todo el piso, y sus rombos burdeos son lo primero
 * que se reconoce del cuarto. Va en coordenadas de PISO: es un rombo
 * isométrico, no un rectángulo.
 */
const ALFOMBRA: Trazo[] = [
  { t: 'piso', p: [[0.9, 0.9], [4.1, 0.9], [4.1, 4.1], [0.9, 4.1]],
    fill: '#B08A46', borde: '#7C4030', grosor: 1.4 },
  // los rombos del estampado, en dos filas
  ...[1.6, 2.5, 3.4].flatMap((u): Trazo[] =>
    [1.6, 2.5, 3.4].map((v): Trazo => ({
      t: 'piso',
      p: [[u - 0.22, v], [u, v - 0.22], [u + 0.22, v], [u, v + 0.22]],
      fill: '#7C3E33',
    }))
  ),
]

/**
 * ⭐ EL KEYBOARD RUG DE K STUDIO — morado con la K amarilla.
 *
 * Está en `cuarto-real-02.jpg`, en el suelo al lado de la cama. No es
 * decoración: de los tres que existen, este es el que vive acá, y es la única
 * cosa del cuarto que salió de sus propias manos. Por eso se dibuja con su
 * forma real —rectangular, no rombo— y con la K legible.
 */
const RUG_KSTUDIO: Trazo[] = [
  { t: 'piso', p: [[3.15, 2.6], [4.05, 2.6], [4.05, 3.7], [3.15, 3.7]],
    fill: 'var(--cu-rug)', borde: '#2E1845', grosor: 1 },
  /* La K, en dos trazos: el palo y la punta de flecha.
     ⚠️ Su sitio se CALCULÓ, no se puso a ojo — el primer intento la dejó
     flotando en el piso, fuera del rug, y se vio en el screenshot. El rug
     ocupa el rombo (3.15,2.6)-(4.05,3.7), y con P(u,v) = [160 + 30(u−v),
     15(u+v)] su centro cae en [173, 101]. La K se dibuja alrededor de ahí. */
  { t: 'poli', p: [[166, 96], [170, 98], [170, 110], [166, 108]], fill: 'var(--cu-rug-k)' },
  { t: 'poli', p: [[171, 98], [183, 104], [171, 110]], fill: 'var(--cu-rug-k)' },
]

/**
 * EL ESCRITORIO CON SU ESTANTERÍA DE NICHOS.
 *
 * En `cuarto-real-02.jpg` la parte de arriba son cuatro cubículos abiertos de
 * madera, no una tabla lisa: es donde tiene las cosas y es lo que le da su
 * silueta. Se dibuja sobre la pared izquierda, encima del tablero.
 */
const ESCRITORIO: Trazo[] = [
  { t: 'caja', u: 0, v: 1.2, a: 1, b: 2.2, h: 26, ...MUEBLE },
  // el fondo de la estantería y sus cuatro nichos
  { t: 'pared', lado: 'izq', en: 1.35, alto: 30, ancho: 2.0, h: 46, fill: 'var(--cu-mueble-der)' },
  ...[0, 1, 2, 3].map((k): Trazo => ({
    t: 'pared', lado: 'izq', en: 1.45 + k * 0.46, alto: 34, ancho: 0.36, h: 38,
    fill: 'var(--cu-mueble-izq)',
  })),
]

/**
 * LA MECEDORA DE MADERA TALLADA, con la ropa encima.
 *
 * Reemplaza la silla de cajas que había: en el cuarto real no hay una silla
 * de escritorio, hay una mecedora antigua de brazos curvos que casi siempre
 * tiene ropa doblada encima. Lo segundo importa tanto como lo primero.
 */
const MECEDORA: Trazo[] = [
  { t: 'caja', u: 1.25, v: 2.45, a: 0.62, b: 0.62, h: 10, ...MUEBLE },
  { t: 'caja', u: 1.25, v: 2.45, a: 0.62, b: 0.12, h: 20, z: 10, ...MUEBLE },
  // los brazos curvos, insinuados con dos líneas gruesas
  { t: 'linea', a: [113, 44], b: [128, 52], color: 'var(--cu-mueble-top)', grosor: 3 },
  { t: 'linea', a: [128, 52], b: [141, 45], color: 'var(--cu-mueble-top)', grosor: 3 },
  // la ropa encima: no está limpia, está usada
  { t: 'caja', u: 1.32, v: 2.52, a: 0.46, b: 0.46, h: 5, z: 10,
    top: '#C9C2CC', der: '#A9A2AE', izq: '#8B8490' },
]

/**
 * LA CAMA, CON SU CABECERO TALLADO.
 *
 * El cabecero de `cuarto-real-04.jpg` es la pieza más reconocible del cuarto:
 * madera oscura, alto, con volutas. Se dibuja como pared alta detrás de la
 * cama más dos remates redondos, que es lo que se lee a este tamaño.
 */
const CAMA: Trazo[] = [
  // el cabecero, contra la pared del fondo
  { t: 'pared', lado: 'der', en: 0.15, alto: 13, ancho: 1.25, h: 42, fill: 'var(--cu-mueble-izq)' },
  { t: 'pared', lado: 'der', en: 0.3, alto: 30, ancho: 0.95, h: 20, fill: 'var(--cu-mueble-der)' },
  { t: 'circulo', c: [212, -18], r: 4, fill: 'var(--cu-mueble-top)' },
  { t: 'circulo', c: [246, -1], r: 4, fill: 'var(--cu-mueble-top)' },

  { t: 'caja', u: 2.6, v: 0, a: 2, b: 1.3, h: 13, ...MUEBLE },
  { t: 'caja', u: 2.65, v: 0.06, a: 1.9, b: 1.2, h: 6, z: 13,
    top: 'var(--cu-sabana)', der: 'var(--cu-sabana-der)', izq: 'var(--cu-sabana-izq)' },
  { t: 'caja', u: 2.72, v: 0.16, a: 0.55, b: 0.95, h: 5, z: 19, ...PAPEL },
]

/** La ventana con la cortina roja: la única luz natural del cuarto. */
const VENTANA: Trazo[] = [
  { t: 'pared', lado: 'der', en: 2.75, alto: 34, ancho: 0.95, h: 44, fill: '#E7DCC6' },
  { t: 'pared', lado: 'der', en: 2.8, alto: 38, ancho: 0.85, h: 36, fill: '#F6EFDC' },
  // la cortina, corrida a medias
  { t: 'pared', lado: 'der', en: 2.75, alto: 34, ancho: 0.34, h: 44, fill: 'var(--cu-cortina)' },
  { t: 'pared', lado: 'der', en: 3.42, alto: 34, ancho: 0.28, h: 44, fill: 'var(--cu-cortina)' },
]

/**
 * EL ARMARIO, con la pistola de tufting encima.
 *
 * `cuarto-real-05.jpg`: un ropero grande de puertas de panel, y arriba la
 * máquina con su cono de hilo amarillo. Que la herramienta duerma sobre el
 * armario del cuarto —y no en el taller— es un dato del negocio, no un
 * adorno: House of Kaizen se hace acá, en el mismo cuarto donde duerme.
 */
const ARMARIO: Trazo[] = [
  { t: 'caja', u: 0.05, v: 3.95, a: 0.95, b: 1.0, h: 62, ...MUEBLE },
  // las dos puertas de panel
  { t: 'poli', p: [[26, 46], [46, 57], [46, 20], [26, 9]], fill: 'var(--cu-mueble-der)' },
  { t: 'poli', p: [[48, 58], [68, 47], [68, 10], [48, 21]], fill: 'var(--cu-mueble-top)' },
  // la pistola de tufting y su cono de hilo
  { t: 'caja', u: 0.3, v: 4.2, a: 0.4, b: 0.22, h: 8, z: 62,
    top: '#4FA8A0', der: '#3E8880', izq: '#2E6862' },
  { t: 'elipse', c: [56, -13], rx: 5, ry: 7, fill: 'var(--cu-rug-k)' },
]

/** La cajonera plástica verde lima de marco azul, la de las fotos. */
const CAJONERA: Trazo[] = [
  { t: 'caja', u: 2.42, v: 3.82, a: 0.76, b: 0.76, h: 32,
    top: 'var(--cu-cajon-marco)', der: '#243D7E', izq: '#1B2E5E' },
  // Los cajones casi llenan el marco: en la foto el azul es un filo, no un
  // borde ancho. Con 0.68 de lado el marco se comía la mitad del mueble.
  ...[0, 1, 2].map((k): Trazo => ({
    t: 'caja', u: 2.45, v: 3.85, a: 0.72, b: 0.72, h: 9, z: 1.5 + k * 10,
    top: 'var(--cu-cajon)', der: '#9BAF33', izq: '#7D8E29',
  })),
]

export const CUARTO: Habitacion = {
  id: 'cuarto',
  nombre: 'Tu cuarto',
  marca: 'MODOZAINT',
  clase: 'hab-cuarto',
  entrada: [2.5, 2.5],
  pista: 'toca un objeto del cuarto',

  trazos: (d) => [
    ...ALFOMBRA,
    ...RUG_KSTUDIO,
    ...LAMPARA,

    // ---- el diploma enmarcado (pared izquierda) ----
    // El de bachiller de 2022, que en las fotos está colgado y a la vista.
    // Aquí hace de calendario: es el objeto que lleva a los días.
    { t: 'pared', lado: 'izq', en: 3.7, alto: 44, ancho: 1.1, h: 32, fill: 'var(--cu-tinta)' },
    { t: 'pared', lado: 'izq', en: 3.75, alto: 46, ancho: 1, h: 28, fill: 'var(--cu-papel)' },
    { t: 'pared', lado: 'izq', en: 3.75, alto: 68, ancho: 1, h: 6, fill: 'var(--oliva)' },
    ...RAYAS_CALENDARIO,

    // ---- LA PUERTA a Ajustes (pared derecha) ----
    { t: 'pared', lado: 'der', en: 1.95, alto: 0, ancho: 0.8, h: 64, fill: 'var(--cu-puerta)' },
    { t: 'pared', lado: 'der', en: 2.03, alto: 4, ancho: 0.64, h: 56, fill: 'var(--cu-puerta-hoja)' },
    { t: 'circulo', c: [238, 12], r: 2.4, fill: 'var(--cu-alcancia)' },

    // ---- el afiche redondo con marco de madera (pared derecha) ----
    // Ocupa el sitio de la diana vieja, con la misma forma y el mismo centro.
    { t: 'circulo', c: [205, -22], r: 16, fill: 'var(--cu-mueble-izq)' },
    { t: 'circulo', c: [205, -22], r: 15, fill: 'var(--cu-papel)' },
    { t: 'circulo', c: [205, -22], r: 10, opacidad: 0.9,
      fill: d.areaFloja ? d.areaFloja.color : 'var(--cu-mueble-der)' },
    { t: 'circulo', c: [205, -22], r: 4, fill: 'var(--cu-papel)' },

    ...VENTANA,

    // ---- corcho con sus papelitos (pared derecha) ----
    { t: 'pared', lado: 'der', en: 3.4, alto: 42, ancho: 1.15, h: 30, fill: 'var(--cu-corcho)' },
    ...[{ en: 3.6, alto: 50 }, { en: 3.95, alto: 58 }, { en: 4.25, alto: 47 }].map((p, k): Trazo => ({
      t: 'pared', lado: 'der', en: p.en, alto: p.alto, ancho: 0.26, h: 9,
      fill: k < d.pendientesTareas ? 'var(--oliva)' : 'var(--cu-papel)',
    })),

    ...ESCRITORIO,

    // el portátil: mira hacia adentro (+u), que es donde se sienta él
    { t: 'poli', p: [[131, 10.5], [106, 23], [106, 0], [131, -12.5]],
      fill: 'var(--cu-mueble-izq)' },
    { t: 'poli', p: [[128, 12], [110, 21], [110, 3], [128, -6]],
      fill: d.faltanHabitos ? 'var(--oliva)' : 'var(--cu-apagado)' },

    // cuaderno abierto sobre el escritorio
    { t: 'poli', p: [[74, 25], [88, 18], [88, 25], [74, 32]], fill: 'var(--cu-papel)' },
    { t: 'poli', p: [[88, 18], [102, 25], [102, 32], [88, 25]], fill: 'var(--cu-papel-der)' },
    { t: 'linea', a: [88, 18], b: [88, 25], color: 'var(--cu-tinta)', grosor: 0.9 },
    { t: 'linea', a: [93, 23], b: [99, 26], color: 'var(--oliva)', grosor: 1.6 },

    ...MECEDORA,
    ...CAMA,

    // la colcha ocre de rombos, con sus flecos
    { t: 'caja', u: 3.45, v: 0.08, a: 1.05, b: 1.16, h: 5, z: 19,
      top: d.protegido ? 'var(--oliva)' : 'var(--cu-cobija)',
      der: d.protegido ? 'var(--cu-oliva-der)' : 'var(--cu-cobija-der)',
      izq: d.protegido ? 'var(--cu-oliva-izq)' : 'var(--cu-cobija-izq)' },
    ...[0, 1, 2].map((k): Trazo => ({
      t: 'linea',
      a: [250 + k * 11, 36 + k * 5.5] as Punto,
      b: [256 + k * 11, 39 + k * 5.5] as Punto,
      color: '#7C3E33', grosor: 1.4,
    })),

    ...CAJONERA,

    // ---- alcancía, encima de la cajonera ----
    { t: 'elipse', c: [118, 87], rx: 10, ry: 7, fill: 'var(--cu-alcancia)' },
    { t: 'elipse', c: [126, 89], rx: 4.5, ry: 3.5, fill: 'var(--cu-alcancia)' },
    { t: 'linea', a: [114, 82], b: [122, 82], color: 'var(--cu-mueble-izq)', grosor: 1.8 },

    ...ARMARIO,

    // ---- el Content OS: la segunda pantalla del escritorio ----
    // Es otra app, con otro repo y otra base. Aquí solo está la salida.
    { t: 'poli', p: [[104, -18], [88, -10], [88, -28], [104, -36]], fill: 'var(--cu-mueble-izq)' },
    { t: 'poli', p: [[102, -20], [91, -14], [91, -27], [102, -33]], fill: '#C49A52' },
    { t: 'linea', a: [96, -12], b: [96, -6], color: 'var(--cu-mueble-izq)', grosor: 2 },

    // ---- la puerta A LA OFICINA (pared derecha, al frente) ----
    { t: 'pared', lado: 'der', en: 4.1, alto: 0, ancho: 0.75, h: 64, fill: 'var(--cu-puerta)' },
    { t: 'pared', lado: 'der', en: 4.18, alto: 4, ancho: 0.6, h: 56, fill: 'var(--cu-puerta-hoja)' },
    { t: 'circulo', c: [302, 43], r: 2.4, fill: '#C49A52' },

    // ---- la puerta AL TALLER (pared izquierda) ----
    // Va en el tramo 0.1..0.9 porque es el ÚNICO libre de esa pared: el
    // monitor ocupa de 0.97 a 1.8, el escritorio de 1.2 a 3.4 y el
    // diploma de 3.7 a 4.8.
    { t: 'pared', lado: 'izq', en: 0.1, alto: 0, ancho: 0.8, h: 64, fill: 'var(--cu-puerta)' },
    { t: 'pared', lado: 'izq', en: 0.18, alto: 4, ancho: 0.64, h: 56, fill: 'var(--cu-puerta-hoja)' },
    { t: 'circulo', c: [140, -20], r: 2.4, fill: 'var(--cu-alcancia)' },
  ],

  objetos: [
    // `etqLejos`: su etiqueta sube un nivel mas. Hoy, Cuaderno y Dias caen en
    // 58 px de pantalla cuando se ve la casa entera, y arriba/abajo solo dan
    // dos sitios para tres etiquetas.
    { id: 'computador', etiqueta: 'Hoy',      tipo: 'ir', href: '/habitos',  centro: [128, -2],  etqAbajo: false, etqLejos: true, parada: [1.5, 1.6] },
    { id: 'cuaderno',   etiqueta: 'Cuaderno', tipo: 'accion', sienta: true,  centro: [88, 25],   etqAbajo: true,  parada: [1.55, 2.75] },
    // ⚠️ Su etiqueta va ARRIBA desde el 28-ago, y no es estetica: con la casa
    // entera en pantalla choca con la del CUADERNO. Los dos objetos estan a 34
    // px uno de otro y sus etiquetas miden 47 y 77 px, asi que abajo no caben
    // los dos. El objeto no se movio — solo el lado de su etiqueta.
    { id: 'calendario', etiqueta: 'Días',     tipo: 'ir', href: '/historial', centro: [32, 4],   etqAbajo: false, parada: [0.7, 3.9] },
    { id: 'diana',      etiqueta: 'Áreas',    tipo: 'ir', href: '/areas',     centro: [205, -22], etqAbajo: true, parada: [1.5, 0.9] },
    { id: 'corcho',     etiqueta: 'Tareas',   tipo: 'ir', href: '/tareas',    centro: [277, -2],  etqAbajo: true, parada: [3.4, 1.7] },
    { id: 'cama',       etiqueta: 'Turnos',   tipo: 'ir', href: '/turnos',    centro: [250, 50],  etqAbajo: true, parada: [3.3, 2.3] },
    { id: 'alcancia',   etiqueta: 'Dinero',   tipo: 'ir', href: '/dinero',    centro: [118, 85],  etqAbajo: true, parada: [3.3, 3.9] },
    // Ajustes es la única pantalla sin objeto propio. Que sea una puerta no es
    // capricho: es donde está «Cerrar sesión», o sea la salida de verdad.
    // Su etiqueta baja un nivel mas: chocaba 13x11 px con la de TAREAS.
    { id: 'puerta',     etiqueta: 'Ajustes',  tipo: 'ir', href: '/ajustes',   centro: [228, 10],  etqAbajo: false, etqLejos: true, parada: [2.35, 1.5] },
    // ⭐ La puerta de la CASA: al taller.
    // ⚠️ Su sitio NO se eligió a ojo: los tres intentos a ojo fallaron —tapó la
    // LÁMPARA, luego quedó DETRÁS DEL MUÑEQUITO, luego tapó la etiqueta de HOY.
    // Se calculó con un chequeo que compara la caja de esta etiqueta contra las
    // de los otros 8 objetos, contra la lámpara y contra el muñequito. De 91
    // huecos válidos, este es el que cae más centrado sobre la puerta dibujada.
    { id: 'al-taller',  etiqueta: 'al taller', tipo: 'puerta', hacia: 'taller', centro: [146, -32], etqAbajo: false, parada: [0.7, 0.5] },
    // ⭐ El Content OS. Es OTRA APP: se sale a ella, no se reimplementa aquí.
    { id: 'contentos', etiqueta: 'Content OS', tipo: 'fuera',
      href: 'https://dermatinta-content-os.vercel.app/plan',
      centro: [96, -24], etqAbajo: true, parada: [1.2, 2.3] },
    // Su sitio también salió del chequeo: en [295,40] la etiqueta se montaba
    // sobre la de TURNOS.
    { id: 'a-oficina', etiqueta: 'a la oficina', tipo: 'puerta', hacia: 'oficina', centro: [280, -38], etqAbajo: true, parada: [4.0, 1.5] },
  ],

  /**
   * Lo que esta pidiendo algo AHORA. Las cuatro que de verdad urgen: los
   * habitos sin marcar, las tareas pendientes, los dias sin llenar y el
   * cuaderno sin escribir. El resto no late — si late todo, no late nada.
   */
  alerta: (d) => ({
    computador: d.faltanHabitos,
    corcho: d.pendientesTareas > 0,
    calendario: d.sinLlenar > 0,
    cuaderno: !d.apunteHoy.trim(),
  }),

  datos: (d) => ({
    computador: d.faltanHabitos ? 'faltan' : 'hecho',
    cuaderno: d.apunteHoy.trim() ? 'escrito' : null,
    calendario: d.sinLlenar > 0 ? d.sinLlenar + ' sin llenar' : d.racha > 0 ? 'racha ' + d.racha : null,
    diana: d.areaFloja ? d.areaFloja.nombre : null,
    corcho: d.pendientesTareas > 0 ? String(d.pendientesTareas) : null,
    cama: d.protegido ? 'protegido' : null,
    alcancia: null,
    puerta: null,
    'al-taller': 'House of Kaizen',
    'a-oficina': 'Dermatinta',
    contentos: 'otra app',
  }),
}
