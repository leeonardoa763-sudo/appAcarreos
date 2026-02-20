/**
 * hooks/useValeMaterialForm.js
 *
 * Hook para manejar el estado y validaciones del formulario de vale de material
 * NOTA: La lógica de cálculo de distancia ahora está en ValeMaterialScreen
 */

import { useState } from "react";
import {
  validateOperadorId,
  validateVehiculoId,
  validateCapacidad,
  validateMaterialId,
  validateBancoId,
  validateSindicatoId,
  validateCantidadSolicitada,
  validateCapacidadVsCantidad,
  validateDistancia,
} from "../utils/validations";

export const useValeMaterialForm = (materiales = []) => {
  const [formData, setFormData] = useState({
    materialId: null,
    bancoId: null,
    sindicatoId: null,
    capacidad: "",
    cantidadSolicitada: "",
    distancia: "",
    selectedOperador: null,
    selectedVehiculo: null,
    notasAdicionales: "",
    requisicion: "",
  });

  const [errors, setErrors] = useState({});

  // Función: Validar formulario
  const validateForm = () => {
    console.log("[useValeMaterialForm] ✔️ Validando formulario...");
    const newErrors = {};

    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorBanco = validateBancoId(formData.bancoId);
    if (errorBanco) newErrors.bancoId = errorBanco;

    const errorCapacidad = validateCapacidad(formData.capacidad);
    if (errorCapacidad) newErrors.capacidad = errorCapacidad;

    const errorCantidad = validateCantidadSolicitada(
      formData.cantidadSolicitada,
    );
    if (errorCantidad) newErrors.cantidadSolicitada = errorCantidad;
    const errorCapacidadVsCantidad = validateCapacidadVsCantidad(
      formData.capacidad,
      formData.cantidadSolicitada,
    );
    if (errorCapacidadVsCantidad)
      newErrors.cantidadSolicitada = errorCapacidadVsCantidad;
    const errorDistancia = validateDistancia(formData.distancia);
    if (errorDistancia) newErrors.distancia = errorDistancia;

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

    const errorOperador = validateOperadorId(
      formData.selectedOperador?.id_operador,
    );
    if (errorOperador) newErrors.operadorId = errorOperador;

    const errorVehiculo = validateVehiculoId(
      formData.selectedVehiculo?.id_vehiculo,
    );
    if (errorVehiculo) newErrors.vehiculoId = errorVehiculo;

    // Validación requisición: Obligatoria solo para materiales tipo 1
    const materialSeleccionado = materiales.find(
      (m) => m.id_material === formData.materialId,
    );
    const esTipo1 = materialSeleccionado?.id_tipo_de_material === 1;

    if (esTipo1 && !formData.requisicion?.trim()) {
      newErrors.requisicion =
        "La requisición es obligatoria para este material";
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    console.log(
      "[useValeMaterialForm]",
      isValid ? "✅" : "❌",
      "Validación:",
      isValid,
    );

    return isValid;
  };

  // Función: Resetear formulario
  const resetForm = () => {
    console.log("[useValeMaterialForm] 🔄 Reseteando formulario");
    setFormData({
      materialId: null,
      bancoId: null,
      sindicatoId: null,
      capacidad: "",
      cantidadSolicitada: "",
      distancia: "",
      selectedOperador: null,
      selectedVehiculo: null,
      notasAdicionales: "",
      requisicion: "",
    });
    setErrors({});
  };

  return {
    formData,
    setFormData,
    errors,
    validateForm,
    resetForm,
  };
};
