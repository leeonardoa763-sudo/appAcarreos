// src/utils/formatters.js

/**
 * Formatea fecha a formato legible español
 * @param {string|Date} fecha - Fecha ISO o Date
 * @returns {string} - Formato: "15 Ene 2024"
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";

  const date = new Date(fecha);
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const año = date.getFullYear();

  return `${dia} ${mes} ${año}`;
};

/**
 * Formatea hora a formato 12h
 * @param {string|Date} fecha - Fecha ISO o Date
 * @returns {string} - Formato: "02:30 PM"
 */
export const formatearHora = (fecha) => {
  if (!fecha) return "N/A";

  const date = new Date(fecha);
  let horas = date.getHours();
  const minutos = date.getMinutes().toString().padStart(2, "0");
  const periodo = horas >= 12 ? "PM" : "AM";

  horas = horas % 12 || 12;

  return `${horas}:${minutos} ${periodo}`;
};
