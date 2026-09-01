/**
 * Entiende lo que se dicta, sin IA y sin costo por uso.
 *
 * Por que no una llamada a Claude: cada frase costaria plata, y marcar un
 * habito es la accion mas repetida de la app. Si algun dia hacen falta frases
 * raras, esto se queda de primera capa y el modelo entra SOLO cuando devuelve
 * `nada` — nunca en el camino comun.
 *
 * ⚠️ Este archivo NO guarda nada. Solo traduce una frase en una intencion.
 * Quien decide es Santiago, en la tarjeta de confirmacion (decision del
 * 2026-08-14): la app lleva el dato hasta la pantalla y espera. Ahi es donde
 * se ve si el microfono oyo bien.
 *
 * ⚠️ Cicatriz (2026-08-14). "Anadir tarea: hacer plan de contenido" marco el
 * habito Publicar como hecho. Dos fallas encadenadas:
 *   1. `anade` con \b no coincide con "anadir", asi que no se vio la intencion.
 *   2. `contenido` era sinonimo de Publicar, y capturo "plan de contenido".
 * De ahi las dos reglas: la intencion explicita SIEMPRE gana, y los sinonimos
 * se comparan por palabra completa, nunca por trozo.
 *
 * ⚠️ Cicatriz (2026-08-14, segunda). "Anadir planeacion de contenido a tareas"
 * caia en `nada`: los patrones solo miraban "tarea" DESPUES del verbo, y aqui
 * va al final. Por eso existe TAREA_AL_FINAL.
 */

export type Nivel = 'minimo' | 'normal' | 'super'

export type Interpretacion =
  | { tipo: 'habito'; habitoId: string; nombre: string; nivel: Nivel; nota: string | null }
  | { tipo: 'tarea'; texto: string; minutos: number | null }
  | {
      tipo: 'movimiento'
      mov: 'cargar' | 'descargar'
      monto: number
      bolsilloId: number | null
      bolsilloNombre: string | null
      nota: string | null
    }
  | { tipo: 'consulta'; que: 'vida' | 'falta' | 'plan' }
  | { tipo: 'consulta_plata'; bolsilloId: number | null; bolsilloNombre: string | null }
  | { tipo: 'nada'; oido: string }

export type HabitoConocido = {
  id: string
  nombre: string
  minimo?: string | null
  normal?: string | null
  super?: string | null
}

export type BolsilloConocido = {
  id: number
  nombre: string
  saldo?: number
}

