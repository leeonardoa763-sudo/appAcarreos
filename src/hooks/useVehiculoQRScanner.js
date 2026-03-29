// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Third party
import { Camera } from "expo-camera";

/**
 * useVehiculoQRScanner
 *
 * Maneja permisos de cámara y escaneo de QR para vehículos.
 * Entrega el string crudo del QR (qr_uid), no una URL de vale.
 *
 * USADO EN:
 * - ModalAsignarVehiculo
 */
const useVehiculoQRScanner = ({ onQrDetectado }) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(false);

  const abrirScanner = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitas permitir el acceso a la cámara para escanear vehículos.",
          [{ text: "OK" }],
        );
        return;
      }

      setScannerVisible(true);
      setScanning(false);
    } catch {
      Alert.alert(
        "Error",
        "No se pudo acceder a la cámara. Intenta de nuevo.",
        [{ text: "OK" }],
      );
    }
  }, []);

  const handleBarCodeScanned = useCallback(
    ({ data }) => {
      if (scanning) return;

      if (!data?.trim()) {
        Alert.alert("QR inválido", "No se pudo leer el código QR.", [
          { text: "Escanear de nuevo", onPress: () => setScanning(false) },
        ]);
        return;
      }

      setScanning(true);
      setScannerVisible(false);
      onQrDetectado(data.trim());
    },
    [scanning, onQrDetectado],
  );

  const cerrarScanner = useCallback(() => {
    setScannerVisible(false);
    setScanning(false);
  }, []);

  return {
    scannerVisible,
    scanning,
    abrirScanner,
    handleBarCodeScanned,
    cerrarScanner,
  };
};

export default useVehiculoQRScanner;
