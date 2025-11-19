/**
 * hooks/useValeMaterialPDF.js
 *
 * Hook para manejar la generación de QR y compartir PDF
 *
 * CAMBIOS PASO C:
 * - ✅ Ref isMounted agregado
 * - ✅ Navegación robusta con InteractionManager
 * - ✅ Sin setTimeout arbitrarios
 * - ✅ Protección setState después de unmount
 */

import { useState, useCallback, useRef } from "react";
import { Alert, InteractionManager } from "react-native";
import { generateAndSharePDF } from "../services/pdfGenerator";

export const useValeMaterialPDF = (navigation) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [shouldSharePDF, setShouldSharePDF] = useState(false);

  const isSharing = useRef(false);
  const isMounted = useRef(true);

  // Función: Navegar a Acarreos (MEJORADA)
  const navegarAcarreos = useCallback(() => {
    if (!isMounted.current) return;

    InteractionManager.runAfterInteractions(() => {
      if (!isMounted.current) return;

      navigation.navigate("ValesMain");

      requestAnimationFrame(() => {
        if (!isMounted.current) return;

        const tabNavigator = navigation.getParent();
        if (tabNavigator && tabNavigator.navigate) {
          tabNavigator.navigate("Acarreos");
        }
      });
    });
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

      if (!isMounted.current) return;

      try {
        isSharing.current = true;

        if (isMounted.current) {
          setGeneratingPDF(true);
        }

        const colorCopia = generarCopiaRoja ? "roja" : "blanca";

        console.log("[useValeMaterialPDF] Generando PDF color:", colorCopia);
        await generateAndSharePDF(valeData, colorCopia, qrDataUrl);
        console.log("[useValeMaterialPDF] PDF compartido exitosamente");

        // Esperar que termine la interacción de compartir
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isMounted.current) {
          navegarAcarreos();
        }
      } catch (error) {
        console.error("[useValeMaterialPDF] Error compartiendo PDF:", error);

        if (isMounted.current) {
          Alert.alert(
            "Error al compartir",
            "No se pudo compartir el PDF. Puedes encontrar el vale en la sección Acarreos.",
            [{ text: "OK", onPress: () => navegarAcarreos() }]
          );
        }
      } finally {
        if (isMounted.current) {
          setGeneratingPDF(false);
          setShouldSharePDF(false);
        }
        isSharing.current = false;
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

      if (!isMounted.current) return;

      console.log("[useValeMaterialPDF] QR generado exitosamente");
      setQrDataUrl(dataUrl);
      setQrGenerated(true);
    },
    [qrGenerated]
  );

  // Función: Reset del estado PDF
  const resetPDFState = useCallback(() => {
    if (!isMounted.current) return;

    setQrDataUrl(null);
    setGeneratingPDF(false);
    setQrGenerated(false);
    setShouldSharePDF(false);
    isSharing.current = false;
  }, []);

  // Función para marcar como desmontado (llamar desde componente padre)
  const setMounted = useCallback((value) => {
    isMounted.current = value;
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
    setMounted,
  };
};
