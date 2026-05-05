/**
 * Jornada laboral: 8:00 AM a 3:00 AM del día siguiente.
 * Timestamps entre medianoche y 2:59 AM se atribuyen a la jornada del día anterior.
 */

function getDiaJornada(fecha) {
  const f = new Date(fecha);
  if (f.getHours() < 3) {
    f.setDate(f.getDate() - 1);
  }
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

/**
 * Devuelve true si la fecha dada pertenece a la misma jornada laboral que ahora.
 */
export function esDentroJornada(fechaCreacion) {
  if (!fechaCreacion) return true;
  const diaVale = getDiaJornada(new Date(fechaCreacion));
  const diaHoy = getDiaJornada(new Date());
  return diaVale === diaHoy;
}
