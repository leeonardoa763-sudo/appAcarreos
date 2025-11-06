/**
 * components/vale/GenerarPDFButton.js
 *
 * Botón reutilizable para generar y compartir PDFs de vales
 *
 * PROPÓSITO:
 * - Generar QR + PDF al presionarse
 * - Manejar estados de loading
 * - Reutilizable para vales de Material y Renta
 *
 * USADO EN:
 * - ValeDetalleModal
 * - Otras pantallas que necesiten generar PDFs
 *
 * PROPS:
 * - valeData: object - Datos completos del vale
 * - tipoVale: string - "material" o "renta"
 * - colorCopia: string - Color de la copia (blanco, roja, verde, etc.)
 * - onSuccess: function - Callback después de generar exitosamente
 * - disabled: boolean - Deshabilitar botón
 */

import React, { useState, useRef } from "react";
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
import { generateAndSharePDF } from "../../services/pdfGenerator";
import { generateAndSharePDFRenta } from "../../services/pdfRentaGenerator";

const GenerarPDFButton = ({
  valeData,
  tipoVale,
  colorCopia = "blanco",
  onSuccess,
  disabled = false,
}) => {
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [shouldShare, setShouldShare] = useState(false);
  const isSharing = useRef(false);

  const handleGenerarPDF = () => {
    if (!valeData || !valeData.qr_verification_url) {
      Alert.alert("Error", "Datos del vale incompletos");
      return;
    }

    setShouldShare(true);
  };

  const handleQRGenerated = async (dataUrl) => {
    setQrDataUrl(dataUrl);

    if (shouldShare && !isSharing.current) {
      await compartirPDF(dataUrl);
    }
  };

  const compartirPDF = async (qrUrl) => {
    if (isSharing.current) return;

    try {
      isSharing.current = true;
      setGenerating(true);

      const generarFn =
        tipoVale === "renta" ? generateAndSharePDFRenta : generateAndSharePDF;

      await generarFn(valeData, colorCopia, qrUrl);

      Alert.alert(
        "PDF Generado",
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
      console.error("Error compartiendo PDF:", error);
      Alert.alert(
        "Error",
        "No se pudo generar el PDF. Intenta nuevamente."
      );
    } finally {
      setGenerating(false);
      isSharing.current = false;
      setShouldShare(false);
    }
  };

  return (
    <>
      {/* Generador QR invisible */}
      {valeData && valeData.qr_verification_url && shouldShare && (
        <QRCodeGenerator
          value={valeData.qr_verification_url}
          onGenerated={handleQRGenerated}
          size={200}
        />
      )}

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
            <Text style={styles.buttonText}>Generar PDF Blanco</Text>
          </View>
        )}
      </TouchableOpacity>
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
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
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