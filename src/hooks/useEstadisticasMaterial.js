// src/hooks/useEstadisticasMaterial.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";
import { statsColors } from "../config/statsColors";

const ESTADOS_MATERIAL = ["en_proceso", "emitido", "verificado", "conciliado"];
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

// Convierte vales con detalles anidados al mismo shape que filas de mv_stats_material
const valesAFilasMaterial = (vales) => {
  const mapa = {};
  vales.forEach((vale) => {
    (vale.vale_material_detalles || []).forEach((det) => {
      const k = det.id_material;
      if (!mapa[k]) {
        mapa[k] = {
          id_material: k,
          nombre_material: det.material?.material ?? String(k),
          _ids: new Set(),
          m3_total: 0,
          costo_total: 0,
          total_viajes: 0,
        };
      }
      mapa[k]._ids.add(vale.id_vale);
      mapa[k].m3_total += Number(det.volumen_real_m3 ?? det.cantidad_pedida_m3 ?? 0);
      mapa[k].costo_total += Number(det.costo_total ?? 0);
      mapa[k].total_viajes += det.vale_material_viajes?.length ?? 0;
    });
  });
  return Object.values(mapa).map(({ _ids, ...r }) => ({
    ...r,
    total_vales: _ids.size,
  }));
};

export const useEstadisticasMaterial = (
  periodo = "mes",
  residenteId = null,
  obraId = null,
  obrasIds = [],
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowsMatview, setRowsMatview] = useState([]);
  const [valesBar, setValesBar] = useState([]);

  const fetchData = useCallback(async () => {
    if (!residenteId) return;
    if (!obraId && (!obrasIds || obrasIds.length === 0)) {
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

      let qBar = supabase
        .from("vales")
        .select(
          "fecha_creacion, fecha_completado, vale_material_detalles(vale_material_viajes(id_viaje))",
        )
        .eq("tipo_vale", "material")
        .in("estado", ESTADOS_MATERIAL)
        .gte("fecha_creacion", toLocalISO(hace7Dias));

      if (obraId) qBar = qBar.eq("id_obra", obraId);
      else qBar = qBar.in("id_obra", obrasIds);

      let filasPromise;

      if (PERIODOS_DIRECTOS.has(periodo)) {
        // ── Periodos cortos: query directa a vales con fecha exacta ────────────
        const [fechaInicio, fechaFin] = rangoFechaDirecto(periodo);

        let qDirect = supabase
          .from("vales")
          .select(`
            id_vale,
            vale_material_detalles(
              id_material,
              material:material(material),
              volumen_real_m3,
              cantidad_pedida_m3,
              costo_total,
              vale_material_viajes(id_viaje)
            )
          `)
          .eq("tipo_vale", "material")
          .in("estado", ESTADOS_MATERIAL)
          .gte("fecha_creacion", fechaInicio)
          .lte("fecha_creacion", fechaFin);

        if (obraId) qDirect = qDirect.eq("id_obra", obraId);
        else qDirect = qDirect.in("id_obra", obrasIds);

        filasPromise = qDirect;
      } else {
        // ── Periodos largos: matview pre-agregada por mes ─────────────────────
        const [mesInicio, mesFin] = rangoMesMatview(periodo);

        let qMv = supabase
          .from("mv_stats_material")
          .select(
            "id_material, nombre_material, total_vales, m3_total, costo_total, total_viajes",
          )
          .gte("mes", mesInicio)
          .lte("mes", mesFin);

        if (obraId) qMv = qMv.eq("id_obra", obraId);
        else qMv = qMv.in("id_obra", obrasIds);

        filasPromise = qMv;
      }

      const [{ data: filasRaw, error: errFilas }, { data: bares, error: errBar }] =
        await Promise.all([filasPromise, qBar]);

      if (errFilas) throw errFilas;
      if (errBar) throw errBar;

      const filas = PERIODOS_DIRECTOS.has(periodo)
        ? valesAFilasMaterial(filasRaw || [])
        : filasRaw || [];

      setRowsMatview(filas);
      setValesBar(bares || []);
    } catch (err) {
      setError(err.message || "Error al cargar estadísticas de material");
    } finally {
      setLoading(false);
    }
  }, [periodo, residenteId, obraId, obrasIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Totales ───────────────────────────────────────────────────────────────

  const totales = useMemo(() => {
    let totalViajes = 0;
    let totalM3 = 0;
    let costoTotal = 0;
    let totalVales = 0;

    rowsMatview.forEach((r) => {
      totalViajes += Number(r.total_viajes || 0);
      totalM3 += Number(r.m3_total || 0);
      costoTotal += Number(r.costo_total || 0);
      totalVales += Number(r.total_vales || 0);
    });

    return { totalViajes, totalM3, costoTotal, totalDistancia: 0, totalVales };
  }, [rowsMatview]);

  // ─── Materiales movidos ────────────────────────────────────────────────────

  const materialesMovidos = useMemo(() => {
    const mapa = {};

    rowsMatview.forEach((r) => {
      if (!r.id_material) return;
      if (!mapa[r.id_material]) {
        mapa[r.id_material] = {
          id: r.id_material,
          nombre: r.nombre_material,
          m3Total: 0,
          viajes: 0,
        };
      }
      mapa[r.id_material].m3Total += Number(r.m3_total || 0);
      mapa[r.id_material].viajes += Number(r.total_viajes || 0);
    });

    return Object.values(mapa).sort((a, b) => b.m3Total - a.m3Total);
  }, [rowsMatview]);

  // ─── Chart data ────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const palette = statsColors.chartPalette;

    const pieData = materialesMovidos.map((mat, i) => ({
      name: mat.nombre,
      value: parseFloat(mat.m3Total.toFixed(2)),
      color: palette[i % palette.length],
    }));

    const hoy = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const toLocalDate = (d) =>
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

    const barData = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const diaStr = toLocalDate(dia);

      const viajesDelDia = valesBar.reduce((acc, vale) => {
        const fechaRaw = vale.fecha_completado ?? vale.fecha_creacion;
        if (!fechaRaw) return acc;
        const fechaLocal = new Date(fechaRaw);
        if (toLocalDate(fechaLocal) !== diaStr) return acc;
        const viajes = (vale.vale_material_detalles || []).reduce(
          (sum, det) => sum + (det.vale_material_viajes?.length ?? 0),
          0,
        );
        return acc + viajes;
      }, 0);

      barData.push({
        label: dia.toLocaleDateString("es-MX", { weekday: "short" }),
        value: viajesDelDia,
      });
    }

    return { pieData, barData };
  }, [materialesMovidos, valesBar]);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    vales: [],
    totales,
    materialesMovidos,
    topOperadores: [],
    chartData,
    loading,
    error,
    refetch: fetchData,
  };
};
