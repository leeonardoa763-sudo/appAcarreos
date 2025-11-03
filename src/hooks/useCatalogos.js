/**
 * hooks/useCatalogos.js
 *
 * Hook para cargar catálogos de la base de datos
 *
 * PROPÓSITO:
 * - Centralizar la carga de datos de catálogos
 * - Reutilizable en cualquier formulario de vales
 * - Manejo de estados de loading y error
 *
 * USADO EN:
 * - ValeRentaScreen
 * - ValeMaterialScreen
 * - Cualquier pantalla que necesite catálogos
 *
 * EJEMPLO DE USO:
 * const { materiales, sindicatos, loading } = useCatalogos(['materiales', 'sindicatos']);
 */

import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

export const useCatalogos = (catalogosRequeridos = []) => {
  const [materiales, setMateriales] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [preciosRenta, setPreciosRenta] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        setError(null);

        const promises = [];

        if (catalogosRequeridos.includes("materiales")) {
          promises.push(
            supabase
              .from("material")
              .select("id_material, material")
              .order("material")
          );
        }

        if (catalogosRequeridos.includes("sindicatos")) {
          promises.push(
            supabase
              .from("sindicatos")
              .select("id_sindicato, sindicato")
              .order("sindicato")
          );
        }

        if (catalogosRequeridos.includes("bancos")) {
          promises.push(
            supabase.from("bancos").select("id_banco, banco").order("banco")
          );
        }

        if (catalogosRequeridos.includes("preciosRenta")) {
          promises.push(supabase.from("precios_renta").select("*"));
        }

        const results = await Promise.all(promises);

        let index = 0;
        if (catalogosRequeridos.includes("materiales")) {
          if (results[index].error) throw results[index].error;
          setMateriales(results[index].data || []);
          index++;
        }

        if (catalogosRequeridos.includes("sindicatos")) {
          if (results[index].error) throw results[index].error;
          setSindicatos(results[index].data || []);
          index++;
        }

        if (catalogosRequeridos.includes("bancos")) {
          if (results[index].error) throw results[index].error;
          setBancos(results[index].data || []);
          index++;
        }

        if (catalogosRequeridos.includes("preciosRenta")) {
          if (results[index].error) throw results[index].error;
          setPreciosRenta(results[index].data || []);
          index++;
        }
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (catalogosRequeridos.length > 0) {
      fetchCatalogos();
    } else {
      setLoading(false);
    }
  }, []);

  return {
    materiales,
    sindicatos,
    bancos,
    preciosRenta,
    loading,
    error,
  };
};
