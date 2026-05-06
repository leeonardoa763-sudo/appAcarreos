// src/hooks/useEstadisticasRenta.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";

const ESTADOS_RENTA = [
  "aceptado",
  "en_proceso",
  "emitido",
  "verificado",
  "conciliado",
];
const PERIODOS_DIRECTOS = new Set(["hoy", "ayer", "semana"]);

// Rango ISO local para periodos cortos — consultan vales directamente
const rangoFechaDirecto = (periodo) => {
  const hoy = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const iso = (d, fin) =>
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${fin ? "23:59:59" : "00:00:00"}`;

  if (periodo === "hoy") return [iso(hoy, false), iso(hoy, true)];
  if (periodo === "ayer") {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
    return [iso(d, false), iso(d, true)];
  }
  // "semana" — últimos 7 días
  const ini = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
  return [iso(ini, false), iso(hoy, true)];
};

// Rango de primer día de mes para periodos largos — consultan la matview
const rangoMesMatview = (periodo) => {
  const hoy = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const primerDia = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-01`;

  if (periodo === "trimestre") {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    return [primerDia(ini), primerDia(hoy)];
  }
  if (periodo === "semestre") {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
    return [primerDia(ini), primerDia(hoy)];
  }
  if (periodo === "año") {
    return [`${hoy.getFullYear()}-01-01`, `${hoy.getFullYear()}-12-01`];
  }
  // "mes"
  return [primerDia(hoy), primerDia(hoy)];
};

export const useEstadisticasRenta = (
  periodo = "mes",
  residenteId = null,
  obraId = null,
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowsMatview, setRowsMatview] = useState([]);
  const [valesBar, setValesBar] = useState([]);

  const fetchData = useCallback(async () => {
    if (!residenteId) return;
    if (!obraId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ── Query bar: últimos 7 días siempre (independiente del periodo) ────────
      const hoy = new Date();
      const hace7Dias = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
      const toLocalISO = (d) => {
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00:00`;
      };

      const qBar = supabase
        .from("vales")
        .select("id_vale, fecha_creacion")
        .eq("tipo_vale", "renta")
        .in("estado", ESTADOS_RENTA)
        .gte("fecha_creacion", toLocalISO(hace7Dias))
        .eq("id_obra", obraId);

      let filasPromise;

      if (PERIODOS_DIRECTOS.has(periodo)) {
        // ── Periodos cortos: query directa a vales con fecha exacta ────────────
        const [fechaInicio, fechaFin] = rangoFechaDirecto(periodo);

        filasPromise = supabase
          .from("vales")
          .select("id_vale, vale_renta_detalle(total_horas, total_dias, costo_total)")
          .eq("tipo_vale", "renta")
          .in("estado", ESTADOS_RENTA)
          .gte("fecha_creacion", fechaInicio)
          .lte("fecha_creacion", fechaFin)
          .eq("id_obra", obraId);
      } else {
        // ── Periodos largos: matview pre-agregada por mes ─────────────────────
        const [mesInicio, mesFin] = rangoMesMatview(periodo);

        filasPromise = supabase
          .from("mv_stats_renta")
          .select("total_vales, total_horas, total_dias, costo_total")
          .gte("mes", mesInicio)
          .lte("mes", mesFin)
          .eq("id_obra", obraId);
      }

      const [{ data: filasRaw, error: errFilas }, { data: bares, error: errBar }] =
        await Promise.all([filasPromise, qBar]);

      if (errFilas) throw errFilas;
      if (errBar) throw errBar;

      let filas;
      if (PERIODOS_DIRECTOS.has(periodo)) {
        const resumen = { total_vales: 0, total_horas: 0, total_dias: 0, costo_total: 0 };
        (filasRaw || []).forEach((vale) => {
          resumen.total_vales++;
          (vale.vale_renta_detalle || []).forEach((det) => {
            resumen.total_horas += Number(det.total_horas ?? 0);
            resumen.total_dias  += Number(det.total_dias  ?? 0);
            resumen.costo_total += Number(det.costo_total ?? 0);
          });
        });
        filas = [resumen];
      } else {
        filas = filasRaw || [];
      }

      setRowsMatview(filas);
      setValesBar(bares || []);
    } catch (err) {
      setError(err.message || "Error al cargar estadísticas de renta");
    } finally {
      setLoading(false);
    }
  }, [periodo, residenteId, obraId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Totales ───────────────────────────────────────────────────────────────

  const totales = useMemo(() => {
    let totalHoras = 0;
    let totalDias = 0;
    let costoTotal = 0;
    let totalVales = 0;

    rowsMatview.forEach((r) => {
      totalHoras += Number(r.total_horas || 0);
      totalDias  += Number(r.total_dias  || 0);
      costoTotal += Number(r.costo_total || 0);
      totalVales += Number(r.total_vales || 0);
    });

    return { totalHoras, totalDias, costoTotal, totalVales };
  }, [rowsMatview]);

  // ─── Chart data ────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const hoy = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const toLocalDate = (d) =>
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

    const barData = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const diaStr = toLocalDate(dia);

      const valesDelDia = valesBar.filter((v) => {
        const f = new Date(v.fecha_creacion);
        return toLocalDate(f) === diaStr;
      }).length;

      barData.push({
        label: dia.toLocaleDateString("es-MX", { weekday: "short" }),
        value: valesDelDia,
      });
    }

    return { pieData: [], barData };
  }, [valesBar]);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    vales: [],
    totales,
    sindicatosUsados: [],
    materialesMovidos: [],
    topOperadores: [],
    chartData,
    loading,
    error,
    refetch: fetchData,
  };
};
