// src/hooks/useEstadisticasRentaTendencia.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook de tendencias para la pestaña de renta.
 *
 * Maneja DOS graficas independientes:
 *
 * 1. tendenciaSemanal (fija)
 *    - Siempre la semana ISO en curso (lunes a domingo)
 *    - Eje X: dias (Lun-Dom), Eje Y: viajes
 *    - Una linea por material
 *    - Filtro interno por material
 *
 * 2. tendenciaPeriodo (filtrable)
 *    - Afectada por periodo y obraId
 *    - Eje X: semanas ISO, Eje Y: viajes
 *    - Una linea por material
 *    - Filtro interno por material
 *
 * Retorna:
 * - semanal: { labels, datasets, materiales, loading, error }
 * - periodo: { labels, datasets, materiales, loading, error }
 * - materialesDisponibles: [{ id, nombre }]
 * - materialIdFiltroSemanal / setMaterialIdFiltroSemanal
 * - materialIdFiltroPeriodo / setMaterialIdFiltroPeriodo
 * - refetchSemanal / refetchPeriodo
 */
export const useEstadisticasRentaTendencia = (
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
  const [materialIdFiltroSemanal, setMaterialIdFiltroSemanal] = useState(null);
  const [materialIdFiltroPeriodo, setMaterialIdFiltroPeriodo] = useState(null);

  // ─── Helpers de fechas ─────────────────────────────────────────────────────

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

  const getLunesActual = () => {
    const hoy = new Date();
    const diaSemana = (hoy.getDay() + 6) % 7;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  };

  const getRangoPeriodo = useCallback(() => {
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

  // ─── Query base ────────────────────────────────────────────────────────────

  const fetchVales = useCallback(
    async (fechaInicio, fechaFin, filtrarPorObra = false) => {
      let query = supabase
        .from("vales")
        .select(
          `
          id_vale,
          fecha_creacion,
          id_obra,
          vale_renta_detalle (
            numero_viajes,
            hora_inicio,
            material!vale_renta_detalle_id_material_fkey (
              id_material,
              material
            )
          )
        `,
        )
        .eq("tipo_vale", "renta")
        .in("estado", ["emitido", "verificado", "conciliado"])
        .gte("fecha_creacion", fechaInicio)
        .lte("fecha_creacion", fechaFin);

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

      const data = await fetchVales(
        lunes.toISOString(),
        domingo.toISOString(),
        true,
      );

      setValesSemanal(data);
    } catch (err) {
      console.error("[Tendencia Renta Semanal] Error:", err.message);
      setErrorSemanal(err.message);
    } finally {
      setLoadingSemanal(false);
    }
  }, [residenteId, obraId, fetchVales]);

  // ─── Fetch grafica 2: periodo filtrable ────────────────────────────────────

  const fetchPeriodo = useCallback(async () => {
    if (!residenteId) return;

    try {
      setLoadingPeriodo(true);
      setErrorPeriodo(null);

      const { fechaInicio, fechaFin } = getRangoPeriodo();

      const data = await fetchVales(fechaInicio, fechaFin, true);

      setValesPeriodo(data);
    } catch (err) {
      console.error("[Tendencia Renta Periodo] Error:", err.message);
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

  // ─── Helpers ───────────────────────────────────────────────────────────────

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

  const getMaterial = (vale) => vale.vale_renta_detalle?.[0]?.material ?? null;

  const getViajes = (vale) =>
    Number(vale.vale_renta_detalle?.[0]?.numero_viajes || 1);

  const getFechaOperacional = (vale) =>
    vale.vale_renta_detalle?.[0]?.hora_inicio ?? vale.fecha_creacion;

  /**
   * Convierte vales en datasets para LineChart agrupados por material.
   * Eje Y: numero de viajes (numero_viajes del detalle).
   *
   * @param {Array} vales
   * @param {"dia" | "semana"} agrupacion
   * @param {number|null} filtroMaterialId
   */
  const procesarVales = useCallback(
    (vales, agrupacion, filtroMaterialId = null) => {
      if (vales.length === 0) {
        return { labels: [], datasets: [], materiales: [] };
      }

      // Obtener materiales distintos en los vales
      const mapaMateriales = {};
      vales.forEach((vale) => {
        const mat = getMaterial(vale);
        if (mat && !mapaMateriales[mat.id_material]) {
          mapaMateriales[mat.id_material] = mat.material;
        }
      });

      let materialesLista = Object.entries(mapaMateriales).map(
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

      if (agrupacion === "dia") {
        const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

        const datasets = materialesLista.map((mat, idx) => {
          const valores = Array(7).fill(0);

          vales.forEach((vale) => {
            const mat2 = getMaterial(vale);
            if (!mat2 || mat2.id_material !== mat.id) return;

            const fecha = new Date(getFechaOperacional(vale));
            const diaIdx = (fecha.getDay() + 6) % 7;
            valores[diaIdx] += getViajes(vale);
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

        return { labels: DIAS, datasets, materiales: materialesLista };
      }

      if (agrupacion === "semana") {
        const semanasSet = new Set();
        vales.forEach((vale) => {
          semanasSet.add(getISOWeek(vale.fecha_creacion));
        });
        const semanas = Array.from(semanasSet).sort((a, b) => a - b);
        const labels = semanas.map((s) => String(s));

        const datasets = materialesLista.map((mat, idx) => {
          const valores = semanas.map((semana) => {
            return vales
              .filter((vale) => {
                const mat2 = getMaterial(vale);
                return (
                  mat2?.id_material === mat.id &&
                  getISOWeek(vale.fecha_creacion) === semana
                );
              })
              .reduce((acc, vale) => acc + getViajes(vale), 0);
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

  // ─── Datos procesados ──────────────────────────────────────────────────────

  const datosSemanal = useMemo(() => {
    return procesarVales(valesSemanal, "dia", materialIdFiltroSemanal);
  }, [valesSemanal, materialIdFiltroSemanal, procesarVales]);

  const datosPeriodo = useMemo(() => {
    return procesarVales(valesPeriodo, "semana", materialIdFiltroPeriodo);
  }, [valesPeriodo, materialIdFiltroPeriodo, procesarVales]);

  // ─── Materiales disponibles para el selector ──────────────────────────────

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
    materialIdFiltroSemanal,
    setMaterialIdFiltroSemanal,
    materialIdFiltroPeriodo,
    setMaterialIdFiltroPeriodo,
    refetchSemanal: fetchSemanal,
    refetchPeriodo: fetchPeriodo,
  };
};
