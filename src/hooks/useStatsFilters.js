// src/hooks/useStatsFilters.js

import { useState, useCallback, useMemo } from "react";

/**
 * Hook para gestionar filtros de estadísticas
 * Filtra datos según obra, materiales, sindicatos y otros criterios
 */
export const useStatsFilters = (data) => {
  const [filters, setFilters] = useState({
    obraId: null,
    materiales: [],
    sindicatos: [],
    mostrarComparativa: false,
  });

  // Aplicar filtros
  const applyFilters = useCallback((newFilters) => {
    console.log("[useStatsFilters] Aplicando filtros:", newFilters);
    setFilters(newFilters);
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    console.log("[useStatsFilters] Limpiando filtros");
    setFilters({
      obraId: null,
      materiales: [],
      sindicatos: [],
      mostrarComparativa: false,
    });
  }, []);

  // Datos filtrados de material
  const filteredMaterialData = useMemo(() => {
    if (!data.valesMaterial) return [];

    let filtered = [...data.valesMaterial];

    // Filtrar por materiales seleccionados
    if (filters.materiales.length > 0) {
      filtered = filtered.filter((vale) =>
        vale.vale_material_detalles?.some((detalle) =>
          filters.materiales.includes(detalle.material?.id_material),
        ),
      );
    }

    return filtered;
  }, [data.valesMaterial, filters.materiales]);

  // Datos filtrados de renta
  const filteredRentaData = useMemo(() => {
    if (!data.valesRenta) return [];

    let filtered = [...data.valesRenta];

    // Filtrar por sindicatos si es necesario
    if (filters.sindicatos.length > 0) {
      filtered = filtered.filter((vale) =>
        vale.vale_renta_detalle?.some((detalle) =>
          filters.sindicatos.includes(detalle.id_sindicato),
        ),
      );
    }

    return filtered;
  }, [data.valesRenta, filters.sindicatos]);

  // Recalcular totales con datos filtrados
  const filteredTotales = useMemo(() => {
    let totalM3 = 0;
    let totalHoras = 0;
    let totalDias = 0;
    let totalViajes = 0;
    let costoMaterial = 0;
    let costoRenta = 0;
    let totalDistancia = 0;

    // Sumar material filtrado
    filteredMaterialData.forEach((vale) => {
      vale.vale_material_detalles?.forEach((detalle) => {
        // Si hay filtro de materiales, solo contar los seleccionados
        if (
          filters.materiales.length === 0 ||
          filters.materiales.includes(detalle.material?.id_material)
        ) {
          totalM3 += Number(
            detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
          );
          totalViajes += 1;
          costoMaterial += Number(detalle.costo_total || 0);
          totalDistancia += Number(detalle.distancia_km || 0);
        }
      });
    });

    // Sumar renta filtrada
    filteredRentaData.forEach((vale) => {
      vale.vale_renta_detalle?.forEach((detalle) => {
        // Si hay filtro de sindicatos, solo contar los seleccionados
        if (
          filters.sindicatos.length === 0 ||
          filters.sindicatos.includes(detalle.id_sindicato)
        ) {
          totalHoras += Number(detalle.total_horas || 0);
          totalDias += Number(detalle.total_dias || 0);
          totalViajes += Number(detalle.numero_viajes || 0);
          costoRenta += Number(detalle.costo_total || 0);
        }
      });
    });

    const costoTotal = costoMaterial + costoRenta;

    return {
      totalM3,
      totalHoras,
      totalDias,
      totalViajes,
      totalDistancia,
      costoTotal,
      costoMaterial,
      costoRenta,
    };
  }, [filteredMaterialData, filteredRentaData, filters]);

  // Datos filtrados completos
  const filteredData = useMemo(() => {
    return {
      valesMaterial: filteredMaterialData,
      valesRenta: filteredRentaData,
      totales: filteredTotales,
    };
  }, [filteredMaterialData, filteredRentaData, filteredTotales]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    // No contar obraId como filtro activo si es null (todas las obras)
    // Solo cuenta como filtro si se seleccionó una obra específica
    if (filters.obraId !== null) count += 1;

    count += filters.materiales.length;
    count += filters.sindicatos.length;
    if (filters.mostrarComparativa) count += 1;

    return count;
  }, [filters]);

  // Verificar si hay filtros activos
  const hasFilters = useMemo(() => {
    return (
      filters.materiales.length > 0 ||
      filters.sindicatos.length > 0 ||
      filters.mostrarComparativa
    );
  }, [filters]);

  return {
    filters,
    filteredData,
    applyFilters,
    clearFilters,
    activeFiltersCount,
    hasFilters,
  };
};
