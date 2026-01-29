// src/hooks/useStatsFilters.js

import { useState, useCallback, useMemo } from "react";

/**
 * Hook para gestionar filtros de estadísticas
 * Filtra datos según materiales, sindicatos y otros criterios
 */
export const useStatsFilters = (data) => {
  const [filters, setFilters] = useState({
    materiales: [],
    sindicatos: [],
    mostrarComparativa: false,
  });

  // Aplicar filtros
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
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
          totalViajes += Number(detalle.numero_viajes || 1);
          costoRenta += Number(detalle.costo_total || 0);
        }
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

    return totales;
  }, [filteredMaterialData, filteredRentaData, filters]);

  // Datos completos filtrados
  const filteredData = useMemo(
    () => ({
      valesMaterial: filteredMaterialData,
      valesRenta: filteredRentaData,
      totales: filteredTotales,
    }),
    [filteredMaterialData, filteredRentaData, filteredTotales],
  );

  // Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    return (
      filters.materiales.length +
      filters.sindicatos.length +
      (filters.mostrarComparativa ? 1 : 0)
    );
  }, [filters]);

  return {
    filters,
    filteredData,
    applyFilters,
    clearFilters,
    activeFiltersCount,
    hasFilters: activeFiltersCount > 0,
  };
};
