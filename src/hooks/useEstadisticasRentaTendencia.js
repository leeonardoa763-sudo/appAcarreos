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
 *    - No afectada por periodo ni obraId
 *    - Eje X: dias (Lun-Dom), Eje Y: viajes
 *    - Filtro interno por sindicato
 *
 * 2. tendenciaPeriodo (filtrable)
 *    - Afectada por periodo y obraId
 *    - Eje X: semanas ISO, Eje Y: viajes
 *    - Una linea por sindicato
 *    - Filtro interno por sindicato
 *
 * Retorna:
 * - semanal: { labels, datasets, sindicatos, loading, error }
 * - periodo: { labels, datasets, sindicatos, loading, error }
 * - sindicatosDisponibles: [{ id, nombre }]
 * - sindicatoIdFiltroSemanal / setSindicatoIdFiltroSemanal
 * - sindicatoIdFiltroPeriodo / setSindicatoIdFiltroPeriodo
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
  const [sindicatoIdFiltroSemanal, setSindicatoIdFiltroSemanal] =
    useState(null);
  const [sindicatoIdFiltroPeriodo, setSindicatoIdFiltroPeriodo] =
    useState(null);

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

      // Grafica 1: siempre por residente, no afectada por obraId
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

      const data = await fetchVales(
        lunes.toISOString(),
        domingo.toISOString(),
        false,
      );

      console.log("[Tendencia Renta Semanal] Vales encontrados:", data.length);

      setValesSemanal(data);
    } catch (err) {
      console.error("[Tendencia Renta Semanal] Error:", err.message);
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

  const getSindicato = (vale) =>
    vale.vale_renta_detalle?.[0]?.sindicatos ?? null;

  /**
   * Convierte vales en datasets para LineChart agrupados por sindicato
   *
   * @param {Array} vales
   * @param {"dia" | "semana"} agrupacion
   * @param {number|null} filtroSindicatoId
   */
  const procesarVales = useCallback(
    (vales, agrupacion, filtroSindicatoId = null) => {
      if (vales.length === 0) {
        return { labels: [], datasets: [], sindicatos: [] };
      }

      // Obtener sindicatos distintos en los vales
      const mapaSindicatos = {};
      vales.forEach((vale) => {
        const sind = getSindicato(vale);
        if (sind && !mapaSindicatos[sind.id_sindicato]) {
          mapaSindicatos[sind.id_sindicato] = sind.sindicato;
        }
      });

      let sindicatosLista = Object.entries(mapaSindicatos).map(
        ([id, nombre]) => ({
          id: Number(id),
          nombre,
        }),
      );

      // Aplicar filtro de sindicato si existe
      if (filtroSindicatoId !== null) {
        sindicatosLista = sindicatosLista.filter(
          (s) => s.id === filtroSindicatoId,
        );
      }

      if (agrupacion === "dia") {
        const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

        const datasets = sindicatosLista.map((sind, idx) => {
          const valores = Array(7).fill(0);

          vales.forEach((vale) => {
            const sind2 = getSindicato(vale);
            if (!sind2 || sind2.id_sindicato !== sind.id) return;

            const fecha = new Date(vale.fecha_creacion);
            const diaIdx = (fecha.getDay() + 6) % 7;
            valores[diaIdx] += 1;
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

        return { labels: DIAS, datasets, sindicatos: sindicatosLista };
      }

      if (agrupacion === "semana") {
        // Semanas ISO unicas ordenadas
        const semanasSet = new Set();
        vales.forEach((vale) => {
          semanasSet.add(getISOWeek(vale.fecha_creacion));
        });
        const semanas = Array.from(semanasSet).sort((a, b) => a - b);
        const labels = semanas.map((s) => String(s));

        console.log("[Tendencia Renta Periodo] Semanas ISO:", semanas);

        const datasets = sindicatosLista.map((sind, idx) => {
          const valores = semanas.map((semana) => {
            return vales.filter((vale) => {
              const sind2 = getSindicato(vale);
              return (
                sind2?.id_sindicato === sind.id &&
                getISOWeek(vale.fecha_creacion) === semana
              );
            }).length;
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

        return { labels, datasets, sindicatos: sindicatosLista };
      }

      return { labels: [], datasets: [], sindicatos: [] };
    },
    [],
  );

  // ─── Datos procesados ──────────────────────────────────────────────────────

  const datosSemanal = useMemo(() => {
    const resultado = procesarVales(
      valesSemanal,
      "dia",
      sindicatoIdFiltroSemanal,
    );

    return resultado;
  }, [valesSemanal, sindicatoIdFiltroSemanal, procesarVales]);

  const datosPeriodo = useMemo(() => {
    const resultado = procesarVales(
      valesPeriodo,
      "semana",
      sindicatoIdFiltroPeriodo,
    );

    return resultado;
  }, [valesPeriodo, sindicatoIdFiltroPeriodo, procesarVales]);

  // ─── Sindicatos disponibles para el selector ───────────────────────────────

  const sindicatosDisponibles = useMemo(() => {
    const mapa = {};
    valesPeriodo.forEach((vale) => {
      const sind = getSindicato(vale);
      if (sind) mapa[sind.id_sindicato] = sind.sindicato;
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
    sindicatosDisponibles,
    sindicatoIdFiltroSemanal,
    setSindicatoIdFiltroSemanal,
    sindicatoIdFiltroPeriodo,
    setSindicatoIdFiltroPeriodo,
    refetchSemanal: fetchSemanal,
    refetchPeriodo: fetchPeriodo,
  };
};
