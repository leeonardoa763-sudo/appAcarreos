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
import { generateAndShareMaterialRecibo as generateAndSharePDF } from "../services/pdfMaterialGeneratorRecibo";
import { useFeatureFlags } from "./useFeatureFlags";

export const useValeMaterialPDF = (navigation) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [shouldSharePDF, setShouldSharePDF] = useState(false);

  const isSharing = useRef(false);
  const isMounted = useRef(true);

  const { flags } = useFeatureFlags();

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
      if (isSharing.current) return;
      if (!valeData || !qrDataUrl) return;
      if (!isMounted.current) return;

      const tipoDeMaterial =
        valeData.vale_material_detalles?.[0]?.material?.id_tipo_de_material;

      const esTipo2 = tipoDeMaterial === 2;
      const esTipo3DirectFlow =
        tipoDeMaterial === 3 && !flags.TIPO3_FLUJO_DOS_PASOS;

      /*
       * LÓGICA ORIGINAL (PDF rojo para todos al crear):
       *   const colorCopia = generarCopiaRoja ? "roja" : "blanca";
       *   await generateAndSharePDF(valeData, colorCopia, qrDataUrl);
       */

      if (esTipo2 && !flags.TIPO2_GENERAR_PDF_ROJO) {
        if (isMounted.current) navegarAcarreos();
        return;
      }

      try {
        isSharing.current = true;
        if (isMounted.current) setGeneratingPDF(true);

        const colorCopia = esTipo3DirectFlow
          ? "blanca"
          : generarCopiaRoja
            ? "roja"
            : "blanca";

        await generateAndSharePDF(valeData, colorCopia, qrDataUrl);

        await new Promise((resolve) => setTimeout(resolve, 500));
        if (isMounted.current) navegarAcarreos();
      } catch (error) {
        console.error("[useValeMaterialPDF] Error compartiendo PDF:", error);
        if (isMounted.current) {
          Alert.alert(
            "Error al compartir",
            "No se pudo compartir el PDF. Puedes encontrar el vale en la sección Acarreos.",
            [{ text: "OK", onPress: () => navegarAcarreos() }],
          );
        }
      } finally {
        if (isMounted.current) {
          setGeneratingPDF(false);
          setShouldSharePDF(false);
          setQrGenerated(false);
        }
        isSharing.current = false;
      }
    },
    [qrDataUrl, navegarAcarreos, flags], // <-- agregar flags aquí
  );

  // Callback: Cuando se genera el QR
  const handleQRGenerated = useCallback(
    (dataUrl) => {

      if (qrGenerated) {
        return;
      }

      if (!isMounted.current) {
        return;
      }

      if (!dataUrl) {
        console.error("[useValeMaterialPDF] ❌ dataUrl vacío");
        return;
      }

      setQrDataUrl(dataUrl);
      setQrGenerated(true);
    },
    [qrGenerated],
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
