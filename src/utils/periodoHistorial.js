/**
 * utils/periodoHistorial.js
 *
 * Traduce el selector de periodo del historial de vales a un rango de fechas.
 *
 * Todo se construye con el constructor local new Date(anio, mes, dia, ...).
 * new Date("YYYY-MM-DD") se parsea como medianoche UTC y en Mexico (UTC-6) cae
 * el dia anterior, asi que un vale del dia 1 quedaria fuera del rango.
 *
 * USADO EN:
 * - HistorialValesScreen (arma los filtros)
 * - FiltrosHistorial (pinta las opciones de mes)
 */

export const MODO_PERIODO = {
  TODOS: "todos",
  MES: "mes",
  RANGO: "rango",
};

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Id del mes en curso, en el formato "YYYY-MM" que usan las opciones. */
export const mesActualId = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
};

/** Ultimos N meses, del mas reciente al mas antiguo. id = "YYYY-MM". */
export const opcionesDeMes = (cantidad = 24) => {
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();
    return {
      id: `${anio}-${String(mes + 1).padStart(2, "0")}`,
      label: `${MESES[mes]} ${anio}`,
    };
  });
};

/** Inicio del dia (00:00:00.000) en hora local. */
const inicioDelDia = (fecha) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);

/** Fin del dia (23:59:59.999) en hora local. */
const finDelDia = (fecha) =>
  new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
    23,
    59,
    59,
    999,
  );

/**
 * @param {{modoPeriodo: string, mes: string, fechaDesde: Date|null, fechaHasta: Date|null}} filtros
 * @returns {{fechaDesde: Date|null, fechaHasta: Date|null}} null = sin limite
 */
export const construirRangoFechas = (filtros) => {
  if (filtros.modoPeriodo === MODO_PERIODO.MES && filtros.mes) {
    const [anio, mes] = filtros.mes.split("-").map(Number);
    return {
      fechaDesde: new Date(anio, mes - 1, 1, 0, 0, 0, 0),
      // El dia 0 del mes siguiente es el ultimo dia del mes pedido
      fechaHasta: new Date(anio, mes, 0, 23, 59, 59, 999),
    };
  }

  if (filtros.modoPeriodo === MODO_PERIODO.RANGO) {
    return {
      fechaDesde: filtros.fechaDesde ? inicioDelDia(filtros.fechaDesde) : null,
      fechaHasta: filtros.fechaHasta ? finDelDia(filtros.fechaHasta) : null,
    };
  }

  return { fechaDesde: null, fechaHasta: null };
};
