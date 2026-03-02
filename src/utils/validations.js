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

const TOLERANCIA_MINUTOS = 10;

/**
 * Valida que la hora de inicio no sea futura (con tolerancia de 10 min)
 * Usada al CREAR un vale de renta
 */
export const validateHoraInicioNoFutura = (hora) => {
  if (!hora) return "La hora de inicio es requerida";

  const ahora = new Date();

  const minutosHora = hora.getHours() * 60 + hora.getMinutes();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  // Tolerancia: 10 min hacia el futuro permitidos
  const limiteMaximo = minutosAhora + TOLERANCIA_MINUTOS;
  // Tolerancia: también permitir hasta 10 min en el pasado (margen de captura)
  const limiteMinimo = minutosAhora - TOLERANCIA_MINUTOS;

  console.log("[validateHoraInicioNoFutura] minutosHora:", minutosHora);
  console.log("[validateHoraInicioNoFutura] minutosAhora:", minutosAhora);
  console.log(
    "[validateHoraInicioNoFutura] limiteMinimo:",
    limiteMinimo,
    "limiteMaximo:",
    limiteMaximo,
  );

  if (minutosHora > limiteMaximo) {
    const horaLimiteH = Math.floor(limiteMaximo / 60) % 24;
    const horaLimiteM = limiteMaximo % 60;
    const ampm = horaLimiteH >= 12 ? "PM" : "AM";
    const displayH = horaLimiteH % 12 || 12;
    const displayM = horaLimiteM < 10 ? `0${horaLimiteM}` : horaLimiteM;
    return `La hora de inicio no puede ser futura. `;
  }

  if (minutosHora < limiteMinimo) {
    const horaLimiteH = Math.floor(limiteMinimo / 60) % 24;
    const horaLimiteM = limiteMinimo % 60;
    const ampm = horaLimiteH >= 12 ? "PM" : "AM";
    const displayH = horaLimiteH % 12 || 12;
    const displayM = horaLimiteM < 10 ? `0${horaLimiteM}` : horaLimiteM;
    return `La hora de inicio es muy antigua. `;
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
 * Valida que el vale se pueda completar (no debe ser del mismo día de creación)
 * Si se creó hoy, puede completarse. Si se creó otro día, está bloqueado.
 * @param {string} fechaCreacionISO - ISO string de fecha_creacion del vale
 * @returns {string | null} - Mensaje de error o null si es válido
 */
export const validateMismoDiaCreacion = (fechaCreacionISO) => {
  if (!fechaCreacionISO) return null;

  const fechaCreacion = new Date(fechaCreacionISO);
  const ahora = new Date();

  const mismoAnio = fechaCreacion.getFullYear() === ahora.getFullYear();
  const mismoMes = fechaCreacion.getMonth() === ahora.getMonth();
  const mismoDia = fechaCreacion.getDate() === ahora.getDate();

  if (!mismoAnio || !mismoMes || !mismoDia) {
    const fechaStr = fechaCreacion.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    return `Este vale fue creado el ${fechaStr} y ya no puede completarse. Si el trabajo se realizó, contacta al administrador.`;
  }

  return null;
};
