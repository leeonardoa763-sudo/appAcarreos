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

// ============================================
// NUEVAS VALIDACIONES PARA VALE DE MATERIAL
// ============================================

/**
 * Valida que se haya seleccionado un banco de material
 * @param {number} bancoId - ID del banco seleccionado
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateBancoId = (bancoId) => {
  if (!bancoId) {
    return "Debes seleccionar un banco de material";
  }
  return null;
};

/**
 * Valida la cantidad solicitada de material
 * @param {string} cantidad - Cantidad en m³
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateCantidadSolicitada = (cantidad) => {
  if (!cantidad) {
    return "La cantidad solicitada es requerida";
  }
  const numero = parseFloat(cantidad);
  if (isNaN(numero) || numero <= 0) {
    return "La cantidad debe ser mayor a 0";
  }
  return null;
};

/**
 * Valida que la distancia esté presente
 * @param {string} distancia - Distancia en Km
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateDistancia = (distancia) => {
  if (!distancia) {
    return "La distancia es requerida";
  }
  const numero = parseFloat(distancia);
  if (isNaN(numero) || numero <= 0) {
    return "La distancia debe ser mayor a 0";
  }
  return null;
};
