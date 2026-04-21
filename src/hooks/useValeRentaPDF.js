/**
 * hooks/useValeRentaPDF.js
 *
 * Hook para manejar la generación del PDF de copia roja
 * al momento de CREAR un vale de renta.
 *
 * PROPÓSITO:
 * - Centralizar la lógica de generación de QR y PDF rojo para vales de renta
 * - Espejo de useValeMaterialPDF pero aplicado a la creación de renta
 * - El PDF rojo se genera inmediatamente al crear el vale (igual que material tipo 1)
 *
 * USADO EN:
 * - ValeRentaScreen (al crear el vale)
 *
 * FLUJO:
 * 1. Se crea el vale en Supabase → queda en "en_proceso"
 * 2. Se muestra SuccessModal con opción "Generar PDF Rojo"
 * 3. GenerarPDFButton invisible genera el QR y el recibo térmico rojo
 * 4. Se navega a Acarreos después de compartir
 */

import { useState, useCallback, useRef } from "react";
import { Alert, InteractionManager } from "react-native";
import { generateAndShareRentaRecibo } from "../services/pdfRentaGeneratorRecibo";

export const useValeRentaPDF = (navigation) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [shouldSharePDF, setShouldSharePDF] = useState(false);

  const isSharing = useRef(false);
  const isMounted = useRef(true);

  // Navegar a Acarreos después de generar el PDF
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

  // Compartir PDF rojo de renta
  const compartirPDF = useCallback(
    async (valeData, qrUrl) => {

      if (isSharing.current) {
        console.warn("[useValeRentaPDF] Ya compartiendo, abortando");
        return;
      }
      if (!valeData || !qrUrl) {
        console.error("[useValeRentaPDF] Datos incompletos:", {
          valeData: !!valeData,
          qrUrl: !!qrUrl,
        });
        return;
      }
      if (!isMounted.current) {
        console.warn("[useValeRentaPDF] Componente desmontado, abortando");
        return;
      }

      try {
        isSharing.current = true;
        if (isMounted.current) setGeneratingPDF(true);

        await generateAndShareRentaRecibo(valeData, "roja", qrUrl);

        await new Promise((resolve) => setTimeout(resolve, 500));
        if (isMounted.current) navegarAcarreos();
      } catch (error) {
        console.error("[useValeRentaPDF] Error:", error.message);
        // ... resto del catch
      }
    },
    [navegarAcarreos],
  );

  // Callback cuando el QRCodeGenerator termina
  const handleQRGenerated = useCallback(
    (dataUrl) => {
      if (qrGenerated) return;
      if (!isMounted.current) return;
      if (!dataUrl) return;

      setQrDataUrl(dataUrl);
      setQrGenerated(true);
    },
    [qrGenerated],
  );

  // Reset completo del estado
  const resetPDFState = useCallback(() => {
    if (!isMounted.current) return;

    setQrDataUrl(null);
    setGeneratingPDF(false);
    setQrGenerated(false);
    setShouldSharePDF(false);
    isSharing.current = false;
  }, []);

  // Marcar como desmontado (llamar en cleanup del componente padre)
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
