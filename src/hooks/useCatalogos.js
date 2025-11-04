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

export const useCatalogos = (catalogosRequeridos = []) => {
  // Estados para almacenar los datos de cada catálogo
  const [materiales, setMateriales] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [preciosRenta, setPreciosRenta] = useState([]);

  // Estados para manejar el estado de carga y errores
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Array para almacenar las promesas de cada consulta
        // Esto nos permite hacer múltiples queries en paralelo
        const promises = [];

        // CONSULTA DE MATERIALES
        // Incluye relación con tipo_de_material para validar lógica de copias
        if (catalogosRequeridos.includes("materiales")) {
          promises.push(
            supabase
              .from("material")
              .select(
                `
                id_material, 
                material,
                id_tipo_de_material,
                tipo_de_material:id_tipo_de_material (
                  id_tipo_de_material,
                  tipo_de_material
                )
              `
              )
              .order("material") // Ordenar alfabéticamente
          );
        }

        // CONSULTA DE SINDICATOS
        if (catalogosRequeridos.includes("sindicatos")) {
          promises.push(
            supabase
              .from("sindicatos")
              .select("id_sindicato, sindicato")
              .order("sindicato") // Ordenar alfabéticamente
          );
        }

        // CONSULTA DE BANCOS DE MATERIAL
        if (catalogosRequeridos.includes("bancos")) {
          promises.push(
            supabase.from("bancos").select("id_banco, banco").order("banco") // Ordenar alfabéticamente
          );
        }

        // CONSULTA DE PRECIOS DE RENTA
        if (catalogosRequeridos.includes("preciosRenta")) {
          promises.push(supabase.from("precios_renta").select("*"));
        }

        // Ejecutar todas las consultas en paralelo
        // Promise.all espera a que todas las promesas se resuelvan
        const results = await Promise.all(promises);

        // Asignar resultados a los estados correspondientes
        // El índice debe coincidir con el orden en que se agregaron las promesas
        let index = 0;

        if (catalogosRequeridos.includes("materiales")) {
          if (results[index].error) throw results[index].error;
          setMateriales(results[index].data || []);
          index++; // Avanzar al siguiente resultado
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
        // Siempre ejecutar esto, haya error o no
        setLoading(false);
      }
    };

    // Solo ejecutar si se requiere al menos un catálogo
    if (catalogosRequeridos.length > 0) {
      fetchCatalogos();
    } else {
      setLoading(false);
    }
  }, []); // Array vacío = ejecutar solo una vez al montar el componente

  // Retornar todos los estados para que el componente los use
  return {
    materiales,
    sindicatos,
    bancos,
    preciosRenta,
    loading,
    error,
  };
};
