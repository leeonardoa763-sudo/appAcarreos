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

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";
import { getCached, setCached } from "../utils/storageUtils";

const CATALOG_TTL = {
  // Bajado de 4h a 10min: la creación de materiales desde el panel admin
  // solo invalida la caché en el propio dispositivo del admin, no en el
  // resto — con TTL de 4h otros usuarios tardaban hasta 4h en ver
  // materiales/presupuestos nuevos aunque ya existieran en Supabase.
  materiales: 10 * 60 * 1000,
  sindicatos: 24 * 3600 * 1000,
  bancos: 24 * 3600 * 1000,
  operadores: 3600 * 1000,
  vehiculos: 3600 * 1000,
};

// Prefijo de las llaves de caché local. Subir la versión invalida toda la caché
// de catálogos en cada dispositivo la próxima vez que se abra la app. Se subió a
// v2 al agregar las columnas es_pipas / es_agua_pipa (feature pipas de agua): sin
// el bump, el sindicato Pipas caía en el picker de renta por caché vieja de 24 h.
// Cualquier consumidor que borre una llave de catálogo debe usar este prefijo.
export const CAT_CACHE_PREFIX = "cat_v2_";
export const catCacheKey = (nombre) => `${CAT_CACHE_PREFIX}${nombre}`;

export const useCatalogos = (catalogosRequeridos = []) => {
  // Estados para almacenar los datos de cada catálogo
  const [materiales, setMateriales] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // Estados para manejar el estado de carga y errores
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [refrescando, setRefrescando] = useState(false);

  const fetchCatalogos = useCallback(
    async (ignorarCache = false) => {
      const fetchers = {
        materiales: () =>
          supabase
            .from("material")
            .select(
              `id_material, material, id_tipo_de_material, es_agua_pipa,
              tipo_de_material:id_tipo_de_material (id_tipo_de_material, tipo_de_material)`,
            )
            .eq("activo", true)
            .order("material"),
        sindicatos: () =>
          supabase
            .from("sindicatos")
            .select("id_sindicato, sindicato, es_pipas")
            .order("sindicato"),
        bancos: () =>
          supabase.from("bancos").select("id_banco, banco").order("banco"),
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
        operadores: setOperadores,
        vehiculos: setVehiculos,
      };

      try {
        if (ignorarCache) {
          setRefrescando(true);
        } else {
          setLoading(true);
        }
        setError(null);

        await Promise.all(
          catalogosRequeridos.map(async (nombre) => {
            if (!ignorarCache) {
              const cached = await getCached(catCacheKey(nombre), CATALOG_TTL[nombre]);
              if (cached) {
                setters[nombre](cached);
                return;
              }
            }
            const { data, error } = await fetchers[nombre]();
            if (error) throw error;
            setters[nombre](data || []);
            await setCached(catCacheKey(nombre), data || []);
          }),
        );
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        setError(err);
      } finally {
        setLoading(false);
        setRefrescando(false);
      }
    },
    [catalogosRequeridos],
  );

  useEffect(() => {
    if (catalogosRequeridos.length > 0) {
      fetchCatalogos();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuelve a pedir los catálogos a Supabase ignorando la caché local —
  // para cuando un usuario necesita ver un material/catálogo recién
  // creado sin esperar el TTL.
  const refrescarCatalogos = useCallback(
    () => fetchCatalogos(true),
    [fetchCatalogos],
  );

  // Retornar todos los estados para que el componente los use
  return {
    materiales,
    sindicatos,
    bancos,
    operadores,
    vehiculos,
    loading,
    error,
    refrescando,
    refrescarCatalogos,
  };
};
