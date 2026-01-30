/**
 * hooks/useValeMaterialForm.js
 *
 * Hook para manejar el estado y validaciones del formulario de vale de material
 */

import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import {
  validateOperadorId,
  validateVehiculoId,
  validateCapacidad,
  validateMaterialId,
  validateBancoId,
  validateSindicatoId,
  validateCantidadSolicitada,
  validateDistancia,
} from "../utils/validations";

export const useValeMaterialForm = (obraData, materiales = []) => {
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

  // Efecto: Calcular distancia cuando se selecciona banco
  useEffect(() => {
    const fetchDistancia = async () => {
      if (!formData.bancoId || !obraData?.id_obra) {
        setFormData((prev) => ({ ...prev, distancia: "" }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from("distancias_banco_obra")
          .select("distancia_km")
          .eq("id_banco", formData.bancoId)
          .eq("id_obra", obraData.id_obra)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFormData((prev) => ({
            ...prev,
            distancia: data.distancia_km.toString(),
          }));
        } else {
          setFormData((prev) => ({ ...prev, distancia: "" }));
          Alert.alert(
            "Distancia no configurada",
            "No hay una distancia registrada para este banco y obra. Contacta al administrador.",
          );
        }
      } catch (error) {
        console.error(
          "[useValeMaterialForm] Error consultando distancia:",
          error,
        );
        Alert.alert("Error", "No se pudo obtener la distancia");
      }
    };

    fetchDistancia();
  }, [formData.bancoId, obraData?.id_obra]);

  // Función: Validar formulario
  const validateForm = () => {
    console.log("[useValeMaterialForm] Validando formulario...");
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

    // ✅ VALIDACIÓN REQUISICIÓN: Obligatoria solo para materiales tipo 1
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

  // Función: Resetear formulario
  const resetForm = () => {
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
