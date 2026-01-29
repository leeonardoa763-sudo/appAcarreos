// src/hooks/useFilterCatalogos.js

import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook para obtener catálogos necesarios para filtros
 * Obtiene materiales y sindicatos disponibles
 */
export const useFilterCatalogos = () => {
  const [materiales, setMateriales] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
    try {
      setLoading(true);

      // Fetch materiales
      const { data: materialesData, error: materialesError } = await supabase
        .from("material")
        .select("id_material, material")
        .order("material", { ascending: true });

      if (materialesError) throw materialesError;

      // Fetch sindicatos
      const { data: sindicatosData, error: sindicatosError } = await supabase
        .from("sindicatos")
        .select("id_sindicato, sindicato")
        .order("sindicato", { ascending: true });

      if (sindicatosError) throw sindicatosError;

      // Transformar a formato esperado
      const materialesFormatted = materialesData.map((m) => ({
        id: m.id_material,
        nombre: m.material,
      }));

      const sindicatosFormatted = sindicatosData.map((s) => ({
        id: s.id_sindicato,
        nombre: s.sindicato,
      }));

      setMateriales(materialesFormatted);
      setSindicatos(sindicatosFormatted);
    } catch (err) {
      console.error("[useFilterCatalogos] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    materiales,
    sindicatos,
    loading,
    error,
    refetch: fetchCatalogos,
  };
};
