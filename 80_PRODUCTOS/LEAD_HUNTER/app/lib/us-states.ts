/**
 * Los 50 estados de EE.UU. El `value` es lo que se manda al actor de Apify
 * como filtro de `locations`, por eso lleva ", United States" — así es como
 * LinkedIn nombra las regiones.
 */
export const TODO_EEUU = "United States";

/**
 * Países disponibles para el filtro de ubicación. Priorizamos habla hispana
 * (recomendación del desafío Nexum) + EE.UU. El `value` es el nombre en el
 * idioma con que LinkedIn nombra el país en su geo — por eso van en inglés
 * los que LinkedIn muestra así ("United States"), y en español los demás.
 */
export const PAISES: string[] = [
  "Colombia",
  "México",
  "Argentina",
  "Chile",
  "Perú",
  "Ecuador",
  "España",
  "United States",
];

/** País por defecto: la demo del desafío apunta a ecommerce en Colombia. */
export const PAIS_DEFAULT = "Colombia";

export const US_STATES: string[] = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

/**
 * Departamentos / provincias / estados por país, tal como LinkedIn nombra sus
 * regiones. Es el filtro `region` del buscador. `""` (o ausente) = todo el país.
 * Fuente: divisiones administrativas oficiales de cada país.
 */
export const REGIONES_POR_PAIS: Record<string, string[]> = {
  Colombia: [
    "Bogotá, D.C.", "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar",
    "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
    "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
    "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
    "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
    "Valle del Cauca", "Vaupés", "Vichada",
  ],
  México: [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
    "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
    "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
  ],
  Argentina: [
    "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco",
    "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
    "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
    "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  ],
  Chile: [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Región Metropolitana de Santiago", "O'Higgins", "Maule",
    "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén",
    "Magallanes",
  ],
  Perú: [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
    "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad",
    "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco",
    "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
  ],
  Ecuador: [
    "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro",
    "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos",
    "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha",
    "Santa Elena", "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua",
    "Zamora Chinchipe",
  ],
  España: [
    "Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias",
    "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña",
    "Comunidad Valenciana", "Extremadura", "Galicia", "La Rioja", "Madrid",
    "Murcia", "Navarra", "País Vasco",
  ],
  [TODO_EEUU]: US_STATES,
};

/** Regiones disponibles para un país (vacío si no lo tenemos mapeado). */
export function regionesDe(country: string): string[] {
  return REGIONES_POR_PAIS[country] ?? [];
}

/**
 * Cómo se le pasan las ubicaciones al actor, según cómo LinkedIn nombra las
 * geos: "Bogotá, Colombia" · "Antioquia, Colombia" · "Texas, United States".
 *
 * - Varias provincias → cada una va SUELTA como su propia ubicación (el actor
 *   acepta un array de `locations`), así se busca en todas a la vez.
 * - Una sola provincia + ciudad → se combinan de lo específico a lo general.
 * - Sin provincia → todo el país.
 */
export function ubicacionParaApify(
  country: string,
  regiones: string[],
  city: string,
): string[] {
  const pais = country.trim() || TODO_EEUU;
  const regs = (regiones ?? []).map((r) => r.trim()).filter(Boolean);
  const ciudad = city.trim();

  if (regs.length > 1) {
    return regs.map((r) => `${r}, ${pais}`);
  }
  const reg = regs[0] ?? "";
  if (ciudad) {
    return [[ciudad, reg, pais].filter(Boolean).join(", ")];
  }
  if (reg) {
    return [`${reg}, ${pais}`];
  }
  return [pais];
}
