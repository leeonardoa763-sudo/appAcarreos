/**
 * hooks/useValeMaterialForm.js
 *
 * Hook para manejar el estado y validaciones del formulario de vale de material
 */

import { useState, useEffect, useCallback, useRef } from "react";
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

export const useValeMaterialForm = (
  materiales = [],
  obraSeleccionadaId = null,
  obras = [],
) => {
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

  // ✅ useRef para trackear el valor actual de obraId
  const obraIdRef = useRef(obraSeleccionadaId);

  // ✅ Actualizar ref cuando cambia el parámetro
  useEffect(() => {
    console.log(
      "[useValeMaterialForm] 📌 Actualizando obraIdRef:",
      obraSeleccionadaId,
    );
    obraIdRef.current = obraSeleccionadaId;
  }, [obraSeleccionadaId]);

  // ✅ FUNCIÓN para calcular distancia
  const calcularDistancia = useCallback(async (bancoId, obraId) => {
    console.log("[useValeMaterialForm] 🔍 calcularDistancia llamada");
    console.log("[useValeMaterialForm] 📍 Banco ID:", bancoId);
    console.log("[useValeMaterialForm] 🏗️ Obra ID:", obraId);

    // Validar que existan ambos IDs
    if (!bancoId || !obraId) {
      console.log("[useValeMaterialForm] ⚠️ Faltan datos (banco o obra)");
      return null;
    }

    try {
      console.log("[useValeMaterialForm] 🔎 Query: distancias_banco_obra");
      console.log("[useValeMaterialForm]    WHERE id_banco =", bancoId);
      console.log("[useValeMaterialForm]    AND id_obra =", obraId);

      const { data, error } = await supabase
        .from("distancias_banco_obra")
        .select("distancia_km")
        .eq("id_banco", bancoId)
        .eq("id_obra", obraId)
        .maybeSingle();

      if (error) {
        console.error("[useValeMaterialForm] ❌ Error en query:", error);
        throw error;
      }

      console.log(
        "[useValeMaterialForm] 📊 Resultado query:",
        JSON.stringify(data),
      );

      if (
        data &&
        data.distancia_km !== null &&
        data.distancia_km !== undefined
      ) {
        const distanciaStr = data.distancia_km.toString();
        console.log(
          "[useValeMaterialForm] ✅ Distancia encontrada:",
          distanciaStr,
          "km",
        );
        return distanciaStr;
      } else {
        console.log(
          "[useValeMaterialForm] ⚠️ No se encontró distancia registrada",
        );
        return null;
      }
    } catch (error) {
      console.error(
        "[useValeMaterialForm] 💥 Error consultando distancia:",
        error,
      );
      return null;
    }
  }, []);

  // ✅ EFECTO: Calcular distancia cuando cambia banco u obra
  useEffect(() => {
    console.log("[useValeMaterialForm] 🔄 useEffect disparado");
    console.log("[useValeMaterialForm] Estado - bancoId:", formData.bancoId);
    console.log("[useValeMaterialForm] Ref - obraId:", obraIdRef.current);

    const fetchDistancia = async () => {
      // ✅ Usar el ref en lugar del parámetro
      const obraActual = obraIdRef.current;
      const distancia = await calcularDistancia(formData.bancoId, obraActual);

      if (distancia !== null) {
        console.log(
          "[useValeMaterialForm] ✅ Actualizando distancia a:",
          distancia,
        );
        setFormData((prev) => ({
          ...prev,
          distancia: distancia,
        }));
      } else {
        console.log("[useValeMaterialForm] ❌ Limpiando distancia");
        setFormData((prev) => ({
          ...prev,
          distancia: "",
        }));

        // Solo mostrar alerta si ambos campos están seleccionados
        if (formData.bancoId && obraActual) {
          const obraData = obras.find((o) => o.id === obraActual);
          const nombreObra = obraData ? obraData.nombre : "esta obra";

          Alert.alert(
            "Distancia no configurada",
            `No hay una distancia registrada entre el banco seleccionado y ${nombreObra}. Contacta al administrador.`,
          );
        }
      }
    };

    fetchDistancia();
  }, [formData.bancoId, obraSeleccionadaId, calcularDistancia, obras]);
  // ✅ Mantener obraSeleccionadaId en dependencias para disparar el efecto

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
