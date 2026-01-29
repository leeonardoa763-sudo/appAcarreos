// src/hooks/useStatsPDF.js

import { useState } from "react";
import { Alert } from "react-native";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

/**
 * Hook para capturar pantalla completa y compartir como imagen(es)
 * Captura el dashboard completo (incluso contenido fuera de scroll)
 * Si es muy alto, lo divide en dos imágenes
 */
export const useStatsPDF = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Captura y comparte la vista completa
   * @param {ref} viewRef - Referencia al View a capturar
   * @param {number} contentHeight - Altura total del contenido
   */
  const captureAndShare = async (viewRef, contentHeight = null) => {
    try {
      setGenerating(true);
      setError(null);

      console.log("[useStatsPDF] Capturando pantalla completa...");
      console.log("[useStatsPDF] Altura del contenido:", contentHeight);

      if (!viewRef || !viewRef.current) {
        throw new Error("Referencia a la vista no disponible");
      }

      // Límite de altura para captura (15000px es seguro para la mayoría de dispositivos)
      const MAX_HEIGHT = 15000;
      const needsSplit = contentHeight && contentHeight > MAX_HEIGHT;

      if (needsSplit) {
        console.log(
          "[useStatsPDF] Contenido muy alto, dividiendo en 2 capturas...",
        );
        await captureSplitView(viewRef, contentHeight);
      } else {
        console.log(
          "[useStatsPDF] Capturando vista completa de una sola vez...",
        );
        await captureSingleView(viewRef, contentHeight);
      }

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

  /**
   * Captura una sola imagen completa
   */
  const captureSingleView = async (viewRef, contentHeight) => {
    const captureOptions = {
      format: "png",
      quality: 1.0,
      result: "tmpfile",
    };

    // Si tenemos altura específica, la usamos
    if (contentHeight) {
      captureOptions.height = contentHeight;
    }

    const uri = await captureRef(viewRef, captureOptions);
    console.log("[useStatsPDF] Captura generada:", uri);

    await shareImage(uri, "Reporte de Estadísticas");
  };

  /**
   * Captura y comparte vista dividida en dos partes
   */
  const captureSplitView = async (viewRef, contentHeight) => {
    const halfHeight = Math.floor(contentHeight / 2);

    // Captura parte superior
    const uri1 = await captureRef(viewRef, {
      format: "png",
      quality: 1.0,
      result: "tmpfile",
      height: halfHeight,
    });

    console.log("[useStatsPDF] Parte 1 capturada:", uri1);

    // Captura parte inferior
    const uri2 = await captureRef(viewRef, {
      format: "png",
      quality: 1.0,
      result: "tmpfile",
      height: contentHeight - halfHeight,
      snapshotContentContainer: true,
    });

    console.log("[useStatsPDF] Parte 2 capturada:", uri2);

    // Compartir primera imagen
    await shareImage(uri1, "Reporte de Estadísticas - Parte 1");

    // Pequeña pausa antes de compartir la segunda
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Compartir segunda imagen
    await shareImage(uri2, "Reporte de Estadísticas - Parte 2");

    Alert.alert(
      "Capturas Completadas",
      "Se generaron 2 imágenes debido al tamaño del reporte",
      [{ text: "OK" }],
    );
  };

  /**
   * Comparte una imagen
   */
  const shareImage = async (uri, title) => {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert(
        "Error",
        "No se puede compartir archivos en este dispositivo",
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle: title,
      UTI: "public.png",
    });

    console.log("[useStatsPDF] Imagen compartida:", title);
  };

  return {
    generating,
    error,
    captureAndShare,
  };
};
