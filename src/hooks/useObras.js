// src/hooks/useObras.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook para obtener las obras asignadas a un residente
 * Usa SOLO la tabla persona_obra (nueva estructura)
 * Retorna lista de obras para selector de filtros
 */
export const useObras = (personaId) => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Función para obtener obras desde la base de datos
   * Extraída con useCallback para poder llamarla manualmente (refetch)
   */
  const fetchObras = useCallback(async () => {
    if (!personaId) {
      console.log("[useObras] No hay personaId disponible");
      setObras([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("[useObras] Obteniendo obras para persona:", personaId);

      // Obtener obras SOLO desde persona_obra con relaciones
      const { data: personaObrasData, error: personaObrasError } =
        await supabase
          .from("persona_obra")
          .select(
            `
            id,
            persona_id,
            obra_id,
            obras!obra_id (
              id_obra,
              obra,
              cc,
              id_empresa,
              empresas:id_empresa (
                empresa,
                sufijo,
                logo 
              )
            )
          `,
          )
          .eq("persona_id", personaId)
          .order("created_at", { ascending: true }); // La primera insertada es la "principal"

      if (personaObrasError) {
        throw personaObrasError;
      }

      if (!personaObrasData || personaObrasData.length === 0) {
        console.log("[useObras] No se encontraron obras asignadas");
        setObras([]);
        setLoading(false);
        return;
      }

      // Formatear obras obtenidas para uso en la aplicación
      const obrasFormateadas = personaObrasData
        .map((item, index) => {
          if (!item.obras) {
            return null;
          }

          const obraFormateada = {
            id: item.obras.id_obra,
            nombre: item.obras.obra,
            cc: item.obras.cc,
            id_empresa: item.obras.id_empresa,
            empresa: item.obras.empresas?.empresa || "Sin empresa",
            sufijo: item.obras.empresas?.sufijo || "",
            logo: item.obras.empresas?.logo || null,
            esPrincipal: index === 0,
          };

          return obraFormateada;
        })
        .filter(Boolean); // Eliminar valores null

      console.log(
        "[useObras] Obras obtenidas exitosamente:",
        obrasFormateadas.length,
      );
      setObras(obrasFormateadas);
    } catch (err) {
      console.error("[useObras] Error al obtener obras:", err);
      console.error("[useObras] Mensaje de error:", err.message);
      setError(err.message);
      setObras([]);
    } finally {
      setLoading(false);
    }
  }, [personaId]);

  // Ejecutar fetch automáticamente al montar o cambiar personaId
  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

  /**
   * Función para forzar recarga manual de obras
   * Útil para pull-to-refresh o actualización tras cambios
   */
  const refetch = useCallback(() => {
    console.log("[useObras] Recarga manual solicitada");
    return fetchObras();
  }, [fetchObras]);

  return { obras, loading, error, refetch };
};
