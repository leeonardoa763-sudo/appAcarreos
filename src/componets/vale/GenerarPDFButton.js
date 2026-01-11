/**
 * components/vale/GenerarPDFButton.js (MEJORADO)
 *
 * Botón reutilizable para generar y compartir PDFs de vales
 *
 * MEJORAS:
 * - Mejor manejo de errores
 * - Logs más descriptivos
 * - Validación de permisos
 * - Timeout para generar QR
 */

import React, { useState, useRef, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import QRCodeGenerator from "../common/QRCodeGenerator";

// import { generateAndSharePDF } from "../../services/pdfGenerator";
// import { generateAndSharePDFRenta } from "../../services/pdfRentaGenerator";
import { generateAndShareMaterialRecibo as generateAndSharePDF } from "../../services/pdfMaterialGeneratorRecibo";
import { generateAndShareRentaRecibo as generateAndSharePDFRenta } from "../../services/pdfRentaGeneratorRecibo";

const GenerarPDFButton = ({
  valeData,
  tipoVale,
  colorCopia = "blanco",
  onSuccess,
  disabled = false,
  autoTrigger = false,
}) => {
  console.log("[GenerarPDFButton] Componente montado");
  console.log("[GenerarPDFButton] Props recibidas:", {
    folio: valeData?.folio,
    tipoVale,
    colorCopia,
    disabled,
    autoTrigger,
    tieneQR: !!valeData?.qr_verification_url,
  });

  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [shouldGeneratePDF, setShouldGeneratePDF] = useState(false);
  const isSharing = useRef(false);
  const qrTimeoutRef = useRef(null);

  // Auto-trigger al montar el componente
  useEffect(() => {
    if (autoTrigger && !generating && !isSharing.current) {
      console.log("[GenerarPDFButton] Auto-trigger activado");
      setShouldGeneratePDF(true);
    }
  }, []);

  // Compartir PDF cuando el QR esté listo
  useEffect(() => {
    if (qrDataUrl && shouldGeneratePDF && !isSharing.current) {
      console.log("[GenerarPDFButton] QR listo, iniciando compartir");
      compartirPDF(qrDataUrl);
    }
  }, [qrDataUrl, shouldGeneratePDF]);

  // Cleanup timeout al desmontar
  useEffect(() => {
    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
    };
  }, []);

  const handleGenerarPDF = () => {
    if (!valeData?.qr_verification_url) {
      Alert.alert("Error", "El vale no tiene URL de verificación");
      return;
    }

    setShouldGeneratePDF(true);
    setGenerating(true);

    // Timeout de seguridad para QR
    qrTimeoutRef.current = setTimeout(() => {
      if (!qrDataUrl) {
        console.error("[GenerarPDFButton] Timeout generando QR");
        Alert.alert(
          "Error",
          "El código QR tardó demasiado en generarse. Intenta de nuevo."
        );
        setGenerating(false);
        setShouldGeneratePDF(false);
      }
    }, 10000); // 10 segundos
  };

  const handleQRGenerated = (dataUrl) => {
    console.log("[GenerarPDFButton] QR generado:", dataUrl?.substring(0, 50));

    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    if (!dataUrl) {
      console.error("[GenerarPDFButton] QR generado pero dataUrl vacío");
      Alert.alert("Error", "Error generando código QR");
      setGenerating(false);
      setShouldGeneratePDF(false);
      return;
    }

    setQrDataUrl(dataUrl);
  };

  const handleQRError = (error) => {
    console.error("[GenerarPDFButton] Error generando QR:", error);

    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    Alert.alert("Error", "No se pudo generar el código QR");
    setGenerating(false);
    setShouldGeneratePDF(false);
    isSharing.current = false;
  };

  const compartirPDF = async (qrUrl) => {
    if (isSharing.current) {
      console.log("[GenerarPDFButton] Ya compartiendo, abortando");
      return;
    }

    try {
      console.log("[GenerarPDFButton] Iniciando compartir PDF");
      isSharing.current = true;

      // Validar datos
      if (!valeData || !valeData.folio) {
        throw new Error("Datos del vale incompletos");
      }

      if (!qrUrl) {
        throw new Error("Código QR no disponible");
      }

      // Seleccionar función según tipo
      const generarFn =
        tipoVale === "renta" ? generateAndSharePDFRenta : generateAndSharePDF;

      console.log(
        "[GenerarPDFButton] Llamando a",
        tipoVale === "renta"
          ? "generateAndSharePDFRenta"
          : "generateAndSharePDF"
      );

      const uri = await generarFn(valeData, colorCopia, qrUrl);

      console.log("[GenerarPDFButton] PDF generado:", uri);

      Alert.alert(
        "PDF Compartido",
        `Vale ${valeData.folio} compartido exitosamente`,
        [
          {
            text: "OK",
            onPress: () => {
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error("[GenerarPDFButton] Error completo:", error);
      console.error("[GenerarPDFButton] Error stack:", error.stack);

      let errorMessage = "No se pudo generar el PDF.";

      if (error.message.includes("compartir no está disponible")) {
        errorMessage =
          "La función de compartir no está disponible en este dispositivo.";
      } else if (error.message.includes("incompletos")) {
        errorMessage = "Los datos del vale están incompletos.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setGenerating(false);
      isSharing.current = false;
      setShouldGeneratePDF(false);
      setQrDataUrl(null); // Resetear para siguiente generación
    }
  };

  return (
    <>
      {/* Generador QR invisible */}
      {shouldGeneratePDF && valeData?.qr_verification_url && (
        <View style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}>
          <QRCodeGenerator
            value={valeData.qr_verification_url}
            onGenerated={handleQRGenerated}
            onError={handleQRError}
            size={200}
          />
        </View>
      )}

      {!autoTrigger && (
        <TouchableOpacity
          style={[
            styles.button,
            disabled && styles.buttonDisabled,
            generating && styles.buttonGenerating,
          ]}
          onPress={handleGenerarPDF}
          disabled={disabled || generating}
          activeOpacity={0.7}
        >
          {generating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.surface} />
              <Text style={styles.buttonText}>Generando PDF...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={20}
                color={colors.surface}
              />
              <Text style={styles.buttonText}>Compartir PDF</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: colors.shadow?.color || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled || "#CCC",
    elevation: 0,
  },
  buttonGenerating: {
    backgroundColor: colors.secondary,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GenerarPDFButton;
