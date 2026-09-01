/**
 * Ciudades por país para el filtro de ubicación de la búsqueda combinada
 * (FuentesView). Antes "Ciudad" era texto libre — cualquiera podía escribir
 * "Medellin" sin tilde o "bogota" y el actor de Apify buscaba mal. Con una
 * lista curada de las plazas más grandes de cada país, el dato siempre está
 * bien escrito y el usuario no tiene que adivinar cómo se llama la ciudad
 * para LinkedIn/Maps.
 *
 * No es exhaustivo (sería una base de datos completa de geografía) — son las
 * ~12 ciudades de mayor actividad económica de cada país, que es donde vive
 * la inmensa mayoría de los negocios que se buscan acá. Si el usuario necesita
 * una ciudad más chica, "Departamento / Provincia (opcional)" cubre ese caso
 * sin tener que mantener miles de municipios.
 */
export const CIUDADES_POR_PAIS: Record<string, string[]> = {
  Colombia: [
    "Bogotá",
    "Medellín",
    "Cali",
    "Barranquilla",
    "Cartagena",
    "Bucaramanga",
    "Pereira",
    "Santa Marta",
    "Manizales",
    "Cúcuta",
    "Ibagué",
    "Villavicencio",
  ],
  México: [
    "Ciudad de México",
    "Guadalajara",
    "Monterrey",
    "Puebla",
    "Tijuana",
    "León",
    "Querétaro",
    "Mérida",
    "Cancún",
    "Toluca",
    "San Luis Potosí",
  ],
  Argentina: [
    "Buenos Aires",
    "Córdoba",
    "Rosario",
    "Mendoza",
    "La Plata",
    "San Miguel de Tucumán",
    "Mar del Plata",
    "Salta",
    "Santa Fe",
    "Neuquén",
  ],
  Chile: [
    "Santiago",
    "Valparaíso",
    "Concepción",
    "La Serena",
    "Antofagasta",
    "Temuco",
    "Rancagua",
    "Viña del Mar",
  ],
  Perú: [
    "Lima",
    "Arequipa",
    "Trujillo",
    "Chiclayo",
    "Piura",
    "Cusco",
    "Huancayo",
    "Iquitos",
  ],
  Ecuador: ["Quito", "Guayaquil", "Cuenca", "Manta", "Ambato", "Loja"],
  España: [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Sevilla",
    "Bilbao",
    "Málaga",
    "Zaragoza",
    "Murcia",
    "Alicante",
  ],
  "United States": [
    "Miami",
    "New York",
    "Los Angeles",
    "Houston",
    "Chicago",
    "Dallas",
    "Orlando",
    "Austin",
    "San Francisco",
    "Atlanta",
    "Phoenix",
    "Boston",
  ],
};

/** Ciudades del país elegido, o vacío si no hay lista curada para ese país. */
export function ciudadesDe(pais: string): string[] {
  return CIUDADES_POR_PAIS[pais] ?? [];
}
