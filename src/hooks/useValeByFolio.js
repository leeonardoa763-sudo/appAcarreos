// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Local - Config
import { supabase } from "../config/supabase";

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
        .select(
          `
    *,
    obras:id_obra (
      id_obra,
      obra,
      cc,
      empresas:id_empresa (
        id_empresa,
        empresa,
        sufijo,
        logo
      )
    ),
    persona:id_persona_creador (
      nombre,
      primer_apellido,
      segundo_apellido
    ),
    persona_completador:id_persona_completador (
      nombre,
      primer_apellido,
      segundo_apellido
    ),
    operadores:id_operador (
      nombre_completo,
      id_sindicato,
      sindicatos:id_sindicato (
        sindicato
      )
    ),
    vehiculos:id_vehiculo (
      placas,
      sindicatos:id_sindicato (
        sindicato
      )
    ),
    vale_material_detalles (
      *,
      material:id_material (
        id_material,
        material,
        id_tipo_de_material
      ),
      bancos:id_banco (
        id_banco,
        banco
      )
    ),
    vale_renta_detalle (
      *,
      material:id_material (material),
      sindicatos:id_sindicato (sindicato),
      precios_renta (
        costo_hr,
        costo_dia
      )
    )
  `,
        )
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
