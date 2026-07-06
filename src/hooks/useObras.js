// src/hooks/useObras.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

const OBRAS_SELECT = `
  id_obra,
  obra,
  cc,
  id_empresa,
  empresas:id_empresa (
    empresa,
    sufijo,
    logo
  )
`;

export const useObras = (personaId, esAdmin = false) => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchObras = useCallback(async () => {
    if (!personaId) {
      setObras([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let obrasRaw = [];

      if (esAdmin) {
        // Admin ve todas las obras (excepto la de prueba 888)
        const { data, error: obrasError } = await supabase
          .from("obras")
          .select(OBRAS_SELECT)
          .neq("id_obra", 888)
          .eq("activo", true)
          .order("id_obra", { ascending: true });

        if (obrasError) throw obrasError;

        obrasRaw = (data || []).map((obra, index) => ({
          id: obra.id_obra,
          nombre: obra.obra,
          cc: obra.cc,
          id_empresa: obra.id_empresa,
          empresa: obra.empresas?.empresa || "Sin empresa",
          sufijo: obra.empresas?.sufijo || "",
          logo: obra.empresas?.logo || null,
          esPrincipal: index === 0,
        }));
      } else {
        // Obtener obras SOLO desde persona_obra con relaciones
        const { data: personaObrasData, error: personaObrasError } =
          await supabase
            .from("persona_obra")
            .select(
              `
              id,
              persona_id,
              obra_id,
              obras!obra_id!inner (${OBRAS_SELECT})
            `,
            )
            .eq("persona_id", personaId)
            .eq("obras.activo", true)
            .order("created_at", { ascending: true });

        if (personaObrasError) throw personaObrasError;

        if (!personaObrasData || personaObrasData.length === 0) {
          setObras([]);
          setLoading(false);
          return;
        }

        obrasRaw = personaObrasData
          .map((item, index) => {
            if (!item.obras) return null;
            return {
              id: item.obras.id_obra,
              nombre: item.obras.obra,
              cc: item.obras.cc,
              id_empresa: item.obras.id_empresa,
              empresa: item.obras.empresas?.empresa || "Sin empresa",
              sufijo: item.obras.empresas?.sufijo || "",
              logo: item.obras.empresas?.logo || null,
              esPrincipal: index === 0,
            };
          })
          .filter(Boolean);
      }

      setObras(obrasRaw);
    } catch (err) {
      console.error("[useObras] Error al obtener obras:", err);
      console.error("[useObras] Mensaje de error:", err.message);
      setError(err.message);
      setObras([]);
    } finally {
      setLoading(false);
    }
  }, [personaId, esAdmin]);

  // Ejecutar fetch automáticamente al montar o cambiar personaId
  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

  /**
   * Función para forzar recarga manual de obras
   * Útil para pull-to-refresh o actualización tras cambios
   */
  const refetch = useCallback(() => {
    return fetchObras();
  }, [fetchObras]);

  return { obras, loading, error, refetch };
};
