// src/hooks/useStatsPDF.js

import { useState } from "react";
import { Alert } from "react-native";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

/**
 * Hook para capturar pantalla y compartir como imagen
 * Captura el dashboard tal como se ve
 */
export const useStatsPDF = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const captureAndShare = async (viewRef) => {
    try {
      setGenerating(true);
      setError(null);

      console.log("[useStatsPDF] Capturando pantalla...");

      if (!viewRef || !viewRef.current) {
        throw new Error("Referencia a la vista no disponible");
      }

      // Capturar la vista como imagen
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1.0,
        result: "tmpfile",
      });

      console.log("[useStatsPDF] Captura generada:", uri);

      // Verificar que sharing esté disponible
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          "Error",
          "No se puede compartir archivos en este dispositivo",
        );
        return false;
      }

      // Compartir la imagen
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Compartir Reporte de Estadísticas",
        UTI: "public.png",
      });

      console.log("[useStatsPDF] Imagen compartida exitosamente");
      return true;
    } catch (err) {
      console.error("[useStatsPDF] Error:", err);
      setError(err.message);
      Alert.alert("Error", "No se pudo capturar la pantalla");
      return false;
    } finally {
      setGenerating(false);
    }
  };

  return {
    generating,
    error,
    captureAndShare,
  };
};
