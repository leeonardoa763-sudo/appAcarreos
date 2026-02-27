// src/hooks/useEstadisticasRenta.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook de estadísticas para vales de RENTA
 *
 * Recibe periodo y obraId como parametros.
 * - Si obraId es null => filtra por residenteId (todas sus obras)
 * - Si obraId tiene valor => filtra por esa obra especifica
 *
 * Devuelve:
 * - vales: array raw de vales con sus detalles
 * - totales: { totalHoras, totalDias, costoTotal, totalVales }
 * - sindicatosUsados: [{ id, nombre, horas, dias, vales }] agrupado
 * - topOperadores: [{ nombre, vales }]
 * - chartData: { pieData, barData }
 * - loading, error, refetch
 */
export const useEstadisticasRenta = (
  periodo = "mes",
  residenteId = null,
  obraId = null,
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vales, setVales] = useState([]);

  // ─── Calcular rango de fechas ──────────────────────────────────────────────

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
        break;
      }
      case "mes":
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
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
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
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
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
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
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

  // ─── Query a Supabase ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!residenteId) {
      console.warn("[useEstadisticasRenta] Sin residenteId, abortando fetch");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { fechaInicio, fechaFin } = calcularRangoFechas();

      let query = supabase
        .from("vales")
        .select(
          `
          id_vale,
          folio,
          fecha_creacion,
          estado,
          id_obra,
          obras!vales_id_obra_fkey (
            obra
          ),
          operadores!vales_id_operador_fkey (
            nombre_completo
          ),
          vale_renta_detalle (
            total_horas,
            total_dias,
            es_renta_por_dia,
            costo_total,
            material!vale_renta_detalle_id_material_fkey (
              id_material,
              material
            ),
            sindicatos!vale_renta_detalle_id_sindicato_fkey (
              id_sindicato,
              sindicato
            )
          )
        `,
        )
        .eq("tipo_vale", "renta")
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin);

      // ── Filtro de obra: una sola fuente de verdad ──
      if (obraId) {
        query = query.eq("id_obra", obraId);
      } else {
        query = query.eq("id_persona_creador", residenteId);
      }

      query = query.order("fecha_creacion", { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      const resultados = data || [];

      if (resultados.length > 0) {
        const obrasEnResultado = [
          ...new Set(resultados.map((v) => v.obras?.obra).filter(Boolean)),
        ];

        const sindicatosEnResultado = [
          ...new Set(
            resultados
              .map((v) => v.vale_renta_detalle?.[0]?.sindicatos?.sindicato)
              .filter(Boolean),
          ),
        ];
      } else {
        console.warn("[useEstadisticasRenta] Sin resultados. Posibles causas:");
        console.warn("  - residenteId incorrecto:", residenteId);
        console.warn(
          "  - obraId no tiene vales de renta en este periodo:",
          obraId,
        );
        console.warn("  - El rango de fechas no coincide con vales existentes");
      }

      setVales(resultados);
    } catch (err) {
      console.error("[useEstadisticasRenta] Error en fetchData:", err.message);
      setError(err.message || "Error al cargar estadísticas de renta");
    } finally {
      setLoading(false);
    }
  }, [periodo, residenteId, obraId, calcularRangoFechas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Totales ───────────────────────────────────────────────────────────────

  const totales = useMemo(() => {
    let totalHoras = 0;
    let totalDias = 0;
    let costoTotal = 0;
    const totalVales = vales.length;

    vales.forEach((vale) => {
      const detalle = vale.vale_renta_detalle?.[0];
      if (!detalle) return;
      totalHoras += Number(detalle.total_horas || 0);
      totalDias += Number(detalle.total_dias || 0);
      costoTotal += Number(detalle.costo_total || 0);
    });

    return { totalHoras, totalDias, costoTotal, totalVales };
  }, [vales]);

  // ─── Sindicatos usados (lista agrupada) ───────────────────────────────────

  const sindicatosUsados = useMemo(() => {
    const mapa = {};

    vales.forEach((vale) => {
      const detalle = vale.vale_renta_detalle?.[0];
      if (!detalle?.sindicatos) return;

      const { id_sindicato, sindicato } = detalle.sindicatos;

      if (!mapa[id_sindicato]) {
        mapa[id_sindicato] = {
          id: id_sindicato,
          nombre: sindicato,
          horas: 0,
          dias: 0,
          vales: 0,
        };
      }

      mapa[id_sindicato].horas += Number(detalle.total_horas || 0);
      mapa[id_sindicato].dias += Number(detalle.total_dias || 0);
      mapa[id_sindicato].vales += 1;
    });

    const lista = Object.values(mapa).sort((a, b) => b.vales - a.vales);

    lista.forEach((s) =>
      console.log(
        `  [Sindicato] ${s.nombre}: ${s.vales} vales | ${s.horas.toFixed(1)} hrs | ${s.dias.toFixed(1)} dias`,
      ),
    );

    return lista;
  }, [vales]);

  // ─── Top operadores ────────────────────────────────────────────────────────

  const topOperadores = useMemo(() => {
    const mapa = {};

    vales.forEach((vale) => {
      const nombre = vale.operadores?.nombre_completo;
      if (!nombre) return;

      if (!mapa[nombre]) {
        mapa[nombre] = { nombre, vales: 0 };
      }
      mapa[nombre].vales += 1;
    });

    const lista = Object.values(mapa)
      .sort((a, b) => b.vales - a.vales)
      .slice(0, 5);

    return lista;
  }, [vales]);

  // ─── Chart data ────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const COLORES = [
      "#004E89",
      "#1A936F",
      "#FF6B35",
      "#F4A261",
      "#457B9D",
      "#E76F51",
      "#2A9D8F",
      "#FDCB6E",
    ];

    // Pie chart: distribucion de vales por sindicato
    const pieData = sindicatosUsados.map((sindicato, index) => ({
      name: sindicato.nombre,
      value: sindicato.vales,
      color: COLORES[index % COLORES.length],
    }));

    // Bar chart: vales por dia (ultimos 7 dias)
    const hoy = new Date();
    const barData = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() - i);
      const diaStr = dia.toISOString().split("T")[0];

      const valesDelDia = vales.filter((vale) => {
        const fechaVale = vale.fecha_creacion?.split("T")[0];
        return fechaVale === diaStr;
      }).length;

      const etiqueta = dia.toLocaleDateString("es-MX", { weekday: "short" });
      barData.push({ label: etiqueta, value: valesDelDia });
    }

    return { pieData, barData };
  }, [sindicatosUsados, vales]);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    vales,
    totales,
    sindicatosUsados,
    topOperadores,
    chartData,
    loading,
    error,
    refetch: fetchData,
  };
};
