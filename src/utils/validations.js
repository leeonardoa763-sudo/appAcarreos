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

// ============================================
// VALIDACIONES COMUNES (Renta y Material)
// ============================================

/**
 * Validar que se haya seleccionado un operador
 */
export const validateOperadorId = (operadorId) => {
  if (!operadorId) {
    return "Debes seleccionar un operador";
  }
  return null;
};

/**
 * Validar que se haya seleccionado un vehículo
 */
export const validateVehiculoId = (vehiculoId) => {
  if (!vehiculoId) {
    return "Debes seleccionar un vehículo";
  }
  return null;
};

/**
 * Valida la capacidad del vehículo (en m³)
 */
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

/**
 * Valida que se haya seleccionado un material
 */
export const validateMaterialId = (materialId) => {
  if (!materialId) {
    return "Debes seleccionar un material";
  }
  return null;
};

// ============================================
// VALIDACIONES ESPECÍFICAS PARA RENTA
// ============================================

/**
 * Valida la hora de inicio
 */
export const validateHoraInicio = (hora) => {
  if (!hora) {
    return "La hora de inicio es requerida";
  }
  return null;
};

/**
 * Valida que se haya seleccionado un sindicato
 */
export const validateSindicatoId = (sindicatoId) => {
  if (!sindicatoId) {
    return "Debes seleccionar un sindicato";
  }
  return null;
};

// ============================================
// VALIDACIONES ESPECÍFICAS PARA MATERIAL
// ============================================

/**
 * Valida que se haya seleccionado un banco de material
 */
export const validateBancoId = (bancoId) => {
  if (!bancoId) {
    return "Debes seleccionar un banco de material";
  }
  return null;
};

/**
 * Valida la cantidad solicitada de material (en m³)
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
 * Valida que la distancia esté presente (en Km)
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
