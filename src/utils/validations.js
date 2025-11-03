/**
 * utils/validations.js
 *
 * Funciones de validación reutilizables
 *
 * PROPÓSITO:
 * - Centralizar validaciones comunes
 * - Reutilizable en todos los formularios
 * - Mensajes de error consistentes
 */

export const validateOperadorNombre = (nombre) => {
  if (!nombre || !nombre.trim()) {
    return "El nombre del operador es requerido";
  }
  if (nombre.trim().length < 3) {
    return "El nombre debe tener al menos 3 caracteres";
  }
  return null;
};

export const validatePlacas = (placas) => {
  if (!placas || !placas.trim()) {
    return "Las placas del vehículo son requeridas";
  }
  if (placas.length < 5) {
    return "Las placas deben tener al menos 5 caracteres";
  }
  return null;
};

export const validateCapacidad = (capacidad) => {
  if (!capacidad) {
    return "La capacidad es requerida";
  }
  const numero = parseFloat(capacidad);
  if (isNaN(numero) || numero <= 0) {
    return "La capacidad debe ser mayor a 0";
  }
  return null;
};

export const validateHoraInicio = (hora) => {
  if (!hora) {
    return "La hora de inicio es requerida";
  }
  return null;
};

export const validateMaterialId = (materialId) => {
  if (!materialId) {
    return "Debes seleccionar un material";
  }
  return null;
};

export const validateSindicatoId = (sindicatoId) => {
  if (!sindicatoId) {
    return "Debes seleccionar un sindicato";
  }
  return null;
};
