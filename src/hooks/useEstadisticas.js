// src/hooks/useEstadisticas.js

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";

/**
 * Hook para gestionar estadísticas de vales
 * Obtiene y procesa datos de material y renta para dashboards
 */
export const useEstadisticas = (periodo = "mes") => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    valesMaterial: [],
    valesRenta: [],
    totales: {
      totalM3: 0,
      totalHoras: 0,
      totalDias: 0,
      totalViajes: 0,
      totalDistancia: 0,
      costoTotal: 0,
      costoMaterial: 0,
      costoRenta: 0,
    },
  });

  // Calcular rango de fechas según periodo
  const calcularRangoFechas = useCallback(() => {
    const hoy = new Date();
    let fechaInicio;

    switch (periodo) {
      case "semana":
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case "mes":
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case "trimestre":
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 3);
        break;
      case "semestre":
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 6);
        break;
      case "año":
        fechaInicio = new Date(hoy);
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
        break;
      default:
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 1);
    }

    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: hoy.toISOString(),
    };
  }, [periodo]);

  // Fetch vales de material
  const fetchValesMaterial = useCallback(
    async (fechaInicio, fechaFin) => {
      console.log("[useEstadisticas] Fetching vales de material...");

      const { data, error } = await supabase
        .from("vales")
        .select(
          `
      id_vale,
      folio,
      fecha_creacion,
      estado,
      operadores!vales_id_operador_fkey (
        nombre_completo
      ),
      vale_material_detalles (
        cantidad_pedida_m3,
        volumen_real_m3,
        costo_total,
        distancia_km,
        material!vale_material_detalles_id_material_fkey (
          material,
          tipo_de_material!material_id_tipo_de_material_fkey (
            tipo_de_material
          )
        ),
        bancos!vale_material_detalles_id_banco_fkey (
          banco
        )
      )
    `,
        )
        .eq("tipo_vale", "material")
        .eq("id_obra", userProfile?.id_current_obra)
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("[useEstadisticas] Error fetching material:", error);
        throw error;
      }

      console.log(
        `[useEstadisticas] Vales material obtenidos: ${data?.length || 0}`,
      );
      return data || [];
    },
    [userProfile],
  );

  // Fetch vales de renta
  const fetchValesRenta = useCallback(
    async (fechaInicio, fechaFin) => {
      console.log("[useEstadisticas] Fetching vales de renta...");

      const { data, error } = await supabase
        .from("vales")
        .select(
          `
      id_vale,
      folio,
      fecha_creacion,
      estado,
      operadores!vales_id_operador_fkey (
        nombre_completo
      ),
      vale_renta_detalle (
        total_horas,
        total_dias,
        es_renta_por_dia,
        numero_viajes,
        costo_total,
        material!vale_renta_detalle_id_material_fkey (
          material
        )
      )
    `,
        )
        .eq("tipo_vale", "renta")
        .eq("id_obra", userProfile?.id_current_obra)
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("[useEstadisticas] Error fetching renta:", error);
        throw error;
      }

      console.log(
        `[useEstadisticas] Vales renta obtenidos: ${data?.length || 0}`,
      );
      return data || [];
    },
    [userProfile],
  );

  // Calcular totales a partir de los datos
  const calcularTotales = useCallback((valesMaterial, valesRenta) => {
    console.log("[useEstadisticas] Calculando totales...");

    let totalM3 = 0;
    let totalHoras = 0;
    let totalDias = 0;
    let totalViajes = 0;
    let costoMaterial = 0;
    let costoRenta = 0;
    let totalDistancia = 0;

    // Sumar material
    valesMaterial.forEach((vale) => {
      vale.vale_material_detalles?.forEach((detalle) => {
        totalM3 += Number(
          detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
        );
        totalViajes += 1;
        costoMaterial += Number(detalle.costo_total || 0);
        totalDistancia += Number(detalle.distancia_km || 0);
      });
    });

    // Sumar renta
    valesRenta.forEach((vale) => {
      vale.vale_renta_detalle?.forEach((detalle) => {
        totalHoras += Number(detalle.total_horas || 0);
        totalDias += Number(detalle.total_dias || 0);
        totalViajes += Number(detalle.numero_viajes || 1);
        costoRenta += Number(detalle.costo_total || 0);
      });
    });

    const totales = {
      totalM3: Math.round(totalM3 * 100) / 100,
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalDias: Math.round(totalDias * 100) / 100,
      totalViajes,
      totalDistancia: Math.round(totalDistancia * 10) / 10,
      costoTotal: Math.round((costoMaterial + costoRenta) * 100) / 100,
      costoMaterial: Math.round(costoMaterial * 100) / 100,
      costoRenta: Math.round(costoRenta * 100) / 100,
    };

    console.log("[useEstadisticas] Totales calculados:", totales);
    return totales;
  }, []);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[useEstadisticas] Cargando datos para periodo: ${periodo}`);

      const { fechaInicio, fechaFin } = calcularRangoFechas();
      console.log(`[useEstadisticas] Rango: ${fechaInicio} - ${fechaFin}`);

      const [valesMaterial, valesRenta] = await Promise.all([
        fetchValesMaterial(fechaInicio, fechaFin),
        fetchValesRenta(fechaInicio, fechaFin),
      ]);

      const totales = calcularTotales(valesMaterial, valesRenta);

      setData({
        valesMaterial,
        valesRenta,
        totales,
      });

      console.log("[useEstadisticas] Datos cargados exitosamente");
    } catch (err) {
      console.error("[useEstadisticas] Error cargando datos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    periodo,
    calcularRangoFechas,
    fetchValesMaterial,
    fetchValesRenta,
    calcularTotales,
  ]);

  // Cargar datos al montar o cambiar periodo
  useEffect(() => {
    if (userProfile?.id_current_obra) {
      cargarDatos();
    } else {
      console.log("[useEstadisticas] Sin obra asignada, no se cargan datos");
      setLoading(false);
    }
  }, [userProfile, cargarDatos]);

  return {
    data,
    loading,
    error,
    refetch: cargarDatos,
  };
};
