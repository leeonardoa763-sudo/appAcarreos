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

      console.log("[useValeByFolio] Buscando folio:", folio);
      console.log("[useValeByFolio] Tipo de dato:", typeof folio);
      console.log("[useValeByFolio] Longitud:", folio?.length);

      const { data, error } = await supabase
        .from("vales")
        .select(VALE_SELECT_COMPLETO)
        .eq("folio", folio)
        .maybeSingle();
      console.log("[useValeByFolio] Respuesta error:", JSON.stringify(error));

      if (error) throw error;

      if (!data) {
        // Busqueda amplia para diagnostico
        const { data: todosVales } = await supabase
          .from("vales")
          .select("id_vale, folio")
          .limit(5)
          .order("fecha_creacion", { ascending: false });

        console.log(
          "[useValeByFolio] Ultimos 5 folios en BD:",
          JSON.stringify(todosVales),
        );

        Alert.alert(
          "Vale no encontrado",
          `Folio escaneado: "${folio}"\n\nVerifica que el QR corresponda a un vale de este sistema.`,
          [{ text: "OK" }],
        );
        return null;
      }

      console.log("[useValeByFolio] Vale encontrado:", data.folio);
      console.log("[useValeByFolio] tipo_vale:", data.tipo_vale);
      console.log(
        "[useValeByFolio] vale_renta_detalle count:",
        data.vale_renta_detalle?.length,
      );

      if (data.vale_renta_detalle?.length > 0) {
        const det = data.vale_renta_detalle[0];
        console.log(
          "[useValeByFolio] detalle[0].material:",
          JSON.stringify(det.material),
        );
        console.log(
          "[useValeByFolio] es_material_descarga:",
          det.material?.es_material_descarga,
        );
      }

      return data;
    } catch (error) {
      console.error("[useValeByFolio] Error completo:", JSON.stringify(error));
      Alert.alert("Error", `Detalle: ${error.message}`, [{ text: "OK" }]);
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
