// src/hooks/useEstadisticas.js

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook para gestionar estadísticas de vales
 * Obtiene y procesa datos de material y renta para dashboards
 * Filtrado por residente y obra
 */
export const useEstadisticas = (
  periodo = "fetchValesRentames",
  residenteId = null,
  obraId = null,
) => {
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
    periodoAnterior: {
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

  // Calcular rango de fechas según periodo (MES COMPLETO del calendario)
  const calcularRangoFechas = useCallback(() => {
    const hoy = new Date();
    let fechaInicio, fechaFin;

    switch (periodo) {
      case "semana": {
        const diaSemana = (hoy.getDay() + 6) % 7;
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - diaSemana);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        fechaFin.setHours(23, 59, 59, 999);

        console.log(
          "[useEstadisticas] Semana inicio:",
          fechaInicio.toISOString(),
        );
        console.log("[useEstadisticas] Semana fin:", fechaFin.toISOString());
        break;
      }

      case "mes":
        // Mes actual completo (del 1 al último día del mes)
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        break;

      case "trimestre":
        // Últimos 3 meses completos
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        break;

      case "semestre":
        // Últimos 6 meses completos
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        break;

      case "año":
        // Últimos 12 meses completos
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 12, 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        break;

      default:
        // Default: mes actual
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
    }

    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
    };
  }, [periodo]);

  // Calcular rango del periodo anterior (para comparaciones)
  const calcularRangoPeriodoAnterior = useCallback(() => {
    const hoy = new Date();
    let fechaInicio, fechaFin;

    switch (periodo) {
      case "semana": {
        const diaSemana = (hoy.getDay() + 6) % 7;
        const lunesEstaSeamana = new Date(hoy);
        lunesEstaSeamana.setDate(hoy.getDate() - diaSemana);
        lunesEstaSeamana.setHours(0, 0, 0, 0);
        fechaFin = new Date(lunesEstaSeamana);
        fechaFin.setDate(lunesEstaSeamana.getDate() - 1);
        fechaFin.setHours(23, 59, 59, 999);
        fechaInicio = new Date(fechaFin);
        fechaInicio.setDate(fechaFin.getDate() - 6);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      }

      case "mes":
        // Mes anterior completo
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
        break;

      case "trimestre":
        // Trimestre anterior (3 meses antes)
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() - 3,
          0,
          23,
          59,
          59,
        );
        break;

      case "semestre":
        // Semestre anterior (6 meses antes)
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 12, 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() - 6,
          0,
          23,
          59,
          59,
        );
        break;

      case "año":
        // Año anterior (12 meses antes)
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 24, 1);
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() - 12,
          0,
          23,
          59,
          59,
        );
        break;

      default:
        // Default: mes anterior
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
    }

    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
    };
  }, [periodo]);

  // Fetch vales de material
  const fetchValesMaterial = useCallback(
    async (fechaInicio, fechaFin) => {
      let query = supabase
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
        requisicion,
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
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin);

      // Filtrar por obra (null = todas las obras del residente)
      if (obraId) {
        query = query.eq("id_obra", obraId);
      }

      query = query.order("fecha_creacion", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("[useEstadisticas] Error fetching material:", error);
        throw error;
      }

      console.log("[Material] fechaInicio:", fechaInicio);
      console.log("[Material] fechaFin:", fechaFin);
      console.log("[Material] obraId:", obraId);
      console.log("[Material] resultados:", data?.length);

      return data || [];
    },
    [residenteId, obraId],
  );

  // Fetch vales de renta
  const fetchValesRenta = useCallback(
    async (fechaInicio, fechaFin) => {
      let query = supabase
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
        ),
        sindicatos!vale_renta_detalle_id_sindicato_fkey (
          sindicato
        )
      )
    `,
        )
        .eq("tipo_vale", "renta")
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin);

      // Si hay obra específica, filtrar por obra (ve TODO lo de la obra)
      // Si no hay obra, filtrar por residente (sus obras asignadas)
      if (obraId) {
        query = query.eq("id_obra", obraId);
      } else if (residenteId) {
        query = query.eq("id_persona_creador", residenteId);
      }

      query = query.order("fecha_creacion", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("[useEstadisticas] Error fetching renta:", error);
        throw error;
      }

      return data || [];
    },
    [residenteId, obraId],
  );

  // Procesar y calcular totales
  const procesarDatos = useCallback((valesMaterial, valesRenta) => {
    // Calcular totales de material
    const totalM3 = valesMaterial.reduce((acc, vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      return (
        acc + (detalle?.volumen_real_m3 || detalle?.cantidad_pedida_m3 || 0)
      );
    }, 0);

    const costoMaterial = valesMaterial.reduce((acc, vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      return acc + (detalle?.costo_total || 0);
    }, 0);

    const totalDistancia = valesMaterial.reduce((acc, vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      return acc + (detalle?.distancia_km || 0);
    }, 0);

    // Calcular totales de renta
    const totalHoras = valesRenta.reduce((acc, vale) => {
      const detalle = vale.vale_renta_detalle?.[0];
      return acc + (detalle?.total_horas || 0);
    }, 0);

    const totalDias = valesRenta.reduce((acc, vale) => {
      const detalle = vale.vale_renta_detalle?.[0];
      return acc + (detalle?.total_dias || 0);
    }, 0);

    const costoRenta = valesRenta.reduce((acc, vale) => {
      const detalle = vale.vale_renta_detalle?.[0];
      return acc + (detalle?.costo_total || 0);
    }, 0);

    const totalViajes = valesMaterial.length + valesRenta.length;
    const costoTotal = costoMaterial + costoRenta;

    return {
      valesMaterial,
      valesRenta,
      totales: {
        totalM3,
        totalHoras,
        totalDias,
        totalViajes,
        totalDistancia,
        costoTotal,
        costoMaterial,
        costoRenta,
      },
    };
  }, []);

  // Cargar datos del periodo actual Y anterior
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener rangos de fechas
      const { fechaInicio, fechaFin } = calcularRangoFechas();
      const { fechaInicio: fechaInicioAnterior, fechaFin: fechaFinAnterior } =
        calcularRangoPeriodoAnterior();

      // Fetch periodo actual Y anterior en paralelo
      const [
        valesMaterial,
        valesRenta,
        valesMaterialAnterior,
        valesRentaAnterior,
      ] = await Promise.all([
        fetchValesMaterial(fechaInicio, fechaFin),
        fetchValesRenta(fechaInicio, fechaFin),
        fetchValesMaterial(fechaInicioAnterior, fechaFinAnterior),
        fetchValesRenta(fechaInicioAnterior, fechaFinAnterior),
      ]);

      // Procesar datos del periodo actual
      const processedData = procesarDatos(valesMaterial, valesRenta);

      // Procesar datos del periodo anterior
      const processedDataAnterior = procesarDatos(
        valesMaterialAnterior,
        valesRentaAnterior,
      );

      // Combinar ambos periodos en el estado
      setData({
        ...processedData,
        periodoAnterior: processedDataAnterior.totales,
      });
    } catch (err) {
      console.error("[useEstadisticas] Error:", err);
      setError(err.message || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, [
    periodo,
    calcularRangoFechas,
    calcularRangoPeriodoAnterior,
    fetchValesMaterial,
    fetchValesRenta,
    procesarDatos,
  ]);

  // Ejecutar al montar o cuando cambien las dependencias
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
  };
};
