// src/hooks/useEstadisticasMaterial.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";

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
        fechaInicio = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate(),
          0,
          0,
          0,
          0,
        );
        fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate(),
          23,
          59,
          59,
          999,
        );
        break;

      case "semana": {
        const diaSemana = (hoy.getDay() + 6) % 7;
        fechaInicio = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate() - diaSemana,
          0,
          0,
          0,
          0,
        );
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
    if (!residenteId) return;

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
            ),
            vale_material_viajes (*)
          )
        `,
        )
        .eq("tipo_vale", "material")
        .in("estado", [
          "aceptado",
          "en_proceso",
          "emitido",
          "verificado",
          "conciliado",
        ])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin);

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

      setVales(data || []);
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
    let totalViajes = 0;
    let totalM3 = 0;
    let costoTotal = 0;
    let totalDistancia = 0;

    vales.forEach((vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      if (!detalle) return;

      const viajes = detalle.vale_material_viajes ?? [];
      totalViajes += viajes.length;

      // Si hay viajes registrados suma el volumen real de cada uno
      // Si no hay viajes aún usa cantidad_pedida_m3 como referencia
      if (viajes.length > 0) {
        viajes.forEach((viaje) => {
          totalM3 += Number(viaje.volumen_m3 || 0);
        });
      } else {
        totalM3 += Number(detalle.cantidad_pedida_m3 || 0);
      }

      costoTotal += Number(detalle.costo_total || 0);
      totalDistancia += Number(detalle.distancia_km || 0);
    });

    return {
      totalViajes,
      totalM3,
      costoTotal,
      totalDistancia,
      totalVales: vales.length,
    };
  }, [vales]);

  // ─── Materiales movidos ────────────────────────────────────────────────────

  const materialesMovidos = useMemo(() => {
    const mapa = {};

    vales.forEach((vale) => {
      const detalle = vale.vale_material_detalles?.[0];
      if (!detalle?.material) return;

      const { id_material, material } = detalle.material;
      const viajes = detalle.vale_material_viajes ?? [];
      const m3Viajes = viajes.reduce(
        (acc, v) => acc + Number(v.volumen_m3 || 0),
        0,
      );
      const m3 =
        viajes.length > 0 ? m3Viajes : Number(detalle.cantidad_pedida_m3 || 0);

      if (!mapa[id_material]) {
        mapa[id_material] = {
          id: id_material,
          nombre: material,
          m3Total: 0,
          viajes: 0,
        };
      }

      mapa[id_material].m3Total += m3;
      mapa[id_material].viajes += viajes.length;
    });

    return Object.values(mapa).sort((a, b) => b.m3Total - a.m3Total);
  }, [vales]);

  // ─── Top operadores ────────────────────────────────────────────────────────

  const topOperadores = useMemo(() => {
    const mapa = {};

    vales.forEach((vale) => {
      const nombre = vale.operadores?.nombre_completo;
      if (!nombre) return;

      const detalle = vale.vale_material_detalles?.[0];
      const viajesDelVale = detalle?.vale_material_viajes?.length ?? 0;

      if (!mapa[nombre]) {
        mapa[nombre] = { nombre, viajes: 0, vales: 0 };
      }
      mapa[nombre].viajes += viajesDelVale;
      mapa[nombre].vales += 1;
    });

    return Object.values(mapa)
      .sort((a, b) => b.viajes - a.viajes)
      .slice(0, 5);
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

    const pieData = materialesMovidos.map((material, index) => ({
      name: material.nombre,
      value: parseFloat(material.m3Total.toFixed(2)),
      color: COLORES[index % COLORES.length],
    }));

    const hoy = new Date();
    const barData = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate() - i,
      );
      const diaStr = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;

      const viajesDelDia = vales.reduce((acc, vale) => {
        const fechaRaw = vale.fecha_creacion;
        if (!fechaRaw) return acc;
        const f = new Date(fechaRaw);
        const fechaStr = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
        if (fechaStr !== diaStr) return acc;
        const detalle = vale.vale_material_detalles?.[0];
        return acc + (detalle?.vale_material_viajes?.length ?? 0);
      }, 0);

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
