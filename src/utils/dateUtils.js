/**
 * utils/dateUtils.js
 *
 * UTILIDADES PARA MANEJO DE FECHAS Y SEMANAS
 *
 * CONTIENE:
 * - Cálculo de número de semana ISO 8601
 * - Rango de fechas por semana
 * - Formateo de fechas para CSV
 * - Generación de opciones de semanas con vales
 *
 * USADO EN:
 * - InformesScreen
 * - useValesExport hook
 */

/**
 * Obtiene el número de semana ISO 8601 de una fecha
 * La semana 1 es la primera semana que contiene un jueves del año
 *
 * @param {Date} date - Fecha a evaluar
 * @returns {number} - Número de semana (1-53)
 */
export const getWeekNumber = (date) => {
  const targetDate = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;

  targetDate.setDate(targetDate.getDate() - dayNumber + 3);

  const firstThursday = new Date(targetDate.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((targetDate - firstThursday) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7
    );

  return weekNumber;
};

/**
 * Obtiene el año correspondiente a una semana ISO
 * (una semana puede pertenecer al año anterior o siguiente)
 *
 * @param {Date} date - Fecha a evaluar
 * @returns {number} - Año ISO de la semana
 */
export const getWeekYear = (date) => {
  const targetDate = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;

  targetDate.setDate(targetDate.getDate() - dayNumber + 3);

  return targetDate.getFullYear();
};

/**
 * Obtiene el rango de fechas (inicio y fin) de una semana específica
 *
 * @param {number} weekNumber - Número de semana (1-53)
 * @param {number} year - Año
 * @returns {Object} - { startDate: Date, endDate: Date }
 */
export const getWeekDateRange = (weekNumber, year) => {
  // Encontrar el primer jueves del año
  const jan4 = new Date(year, 0, 4);
  const firstThursday = new Date(jan4);
  firstThursday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + 3);

  // Calcular el lunes de la semana objetivo
  const targetMonday = new Date(firstThursday);
  targetMonday.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);

  // Calcular el domingo de la semana objetivo
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);

  // Establecer horas para cubrir todo el día
  const startDate = new Date(targetMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetSunday);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Formatea una fecha para mostrar en la UI
 *
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada (DD/MM/YYYY HH:mm)
 */
export const formatDateForDisplay = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formatea una fecha solo con día/mes/año
 *
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada (DD/MM/YYYY)
 */
export const formatDateOnly = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formatea fecha con hora para CSV
 *
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada (DD/MM/YYYY HH:mm)
 */
export const formatDateTimeForCSV = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formatea una fecha para CSV (ISO 8601)
 *
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha en formato ISO
 */
export const formatDateForCSV = (date) => {
  if (!date) return "";

  const d = new Date(date);
  return d.toISOString();
};

/**
 * Genera un array con todas las semanas del año actual
 * Útil para picker de semanas
 *
 * @returns {Array} - Array de objetos { label: "Semana 1", id: 1 }
 * Nota: Usa 'id' para compatibilidad con FormPicker
 */
export const getWeeksOfYear = () => {
  const currentYear = new Date().getFullYear();
  const weeks = [];

  // Determinar cuántas semanas tiene el año (52 o 53)
  const lastDayOfYear = new Date(currentYear, 11, 31);
  const maxWeeks = getWeekNumber(lastDayOfYear);

  for (let i = 1; i <= maxWeeks; i++) {
    weeks.push({
      id: i,
      label: `Semana ${i}`,
    });
  }

  return weeks;
};

/**
 * NUEVA: Obtiene semanas únicas de un array de vales
 * Útil para mostrar solo semanas que tienen vales
 *
 * @param {Array} vales - Array de vales con fecha_creacion
 * @returns {Array} - Array de objetos { id: weekNumber, label: "Semana X (DD/MM - DD/MM)" }
 */
export const getWeeksFromVales = (vales) => {
  if (!vales || vales.length === 0) return [];

  // Obtener semanas únicas
  const weeksSet = new Set();
  vales.forEach((vale) => {
    const weekNum = getWeekNumber(new Date(vale.fecha_creacion));
    weeksSet.add(weekNum);
  });

  // Convertir a array y ordenar
  const weeksArray = Array.from(weeksSet).sort((a, b) => b - a);

  // Generar objetos con rango de fechas
  const currentYear = getCurrentYear();
  return weeksArray.map((weekNum) => {
    const { startDate, endDate } = getWeekDateRange(weekNum, currentYear);
    const startStr = formatDateOnly(startDate);
    const endStr = formatDateOnly(endDate);

    return {
      id: weekNum,
      label: `Semana ${weekNum} (${startStr} - ${endStr})`,
    };
  });
};

/**
 * Obtiene la semana actual
 *
 * @returns {number} - Número de semana actual
 */
export const getCurrentWeek = () => {
  return getWeekNumber(new Date());
};

/**
 * Obtiene el año actual
 *
 * @returns {number} - Año actual
 */
export const getCurrentYear = () => {
  return new Date().getFullYear();
};
