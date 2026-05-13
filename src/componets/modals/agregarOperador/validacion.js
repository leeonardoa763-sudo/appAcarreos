export const validarFormulario = (form) => {
  const errores = {};

  if (!form.nombre.trim()) {
    errores.nombre = "El nombre es obligatorio";
  }
  if (!form.primerApellido.trim()) {
    errores.primerApellido = "El primer apellido es obligatorio";
  }
  if (!form.sindicatoId) {
    errores.sindicatoId = "Selecciona un sindicato";
  }

  const placasLimpias = form.placas.trim().toUpperCase();
  if (!placasLimpias) {
    errores.placas = "Las placas son obligatorias";
  } else if (placasLimpias.length < 6 || placasLimpias.length > 10) {
    errores.placas = "Las placas deben tener entre 6 y 10 caracteres";
  }

  if (!form.capacidad.trim()) {
    errores.capacidad = "La capacidad es obligatoria";
  } else if (
    isNaN(parseFloat(form.capacidad)) ||
    parseFloat(form.capacidad) <= 0
  ) {
    errores.capacidad = "Ingresa una capacidad válida mayor a 0";
  }

  return errores;
};

export const generarQrUid = (placas) => {
  const placasLimpias = placas.replace(/[^A-Z0-9]/g, "");
  const timestamp = Date.now().toString(36).toUpperCase();
  return `VH-${placasLimpias}-${timestamp}`;
};
