import { CUARTO } from './cuarto'
import { TALLER } from './taller'
import { OFICINA } from './oficina'
import type { Habitacion } from '../motor'

/**
 * LA CASA. Añadir una habitación es añadir una línea aquí y un archivo de
 * datos al lado — nunca tocar el motor. Ese es el criterio con el que se
 * juzga esta arquitectura.
 */
export const HABITACIONES: Habitacion[] = [CUARTO, TALLER, OFICINA]
export const ENTRADA = CUARTO.id
