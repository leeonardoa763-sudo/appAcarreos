import { useState, useCallback } from "react";
import { supabase } from "../config/supabase";
import { clearStorageKey } from "../utils/storageUtils";
import { catCacheKey } from "./useCatalogos";

export const useGestionMateriales = () => {
  const [materiales, setMateriales] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMateriales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("material")
        .select(
          `id_material, material, id_tipo_de_material, es_material_descarga, activo,
          tipo_de_material:id_tipo_de_material (id_tipo_de_material, tipo_de_material)`
        )
        .order("material");
      if (err) throw err;
      console.log("[GestionMat] materiales cargados:", data?.length);
      setMateriales(data || []);
    } catch (err) {
      console.error("[GestionMat] Error cargando materiales:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTipos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("tipo_de_material")
        .select("id_tipo_de_material, tipo_de_material")
        .order("tipo_de_material");
      if (err) throw err;
      console.log("[GestionMat] tipos cargados:", data?.length);
      setTipos(data || []);
    } catch (err) {
      console.error("[GestionMat] Error cargando tipos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidarCacheMateriales = async () => {
    await clearStorageKey(catCacheKey("materiales"));
    console.log("[GestionMat] cache invalidado");
  };

  const crearMaterial = useCallback(async (datos) => {
    console.log("[GestionMat] crearMaterial:", datos);
    const { error: err } = await supabase.from("material").insert({
      material: datos.material.trim(),
      id_tipo_de_material: datos.id_tipo_de_material,
      es_material_descarga: datos.es_material_descarga ?? false,
      activo: true,
    });
    if (err) throw err;
    await invalidarCacheMateriales();
    await fetchMateriales();
  }, [fetchMateriales]);

  const editarMaterial = useCallback(async (id, datos) => {
    console.log("[GestionMat] editarMaterial id:", id, datos);
    const { error: err } = await supabase
      .from("material")
      .update({
        material: datos.material.trim(),
        id_tipo_de_material: datos.id_tipo_de_material,
        es_material_descarga: datos.es_material_descarga ?? false,
        activo: datos.activo ?? true,
      })
      .eq("id_material", id);
    if (err) throw err;
    await invalidarCacheMateriales();
    await fetchMateriales();
  }, [fetchMateriales]);

  const crearTipo = useCallback(async (datos) => {
    console.log("[GestionMat] crearTipo:", datos);
    const { error: err } = await supabase
      .from("tipo_de_material")
      .insert({ tipo_de_material: datos.tipo_de_material.trim() });
    if (err) throw err;
    await fetchTipos();
  }, [fetchTipos]);

  const editarTipo = useCallback(async (id, datos) => {
    console.log("[GestionMat] editarTipo:", id, datos);
    const { error: err } = await supabase
      .from("tipo_de_material")
      .update({ tipo_de_material: datos.tipo_de_material.trim() })
      .eq("id_tipo_de_material", id);
    if (err) throw err;
    await fetchTipos();
  }, [fetchTipos]);

  return {
    materiales,
    tipos,
    loading,
    error,
    fetchMateriales,
    fetchTipos,
    crearMaterial,
    editarMaterial,
    crearTipo,
    editarTipo,
  };
};
