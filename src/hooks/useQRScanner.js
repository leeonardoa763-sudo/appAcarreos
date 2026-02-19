// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Third party
import { Camera } from "expo-camera";

// 4. Local - Utils
import {
  extractFolioFromUrl,
  isValidVerificationUrl,
} from "../utils/qrGenerator";

/**
 * useQRScanner
 *
 * Maneja permisos de cámara y lógica de escaneo de QR de vales
 *
 * USADO EN:
 * - QRScannerModal
 *
 * RETORNA:
 * - scannerVisible: boolean - Si el escáner está abierto
 * - scanning: boolean - Si está procesando un escaneo
 * - requestPermissionAndOpen: function - Pide permisos y abre escáner
 * - handleBarCodeScanned: function - Callback al detectar QR
 * - closeScanner: function - Cierra el escáner
 */
const useQRScanner = ({ onFolioDetected }) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Solicitar permisos y abrir escáner
  const requestPermissionAndOpen = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitas permitir el acceso a la cámara para escanear vales.",
          [{ text: "OK" }],
        );
        return;
      }

      setScannerVisible(true);
      setScanning(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo acceder a la cámara. Intenta de nuevo.");
    }
  }, []);

  // Procesar QR escaneado
  const handleBarCodeScanned = useCallback(
    ({ data }) => {
      if (scanning) return;

      console.log("[useQRScanner] QR detectado, data cruda:", data);
      console.log("[useQRScanner] isValid:", isValidVerificationUrl(data));
      console.log("[useQRScanner] folio extraido:", extractFolioFromUrl(data));

      setScanning(true);

      // Validar que sea una URL de vale válida
      if (!isValidVerificationUrl(data)) {
        Alert.alert(
          "QR no válido",
          "Este código QR no corresponde a un vale del sistema.",
          [
            {
              text: "Escanear de nuevo",
              onPress: () => setScanning(false),
            },
          ],
        );
        return;
      }

      // Extraer folio de la URL
      const folio = extractFolioFromUrl(data);

      if (!folio) {
        Alert.alert("Error", "No se pudo leer el folio del vale.", [
          {
            text: "Escanear de nuevo",
            onPress: () => setScanning(false),
          },
        ]);
        return;
      }

      // Cerrar escáner y notificar folio detectado
      setScannerVisible(false);
      onFolioDetected(folio);
    },
    [scanning, onFolioDetected],
  );

  const closeScanner = useCallback(() => {
    setScannerVisible(false);
    setScanning(false);
  }, []);

  return {
    scannerVisible,
    scanning,
    requestPermissionAndOpen,
    handleBarCodeScanned,
    closeScanner,
  };
};

export default useQRScanner;
