// src/hooks/useCancelarVale.js
//
// Hook para manejar la cancelación de un vale.
// Solo accesible para rol RESIDENTE.
// El vale debe estar en estado "en_proceso".

import { useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";

const MOTIVO_MIN_CHARS = 40;

export const useCancelarVale = (vale, onExito) => {
  const { userRole, userProfile } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [errorMotivo, setErrorMotivo] = useState("");

  // Determina si el botón debe mostrarse

  const puedeCancel =
    userRole?.toLowerCase() === "residente" && vale?.estado === "en_proceso";

  const abrirModal = () => {
    setMotivo("");
    setErrorMotivo("");
    setModalVisible(true);
  };

  const cerrarModal = () => {
    if (cancelando) return;
    setModalVisible(false);
    setMotivo("");
    setErrorMotivo("");
  };

  const validarMotivo = (texto) => {
    if (!texto || texto.trim().length === 0) {
      return "El motivo es obligatorio.";
    }
    if (texto.trim().length < MOTIVO_MIN_CHARS) {
      return `El motivo debe tener al menos ${MOTIVO_MIN_CHARS} caracteres. (${texto.trim().length}/${MOTIVO_MIN_CHARS})`;
    }
    return "";
  };

  const handleCambioMotivo = (texto) => {
    setMotivo(texto);
    if (errorMotivo) {
      setErrorMotivo(validarMotivo(texto));
    }
  };

  const confirmarCancelacion = async () => {
    const error = validarMotivo(motivo);
    if (error) {
      setErrorMotivo(error);
      return;
    }

    // TEMPORAL - diagnóstico
    console.log("[CANCELAR] id_vale:", vale?.id_vale);
    console.log("[CANCELAR] estado actual:", vale?.estado);
    console.log("[CANCELAR] auth_user_id:", userProfile?.auth_user_id);
    console.log("[CANCELAR] id_persona:", userProfile?.id_persona);
    console.log("[CANCELAR] userRole:", userRole);
    console.log("[CANCELAR] motivo length:", motivo.trim().length);

    try {
      setCancelando(true);

      const { data, error: errorSupabase } = await supabase
        .from("vales")
        .update({
          estado: "cancelado",
          motivo_cancelacion: motivo.trim(),
          cancelado_por: userProfile.auth_user_id,
          fecha_cancelacion: new Date().toISOString(),
        })
        .eq("id_vale", vale.id_vale)
        .eq("estado", "en_proceso")
        .select(); // 🆕 agregar .select() para ver qué devuelve

      // TEMPORAL - diagnóstico
      console.log("[CANCELAR] data:", JSON.stringify(data));
      console.log("[CANCELAR] error:", JSON.stringify(errorSupabase));

      if (errorSupabase) throw errorSupabase;

      setModalVisible(false);
      setMotivo("");

      Alert.alert("Vale cancelado", "El vale fue cancelado exitosamente.", [
        { text: "OK", onPress: onExito },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo cancelar el vale. Por favor intenta de nuevo.",
        [{ text: "OK" }],
      );
    } finally {
      setCancelando(false);
    }
  };

  return {
    // Estado
    modalVisible,
    motivo,
    cancelando,
    errorMotivo,
    puedeCancel,
    // Acciones
    abrirModal,
    cerrarModal,
    handleCambioMotivo,
    confirmarCancelacion,
    // Constante útil para el modal
    MOTIVO_MIN_CHARS,
  };
};
