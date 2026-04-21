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

const TOLERANCIA_MINUTOS = 60;

/**
 * Valida la hora de inicio al crear un vale de renta.
 * - Si la fecha es futura (mañana o después): válido sin restricción de hora
 * - Si la fecha es hoy: no puede exceder 10 min al futuro ni ser muy antigua
 * - Si la fecha es pasada: siempre inválido
 */
export const validateHoraInicioNoFutura = (hora) => {
  if (!hora) return "La hora de inicio es requerida";

  const ahora = new Date();

  const fechaHora = new Date(
    hora.getFullYear(),
    hora.getMonth(),
    hora.getDate(),
  );
  const fechaHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  );
  const diffDias = Math.round((fechaHora - fechaHoy) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "No puedes crear vales con fecha pasada";
  if (diffDias > 0) return null;

  const minutosHora = hora.getHours() * 60 + hora.getMinutes();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  if (minutosHora < minutosAhora - TOLERANCIA_MINUTOS) {
    return "La hora de inicio no puede ser más de 60 minutos en el pasado";
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
 * Valida que el vale se pueda completar según su fecha operacional.
 *
 * Para RENTA: fechaCreacionISO = hora_inicio del detalle
 * Para MATERIAL: fechaCreacionISO = fecha_programada ?? fecha_creacion
 *
 * Turno normal:
 * - Si la fecha operacional es hoy: puede completarse
 * - Si es futura: no puede completarse aún
 * - Si fue ayer o antes: no puede completarse
 *
 * Turno nocturno:
 * - Se permite completar hasta 12 horas después de hora_inicio,
 *   aunque haya cruzado medianoche al día siguiente
 */
export const validateMismoDiaCreacion = (
  fechaCreacionISO,
  esTurnoNocturno = false,
) => {
  if (!fechaCreacionISO) return null;

  const fechaInicio = new Date(fechaCreacionISO);
  const ahora = new Date();

  // --- Lógica turno nocturno (solo renta) ---
  if (esTurnoNocturno) {
    const diffHoras = (ahora - fechaInicio) / (1000 * 60 * 60);

    if (diffHoras < 0) {
      const fechaStr = fechaInicio.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      return `Este vale está programado para el ${fechaStr} y aún no puede completarse.`;
    }

    if (diffHoras > 12) {
      return `Este vale de turno nocturno venció. Solo se permite completar dentro de las 12 horas desde el inicio. Contacta al administrador.`;
    }

    return null;
  }

  // --- Lógica turno normal ---
  // Para material: fechaCreacionISO puede ser un DATE (solo fecha, sin hora).
  // Construimos la fecha de referencia ignorando la hora para comparación por día.
  const inicioSoloFecha = new Date(
    fechaInicio.getFullYear(),
    fechaInicio.getMonth(),
    fechaInicio.getDate(),
  );
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  const diffDias = Math.round((inicioSoloFecha - hoy) / (1000 * 60 * 60 * 24));

  if (diffDias > 0) {
    const fechaStr = fechaInicio.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    return `Este vale está programado para el ${fechaStr} y aún no puede completarse.`;
  }

  if (diffDias < 0) {
    const fechaStr = fechaInicio.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    return `Este vale fue programado para el ${fechaStr} y ya no puede completarse. Si el trabajo se realizó, contacta al administrador.`;
  }

  return null;
};
