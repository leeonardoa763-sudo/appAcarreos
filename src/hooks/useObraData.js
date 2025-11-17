/**
 * hooks/useObraData.js
 *
 * Hook personalizado para obtener datos de la obra asignada al usuario
 *
 * PROPÓSITO:
 * - Centralizar la lógica de consulta de datos de obra
 * - Evitar duplicación de código en múltiples pantallas
 * - Proporcionar estados de loading y error consistentes
 * - Reutilizable en cualquier pantalla que necesite datos de obra
 *
 * RETORNA:
 * - obraData: Objeto con información completa de la obra y empresa
 * - loading: Boolean indicando si está cargando
 * - error: String con mensaje de error (null si no hay error)
 * - refetch: Función para recargar los datos manualmente
 *
 * USADO EN:
 * - ValeMaterialScreen
 * - ValeRentaScreen
 * - Cualquier pantalla que requiera datos de la obra del usuario
 *
 * EJEMPLO DE USO:
 * const { obraData, loading, error, refetch } = useObraData(userProfile);
 *
 * if (loading) return <ActivityIndicator />;
 * if (error) return <Text>{error}</Text>;
 * if (obraData) return <Text>{obraData.obra}</Text>;
 */

import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

export const useObraData = (userProfile) => {
  // Estado para almacenar los datos de la obra
  const [obraData, setObraData] = useState(null);

  // Estado para manejar el loading durante la consulta
  const [loading, setLoading] = useState(true);

  // Estado para almacenar mensajes de error
  const [error, setError] = useState(null);

  /**
   * Función interna para consultar los datos de la obra
   * Se ejecuta automáticamente y también puede llamarse manualmente con refetch
   */
  const fetchObraData = async () => {
    // Validar que el usuario tenga una obra asignada
    if (!userProfile?.id_current_obra) {
      setObraData(null);
      setLoading(false);
      setError("No hay obra asignada al usuario");
      return;
    }

    try {
      // Iniciar estado de carga
      setLoading(true);
      setError(null);

      // Consultar datos de la obra incluyendo información de la empresa
      // La relación obras -> empresas se hace mediante id_empresa
      const { data, error: supabaseError } = await supabase
        .from("obras")
        .select(
          `
          id_obra,
          obra,
          cc,
          empresas:id_empresa (
            id_empresa,
            empresa,
            sufijo
          )
        `
        )
        .eq("id_obra", userProfile.id_current_obra)
        .single();

      // Manejar errores de Supabase
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Validar que se hayan obtenido datos
      if (!data) {
        throw new Error("No se encontraron datos de la obra");
      }

      // Guardar datos en el estado
      setObraData(data);
      setError(null);
    } catch (err) {
      // Capturar y guardar el error
      const errorMessage = "No se pudieron cargar los datos de la obra";
      setError(errorMessage);
      setObraData(null);
    } finally {
      // Finalizar estado de carga siempre
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos automáticamente cuando cambia el userProfile
   * Se ejecuta en el montaje inicial y cada vez que userProfile cambie
   */
  useEffect(() => {
    fetchObraData();
  }, [userProfile?.id_current_obra]);

  /**
   * Función refetch expuesta para permitir recarga manual
   * Útil si se necesita actualizar los datos después de una modificación
   */
  const refetch = () => {
    fetchObraData();
  };

  // Retornar los datos y funciones necesarias
  return {
    obraData,
    loading,
    error,
    refetch,
  };
};
