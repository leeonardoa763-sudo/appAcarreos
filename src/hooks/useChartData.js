// src/hooks/useChartData.js

import { useMemo } from "react";
import { statsColors } from "../config/statsColors";

/**
 * Hook para transformar datos de estadísticas a formato de gráficos
 * Procesa datos de vales y los convierte en estructuras listas para Chart Kit
 */
export const useChartData = (data) => {
  // Distribución de m³ por tipo de material (Gráfico de Pastel)
  const materialPieData = useMemo(() => {
    const materialMap = new Map();

    data.valesMaterial.forEach((vale) => {
      vale.vale_material_detalles?.forEach((detalle) => {
        const materialNombre = detalle.material?.material || "Otros";
        const m3 = Number(
          detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
        );

        if (materialMap.has(materialNombre)) {
          materialMap.set(materialNombre, materialMap.get(materialNombre) + m3);
        } else {
          materialMap.set(materialNombre, m3);
        }
      });
    });

    const chartData = Array.from(materialMap.entries())
      .map(([name, value], index) => ({
        name,
        value: Math.round(value * 100) / 100,
        color:
          statsColors.chartPalette[index % statsColors.chartPalette.length],
        legendFontColor: "#2C3E50",
        legendFontSize: 13,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 materiales

    return chartData;
  }, [data.valesMaterial]);

  // Distribución de costos Material vs Renta (Gráfico de Pastel)
  const costoPieData = useMemo(() => {
    const costoMaterial = data.totales.costoMaterial;
    const costoRenta = data.totales.costoRenta;

    if (costoMaterial === 0 && costoRenta === 0) {
      return [];
    }

    return [
      {
        name: "Material",
        value: costoMaterial,
        color: statsColors.gradients.material[0],
        legendFontColor: "#2C3E50",
        legendFontSize: 13,
      },
      {
        name: "Renta",
        value: costoRenta,
        color: statsColors.gradients.rental[0],
        legendFontColor: "#2C3E50",
        legendFontSize: 13,
      },
    ];
  }, [data.totales]);

  // Distribución por sindicato (Gráfico de Pastel)
  const sindicatoPieData = useMemo(() => {
    const sindicatoMap = new Map();

    // Contar vales de material por sindicato
    data.valesMaterial.forEach((vale) => {
      vale.vale_material_detalles?.forEach((detalle) => {
        const sindicato = "General"; // Ajustar según tu estructura de datos
        const m3 = Number(
          detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
        );

        if (sindicatoMap.has(sindicato)) {
          sindicatoMap.set(sindicato, sindicatoMap.get(sindicato) + m3);
        } else {
          sindicatoMap.set(sindicato, m3);
        }
      });
    });

    const chartData = Array.from(sindicatoMap.entries())
      .map(([name, value], index) => ({
        name,
        value: Math.round(value * 100) / 100,
        color:
          statsColors.chartPalette[index % statsColors.chartPalette.length],
        legendFontColor: "#2C3E50",
        legendFontSize: 13,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.valesMaterial]);

  // Tendencia temporal de m³ por semana (Gráfico de Línea/Barras)
  const tendenciaM3Data = useMemo(() => {
    const weekMap = new Map();

    data.valesMaterial.forEach((vale) => {
      const fecha = new Date(vale.fecha_creacion);
      const weekKey = `Sem ${getWeekNumber(fecha)}`;

      vale.vale_material_detalles?.forEach((detalle) => {
        const m3 = Number(
          detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
        );

        if (weekMap.has(weekKey)) {
          weekMap.set(weekKey, weekMap.get(weekKey) + m3);
        } else {
          weekMap.set(weekKey, m3);
        }
      });
    });

    const sortedEntries = Array.from(weekMap.entries()).sort((a, b) => {
      const weekA = parseInt(a[0].replace("Sem ", ""));
      const weekB = parseInt(b[0].replace("Sem ", ""));
      return weekA - weekB;
    });

    const labels = sortedEntries.map(([week]) => week);
    const values = sortedEntries.map(
      ([, value]) => Math.round(value * 10) / 10,
    );

    return {
      labels,
      datasets: [
        {
          data: values.length > 0 ? values : [0],
        },
      ],
    };
  }, [data.valesMaterial]);

  // Tendencia temporal de horas de renta por semana
  const tendenciaHorasData = useMemo(() => {
    const weekMap = new Map();

    data.valesRenta.forEach((vale) => {
      const fecha = new Date(vale.fecha_creacion);
      const weekKey = `Sem ${getWeekNumber(fecha)}`;

      vale.vale_renta_detalle?.forEach((detalle) => {
        const horas = Number(detalle.total_horas || 0);

        if (weekMap.has(weekKey)) {
          weekMap.set(weekKey, weekMap.get(weekKey) + horas);
        } else {
          weekMap.set(weekKey, horas);
        }
      });
    });

    const sortedEntries = Array.from(weekMap.entries()).sort((a, b) => {
      const weekA = parseInt(a[0].replace("Sem ", ""));
      const weekB = parseInt(b[0].replace("Sem ", ""));
      return weekA - weekB;
    });

    const labels = sortedEntries.map(([week]) => week);
    const values = sortedEntries.map(
      ([, value]) => Math.round(value * 10) / 10,
    );

    return {
      labels,
      datasets: [
        {
          data: values.length > 0 ? values : [0],
        },
      ],
    };
  }, [data.valesRenta]);

  // Top 5 operadores más activos
  const topOperadoresData = useMemo(() => {
    const operadorMap = new Map();

    // Contar vales de material
    data.valesMaterial.forEach((vale) => {
      const operador = vale.operadores?.nombre_completo || "Sin Operador";
      operadorMap.set(operador, (operadorMap.get(operador) || 0) + 1);
    });

    // Contar vales de renta
    data.valesRenta.forEach((vale) => {
      const operador = vale.operadores?.nombre_completo || "Sin Operador";
      operadorMap.set(operador, (operadorMap.get(operador) || 0) + 1);
    });

    // Filtrar "Sin Operador" si existe y hay otros operadores
    const entries = Array.from(operadorMap.entries());
    const filteredEntries =
      entries.length > 1
        ? entries.filter(([nombre]) => nombre !== "Sin Operador")
        : entries;

    const topOperadores = filteredEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, viajes]) => ({ nombre, viajes }));

    return topOperadores;
  }, [data.valesMaterial, data.valesRenta]);

  return {
    materialPieData,
    costoPieData,
    sindicatoPieData,
    tendenciaM3Data,
    tendenciaHorasData,
    topOperadoresData,
  };
};

/**
 * Obtener número de semana del año
 */
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
