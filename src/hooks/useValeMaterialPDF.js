/**
 * hooks/useValeMaterialPDF.js
 *
 * Hook para manejar la generación de QR y compartir PDF
 */

import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { generateAndSharePDF } from "../services/pdfGenerator";

export const useValeMaterialPDF = (navigation) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [shouldSharePDF, setShouldSharePDF] = useState(false);

  const isSharing = useRef(false);

  // Función: Navegar a Acarreos
  const navegarAcarreos = useCallback(() => {
    console.log("[useValeMaterialPDF] Navegando a Acarreos");

    try {
      navigation.navigate("ValesMain");

      setTimeout(() => {
        const parent = navigation.getParent();
        if (parent && parent.navigate) {
          parent.navigate("Acarreos");
        }
      }, 100);
    } catch (error) {
      console.error("[useValeMaterialPDF] Error en navegación:", error);
    }
  }, [navigation]);

  // Función: Compartir PDF
  const compartirPDF = useCallback(
    async (valeData, generarCopiaRoja) => {
      if (isSharing.current) {
        console.log("[useValeMaterialPDF] Ya está compartiendo - abortando");
        return;
      }

      if (!valeData || !qrDataUrl) {
        console.log("[useValeMaterialPDF] Faltan datos para compartir PDF");
        return;
      }

      try {
        isSharing.current = true;
        setGeneratingPDF(true);

        const colorCopia = generarCopiaRoja ? "roja" : "blanca";

        console.log("[useValeMaterialPDF] Generando PDF color:", colorCopia);
        await generateAndSharePDF(valeData, colorCopia, qrDataUrl);
        console.log("[useValeMaterialPDF] PDF compartido exitosamente");

        // Delay antes de navegar
        await new Promise((resolve) => setTimeout(resolve, 500));

        navegarAcarreos();
      } catch (error) {
        console.error("[useValeMaterialPDF] Error compartiendo PDF:", error);
        Alert.alert(
          "Error al compartir",
          "No se pudo compartir el PDF. Puedes encontrar el vale en la sección Acarreos.",
          [{ text: "OK", onPress: () => navegarAcarreos() }]
        );
      } finally {
        setGeneratingPDF(false);
        isSharing.current = false;
        setShouldSharePDF(false);
      }
    },
    [qrDataUrl, navegarAcarreos]
  );

  // Callback: Cuando se genera el QR
  const handleQRGenerated = useCallback(
    (dataUrl) => {
      if (qrGenerated) {
        console.log("[useValeMaterialPDF] QR ya fue procesado, ignorando...");
        return;
      }

      console.log("[useValeMaterialPDF] QR generado exitosamente");
      setQrDataUrl(dataUrl);
      setQrGenerated(true);
    },
    [qrGenerated]
  );

  // Función: Reset del estado PDF
  const resetPDFState = useCallback(() => {
    setQrDataUrl(null);
    setGeneratingPDF(false);
    setQrGenerated(false);
    setShouldSharePDF(false);
    isSharing.current = false;
  }, []);

  return {
    qrDataUrl,
    generatingPDF,
    shouldSharePDF,
    setShouldSharePDF,
    compartirPDF,
    handleQRGenerated,
    navegarAcarreos,
    resetPDFState,
  };
};
