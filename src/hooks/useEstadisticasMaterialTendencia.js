// src/hooks/useEstadisticasMaterialTendencia.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook de tendencias para la pestaña de material.
 *
 * Maneja DOS graficas independientes:
 *
 * 1. tendenciaSemanal (fija)
 *    - Siempre la semana ISO en curso (lunes a domingo)
 *    - No afectada por periodo ni obraId ni materialId
 *    - Muestra una linea por cada material
 *
 * 2. tendenciaPeriodo (filtrable)
 *    - Afectada por periodo, obraId y materialId
 *    - Eje X: semanas ISO del rango seleccionado
 *    - Muestra todas las lineas o solo la del material filtrado
 *
 * Retorna:
 * - semanal: { labels, datasets, materiales, loading, error }
 * - periodo: { labels, datasets, materiales, loading, error }
 * - materialIdFiltro: id del material seleccionado en grafica 2
 * - setMaterialIdFiltro: setter para el filtro interno de grafica 2
 */
export const useEstadisticasMaterialTendencia = (
  periodo = "mes",
  residenteId = null,
  obraId = null,
) => {
  const [valesSemanal, setValesSemanal] = useState([]);
  const [valesPeriodo, setValesPeriodo] = useState([]);
  const [loadingSemanal, setLoadingSemanal] = useState(true);
  const [loadingPeriodo, setLoadingPeriodo] = useState(true);
  const [errorSemanal, setErrorSemanal] = useState(null);
  const [errorPeriodo, setErrorPeriodo] = useState(null);
  const [materialIdFiltro, setMaterialIdFiltro] = useState(null);
  const [materialIdFiltroSemanal, setMaterialIdFiltroSemanal] = useState(null);

  // ─── Helpers de fechas ─────────────────────────────────────────────────────

  // Retorna numero de semana ISO de una fecha
  const getISOWeek = (fecha) => {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const semanaUno = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - semanaUno.getTime()) / 86400000 -
          3 +
          ((semanaUno.getDay() + 6) % 7)) /
          7,
      )
    );
  };

  // Lunes de la semana actual
  const getLunesActual = () => {
    const hoy = new Date();
    const diaSemana = (hoy.getDay() + 6) % 7;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  };

  // Rango de fechas segun periodo (igual que useEstadisticasMaterial)
  const getRangoPeriodo = useCallback(() => {
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

  // ─── Query base reutilizable ───────────────────────────────────────────────

  const fetchVales = useCallback(
    async (fechaInicio, fechaFin, filtrarPorObra = false) => {
      let query = supabase
        .from("vales")
        .select(
          `
          id_vale,
          fecha_creacion,
          id_obra,
          vale_material_detalles (
            volumen_real_m3,
            cantidad_pedida_m3,
            material!vale_material_detalles_id_material_fkey (
              id_material,
              material
            )
          )
        `,
        )
        .eq("tipo_vale", "material")
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin);

      // Grafica 1: siempre por residente (todas sus obras, no afectada por obraId)
      // Grafica 2: respeta obraId
      if (filtrarPorObra && obraId) {
        query = query.eq("id_obra", obraId);
      } else if (residenteId) {
        query = query.eq("id_persona_creador", residenteId);
      }

      query = query.order("fecha_creacion", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    [residenteId, obraId],
  );

  // ─── Fetch grafica 1: semana fija ──────────────────────────────────────────

  const fetchSemanal = useCallback(async () => {
    if (!residenteId) return;

    try {
      setLoadingSemanal(true);
      setErrorSemanal(null);

      const lunes = getLunesActual();
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      domingo.setHours(23, 59, 59, 999);

      // filtrarPorObra = false: no le afecta obraId
      const data = await fetchVales(
        lunes.toISOString(),
        domingo.toISOString(),
        false,
      );

      setValesSemanal(data);
    } catch (err) {
      console.error("[Tendencia Semanal] Error:", err.message);
      setErrorSemanal(err.message);
    } finally {
      setLoadingSemanal(false);
    }
  }, [residenteId, fetchVales]);

  // ─── Fetch grafica 2: periodo filtrable ────────────────────────────────────

  const fetchPeriodo = useCallback(async () => {
    if (!residenteId) return;

    try {
      setLoadingPeriodo(true);
      setErrorPeriodo(null);

      const { fechaInicio, fechaFin } = getRangoPeriodo();

      // filtrarPorObra = true: respeta obraId
      const data = await fetchVales(fechaInicio, fechaFin, true);

      setValesPeriodo(data);
    } catch (err) {
      console.error("[Tendencia Periodo] Error:", err.message);
      setErrorPeriodo(err.message);
    } finally {
      setLoadingPeriodo(false);
    }
  }, [residenteId, obraId, periodo, getRangoPeriodo, fetchVales]);

  useEffect(() => {
    fetchSemanal();
  }, [fetchSemanal]);
  useEffect(() => {
    fetchPeriodo();
  }, [fetchPeriodo]);

  // ─── Helpers de procesamiento ──────────────────────────────────────────────

  const COLORES = [
    "#FF6B35",
    "#004E89",
    "#1A936F",
    "#F4A261",
    "#E76F51",
    "#457B9D",
    "#2A9D8F",
    "#FDCB6E",
  ];

  // Extrae m3 de un vale
  const getM3 = (vale) => {
    const detalle = vale.vale_material_detalles?.[0];
    return Number(detalle?.volumen_real_m3 || detalle?.cantidad_pedida_m3 || 0);
  };

  // Extrae info del material de un vale
  const getMaterial = (vale) =>
    vale.vale_material_detalles?.[0]?.material ?? null;

  /**
   * Convierte array de vales en datasets para LineChart
   * agrupados por dia (etiquetas = "Lun", "Mar"...) o semana ISO ("1", "2"...)
   *
   * @param {Array} vales
   * @param {"dia" | "semana"} agrupacion
   * @param {number|null} filtroMaterialId - si se pasa, solo incluye ese material
   */
  const procesarVales = useCallback(
    (vales, agrupacion, filtroMaterialId = null) => {
      if (vales.length === 0) {
        return { labels: [], datasets: [], materiales: [] };
      }

      // Obtener todos los materiales distintos en los vales
      const mapaMaterieles = {};
      vales.forEach((vale) => {
        const mat = getMaterial(vale);
        if (mat && !mapaMaterieles[mat.id_material]) {
          mapaMaterieles[mat.id_material] = mat.material;
        }
      });

      let materialesLista = Object.entries(mapaMaterieles).map(
        ([id, nombre]) => ({
          id: Number(id),
          nombre,
        }),
      );

      // Aplicar filtro de material si existe
      if (filtroMaterialId !== null) {
        materialesLista = materialesLista.filter(
          (m) => m.id === filtroMaterialId,
        );
      }

      // Obtener etiquetas del eje X segun agrupacion
      let labels = [];

      if (agrupacion === "dia") {
        // Lunes a domingo de la semana actual
        const lunes = getLunesActual();
        const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        labels = DIAS;

        const datasets = materialesLista.map((mat, idx) => {
          const valores = Array(7).fill(0);

          vales.forEach((vale) => {
            const mat2 = getMaterial(vale);
            if (!mat2 || mat2.id_material !== mat.id) return;

            const fecha = new Date(vale.fecha_creacion);
            const diaIdx = (fecha.getDay() + 6) % 7; // Lunes = 0
            valores[diaIdx] += getM3(vale);
          });

          return {
            data: valores.map((v) => parseFloat(v.toFixed(2))),
            color: (opacity = 1) => {
              const hex = COLORES[idx % COLORES.length];
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r},${g},${b},${opacity})`;
            },
            strokeWidth: 2,
          };
        });

        return { labels, datasets, materiales: materialesLista };
      }

      if (agrupacion === "semana") {
        // Obtener semanas ISO unicas en los vales, ordenadas
        const semanasSet = new Set();
        vales.forEach((vale) => {
          semanasSet.add(getISOWeek(vale.fecha_creacion));
        });
        const semanas = Array.from(semanasSet).sort((a, b) => a - b);
        labels = semanas.map((s) => String(s));

        console.log("[Tendencia Periodo] Semanas ISO encontradas:", semanas);

        const datasets = materialesLista.map((mat, idx) => {
          const valores = semanas.map((semana) => {
            let m3semana = 0;
            vales.forEach((vale) => {
              const mat2 = getMaterial(vale);
              if (!mat2 || mat2.id_material !== mat.id) return;
              if (getISOWeek(vale.fecha_creacion) !== semana) return;
              m3semana += getM3(vale);
            });
            return parseFloat(m3semana.toFixed(2));
          });

          return {
            data: valores,
            color: (opacity = 1) => {
              const hex = COLORES[idx % COLORES.length];
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r},${g},${b},${opacity})`;
            },
            strokeWidth: 2,
          };
        });

        return { labels, datasets, materiales: materialesLista };
      }

      return { labels: [], datasets: [], materiales: [] };
    },
    [],
  );

  // ─── Datos procesados para cada grafica ────────────────────────────────────

  const datosSemanal = useMemo(() => {
    const resultado = procesarVales(
      valesSemanal,
      "dia",
      materialIdFiltroSemanal,
    );

    return resultado;
  }, [valesSemanal, materialIdFiltroSemanal, procesarVales]);

  const datosPeriodo = useMemo(() => {
    const resultado = procesarVales(valesPeriodo, "semana", materialIdFiltro);

    return resultado;
  }, [valesPeriodo, materialIdFiltro, procesarVales]);

  // ─── Lista de materiales disponibles para el selector de grafica 2 ─────────

  const materialesDisponibles = useMemo(() => {
    const mapa = {};
    valesPeriodo.forEach((vale) => {
      const mat = getMaterial(vale);
      if (mat) mapa[mat.id_material] = mat.material;
    });
    return Object.entries(mapa).map(([id, nombre]) => ({
      id: Number(id),
      nombre,
    }));
  }, [valesPeriodo]);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    semanal: {
      ...datosSemanal,
      loading: loadingSemanal,
      error: errorSemanal,
    },
    periodo: {
      ...datosPeriodo,
      loading: loadingPeriodo,
      error: errorPeriodo,
    },
    materialesDisponibles,
    materialIdFiltro,
    materialIdFiltroSemanal,
    setMaterialIdFiltroSemanal,
    setMaterialIdFiltro,
    refetchSemanal: fetchSemanal,
    refetchPeriodo: fetchPeriodo,
  };
};
