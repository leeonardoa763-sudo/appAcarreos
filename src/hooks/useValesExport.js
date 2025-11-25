/**
 * hooks/useValesExport.js
 *
 * HOOK PARA EXPORTACIÓN DE VALES A CSV
 *
 * FUNCIONALIDADES:
 * - Query a Supabase con filtros por usuario y semana
 * - Transformación de datos a formato CSV
 * - Generación y descarga de archivos CSV
 * - Manejo de estados loading y errores
 *
 * USADO EN:
 * - InformesScreen
 */

import { useState } from "react";
import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "../config/supabase";
import {
  getWeekDateRange,
  formatDateOnly,
  getWeekNumber,
} from "../utils/dateUtils";

export const useValesExport = (userProfile) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene vales de material con todos sus datos relacionados
   */
  const fetchValesMaterial = async (weekNumber, year) => {
    const { startDate, endDate } = getWeekDateRange(weekNumber, year);

    const { data, error } = await supabase
      .from("vales")
      .select(
        `
        id_vale,
        folio,
        fecha_creacion,
        tipo_vale,
        obras:id_obra (nombre_obra),
        persona_creador:id_persona_creador (
          nombre,
          primer_apellido,
          segundo_apellido
        ),
        operadores:id_operador (
          nombre,
          primer_apellido,
          segundo_apellido
        ),
        vehiculos:id_vehiculo (placas),
        vale_material_detalles (
          material:id_material (nombre_material),
          bancos:id_banco (nombre_banco),
          capacidad_m3,
          distancia_km,
          cantidad_pedida_m3,
          volumen_real_m3,
          peso_ton,
          precio_m3,
          costo_total,
          tarifa_primer_km,
          tarifa_subsecuente
        )
      `
      )
      .eq("tipo_vale", "material")
      .eq("id_persona_creador", userProfile.id_persona)
      .gte("fecha_creacion", startDate.toISOString())
      .lte("fecha_creacion", endDate.toISOString())
      .order("fecha_creacion", { ascending: false });

    if (error) throw error;
    return data;
  };

  /**
   * Obtiene vales de renta con todos sus datos relacionados
   */
  const fetchValesRenta = async (weekNumber, year) => {
    const { startDate, endDate } = getWeekDateRange(weekNumber, year);

    const { data, error } = await supabase
      .from("vales")
      .select(
        `
        id_vale,
        folio,
        fecha_creacion,
        tipo_vale,
        obras:id_obra (nombre_obra),
        persona_creador:id_persona_creador (
          nombre,
          primer_apellido,
          segundo_apellido
        ),
        operadores:id_operador (
          nombre,
          primer_apellido,
          segundo_apellido
        ),
        vehiculos:id_vehiculo (placas),
        vale_renta_detalle (
          material:id_material (nombre_material),
          hora_inicio,
          hora_fin,
          total_horas,
          total_dias,
          es_renta_por_dia,
          costo_total,
          precios_renta:id_precios_renta (
            costo_hr,
            costo_dia
          )
        )
      `
      )
      .eq("tipo_vale", "renta")
      .eq("id_persona_creador", userProfile.id_persona)
      .gte("fecha_creacion", startDate.toISOString())
      .lte("fecha_creacion", endDate.toISOString())
      .order("fecha_creacion", { ascending: false });

    if (error) throw error;
    return data;
  };

  /**
   * Escapa caracteres especiales para CSV
   */
  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return "";

    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  /**
   * Convierte array de objetos a formato CSV
   */
  const convertToCSV = (data, headers) => {
    const headerRow = headers.map((h) => escapeCsvValue(h.label)).join(",");

    const dataRows = data.map((row) => {
      return headers.map((h) => escapeCsvValue(row[h.key])).join(",");
    });

    return [headerRow, ...dataRows].join("\n");
  };

  /**
   * Transforma datos de vales de material a formato CSV
   */
  const transformMaterialData = (vales) => {
    return vales.map((vale) => {
      const detalle = vale.vale_material_detalles?.[0] || {};
      const operador = vale.operadores;
      const residente = vale.persona_creador;
      const weekNum = getWeekNumber(new Date(vale.fecha_creacion));

      return {
        folio: vale.folio || "-",
        fecha: formatDateOnly(vale.fecha_creacion),
        semana: `Semana ${weekNum}`,
        obra: vale.obras?.nombre_obra || "-",
        residente: residente
          ? `${residente.nombre} ${residente.primer_apellido} ${
              residente.segundo_apellido || ""
            }`.trim()
          : "-",
        operador: operador
          ? `${operador.nombre} ${operador.primer_apellido} ${
              operador.segundo_apellido || ""
            }`.trim()
          : "-",
        placas: vale.vehiculos?.placas || "-",
        material: detalle.material?.nombre_material || "-",
        banco: detalle.bancos?.nombre_banco || "-",
        capacidad: detalle.capacidad_m3 || "0",
        distancia: detalle.distancia_km || "0",
        cantidad_pedida: detalle.cantidad_pedida_m3 || "0",
        volumen_real: detalle.volumen_real_m3 || "0",
        peso: detalle.peso_ton || "0",
        precio_m3: detalle.precio_m3 || "0",
        costo_total: detalle.costo_total || "0",
      };
    });
  };

  /**
   * Transforma datos de vales de renta a formato CSV
   */
  const transformRentaData = (vales) => {
    return vales.map((vale) => {
      const detalle = vale.vale_renta_detalle?.[0] || {};
      const operador = vale.operadores;
      const residente = vale.persona_creador;
      const weekNum = getWeekNumber(new Date(vale.fecha_creacion));

      return {
        folio: vale.folio || "-",
        fecha: formatDateOnly(vale.fecha_creacion),
        semana: `Semana ${weekNum}`,
        obra: vale.obras?.nombre_obra || "-",
        residente: residente
          ? `${residente.nombre} ${residente.primer_apellido} ${
              residente.segundo_apellido || ""
            }`.trim()
          : "-",
        operador: operador
          ? `${operador.nombre} ${operador.primer_apellido} ${
              operador.segundo_apellido || ""
            }`.trim()
          : "-",
        placas: vale.vehiculos?.placas || "-",
        material_movido: detalle.material?.nombre_material || "-",
        tipo_renta: detalle.es_renta_por_dia ? "Por día" : "Por hora",
        hora_inicio: detalle.hora_inicio
          ? formatDateOnly(detalle.hora_inicio)
          : "-",
        hora_fin: detalle.hora_fin ? formatDateOnly(detalle.hora_fin) : "-",
        total_horas: detalle.total_horas || "0",
        total_dias: detalle.total_dias || "0",
        tarifa_hora: detalle.precios_renta?.costo_hr || "0",
        tarifa_dia: detalle.precios_renta?.costo_dia || "0",
        costo_total: detalle.costo_total || "0",
      };
    });
  };

  /**
   * Guarda y comparte archivo CSV
   */
  const saveAndShareCSV = async (csvContent, filename) => {
    try {
      // Agregar BOM para UTF-8 (para que Excel lo abra correctamente)
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvWithBOM, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Exportar CSV",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Archivo Guardado", `El archivo se guardó en: ${fileUri}`, [
          { text: "OK" },
        ]);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Exporta vales de material a CSV
   */
  const exportMaterialCSV = async (weekNumber, year) => {
    try {
      setLoading(true);
      setError(null);

      const vales = await fetchValesMaterial(weekNumber, year);

      if (!vales || vales.length === 0) {
        Alert.alert(
          "Sin Datos",
          `No se encontraron vales de material para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }]
        );
        setLoading(false);
        return false;
      }

      const transformedData = transformMaterialData(vales);

      const headers = [
        { key: "folio", label: "Folio" },
        { key: "fecha", label: "Fecha" },
        { key: "semana", label: "Semana" },
        { key: "obra", label: "Obra" },
        { key: "residente", label: "Residente" },
        { key: "operador", label: "Operador" },
        { key: "placas", label: "Placas" },
        { key: "material", label: "Material" },
        { key: "banco", label: "Banco" },
        { key: "capacidad", label: "Capacidad (m³)" },
        { key: "distancia", label: "Distancia (km)" },
        { key: "cantidad_pedida", label: "Cantidad Pedida (m³)" },
        { key: "volumen_real", label: "Volumen Real (m³)" },
        { key: "peso", label: "Peso (ton)" },
        { key: "precio_m3", label: "Precio por m³" },
        { key: "costo_total", label: "Costo Total" },
      ];

      const csvContent = convertToCSV(transformedData, headers);
      const filename = `vales_material_semana${weekNumber}_${year}.csv`;

      await saveAndShareCSV(csvContent, filename);

      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${vales.length} vales de material`,
        [{ text: "OK" }]
      );

      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      Alert.alert(
        "Error",
        "No se pudo exportar los vales de material. Intenta de nuevo.",
        [{ text: "OK" }]
      );
      return false;
    }
  };

  /**
   * Exporta vales de renta a CSV
   */
  const exportRentaCSV = async (weekNumber, year) => {
    try {
      setLoading(true);
      setError(null);

      const vales = await fetchValesRenta(weekNumber, year);

      if (!vales || vales.length === 0) {
        Alert.alert(
          "Sin Datos",
          `No se encontraron vales de renta para la Semana ${weekNumber} del ${year}`,
          [{ text: "OK" }]
        );
        setLoading(false);
        return false;
      }

      const transformedData = transformRentaData(vales);

      const headers = [
        { key: "folio", label: "Folio" },
        { key: "fecha", label: "Fecha" },
        { key: "semana", label: "Semana" },
        { key: "obra", label: "Obra" },
        { key: "residente", label: "Residente" },
        { key: "operador", label: "Operador" },
        { key: "placas", label: "Placas" },
        { key: "material_movido", label: "Material Movido" },
        { key: "tipo_renta", label: "Tipo de Renta" },
        { key: "hora_inicio", label: "Hora Inicio" },
        { key: "hora_fin", label: "Hora Fin" },
        { key: "total_horas", label: "Total Horas" },
        { key: "total_dias", label: "Total Días" },
        { key: "tarifa_hora", label: "Tarifa por Hora" },
        { key: "tarifa_dia", label: "Tarifa por Día" },
        { key: "costo_total", label: "Costo Total" },
      ];

      const csvContent = convertToCSV(transformedData, headers);
      const filename = `vales_renta_semana${weekNumber}_${year}.csv`;

      await saveAndShareCSV(csvContent, filename);

      Alert.alert(
        "Exportación Exitosa",
        `Se exportaron ${vales.length} vales de renta`,
        [{ text: "OK" }]
      );

      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      Alert.alert(
        "Error",
        "No se pudo exportar los vales de renta. Intenta de nuevo.",
        [{ text: "OK" }]
      );
      return false;
    }
  };

  return {
    loading,
    error,
    exportMaterialCSV,
    exportRentaCSV,
  };
};
