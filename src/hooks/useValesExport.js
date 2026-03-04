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
 * - MODIFICADO: Soporta múltiples obras asignadas
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
  fetchTicketsDescarga,
} from "./exportHelpers/valesQueries";

// Transformación CSV
import {
  convertToCSV,
  transformMaterialData,
  transformRentaData,
  MATERIAL_HEADERS,
  RENTA_HEADERS,
  transformTicketsData,
  TICKETS_HEADERS,
} from "./exportHelpers/csvConverter";

// File System
import { saveAndShareCSV } from "./exportHelpers/fileSystemUtils";

export const useValesExport = (obrasAsignadas = []) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene array de IDs de todas las obras asignadas
   */
  const getObrasIds = () => {
    // Validar que obrasAsignadas sea un array válido
    if (!Array.isArray(obrasAsignadas) || obrasAsignadas.length === 0) {
      console.warn(
        "[useValesExport] ⚠️ No hay obras asignadas o no es un array válido",
      );
      return [];
    }

    const ids = obrasAsignadas.map((obra) => obra.id).filter(Boolean);
    console.log("[useValesExport] 🏗️ IDs de obras a exportar:", ids);
    console.log("[useValesExport] 🏗️ Total de obras:", ids.length);
    return ids;
  };

  /**
   * Obtiene semanas que tienen vales emitidos
   * MODIFICADO: Busca en todas las obras asignadas
   */
  const fetchWeeksWithVales = async () => {
    const obrasIds = getObrasIds();

    if (obrasIds.length === 0) {
      console.warn(
        "[useValesExport] ⚠️ No se pueden obtener semanas sin obras",
      );
      return [];
    }

    console.log("[useValesExport] Buscando semanas para obras:", obrasIds);
    return await fetchWeeksQuery(obrasIds);
  };

  /**
   * Exporta vales de material a CSV
   * MODIFICADO: Exporta de todas las obras asignadas
   */
  const exportMaterialCSV = async (weekNumber, year) => {
    console.log("[useValesExport] === INICIO EXPORTACIÓN MATERIAL ===");
    try {
      setLoading(true);
      setError(null);

      const obrasIds = getObrasIds();

      if (obrasIds.length === 0) {
        Alert.alert("Sin Obras", "No tienes obras asignadas para exportar.", [
          { text: "OK" },
        ]);
        setLoading(false);
        return false;
      }

      console.log("[useValesExport] 1️⃣ Fetching vales de material...");
      console.log("[useValesExport] Semana:", weekNumber, "Año:", year);
      console.log("[useValesExport] Obras IDs:", obrasIds);

      const vales = await fetchValesMaterial(weekNumber, year, obrasIds);

      if (!vales || vales.length === 0) {
        console.log("[useValesExport] ⚠️ No hay vales para exportar");
        Alert.alert(
          "Sin Datos",
          `No se encontraron vales de material emitidos para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }],
        );
        setLoading(false);
        return false;
      }

      console.log(
        "[useValesExport] 2️⃣ Transformando",
        vales.length,
        "vales...",
      );
      const transformedData = transformMaterialData(vales);

      console.log("[useValesExport] 3️⃣ Convirtiendo a CSV...");
      const csvContent = convertToCSV(transformedData, MATERIAL_HEADERS);

      console.log("[useValesExport] 4️⃣ Compartiendo CSV...");
      const filename = `vales_material_semana${weekNumber}_${year}.csv`;
      await saveAndShareCSV(csvContent, filename);

      console.log("[useValesExport] ✅ Exportación completada");

      // Mostrar mensaje con cantidad de obras incluidas
      const obrasNombres = obrasAsignadas.map((o) => o.nombre).join(", ");
      const mensajeObras =
        obrasAsignadas.length > 1
          ? `de ${obrasAsignadas.length} obras (${obrasNombres})`
          : `de ${obrasNombres}`;

      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${vales.length} vales de material ${mensajeObras}`,
        [{ text: "OK" }],
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
        [{ text: "OK" }],
      );
      return false;
    } finally {
      console.log("[useValesExport] === FIN EXPORTACIÓN MATERIAL ===");
    }
  };

  /**
   * Exporta vales de renta a CSV
   * MODIFICADO: Exporta de todas las obras asignadas
   */
  const exportRentaCSV = async (weekNumber, year) => {
    console.log("[useValesExport] === INICIO EXPORTACIÓN RENTA ===");
    try {
      setLoading(true);
      setError(null);

      const obrasIds = getObrasIds();

      if (obrasIds.length === 0) {
        Alert.alert("Sin Obras", "No tienes obras asignadas para exportar.", [
          { text: "OK" },
        ]);
        setLoading(false);
        return false;
      }

      console.log("[useValesExport] 1️⃣ Fetching vales de renta...");
      console.log("[useValesExport] Semana:", weekNumber, "Año:", year);
      console.log("[useValesExport] Obras IDs:", obrasIds);

      const vales = await fetchValesRenta(weekNumber, year, obrasIds);

      if (!vales || vales.length === 0) {
        console.log("[useValesExport] ⚠️ No hay vales para exportar");
        Alert.alert(
          "Sin Datos",
          `No se encontraron vales de renta emitidos para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }],
        );
        setLoading(false);
        return false;
      }

      console.log(
        "[useValesExport] 2️⃣ Transformando",
        vales.length,
        "vales...",
      );
      const transformedData = transformRentaData(vales);

      console.log("[useValesExport] 3️⃣ Convirtiendo a CSV...");
      const csvContent = convertToCSV(transformedData, RENTA_HEADERS);

      console.log("[useValesExport] 4️⃣ Compartiendo CSV...");
      const filename = `vales_renta_semana${weekNumber}_${year}.csv`;
      await saveAndShareCSV(csvContent, filename);

      console.log("[useValesExport] ✅ Exportación completada");

      // Mostrar mensaje con cantidad de obras incluidas
      const obrasNombres = obrasAsignadas.map((o) => o.nombre).join(", ");
      const mensajeObras =
        obrasAsignadas.length > 1
          ? `de ${obrasAsignadas.length} obras (${obrasNombres})`
          : `de ${obrasNombres}`;

      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${vales.length} vales de renta ${mensajeObras}`,
        [{ text: "OK" }],
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
        [{ text: "OK" }],
      );
      return false;
    } finally {
      console.log("[useValesExport] === FIN EXPORTACIÓN RENTA ===");
    }
  };

  /**
   * Exporta tickets de descarga a CSV
   * Filtra por semana del vale asociado
   */
  const exportTicketsCSV = async (weekNumber, year) => {
    try {
      setLoading(true);
      setError(null);

      const obrasIds = getObrasIds();

      if (obrasIds.length === 0) {
        Alert.alert("Sin Obras", "No tienes obras asignadas para exportar.", [
          { text: "OK" },
        ]);
        setLoading(false);
        return false;
      }

      const tickets = await fetchTicketsDescarga(weekNumber, year, obrasIds);

      if (!tickets || tickets.length === 0) {
        Alert.alert(
          "Sin Datos",
          `No se encontraron tickets de descarga para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }],
        );
        setLoading(false);
        return false;
      }

      const transformedData = transformTicketsData(tickets);
      const csvContent = convertToCSV(transformedData, TICKETS_HEADERS);
      const filename = `tickets_descarga_semana${weekNumber}_${year}.csv`;
      await saveAndShareCSV(csvContent, filename);

      const obrasNombres = obrasAsignadas.map((o) => o.nombre).join(", ");
      const mensajeObras =
        obrasAsignadas.length > 1
          ? `de ${obrasAsignadas.length} obras (${obrasNombres})`
          : `de ${obrasNombres}`;

      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${tickets.length} tickets de descarga ${mensajeObras}`,
        [{ text: "OK" }],
      );

      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      Alert.alert(
        "Error",
        `No se pudo exportar los tickets de descarga.\n\nDetalle: ${err.message}`,
        [{ text: "OK" }],
      );
      return false;
    }
  };

  return {
    loading,
    error,
    fetchWeeksWithVales,
    exportMaterialCSV,
    exportRentaCSV,
    exportTicketsCSV,
  };
};
