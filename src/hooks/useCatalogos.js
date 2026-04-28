/**
 * hooks/useCatalogos.js
 *
 * Hook para cargar catálogos de la base de datos
 *
 * PROPÓSITO:
 * - Centralizar la carga de datos de catálogos
 * - Reutilizable en cualquier formulario de vales
 * - Manejo de estados de loading y error
 * - Incluye información de tipo de material para validaciones
 *
 * USADO EN:
 * - ValeRentaScreen
 * - ValeMaterialScreen
 * - Cualquier pantalla que necesite catálogos
 *
 * EJEMPLO DE USO:
 * const { materiales, sindicatos, bancos, loading } = useCatalogos(['materiales', 'sindicatos', 'bancos']);
 */

import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { getCached, setCached } from "../utils/storageUtils";

const CATALOG_TTL = {
  materiales: 4 * 3600 * 1000,
  sindicatos: 24 * 3600 * 1000,
  bancos: 24 * 3600 * 1000,
  preciosRenta: 4 * 3600 * 1000,
  operadores: 3600 * 1000,
  vehiculos: 3600 * 1000,
};

export const useCatalogos = (catalogosRequeridos = []) => {
  // Estados para almacenar los datos de cada catálogo
  const [materiales, setMateriales] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [preciosRenta, setPreciosRenta] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // Estados para manejar el estado de carga y errores
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchers = {
      materiales: () =>
        supabase
          .from("material")
          .select(
            `id_material, material, id_tipo_de_material,
            tipo_de_material:id_tipo_de_material (id_tipo_de_material, tipo_de_material)`,
          )
          .order("material"),
      sindicatos: () =>
        supabase
          .from("sindicatos")
          .select("id_sindicato, sindicato")
          .order("sindicato"),
      bancos: () =>
        supabase.from("bancos").select("id_banco, banco").order("banco"),
      preciosRenta: () => supabase.from("precios_renta").select("*"),
      operadores: () =>
        supabase
          .from("operadores")
          .select("id_operador, nombre_completo, id_sindicato")
          .eq("activo", true)
          .order("nombre_completo"),
      vehiculos: () =>
        supabase
          .from("vehiculos")
          .select("id_vehiculo, placas, id_sindicato, capacidad_m3")
          .eq("activo", true)
          .order("placas"),
    };

    const setters = {
      materiales: setMateriales,
      sindicatos: setSindicatos,
      bancos: setBancos,
      preciosRenta: setPreciosRenta,
      operadores: setOperadores,
      vehiculos: setVehiculos,
    };

    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        setError(null);

        await Promise.all(
          catalogosRequeridos.map(async (nombre) => {
            const cached = await getCached(`cat_${nombre}`, CATALOG_TTL[nombre]);
            if (cached) {
              setters[nombre](cached);
              return;
            }
            const { data, error } = await fetchers[nombre]();
            if (error) throw error;
            setters[nombre](data || []);
            await setCached(`cat_${nombre}`, data || []);
          }),
        );
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

  // Retornar todos los estados para que el componente los use
  return {
    materiales,
    sindicatos,
    bancos,
    preciosRenta,
    operadores,
    vehiculos,
    loading,
    error,
  };
};
