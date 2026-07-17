/**
 * Jornada laboral: 8:00 AM a 3:00 AM del día siguiente.
 * Timestamps entre medianoche y 2:59 AM se atribuyen a la jornada del día anterior.
 */

/**
 * Fecha (a medianoche local) del día de jornada al que pertenece un timestamp.
 */
function getFechaJornada(fecha) {
  const f = new Date(fecha);
  if (f.getHours() < 3) {
    f.setDate(f.getDate() - 1);
  }
  f.setHours(0, 0, 0, 0);
  return f;
}

/**
 * Devuelve true si la fecha dada pertenece a una jornada en la que aún se
 * puede registrar viajes.
 *
 * - Vale normal: solo su misma jornada laboral.
 * - Vale programado (esProgramado): su jornada y la jornada siguiente (máximo
 *   un día de diferencia). Pensado para vales creados el día anterior cuando el
 *   camión llega directo al banco en lugar de pasar primero por la obra.
 */
export function esDentroJornada(fechaCreacion, esProgramado = false) {
  if (!fechaCreacion) return true;
  const jVale = getFechaJornada(fechaCreacion);
  const jHoy = getFechaJornada(new Date());
  const diffDias = Math.round((jHoy - jVale) / 86400000);
  if (diffDias === 0) return true;
  if (esProgramado && diffDias === 1) return true;
  return false;
}

/**
 * Texto de la etiqueta de un vale programado, relativo a la jornada actual.
 * El día en que se crea apunta a mañana; en la jornada siguiente ese mismo vale
 * ya es el de hoy. Fuera de esas dos jornadas se queda en la forma neutral,
 * porque "mañana"/"hoy" ya no significan nada para un vale viejo o completado.
 */
export function etiquetaProgramado(fechaCreacion) {
  if (!fechaCreacion) return "Programado";
  const jVale = getFechaJornada(fechaCreacion);
  const jHoy = getFechaJornada(new Date());
  const diffDias = Math.round((jHoy - jVale) / 86400000);
  if (diffDias === 0) return "Programado para mañana";
  if (diffDias === 1) return "Programado para hoy";
  return "Programado";
}
