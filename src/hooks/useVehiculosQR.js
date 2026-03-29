// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Local - Config
import { supabase } from "../config/supabase";

/**
 * useVehiculosQR
 *
 * Obtiene todos los vehículos activos con su qr_uid para generación de etiquetas.
 *
 * USADO EN:
 * - SeccionQRVehiculos (DevToolsScreen)
 */
const useVehiculosQR = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarVehiculos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: errorDB } = await supabase
        .from("vehiculos")
        .select(
          `
          id_vehiculo,
          placas,
          capacidad_m3,
          qr_uid,
          operador_sugerido:operadores!id_operador_sugerido (
            nombre_completo
          )
        `,
        )
        .eq("activo", true)
        .not("qr_uid", "is", null)
        .order("placas");

      if (errorDB) throw errorDB;

      setVehiculos(data ?? []);
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", "No se pudieron cargar los vehículos.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vehiculos,
    loading,
    error,
    cargarVehiculos,
  };
};

export default useVehiculosQR;
