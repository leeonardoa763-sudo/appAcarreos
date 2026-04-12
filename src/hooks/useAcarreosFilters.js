// src/hooks/useAcarreosFilters.js

import { useState, useCallback, useMemo, useEffect } from "react";

/**
 * Hook para gestionar filtros de la pantalla de Acarreos.
 *
 * FILTROS:
 * - soloHoy      boolean  — solo vales de hoy
 * - obraId       number   — filtra por obra (null = todas)
 * - materialId   number   — filtra por tipo de material (null = todos)
 * - sindicatoId  number   — filtra por sindicato del operador/vehículo
 * - operadorId   number   — filtra por operador
 * - placas       string   — filtra por placas (búsqueda parcial)
 *
 * PERSISTENCIA:
 * Se mantiene mientras el componente padre no desmonte el hook.
 * Para persistencia entre navegaciones, pasar `persistedFilters` desde
 * un estado en el Navigator o Context.
 *
 * RELACIONES BD:
 * - operadores.id_sindicato → sindicatos.id_sindicato
 * - vehiculos.id_sindicato  → sindicatos.id_sindicato
 * - El filtro de sindicato usa id_operador para cruzar con el catálogo
 *   de operadores que ya se carga en la pantalla.
 */

const FILTROS_INICIALES = {
  soloHoy: false,
  obraId: null,
  obraLabel: null,
  materialId: null,
  materialLabel: null,
  sindicatoId: null,
  sindicatoLabel: null,
  operadorId: null,
  operadorLabel: null,
  placas: null,
};

export const useAcarreosFilters = (
  persistedFilters = null,
  esChecador = false,
) => {
  // DESPUÉS
  const [filters, setFilters] = useState(
    persistedFilters ?? { ...FILTROS_INICIALES, soloHoy: esChecador },
  );

  // Sincronizar soloHoy cuando esChecador cambia de false a true
  // useEffect(() => {
  //   if (esChecador) {
  //     setFilters((prev) => ({ ...prev, soloHoy: true }));
  //   }
  // }, [esChecador]);

  // ─── Setter individual ─────────────────────────────────────────────────────
  // key: nombre del filtro, value: valor, label: texto para mostrar en chip
  const setFilter = useCallback((key, value, label = null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      [`${key}Label`]: label,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...FILTROS_INICIALES });
  }, []);

  // ─── Contador de filtros activos ───────────────────────────────────────────
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.soloHoy) count++;
    if (filters.obraId !== null) count++;
    if (filters.materialId !== null) count++;
    if (filters.sindicatoId !== null) count++;
    if (filters.operadorId !== null) count++;
    if (filters.placas !== null) count++;
    return count;
  }, [filters]);

  // ─── Función principal de filtrado ────────────────────────────────────────
  /**
   * Recibe un array de vales y el catálogo de operadores (para cruzar sindicato).
   * Devuelve solo los vales que pasan todos los filtros activos.
   *
   * @param {Array} vales         - Array de vales (material o renta)
   * @param {Array} operadores    - Catálogo completo de operadores con id_sindicato
   */
  const applyFilters = useCallback(
    (vales, operadores = []) => {
      if (!vales || !Array.isArray(vales)) return [];

      return vales.filter((vale) => {
        // ── Filtro: solo hoy ──────────────────────────────────────────────────
        if (filters.soloHoy) {
          const hoy = new Date();

          const esMismoDia = (fechaISO) => {
            if (!fechaISO) return false;
            // Si viene solo fecha sin hora, construir en local para evitar bug UTC-6
            const fecha = fechaISO.includes("T")
              ? new Date(fechaISO)
              : (() => {
                  const [y, m, d] = fechaISO.split("-").map(Number);
                  return new Date(y, m - 1, d);
                })();
            return (
              fecha.getFullYear() === hoy.getFullYear() &&
              fecha.getMonth() === hoy.getMonth() &&
              fecha.getDate() === hoy.getDate()
            );
          };

          // Renta: usa hora_inicio del detalle
          // Material: usa fecha_programada si existe, sino fecha_creacion
          let fechaReferencia;
          if (vale.tipo_vale === "renta") {
            fechaReferencia = vale.vale_renta_detalle?.[0]?.hora_inicio;
          } else {
            fechaReferencia = vale.fecha_programada ?? vale.fecha_creacion;
          }

          if (!esMismoDia(fechaReferencia)) return false;
        }

        // ── Filtro: obra ──────────────────────────────────────────────────────
        if (filters.obraId !== null) {
          if (vale.id_obra !== filters.obraId) return false;
        }

        // ── Filtro: material ──────────────────────────────────────────────────
        // Solo aplica a vales de tipo material; los de renta los deja pasar
        if (filters.materialId !== null) {
          if (vale.tipo_vale === "material") {
            const tieneMaterial = vale.vale_material_detalles?.some(
              (d) => d.material?.id_material === filters.materialId,
            );
            if (!tieneMaterial) return false;
          }
        }

        // ── Filtro: sindicato ─────────────────────────────────────────────────
        if (filters.sindicatoId !== null) {
          const operadorDelVale = operadores.find(
            (op) => op.id_operador === vale.id_operador,
          );
          const sindicatoOperador = operadorDelVale?.id_sindicato;
          if (sindicatoOperador !== filters.sindicatoId) return false;
        }

        // ── Filtro: operador ──────────────────────────────────────────────────
        if (filters.operadorId !== null) {
          if (vale.id_operador !== filters.operadorId) return false;
        }

        // ── Filtro: placas ────────────────────────────────────────────────────
        if (filters.placas !== null && filters.placas.trim() !== "") {
          const placasVale = vale.vehiculos?.placas?.toLowerCase() || "";
          if (!placasVale.includes(filters.placas.toLowerCase().trim())) {
            return false;
          }
        }

        return true;
      });
    },
    [filters],
  );

  return {
    filters,
    setFilter,
    clearFilters,
    applyFilters,
    activeCount,
  };
};