/** Quita tildes y signos para que "leí" y "lei" sean lo mismo. */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Igual que `normalizar` pero conserva . y , : los numeros los necesitan. */
function normalizarConNumeros(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!;:$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function palabraSuelta(aguja: string, pajar: string): boolean {
  const a = normalizar(aguja)
  if (!a) return false
  const escapado = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s)${escapado}(\\s|$)`).test(pajar)
}

const NIVELES: [RegExp, Nivel][] = [
  [/\b(super|maximo|completo|a tope|full)\b/, 'super'],
  [/\b(minimo|poquito|un poco|apenas)\b/, 'minimo'],
  [/\b(normal|regular|lo de siempre)\b/, 'normal'],
]

/**
 * Intencion EXPLICITA de crear una tarea. Se revisa antes que nada: si alguien
 * dice la palabra "tarea", no hay habito que valga.
 */
// ⚠️ Estas se comparan contra el texto YA normalizado, que no tiene signos:
// "tarea: correr la SQL" llega como "tarea correr la sql". Buscar los dos
// puntos aqui no encuentra nada nunca.
const TAREA_EXPLICITA = [
  /\b(anadir|anade|anado|anadi|agregar|agrega|agregue|crear|crea|nueva|anota|apunta)\s+(una\s+|la\s+|mi\s+)?tarea\b/,
  /^tarea\b/,
  /\bnueva tarea\b/,
]

/** "Anadir planeacion de contenido A TAREAS": el destino va al final. */
const TAREA_AL_FINAL = /\ba (mis |las |la |mi )?(tareas?|lista|pendientes|backlog)\s*$/

/** Intencion de anotar algo, aunque no diga la palabra "tarea". */
const TAREA_SUAVE = /\b(anota|anotar|apunta|apuntar|recuerdame|recordarme|pendiente|tengo que|hay que|no olvidar|se me olvida)\b/

const VERBOS_HECHO = /\b(hice|hago|ya|termine|acabo de|cumpli|complete|marca|marcar|hecho|estuve)\b/

// ---------- PLATA ----------
// Regla dura: sin monto no hay movimiento. "Tengo que pagar el SOAT" es una
// tarea, no un gasto; lo unico que los separa de verdad es que haya una cifra.

/** Sale plata del bolsillo. */
const SALE = /\b(gaste|gasto|gastamos|pague|pago|pagamos|saque|saco|retire|compre|compro|me costo|costo|salieron|salio|me gaste)\b/

/** Entra plata al bolsillo. */
const ENTRA = /\b(meti|metio|guarde|guardo|cargue|cargo|abone|abono|ahorre|ahorro|deposite|deposito|entro|entraron|recibi|me entro|me llego|llego)\b/

const CONSULTA_PLATA = /\b(cuanto|cuanta)\b.*\b(tengo|queda|hay|llevo|va)\b|\bsaldo\b/

const UNIDADES: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21,
  veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70,
  ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200,
  trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600,
  setecientos: 700, ochocientos: 800, novecientos: 900,
}

/**
 * "1.800" son mil ochocientos, no uno coma ocho: en Colombia el punto separa
 * miles. Solo se lee como decimal cuando quedan 1 o 2 digitos ("1.5 millones").
 */
function digitosANumero(s: string): number {
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return parseInt(s.replace(/[.,]/g, ''), 10)
  if (/^\d+[.,]\d{1,2}$/.test(s)) return parseFloat(s.replace(',', '.'))
  return parseInt(s.replace(/[.,]/g, ''), 10)
}

/** "treinta mil", "mil ochocientos", "dos millones y medio" → numero. */
function palabrasANumero(t: string): number | null {
  const palabras = t.split(' ')
  let total = 0
  let parcial = 0
  let vio = false

  for (const p of palabras) {
    if (p === 'y' || p === 'con') continue
    if (UNIDADES[p] !== undefined) { parcial += UNIDADES[p]; vio = true; continue }
    if (p === 'mil' || p === 'miles') { total += (parcial || 1) * 1000; parcial = 0; vio = true; continue }
    if (p === 'millon' || p === 'millones') { total += (parcial || 1) * 1_000_000; parcial = 0; vio = true; continue }
    if (p === 'medio' || p === 'media') { parcial += 0.5; vio = true; continue }
    // Cualquier otra palabra corta la cifra: "treinta mil del mecato" para en "del".
    if (vio) break
  }
  if (!vio) return null
  const n = total + parcial
  return n > 0 ? n : null
}

/**
 * Encuentra la cifra de la frase. Prueba digitos primero porque el dictado
 * casi siempre entrega "1.800" y no "mil ochocientos".
 */
export function montoEn(fraseNormalizada: string): number | null {
  const t = fraseNormalizada

  const conMillon = t.match(/(\d+(?:[.,]\d+)*)\s*(millones|millon|m)\b/)
  if (conMillon) return Math.round(digitosANumero(conMillon[1]) * 1_000_000)

  const conMil = t.match(/(\d+(?:[.,]\d+)*)\s*(mil|k)\b/)
  if (conMil) return Math.round(digitosANumero(conMil[1]) * 1000)

  const soloDigitos = t.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/)
  if (soloDigitos) {
    const n = digitosANumero(soloDigitos[1])
    if (n > 0) return Math.round(n)
  }

  // Sin digitos: intentar con las palabras, desde donde arranque un numero.
  const palabras = t.split(' ')
  for (let i = 0; i < palabras.length; i++) {
    if (UNIDADES[palabras[i]] !== undefined || palabras[i] === 'mil' || palabras[i] === 'millon') {
      const n = palabrasANumero(palabras.slice(i).join(' '))
      if (n) return Math.round(n)
    }
  }
  return null
}

function buscarBolsillo(t: string, bolsillos: BolsilloConocido[]): BolsilloConocido | null {
  // Nombre completo primero: "gastos del hogar" antes que "hogar".
  const porLargo = [...bolsillos].sort((a, b) => b.nombre.length - a.nombre.length)
  for (const b of porLargo) {
    if (palabraSuelta(b.nombre, t)) return b
  }
  // Alguna palabra distintiva del nombre ("Ahorro moto" → "moto").
  for (const b of porLargo) {
    for (const palabra of normalizar(b.nombre).split(' ')) {
      if (palabra.length >= 4 && palabraSuelta(palabra, t)) return b
    }
  }
  return null
}

/**
 * Lo que va despues de "en" / "para": el concepto del gasto.
 * `de` solo se prueba cuando NO se reconocio el bolsillo, porque casi siempre
 * el "de X" ES el bolsillo ("saque 30 mil DE LA MOTO") y no el concepto.
 */
function conceptoEn(t: string, hayBolsillo: boolean): string | null {
  const m =
    t.match(/\b(?:en|para|por)\s+(?:el |la |los |las |un |una )?([a-z0-9\s]{2,40})$/) ??
    (hayBolsillo ? null : t.match(/\bde\s+(?:el |la |los |las |un |una )?([a-z0-9\s]{2,40})$/))
  if (!m) return null
  const limpio = m[1].replace(/\b(bolsillo|bolsillos)\b/g, '').trim()
  return limpio || null
}

export function interpretar(
  frase: string,
  habitos: HabitoConocido[],
  bolsillos: BolsilloConocido[] = [],
): Interpretacion {
  const t = normalizar(frase)
  const tn = normalizarConNumeros(frase)
  if (!t) return { tipo: 'nada', oido: frase }

  // 1. Intencion explicita de tarea. Gana sobre todo lo demas, siempre.
  if (TAREA_EXPLICITA.some(re => re.test(t)) || TAREA_AL_FINAL.test(t)) {
    return { tipo: 'tarea', texto: limpiarTexto(frase), minutos: minutosEn(t) }
  }

  // 2. Plata. Va antes que habitos: "compre crema" con cifra es un gasto,
  //    no el habito de la crema. Sin cifra no entra aqui.
  const sale = SALE.test(t)
  const entra = ENTRA.test(t)
  if (sale || entra) {
    const monto = montoEn(tn)
    if (monto) {
      const b = buscarBolsillo(t, bolsillos)
      const concepto = conceptoEn(t, !!b)
      // Si el concepto repite el nombre del bolsillo, la nota sobra.
      const repetido = concepto && b && normalizar(concepto) === normalizar(b.nombre)
      return {
        tipo: 'movimiento',
        mov: sale ? 'descargar' : 'cargar',
        monto,
        bolsilloId: b?.id ?? null,
        bolsilloNombre: b?.nombre ?? null,
        // Sin bolsillo reconocido se guarda la frase entera: perder el contexto
        // seria peor que una nota larga, y de todos modos es editable.
        nota: repetido ? null : concepto ?? (b ? null : frase.trim()),
      }
    }
  }

  // 3. Preguntas de estado.
  if (CONSULTA_PLATA.test(t) && (bolsillos.length > 0 || /\bplata|bolsillo|saldo\b/.test(t))) {
    const b = buscarBolsillo(t, bolsillos)
    if (b || /\bplata|bolsillo|saldo|banco\b/.test(t)) {
      return { tipo: 'consulta_plata', bolsilloId: b?.id ?? null, bolsilloNombre: b?.nombre ?? null }
    }
  }
  if (/\b(cuanta|cuanto)\b.*\bvida\b|\bcomo (voy|estoy)\b/.test(t)) {
    return { tipo: 'consulta', que: 'vida' }
  }
  if (/\bque (me )?falta\b|\bcuanto (me )?falta\b/.test(t)) {
    return { tipo: 'consulta', que: 'falta' }
  }
  if (/\bque (hago|toca|cabe)\b|\bplan de hoy\b|\bque tengo hoy\b/.test(t)) {
    return { tipo: 'consulta', que: 'plan' }
  }

  // 4. Intencion suave de anotar. Antes que el habito: "recuerdame hacer
  //    ejercicio" es un pendiente, no un ejercicio ya hecho.
  if (TAREA_SUAVE.test(t)) {
    return { tipo: 'tarea', texto: limpiarTexto(frase), minutos: minutosEn(t) }
  }

  // 5. ¿Nombra un habito?
  const h = buscarHabito(t, habitos)
  if (h) {
    return {
      tipo: 'habito',
      habitoId: h.id,
      nombre: h.nombre,
      nivel: nivelEn(t),
      nota: frase.trim().length > 14 ? frase.trim() : null,
    }
  }

  // 6. Dijo que hizo algo pero no sabemos que. No se inventa: se guarda.
  if (VERBOS_HECHO.test(t)) {
    return { tipo: 'tarea', texto: frase.trim(), minutos: minutosEn(t) }
  }

  return { tipo: 'nada', oido: frase }
}

function buscarHabito(t: string, habitos: HabitoConocido[]): HabitoConocido | null {
  // Por el nombre configurado, como palabra completa.
  for (const h of habitos) {
    if (palabraSuelta(h.nombre, t)) return h
  }
  // Por sinonimos hablados, tambien como palabra completa.
  for (const h of habitos) {
    for (const s of SINONIMOS[h.id] ?? []) {
      if (palabraSuelta(s, t)) return h
    }
  }
  // Ultimo recurso: una palabra LARGA y distintiva del texto de sus niveles
  // ("80 flexiones" -> Ejercicio). Se exigen 6+ letras para no morder
  // palabras comunes.
  for (const h of habitos) {
    for (const nivel of [h.minimo, h.normal, h.super]) {
      if (!nivel) continue
      for (const palabra of normalizar(nivel).split(/[\s·,]+/)) {
        if (palabra.length >= 6 && palabraSuelta(palabra, t)) return h
      }
    }
  }
  return null
}

/**
 * Sinonimos hablados. ⚠️ Solo palabras que NO tienen sentido fuera del habito.
 * Nada de "contenido", "historia", "post" o "trabajar": aparecen en frases que
 * hablan de otra cosa y se llevan la accion por delante.
 */
const SINONIMOS: Record<string, string[]> = {
  ejercicio:   ['ejercicio', 'entrenar', 'entrene', 'gimnasio', 'gym', 'flexiones', 'corri', 'trote', 'trotar'],
  leer:        ['leer', 'lei', 'leyendo', 'lectura'],
  dormir:      ['dormir', 'dormi', 'duermo', 'siesta'],
  publicar:    ['publicar', 'publique', 'publico'],
  aprender:    ['aprender', 'aprendi', 'estudiar', 'estudie'],
  bloque:      ['bloque', 'deep work'],
  novia:       ['novia', 'mi novia'],
  gente:       ['amigos', 'familia'],
  desconectar: ['desconectar', 'desconecte', 'sin celular', 'sin movil', 'sin pantallas'],
}

function nivelEn(t: string): Nivel {
  for (const [re, nivel] of NIVELES) if (re.test(t)) return nivel
  return 'normal'
}

/** Le quita el encabezado ("anadir tarea:", "recuerdame que…") y el destino final. */
function limpiarTexto(frase: string): string {
  const limpio = frase
    .replace(/^\s*(anadir|añadir|anade|añade|anado|añado|agregar|agrega|crear|crea|nueva|anota|apunta)\s+(una\s+|la\s+|mi\s+)?tarea\s*[:\-]?\s*/i, '')
    .replace(/^\s*tarea\s*[:\-]\s*/i, '')
    // ⚠️ Con tilde y sin ella: el dictado del navegador SI pone tildes, y
    //    "recuérdame" no coincidia con el patron pelado.
    .replace(/^\s*(an[oó]ta(me)?|anotar|ap[uú]nta(me)?|apuntar|recu[eé]rda(me)?|record[aá]rme(lo)?)\s*(que)?\s*[:\-]?\s*/i, '')
    .replace(/^\s*(tengo que|hay que|no olvidar)\s*/i, '')
    // "Anadir planeacion de contenido a tareas" -> "planeacion de contenido"
    .replace(/^\s*(anadir|añadir|anade|añade|agregar|agrega|crear|crea|apunta|anota)\s+/i, '')
    .replace(/\s+a\s+(mis\s+|las\s+|la\s+|mi\s+)?(tareas?|lista|pendientes|backlog)\s*$/i, '')
    .trim()
  return limpio || frase.trim()
}

/** "45 minutos", "una hora y media", "2 h" → minutos. */
export function minutosEn(t: string): number | null {
  if (/hora y media/.test(t)) return 90
  let total = 0
  const horas = t.match(/(\d+)\s*(h|hora|horas)\b/)
  const mins = t.match(/(\d+)\s*(m|min|minuto|minutos)\b/)
  if (horas) total += parseInt(horas[1], 10) * 60
  if (mins) total += parseInt(mins[1], 10)
  if (!total && /media hora/.test(t)) total = 30
  return total > 0 ? total : null
}
