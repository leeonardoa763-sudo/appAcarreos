// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Local - Config
import { supabase } from "../config/supabase";
import { VALE_SELECT_COMPLETO } from "./queries/valesSelect";

/**
 * useValeByFolio
 *
 * Busca un vale completo en Supabase por su folio
 * Usa el mismo query con relaciones que AcarreosScreen
 *
 * USADO EN:
 * - ValesScreen (después de escanear QR)
 *
 * RETORNA:
 * - buscarValePorFolio: function - Busca y retorna el vale
 * - loading: boolean
 */
const useValeByFolio = () => {
  const [loading, setLoading] = useState(false);

  const buscarValePorFolio = useCallback(async (folio) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("vales")
        .select(VALE_SELECT_COMPLETO)
        .eq("folio", folio)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        Alert.alert(
          "Vale no encontrado",
          `Folio escaneado: "${folio}"\n\nVerifica que el QR corresponda a un vale de este sistema.`,
          [{ text: "OK" }],
        );
        return null;
      }

      return data;
    } catch (error) {
      console.error("[useValeByFolio] Error:", error.message);
      Alert.alert("Error", `No se pudo buscar el vale. Intenta de nuevo.`, [
        { text: "OK" },
      ]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    buscarValePorFolio,
    loading,
  };
};

export default useValeByFolio;
