// 1. React y hooks
import { useState, useCallback, useRef } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Third party
import { Camera } from "expo-camera";

// 4. Local
import { supabase } from "../config/supabase";
import { VALE_SELECT_COMPLETO } from "./queries/valesSelect";

/**
 * useVehiculoQRNavegacion
 *
 * Escanea el QR fijo de un vehículo (VH-{PLACAS}) y resuelve
 * los vales en_proceso asignados a ese vehículo.
 *
 * FLUJO:
 * 1. Abre escáner de cámara
 * 2. Lee qr_uid del vehículo
 * 3. Busca vales en_proceso con id_vehiculo coincidente
 * 4. Si hay 1 vale  → llama onValeUnico(vale)
 * 5. Si hay 2+ → llama onMultiplesVales(vales)
 * 6. Si hay 0  → alerta informativa
 *
 * USADO EN:
 * - ValesScreen (botón "Ir a Vale por QR")
 */
const useVehiculoQRNavegacion = ({ onValeUnico, onMultiplesVales }) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const procesandoRef = useRef(false);

  // ─── Abrir escáner ────────────────────────────────────────────────────────

  const abrirEscaner = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitas permitir el acceso a la cámara para escanear el QR del operador.",
          [{ text: "OK" }],
        );
        return;
      }

      procesandoRef.current = false;
      setScannerVisible(true);
      setScanning(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo acceder a la cámara. Intenta de nuevo.");
    }
  }, []);

  // ─── Buscar vales del vehículo ────────────────────────────────────────────

  const buscarValesDelVehiculo = useCallback(
    async (qrUid) => {
      try {
        setBuscando(true);

        // Paso 1: Buscar vehículo por qr_uid
        const { data: vehiculo, error: errorVehiculo } = await supabase
          .from("vehiculos")
          .select("id_vehiculo, placas")
          .eq("qr_uid", qrUid)
          .eq("activo", true)
          .single();

        if (errorVehiculo || !vehiculo) {
          Alert.alert(
            "Vehículo no encontrado",
            "El QR escaneado no corresponde a ningún vehículo registrado en el sistema.",
            [{ text: "OK" }],
          );
          return;
        }

        // Paso 2: Obtener folios de vales en_proceso de ese vehículo
        const { data: valesBasicos, error: errorFolios } = await supabase
          .from("vales")
          .select("folio")
          .eq("id_vehiculo", vehiculo.id_vehiculo)
          .eq("estado", "en_proceso");

        if (errorFolios) throw errorFolios;

        if (!valesBasicos || valesBasicos.length === 0) {
          Alert.alert(
            "Sin vales activos",
            `El vehículo con placas ${vehiculo.placas} no tiene vales en proceso actualmente.`,
            [{ text: "OK" }],
          );
          return;
        }

        // Paso 3: Cargar cada vale con VALE_SELECT_COMPLETO
        const folios = valesBasicos.map((v) => v.folio);

        const { data: valesCompletos, error: errorCompleto } = await supabase
          .from("vales")
          .select(VALE_SELECT_COMPLETO)
          .in("folio", folios);

        if (errorCompleto) throw errorCompleto;

        if (!valesCompletos || valesCompletos.length === 0) {
          Alert.alert("Error", "No se pudieron cargar los datos del vale.", [
            { text: "OK" },
          ]);
          return;
        }

        if (valesCompletos.length === 1) {
          onValeUnico(valesCompletos[0]);
        } else {
          onMultiplesVales(valesCompletos);
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "No se pudo buscar el vale. Por favor intenta de nuevo.",
          [{ text: "OK" }],
        );
      } finally {
        setBuscando(false);
      }
    },
    [onValeUnico, onMultiplesVales],
  );

  // ─── Procesar QR escaneado ────────────────────────────────────────────────

  const handleBarCodeScanned = useCallback(
    async ({ data }) => {
      if (procesandoRef.current) return;
      procesandoRef.current = true;

      setScanning(true);

      // Validar formato VH-{PLACAS}
      const esQrVehiculo = typeof data === "string" && data.startsWith("VH-");

      if (!esQrVehiculo) {
        Alert.alert(
          "QR no válido",
          "Este código QR no corresponde a un vehículo del sistema.",
          [
            {
              text: "Escanear de nuevo",
              onPress: () => {
                procesandoRef.current = false;
                setScanning(false);
              },
            },
          ],
        );
        return;
      }

      setScannerVisible(false);

      // Pequeño delay para dejar que el modal de escáner cierre
      setTimeout(() => {
        buscarValesDelVehiculo(data);
      }, 300);
    },
    [buscarValesDelVehiculo],
  );

  // ─── Cerrar escáner ───────────────────────────────────────────────────────

  const cerrarEscaner = useCallback(() => {
    procesandoRef.current = false;
    setScannerVisible(false);
    setScanning(false);
  }, []);

  return {
    scannerVisible,
    scanning,
    buscando,
    abrirEscaner,
    handleBarCodeScanned,
    cerrarEscaner,
  };
};

export default useVehiculoQRNavegacion;
