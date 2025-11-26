/**
 * hooks/useValesExport.js
 *
 * HOOK PRINCIPAL PARA EXPORTACIÓN DE VALES A CSV
 *
 * FUNCIONALIDADES:
 * - Coordina el proceso de exportación
 * - Maneja estados loading y errores
 * - Muestra alertas al usuario
 * - Comparte CSV igual que PDFs
 *
 * USADO EN:
 * - InformesScreen
 */

import { useState } from "react";
import { Alert } from "react-native";

// Queries
import {
  fetchWeeksWithVales as fetchWeeksQuery,
  fetchValesMaterial,
  fetchValesRenta,
} from "./exportHelpers/valesQueries";

// Transformación CSV
import {
  convertToCSV,
  transformMaterialData,
  transformRentaData,
  MATERIAL_HEADERS,
  RENTA_HEADERS,
} from "./exportHelpers/csvConverter";

// File System
import { saveAndShareCSV } from "./exportHelpers/fileSystemUtils";

export const useValesExport = (userProfile) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene semanas con vales emitidos
   */
  const fetchWeeksWithVales = async () => {
    return await fetchWeeksQuery(userProfile?.id_current_obra);
  };

  /**
   * Exporta vales de material a CSV
   */
  const exportMaterialCSV = async (weekNumber, year) => {
    console.log("[useValesExport] === INICIO EXPORTACIÓN MATERIAL ===");
    try {
      setLoading(true);
      setError(null);

      console.log("[useValesExport] 1️⃣ Fetching vales...");
      const vales = await fetchValesMaterial(
        weekNumber,
        year,
        userProfile.id_current_obra
      );

      if (!vales || vales.length === 0) {
        console.log("[useValesExport] ⚠️ No hay vales para exportar");
        Alert.alert(
          "Sin Datos",
          `No se encontraron vales de material emitidos para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }]
        );
        setLoading(false);
        return false;
      }

      console.log("[useValesExport] 2️⃣ Transformando datos...");
      const transformedData = transformMaterialData(vales);

      console.log("[useValesExport] 3️⃣ Convirtiendo a CSV...");
      const csvContent = convertToCSV(transformedData, MATERIAL_HEADERS);

      console.log("[useValesExport] 4️⃣ Compartiendo CSV...");
      const filename = `vales_material_semana${weekNumber}_${year}.csv`;
      await saveAndShareCSV(csvContent, filename);

      console.log("[useValesExport] ✅ Exportación completada");
      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${vales.length} vales de material`,
        [{ text: "OK" }]
      );

      setLoading(false);
      return true;
    } catch (err) {
      console.error("[useValesExport] ❌ ERROR EN EXPORTACIÓN MATERIAL");
      console.error("Mensaje:", err.message);

      setError(err.message);
      setLoading(false);
      Alert.alert(
        "Error",
        `No se pudo exportar los vales de material.\n\nDetalle: ${err.message}`,
        [{ text: "OK" }]
      );
      return false;
    } finally {
      console.log("[useValesExport] === FIN EXPORTACIÓN MATERIAL ===");
    }
  };

  /**
   * Exporta vales de renta a CSV
   */
  const exportRentaCSV = async (weekNumber, year) => {
    console.log("[useValesExport] === INICIO EXPORTACIÓN RENTA ===");
    try {
      setLoading(true);
      setError(null);

      console.log("[useValesExport] 1️⃣ Fetching vales...");
      const vales = await fetchValesRenta(
        weekNumber,
        year,
        userProfile.id_current_obra
      );

      if (!vales || vales.length === 0) {
        console.log("[useValesExport] ⚠️ No hay vales para exportar");
        Alert.alert(
          "Sin Datos",
          `No se encontraron vales de renta emitidos para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }]
        );
        setLoading(false);
        return false;
      }

      console.log("[useValesExport] 2️⃣ Transformando datos...");
      const transformedData = transformRentaData(vales);

      console.log("[useValesExport] 3️⃣ Convirtiendo a CSV...");
      const csvContent = convertToCSV(transformedData, RENTA_HEADERS);

      console.log("[useValesExport] 4️⃣ Compartiendo CSV...");
      const filename = `vales_renta_semana${weekNumber}_${year}.csv`;
      await saveAndShareCSV(csvContent, filename);

      console.log("[useValesExport] ✅ Exportación completada");
      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${vales.length} vales de renta`,
        [{ text: "OK" }]
      );

      setLoading(false);
      return true;
    } catch (err) {
      console.error("[useValesExport] ❌ ERROR EN EXPORTACIÓN RENTA");
      console.error("Mensaje:", err.message);

      setError(err.message);
      setLoading(false);
      Alert.alert(
        "Error",
        `No se pudo exportar los vales de renta.\n\nDetalle: ${err.message}`,
        [{ text: "OK" }]
      );
      return false;
    } finally {
      console.log("[useValesExport] === FIN EXPORTACIÓN RENTA ===");
    }
  };

  return {
    loading,
    error,
    fetchWeeksWithVales,
    exportMaterialCSV,
    exportRentaCSV,
  };
};
