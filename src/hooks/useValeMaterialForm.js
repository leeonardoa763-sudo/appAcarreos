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
  validateCapacidadVehiculo,
  validateMaterialId,
  validateBancoId,
  validateSindicatoId,
  validateDistancia,
  validateCantidadSolicitada,
} from "../utils/validations";
export const useValeMaterialForm = (materiales = [], modoAsfaltico = false) => {
  const [formData, setFormData] = useState({
    materialId: null,
    bancoId: null,
    sindicatoId: null,
    capacidad: "",
    cantidadMaterial: "",
    distancia: "",
    selectedOperador: null,
    selectedVehiculo: null,
    vehiculoPlacas: "",
    notasAdicionales: "",
    requisicion: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = (
    _unused = false,
    completarDespues = false,
  ) => {
    const newErrors = {};

    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorBanco = validateBancoId(formData.bancoId);
    if (errorBanco) newErrors.bancoId = errorBanco;

    const errorDistancia = validateDistancia(formData.distancia);
    if (errorDistancia) newErrors.distancia = errorDistancia;

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

    // Validaciones adicionales para modo asfaltico
    if (modoAsfaltico) {
      const errorCantidad = validateCantidadSolicitada(formData.cantidadMaterial);
      if (errorCantidad) newErrors.cantidadMaterial = errorCantidad;

      const errorOperador = validateOperadorId(
        formData.selectedOperador?.id_operador,
      );
      if (errorOperador) newErrors.operadorId = errorOperador;

      const errorVehiculo = validateVehiculoId(
        formData.selectedVehiculo?.id_vehiculo,
      );
      if (errorVehiculo) newErrors.vehiculoId = errorVehiculo;

      const errorCapacidadVehiculo = validateCapacidadVehiculo(
        formData.selectedVehiculo,
      );
      if (errorCapacidadVehiculo) newErrors.vehiculoId = errorCapacidadVehiculo;
    } else {
      // Solo validar operador, vehículo y capacidad si NO se va a completar después
      if (!completarDespues) {
        const errorCapacidad = validateCapacidad(formData.capacidad);
        if (errorCapacidad) newErrors.capacidad = errorCapacidad;

        const errorOperador = validateOperadorId(
          formData.selectedOperador?.id_operador,
        );
        if (errorOperador) newErrors.operadorId = errorOperador;

        const errorVehiculo = validateVehiculoId(
          formData.selectedVehiculo?.id_vehiculo,
        );
        if (errorVehiculo) newErrors.vehiculoId = errorVehiculo;

        const errorCapacidadVehiculo = validateCapacidadVehiculo(
          formData.selectedVehiculo,
        );
        if (errorCapacidadVehiculo) newErrors.vehiculoId = errorCapacidadVehiculo;
      }
    }

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
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      materialId: null,
      bancoId: null,
      sindicatoId: null,
      capacidad: "",
      cantidadMaterial: "",
      distancia: "",
      selectedOperador: null,
      selectedVehiculo: null,
      vehiculoPlacas: "",
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
