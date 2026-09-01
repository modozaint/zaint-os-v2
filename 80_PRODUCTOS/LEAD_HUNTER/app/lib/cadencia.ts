import type { ConfigCadencia } from "./types";

/**
 * Reparte `cantidad` envíos en el calendario respetando la cadencia:
 * solo en días activos, dentro del horario, un máximo por día y con un
 * espaciado IRREGULAR entre uno y otro (nunca ráfagas exactas).
 *
 * Devuelve un timestamp (ms) por cada envío, en orden. Es una función pura:
 * misma entrada → mismo tipo de salida (con algo de azar en el espaciado).
 */
export function programarEnvios(
  cantidad: number,
  config: ConfigCadencia,
  desde: number = Date.now(),
): number[] {
  const salidas: number[] = [];
  if (cantidad <= 0) return salidas;

  const diasOk = config.diasSemana.length ? config.diasSemana : [1, 2, 3, 4, 5];
  const rnd = (min: number, max: number) => min + Math.random() * (max - min);

  let cursor = new Date(desde);
  let enElDia = 0;

  // Empuja el cursor hasta el próximo hueco válido (día activo + dentro de hora
  // + sin exceder el tope diario).
  const irASlotValido = () => {
    for (let guard = 0; guard < 500; guard++) {
      const diaActivo = diasOk.includes(cursor.getDay());
      if (!diaActivo) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(config.horaInicio, 0, 0, 0);
        enElDia = 0;
        continue;
      }
      if (cursor.getHours() < config.horaInicio) {
        cursor.setHours(config.horaInicio, 0, 0, 0);
      }
      const seAcaboElDia =
        cursor.getHours() >= config.horaFin || enElDia >= config.maxPorDia;
      if (seAcaboElDia) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(config.horaInicio, 0, 0, 0);
        enElDia = 0;
        continue;
      }
      return; // hueco válido
    }
  };

  for (let i = 0; i < cantidad; i++) {
    irASlotValido();
    salidas.push(cursor.getTime());
    enElDia++;
    const gap = rnd(config.espaciadoMinMin, config.espaciadoMaxMin);
    cursor = new Date(cursor.getTime() + gap * 60_000);
  }
  return salidas;
}

/** ¿Cuántos días de calendario abarca un plan de N envíos con esta cadencia? */
export function diasQueTarda(cantidad: number, config: ConfigCadencia): number {
  if (cantidad <= 0) return 0;
  const porSemana = config.maxPorDia * (config.diasSemana.length || 5);
  if (porSemana <= 0) return 0;
  return Math.ceil(cantidad / porSemana) * 7;
}
