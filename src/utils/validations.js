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

export const validateCapacidadVsCantidad = (capacidad, cantidadSolicitada) => {
  const cap = parseFloat(capacidad);
  const cantidad = parseFloat(cantidadSolicitada);

  if (isNaN(cap) || isNaN(cantidad)) return null;

  if (cap < cantidad) {
    return `La capacidad del camión (${cap} m³) no puede ser menor a la cantidad solicitada (${cantidad} m³)`;
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

// ============================================
// VALIDACIONES DE TIEMPO PARA VALES
// ============================================

const TOLERANCIA_PASADO_MINUTOS = 60;
// Margen hacia adelante solo para absorber desfases de reloj del dispositivo
const TOLERANCIA_FUTURO_MINUTOS = 10;
// Horas que un vale de turno nocturno sigue siendo completable desde su inicio
const VENTANA_TURNO_NOCTURNO_HORAS = 12;

/**
 * Valida la hora de inicio al crear un vale de renta.
 * El vale se crea siempre al momento, así que la hora debe estar alrededor de
 * ahora: hasta 60 min atrás y hasta 10 min adelante.
 */
export const validateHoraInicioNoFutura = (hora) => {
  if (!hora) return "La hora de inicio es requerida";

  const diffMinutos = (hora.getTime() - Date.now()) / (1000 * 60);

  if (diffMinutos > TOLERANCIA_FUTURO_MINUTOS) {
    return "La hora de inicio no puede ser futura";
  }

  if (diffMinutos < -TOLERANCIA_PASADO_MINUTOS) {
    return `La hora de inicio no puede ser más de ${TOLERANCIA_PASADO_MINUTOS} minutos en el pasado`;
  }

  return null;
};

/**
 * Valida que el vehículo seleccionado tenga capacidad configurada
 */
export const validateCapacidadVehiculo = (vehiculo) => {
  if (!vehiculo) return null;
  if (!vehiculo.capacidad_m3) {
    return "El vehículo seleccionado no tiene capacidad configurada";
  }
  return null;
};

/**
 * Valida que la hora de fin sea anterior a la hora actual
 * Usada al COMPLETAR un vale de renta por horas
 */
export const validateHoraFinNoPosterior = (horaFin) => {
  if (!horaFin) return "La hora de fin es requerida";

  const ahora = new Date();
  if (horaFin > ahora) {
    return "La hora de fin no puede ser posterior a la hora actual";
  }

  return null;
};

/**
 * Valida que haya transcurrido el tiempo mínimo para renta por día o medio día
 * @param {string} horaInicioISO - ISO string de hora_inicio del vale
 * @param {"dia" | "medio_dia"} tipo
 * @returns {string | null} - Mensaje de error o null si es válido
 */
export const validateTiempoMinimoRenta = (horaInicioISO, tipo) => {
  if (!horaInicioISO) return "No se encontró la hora de inicio del vale";

  const horaInicio = new Date(horaInicioISO);
  const ahora = new Date();
  const diffHoras = (ahora - horaInicio) / (1000 * 60 * 60);

  if (tipo === "dia" && diffHoras < 8) {
    const horasRestantes = (8 - diffHoras).toFixed(1);
    return `Para renta por día completo deben haber transcurrido al menos 8 horas desde el inicio. Faltan ${horasRestantes} hrs.`;
  }

  if (tipo === "medio_dia" && diffHoras < 4) {
    const horasRestantes = (4 - diffHoras).toFixed(1);
    return `Para renta por medio día deben haber transcurrido al menos 4 horas desde el inicio. Faltan ${horasRestantes} hrs.`;
  }

  return null;
};

/**
 * Ventana de completado para vales de renta marcados como turno nocturno.
 *
 * Un turno nocturno cruza la medianoche, así que no puede regirse por una regla
 * de "mismo día". La única restricción es la duración: se permite completar
 * hasta 12 horas después de hora_inicio.
 *
 * Aplica SOLO cuando el detalle tiene es_turno_nocturno = true. Los vales de
 * renta normales no tienen restricción de fecha (se quitó en marzo 2026) y esta
 * función no debe usarse para reintroducirla.
 *
 * @param {string} horaInicioISO - hora_inicio del vale_renta_detalle
 * @returns {string | null} - Mensaje de bloqueo, o null si aún está en ventana
 */
export const validateVentanaTurnoNocturno = (horaInicioISO) => {
  if (!horaInicioISO) return null;

  const diffHoras = (Date.now() - new Date(horaInicioISO).getTime()) / 3600000;

  if (diffHoras > VENTANA_TURNO_NOCTURNO_HORAS) {
    return `Este vale de turno nocturno venció. Solo se permite completar dentro de las ${VENTANA_TURNO_NOCTURNO_HORAS} horas desde el inicio. Contacta al administrador.`;
  }

  return null;
};
