// src/hooks/useEstadisticasMaterial.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook de estadísticas para vales de MATERIAL
 *
 * Recibe periodo y obraId como parametros.
 * - Si obraId es null => filtra por residenteId (todas sus obras)
 * - Si obraId tiene valor => filtra por esa obra especifica
 *
 * Devuelve:
 * - vales: array raw de vales con sus detalles
 * - totales: { totalM3, costoTotal, totalDistancia, totalViajes }
 * - materialesMovidos: [{ id, nombre, m3Total, viajes }]
 * - topOperadores: [{ nombre, viajes }]
 * - chartData: { pieData, barData }
 * - loading, error, refetch
 */
export const useEstadisticasMaterial = (
  periodo = "mes",
  residenteId = null,
  obraId = null,
  obrasIds = [],
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vales, setVales] = useState([]);

  // ─── Calcular rango de fechas ──────────────────────────────────────────────

  const calcularRangoFechas = useCallback(() => {
    const hoy = new Date();
    let fechaInicio, fechaFin;

    switch (periodo) {
      case "hoy":
        fechaInicio = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(hoy);
        fechaFin.setHours(23, 59, 59, 999);
        break;

      case "semana": {
        const diaSemana = (hoy.getDay() + 6) % 7; // Lunes = 0
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
        // Ultimos 3 meses completos incluyendo el actual
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
      console.warn(
        "[useEstadisticasMaterial] Sin residenteId, abortando fetch",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { fechaInicio, fechaFin } = calcularRangoFechas();

      // ── LOG: parametros de la query ──
      //   console.log("[useEstadisticasMaterial] ====== INICIO FETCH ======");
      //   console.log("[useEstadisticasMaterial] Periodo:", periodo);
      //   console.log("[useEstadisticasMaterial] ResidenteId:", residenteId);
      //   console.log(
      //     "[useEstadisticasMaterial] ObraId:",
      //     obraId ?? "null (todas las obras)",
      //   );
      //   console.log("[useEstadisticasMaterial] Fecha inicio:", fechaInicio);
      //   console.log("[useEstadisticasMaterial] Fecha fin:  ", fechaFin);

      let query = supabase
        .from("vales")
        .select(
          `
          id_vale,
          folio,
          fecha_creacion,
          fecha_completado,
          estado,
          id_obra,
          obras!vales_id_obra_fkey (
            obra
          ),
          operadores!vales_id_operador_fkey (
            nombre_completo
          ),
          vale_material_detalles (
            cantidad_pedida_m3,
            volumen_real_m3,
            costo_total,
            distancia_km,
            requisicion,
            material!vale_material_detalles_id_material_fkey (
              id_material,
              material
            )
          )
        `,
        )
        .eq("tipo_vale", "material")
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_completado", fechaInicio)
        .lte("fecha_completado", fechaFin);

      // ── Filtro de obra: una sola fuente de verdad ──
      if (obraId) {
        query = query.eq("id_obra", obraId);
      } else if (obrasIds?.length > 0) {
        query = query.in("id_obra", obrasIds);
      } else {
        query = query.eq("id_persona_creador", residenteId);
      }

      query = query.order("fecha_creacion", { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      const resultados = data || [];

      // ── LOG: resultado raw ──

      if (resultados.length > 0) {
        // console.log("[useEstadisticasMaterial] Ejemplo primer vale:", {
        //   folio: resultados[0].folio,
        //   fecha: resultados[0].fecha_creacion,
        //   obra: resultados[0].obras?.obra,
        //   estado: resultados[0].estado,
        //   detalle: resultados[0].vale_material_detalles?.[0],
        // });

        const obrasEnResultado = [
          ...new Set(resultados.map((v) => v.obras?.obra).filter(Boolean)),
        ];
        console.log(
          "[useEstadisticasMaterial] Obras distintas en resultado:",
          obrasEnResultado,
        );

        const materialesEnResultado = [
          ...new Set(
            resultados
              .map((v) => v.vale_material_detalles?.[0]?.material?.material)
              .filter(Boolean),
          ),
        ];
      } else {
        console.warn(
          "[useEstadisticasMaterial] Sin resultados. Posibles causas:",
        );
        console.warn("  - residenteId incorrecto:", residenteId);
        console.warn("  - obraId no tiene vales en este periodo:", obraId);
        console.warn("  - El rango de fechas no coincide con vales existentes");
        console.warn(
          "  - Los estados de los vales no incluyen emitido/verificado/conciliado",
        );
      }

      setVales(resultados);
    } catch (err) {
      console.error(
        "[useEstadisticasMaterial] Error en fetchData:",
        err.message,
      );
      setError(err.message || "Error al cargar estadísticas de material");
    } finally {
      setLoading(false);
    }
  }, [periodo, residenteId, obraId, obrasIds, calcularRangoFechas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Totales ───────────────────────────────────────────────────────────────

  const totales = useMemo(() => {
    let totalM3 = 0;
    let costoTotal = 0;
    let totalDistancia = 0;
    const totalViajes = vales.length;

    vales.forEach((vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      if (!detalle) return;
      totalM3 += Number(
        detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
      );
      costoTotal += Number(detalle.costo_total || 0);
      totalDistancia += Number(detalle.distancia_km || 0);
    });

    // console.log("[useEstadisticasMaterial] Totales calculados:", {
    //   totalM3: totalM3.toFixed(2),
    //   costoTotal: costoTotal.toFixed(2),
    //   totalDistancia: totalDistancia.toFixed(2),
    //   totalViajes,
    // });

    return { totalM3, costoTotal, totalDistancia, totalViajes };
  }, [vales]);

  // ─── Materiales movidos (lista agrupada por material) ─────────────────────

  const materialesMovidos = useMemo(() => {
    const mapa = {};

    vales.forEach((vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      if (!detalle?.material) return;

      const { id_material, material } = detalle.material;
      const m3 = Number(
        detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0,
      );

      if (!mapa[id_material]) {
        mapa[id_material] = {
          id: id_material,
          nombre: material,
          m3Total: 0,
          viajes: 0,
        };
      }

      mapa[id_material].m3Total += m3;
      mapa[id_material].viajes += 1;
    });

    const lista = Object.values(mapa).sort((a, b) => b.m3Total - a.m3Total);

    // console.log(
    //   "[useEstadisticasMaterial] Materiales agrupados:",
    //   lista.length,
    //   "tipos",
    // );
    // lista.forEach((m) =>
    //   console.log(
    //     `  [Material] ${m.nombre}: ${m.m3Total.toFixed(2)} m3 | ${m.viajes} viajes`,
    //   ),
    // );

    return lista;
  }, [vales]);

  // ─── Top operadores ────────────────────────────────────────────────────────

  const topOperadores = useMemo(() => {
    const mapa = {};

    vales.forEach((vale) => {
      const nombre = vale.operadores?.nombre_completo;
      if (!nombre) return;

      if (!mapa[nombre]) {
        mapa[nombre] = { nombre, viajes: 0 };
      }
      mapa[nombre].viajes += 1;
    });

    const lista = Object.values(mapa)
      .sort((a, b) => b.viajes - a.viajes)
      .slice(0, 5);

    return lista;
  }, [vales]);

  // ─── Chart data ────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const COLORES = [
      "#FF6B35",
      "#004E89",
      "#1A936F",
      "#F4A261",
      "#E76F51",
      "#457B9D",
      "#2A9D8F",
    ];

    // Pie chart: distribucion de m3 por material
    const pieData = materialesMovidos.map((material, index) => ({
      name: material.nombre,
      value: parseFloat(material.m3Total.toFixed(2)),
      color: COLORES[index % COLORES.length],
    }));

    // Bar chart: viajes por dia (ultimos 7 dias)
    const hoy = new Date();
    const barData = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() - i);
      const diaStr = dia.toISOString().split("T")[0];

      const viajesDelDia = vales.filter((vale) => {
        const fechaVale = vale.fecha_creacion?.split("T")[0];
        return fechaVale === diaStr;
      }).length;

      const etiqueta = dia.toLocaleDateString("es-MX", { weekday: "short" });
      barData.push({ label: etiqueta, value: viajesDelDia });
    }

    return { pieData, barData };
  }, [materialesMovidos, vales]);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    vales,
    totales,
    materialesMovidos,
    topOperadores,
    chartData,
    loading,
    error,
    refetch: fetchData,
  };
};
