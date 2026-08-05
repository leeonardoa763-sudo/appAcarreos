/**
 * hooks/useGestionTarifas.js
 *
 * Datos y mutaciones de la pantalla "Tarifas por obra" (panel de Administrador).
 *
 * Dos capas de tarifa:
 *   - DEFAULT DEL SINDICATO — `precios_material` / `precios_renta`. Aqui son de
 *     SOLO LECTURA: se muestran para poder compararlas y precargar el formulario,
 *     pero no se editan desde la app. Un error de captura ahi afectaria a todas
 *     las obras, incluida la 146 (produccion).
 *   - TARIFA DE OBRA — `precios_material_obra` / `precios_renta_obra`. CRUD completo.
 *
 * La resolucion en tiempo de cotizacion vive en `utils/preciosMaterial.js` y
 * `utils/preciosRenta.js`, no aqui: este hook solo administra el catalogo.
 */

import { useState, useCallback } from "react";
import { supabase } from "../config/supabase";

const CAMPOS_MATERIAL = `
  id_precios_material_obra,
  id_obra,
  id_tipo_de_material,
  id_sindicato,
  numero_de_intervalos,
  primer_km,
  km_sub_int1,
  limite_int1,
  km_sub_int2,
  limite_int2,
  activo
`;

const CAMPOS_RENTA = `
  id_precios_renta_obra,
  id_obra,
  id_sindicato,
  costo_hr,
  costo_dia,
  activo
`;

export const useGestionTarifas = () => {
  const [sindicatos, setSindicatos] = useState([]);
  const [tiposMaterial, setTiposMaterial] = useState([]);
  const [defaultsMaterial, setDefaultsMaterial] = useState([]);
  const [defaultsRenta, setDefaultsRenta] = useState([]);
  const [tarifasMaterialObra, setTarifasMaterialObra] = useState([]);
  const [tarifasRentaObra, setTarifasRentaObra] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Catalogos y tarifas por defecto. No dependen de la obra, se piden una vez.
   */
  const fetchDefaults = useCallback(async () => {
    const [resSindicatos, resTipos, resMaterial, resRenta] = await Promise.all([
      supabase
        .from("sindicatos")
        .select("id_sindicato, sindicato")
        .order("sindicato"),
      supabase
        .from("tipo_de_material")
        .select("id_tipo_de_material, tipo_de_material")
        .order("tipo_de_material"),
      supabase.from("precios_material").select("*"),
      supabase.from("precios_renta").select("*"),
    ]);

    const fallo = [resSindicatos, resTipos, resMaterial, resRenta].find(
      (r) => r.error,
    );
    if (fallo) throw fallo.error;

    setSindicatos(resSindicatos.data ?? []);
    setTiposMaterial(resTipos.data ?? []);
    setDefaultsMaterial(resMaterial.data ?? []);
    setDefaultsRenta(resRenta.data ?? []);
  }, []);

  /**
   * Tarifas propias de una obra. Sin obra seleccionada se vacian las listas en
   * vez de traer las de todas las obras.
   */
  const fetchTarifasObra = useCallback(async (idObra) => {
    if (!idObra) {
      setTarifasMaterialObra([]);
      setTarifasRentaObra([]);
      return;
    }

    const [resMaterial, resRenta] = await Promise.all([
      supabase
        .from("precios_material_obra")
        .select(CAMPOS_MATERIAL)
        .eq("id_obra", idObra),
      supabase
        .from("precios_renta_obra")
        .select(CAMPOS_RENTA)
        .eq("id_obra", idObra),
    ]);

    if (resMaterial.error) throw resMaterial.error;
    if (resRenta.error) throw resRenta.error;

    setTarifasMaterialObra(resMaterial.data ?? []);
    setTarifasRentaObra(resRenta.data ?? []);
  }, []);

  // Declarada antes del useCallback que la usa: el build web aplica TDZ estricta
  const fetchTodo = useCallback(
    async (idObra) => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchDefaults(), fetchTarifasObra(idObra)]);
      } catch (err) {
        console.error("[useGestionTarifas] Error al cargar tarifas:", err);
        setError(err.message ?? "Error al cargar tarifas");
      } finally {
        setLoading(false);
      }
    },
    [fetchDefaults, fetchTarifasObra],
  );

  // ─── Mutaciones ───────────────────────────────────────────────────────────
  // Lanzan el error en vez de tragarselo: el modal lo atrapa y lo pinta inline.

  const crearTarifaMaterialObra = useCallback(
    async (idObra, datos) => {
      const { error: err } = await supabase
        .from("precios_material_obra")
        .insert({ ...datos, id_obra: idObra, activo: true });
      if (err) throw err;
      await fetchTarifasObra(idObra);
    },
    [fetchTarifasObra],
  );

  const editarTarifaMaterialObra = useCallback(
    async (idObra, idTarifa, datos) => {
      const { error: err } = await supabase
        .from("precios_material_obra")
        .update({ ...datos, actualizado_en: new Date().toISOString() })
        .eq("id_precios_material_obra", idTarifa);
      if (err) throw err;
      await fetchTarifasObra(idObra);
    },
    [fetchTarifasObra],
  );

  /**
   * Borrado real, no soft-delete: quitar la tarifa de obra significa "esta obra
   * vuelve a usar la del sindicato". Los vales ya creados no se tocan — material
   * congela el importe y renta guarda costo_hr_aplicado / costo_dia_aplicado.
   */
  const eliminarTarifaMaterialObra = useCallback(
    async (idObra, idTarifa) => {
      const { error: err } = await supabase
        .from("precios_material_obra")
        .delete()
        .eq("id_precios_material_obra", idTarifa);
      if (err) throw err;
      await fetchTarifasObra(idObra);
    },
    [fetchTarifasObra],
  );

  const crearTarifaRentaObra = useCallback(
    async (idObra, datos) => {
      const { error: err } = await supabase
        .from("precios_renta_obra")
        .insert({ ...datos, id_obra: idObra, activo: true });
      if (err) throw err;
      await fetchTarifasObra(idObra);
    },
    [fetchTarifasObra],
  );

  const editarTarifaRentaObra = useCallback(
    async (idObra, idTarifa, datos) => {
      const { error: err } = await supabase
        .from("precios_renta_obra")
        .update({ ...datos, actualizado_en: new Date().toISOString() })
        .eq("id_precios_renta_obra", idTarifa);
      if (err) throw err;
      await fetchTarifasObra(idObra);
    },
    [fetchTarifasObra],
  );

  const eliminarTarifaRentaObra = useCallback(
    async (idObra, idTarifa) => {
      const { error: err } = await supabase
        .from("precios_renta_obra")
        .delete()
        .eq("id_precios_renta_obra", idTarifa);
      if (err) throw err;
      await fetchTarifasObra(idObra);
    },
    [fetchTarifasObra],
  );

  return {
    sindicatos,
    tiposMaterial,
    defaultsMaterial,
    defaultsRenta,
    tarifasMaterialObra,
    tarifasRentaObra,
    loading,
    error,
    fetchTodo,
    crearTarifaMaterialObra,
    editarTarifaMaterialObra,
    eliminarTarifaMaterialObra,
    crearTarifaRentaObra,
    editarTarifaRentaObra,
    eliminarTarifaRentaObra,
  };
};
