/**
 * Jornada laboral: 8:00 AM a 3:00 AM del día siguiente.
 * Timestamps entre medianoche y 2:59 AM se atribuyen a la jornada del día anterior.
 */

const DIA_SABADO = 6;

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
 * Cuántas jornadas de diferencia admite un vale programado a partir de su
 * jornada de creación. Normalmente 1 (para mañana); si la jornada de creación
 * cae en sábado se extiende a 2 (para el lunes), porque no se trabaja en
 * domingo y el vale creado el sábado debe seguir aceptando viajes el lunes.
 */
export function diasPermitidosProgramado(fechaCreacion) {
  return getFechaJornada(fechaCreacion).getDay() === DIA_SABADO ? 2 : 1;
}

/**
 * Devuelve true si la fecha dada pertenece a una jornada en la que aún se
 * puede registrar viajes.
 *
 * - Vale normal: solo su misma jornada laboral.
 * - Vale programado (esProgramado): su jornada y hasta la(s) jornada(s)
 *   siguiente(s) admitidas (ver diasPermitidosProgramado). Pensado para vales
 *   creados el día anterior cuando el camión llega directo al banco en lugar
 *   de pasar primero por la obra.
 */
export function esDentroJornada(fechaCreacion, esProgramado = false) {
  if (!fechaCreacion) return true;
  const jVale = getFechaJornada(fechaCreacion);
  const jHoy = getFechaJornada(new Date());
  const diffDias = Math.round((jHoy - jVale) / 86400000);
  if (diffDias === 0) return true;
  if (
    esProgramado &&
    diffDias >= 1 &&
    diffDias <= diasPermitidosProgramado(fechaCreacion)
  ) {
    return true;
  }
  return false;
}

/**
 * Texto de la etiqueta de un vale programado, relativo a la jornada actual.
 * El día en que se crea apunta al día objetivo (mañana, o el lunes si se creó
 * en sábado); en la última jornada admitida ese mismo vale ya es el de hoy.
 * Fuera de esas jornadas se queda en la forma neutral, porque "mañana"/"hoy"
 * ya no significan nada para un vale viejo o completado.
 */
export function etiquetaProgramado(fechaCreacion) {
  if (!fechaCreacion) return "Programado";
  const jVale = getFechaJornada(fechaCreacion);
  const jHoy = getFechaJornada(new Date());
  const diffDias = Math.round((jHoy - jVale) / 86400000);
  const maxDias = diasPermitidosProgramado(fechaCreacion);

  if (diffDias === maxDias) return "Programado para hoy";
  if (diffDias === 0) {
    return maxDias === 2 ? "Programado para el lunes" : "Programado para mañana";
  }
  if (diffDias > 0 && diffDias < maxDias) return "Programado para el lunes";
  return "Programado";
}
