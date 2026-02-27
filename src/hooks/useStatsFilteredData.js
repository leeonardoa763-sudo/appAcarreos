// src/hooks/useStatsFilteredData.js

import { useMemo } from "react";

/**
 * Hook que recibe data real de useEstadisticas y los filtros activos,
 * y devuelve los datos filtrados localmente.
 *
 * Se separa de useStatsFilters para evitar el problema de orden de hooks:
 * useStatsFilters → filters.obraId → useEstadisticas → data → useStatsFilteredData
 */
export const useStatsFilteredData = (data, filters) => {
  const filteredData = useMemo(() => {
    const base = data || {
      valesMaterial: [],
      valesRenta: [],
      totales: {},
      periodoAnterior: {},
    };

    const hayFiltros =
      filters.materialId !== null || filters.sindicatoId !== null;

    if (!hayFiltros) return base;

    console.log("[useStatsFilteredData] Filtrando...");
    console.log("  materialId:", filters.materialId);
    console.log("  sindicatoId:", filters.sindicatoId);
    console.log("  valesMaterial entrada:", base.valesMaterial?.length);
    console.log("  valesRenta entrada:", base.valesRenta?.length);

    let valesMaterial = [...(base.valesMaterial || [])];
    let valesRenta = [...(base.valesRenta || [])];

    // ── Filtro por material ──────────────────────────────────────────────────
    if (filters.materialId !== null) {
      valesMaterial = valesMaterial.filter((vale) =>
        vale.vale_material_detalles?.some(
          (d) => d.material?.id_material === filters.materialId,
        ),
      );
      valesRenta = valesRenta.filter((vale) =>
        vale.vale_renta_detalle?.some(
          (d) => d.material?.id_material === filters.materialId,
        ),
      );
    }

    // ── Filtro por sindicato ─────────────────────────────────────────────────
    if (filters.sindicatoId !== null) {
      valesMaterial = valesMaterial.filter(
        (vale) => vale.vehiculos?.id_sindicato === filters.sindicatoId,
      );
      valesRenta = valesRenta.filter(
        (vale) => vale.vehiculos?.id_sindicato === filters.sindicatoId,
      );
    }

    console.log("  valesMaterial resultado:", valesMaterial.length);
    console.log("  valesRenta resultado:", valesRenta.length);

    // ── Recalcular totales ───────────────────────────────────────────────────
    let totalM3 = 0;
    let totalHoras = 0;
    let totalDias = 0;
    let totalViajes = 0;
    let totalDistancia = 0;
    let costoMaterial = 0;
    let costoRenta = 0;

    valesMaterial.forEach((vale) => {
      vale.vale_material_detalles?.forEach((d) => {
        totalM3 += Number(d.volumen_real_m3 || d.cantidad_pedida_m3 || 0);
        totalViajes += 1;
        costoMaterial += Number(d.costo_total || 0);
        totalDistancia += Number(d.distancia_km || 0);
      });
    });

    valesRenta.forEach((vale) => {
      vale.vale_renta_detalle?.forEach((d) => {
        totalHoras += Number(d.total_horas || 0);
        totalDias += Number(d.total_dias || 0);
        totalViajes += Number(d.numero_viajes || 0);
        costoRenta += Number(d.costo_total || 0);
      });
    });

    return {
      valesMaterial,
      valesRenta,
      periodoAnterior: base.periodoAnterior,
      totales: {
        totalM3,
        totalHoras,
        totalDias,
        totalViajes,
        totalDistancia,
        costoTotal: costoMaterial + costoRenta,
        costoMaterial,
        costoRenta,
      },
    };
  }, [data, filters.materialId, filters.sindicatoId]);

  return filteredData;
};
