/**
 * ¿Este perfil de LinkedIn es una PERSONA o una CUENTA DE EMPRESA?
 *
 * Por qué existe: en la búsqueda de "agencia de marketing · Colombia" del
 * 03-08, de 15 resultados **10 eran cuentas de empresa** ("3 Studio Agency",
 * "Agencia Marketing", "Stv Content"). El generador tenía la orden fija de
 * "saluda por el nombre de pila", así que le habría escrito "Hola Agencia" a
 * una marca. Delata al instante que es un bot.
 *
 * La decisión (Santiago, 03-08) NO es descartarlos: son leads igual de buenos,
 * porque detrás de esa cuenta hay una persona administrándola. Lo que cambia es
 * el trato — se saluda a la marca y se pregunta con quién se tiene el gusto.
 *
 * Esto es una PISTA, no un veredicto: se le pasa al modelo junto al perfil y él
 * decide con criterio. Por eso se prefiere pecar de marcar empresa (el costo es
 * un "¿con quién tengo el gusto?" de más) antes que saludar a una marca por su
 * "nombre de pila".
 */

/** Palabras que en un NOMBRE delatan un negocio, no una persona. */
const TERMINOS_EMPRESA = [
  "agencia", "agency", "studio", "estudio", "marketing", "digital", "media",
  "group", "grupo", "solutions", "soluciones", "consulting", "consultora",
  "labs", "tech", "sas", "ltda", "inc", "llc", "corp", "company", "cia",
  "comunicaciones", "publicidad", "content", "creative", "creativa", "design",
  "software", "systems", "sistemas", "global", "network", "partners",
];

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    // quita los diacríticos que NFD dejó sueltos (tildes, diéresis)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s&.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Del headline "Director de cuenta en Goma Agencia SAS" saca "goma agencia sas".
 * Es la parte que LinkedIn usa para la empresa, y sirve para detectar el caso
 * más claro de todos: que el "nombre" del perfil SEA el nombre de la empresa.
 */
function empresaDelHeadline(headline: string): string {
  const m = normalizar(headline).match(/\ben\s+(.+)$/);
  return m ? m[1].trim() : "";
}

export interface SenalPerfil {
  esEmpresa: boolean;
  /** Por qué se decidió así. Se muestra en la app y ayuda a depurar la heurística. */
  motivo: string;
}

export function analizarTipoPerfil(
  nombre: string,
  headline: string = "",
): SenalPerfil {
  const n = normalizar(nombre);
  const h = normalizar(headline);
  if (!n) return { esEmpresa: false, motivo: "" };

  const palabras = n.split(" ").filter(Boolean);
  const razones: string[] = [];
  let puntos = 0;

  // 1. El nombre contiene un término de negocio ("Focus Agency", "Stv Content").
  const termino = palabras.find((p) => TERMINOS_EMPRESA.includes(p));
  if (termino) {
    puntos += 2;
    razones.push(`el nombre contiene "${termino}"`);
  }

  // 2. El nombre del perfil ES la empresa del headline ("Buoc Conecta" cuyo
  //    headline dice "Agencia de Marketing en Buoc Conecta"). Señal muy fuerte:
  //    una persona no se llama igual que la empresa donde trabaja.
  const empresa = empresaDelHeadline(h);
  if (empresa && n.length > 3 && empresa.includes(n)) {
    puntos += 2;
    razones.push("el nombre del perfil es el de la empresa");
  }

  // 3. El headline ARRANCA describiendo el negocio en vez de un cargo
  //    ("Agencia de marketing en Independiente"). Una persona suele abrir con
  //    su rol ("Director de...", "Fundador de...").
  if (/^(agencia|agency|estudio|studio)\b/.test(h)) {
    puntos += 1;
    razones.push("el headline arranca describiendo el negocio");
  }

  // 4. Una sola palabra, o dígitos/símbolos de marca ("3 Studio", "N&D").
  if (palabras.length === 1) {
    puntos += 1;
    razones.push("el nombre es una sola palabra");
  }
  if (/[0-9&.]/.test(n)) {
    puntos += 1;
    razones.push("el nombre trae números o símbolos");
  }

  // 5. Arranca con una palabra funcional ("y Punto", "de la Casa Creativa").
  //    Ningún nombre de pila es una conjunción o un artículo.
  if (/^(y|e|o|de|del|la|el|los|las|con)\s/.test(n)) {
    puntos += 1;
    razones.push("el nombre arranca con una palabra que no es un nombre de pila");
  }

  // 6. CamelCase pegado en el nombre original ("PepitoPerez"), típico de un
  //    handle o una marca. Se excluyen los prefijos de apellidos reales
  //    (McCarthy, MacLeod, DeLuca, O'Brien) para no marcar a una persona.
  const camel = nombre
    .split(/\s+/)
    .some(
      (p) =>
        p.length >= 8 &&
        /[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(p) &&
        !/^(mc|mac|de|di|van|von|le|o')/i.test(p),
    );
  if (camel) {
    puntos += 1;
    razones.push("el nombre viene pegado en CamelCase, como un usuario o una marca");
  }

  return {
    esEmpresa: puntos >= 2,
    motivo: puntos >= 2 ? razones.join("; ") : "",
  };
}

/** Atajo: solo el booleano. */
export const pareceEmpresa = (nombre: string, headline = ""): boolean =>
  analizarTipoPerfil(nombre, headline).esEmpresa;
