// src/hooks/useFilterCatalogos.js

import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { getCached, setCached } from "../utils/storageUtils";

const TTL_MATERIALES = 4 * 3600 * 1000;
const TTL_SINDICATOS = 24 * 3600 * 1000;

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

      await Promise.all([
        (async () => {
          const cached = await getCached("cat_filter_materiales", TTL_MATERIALES);
          if (cached) { setMateriales(cached); return; }
          const { data, error } = await supabase
            .from("material")
            .select("id_material, material")
            .order("material", { ascending: true });
          if (error) throw error;
          const formatted = data.map((m) => ({ id: m.id_material, nombre: m.material }));
          setMateriales(formatted);
          await setCached("cat_filter_materiales", formatted);
        })(),
        (async () => {
          const cached = await getCached("cat_filter_sindicatos", TTL_SINDICATOS);
          if (cached) { setSindicatos(cached); return; }
          const { data, error } = await supabase
            .from("sindicatos")
            .select("id_sindicato, sindicato")
            .order("sindicato", { ascending: true });
          if (error) throw error;
          const formatted = data.map((s) => ({ id: s.id_sindicato, nombre: s.sindicato }));
          setSindicatos(formatted);
          await setCached("cat_filter_sindicatos", formatted);
        })(),
      ]);
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
