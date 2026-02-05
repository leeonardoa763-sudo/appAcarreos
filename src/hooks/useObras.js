// src/hooks/useObras.js

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchObras = async () => {
      if (!personaId) {
        console.log("[useObras] ❌ No hay personaId");
        setObras([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener obras SOLO desde persona_obra
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
          setObras([]);
          setLoading(false);
          return;
        }

        // Formatear obras obtenidas
        const obrasFormateadas = personaObrasData
          .map((item, index) => {
            if (!item.obras) {
              return null;
            }

            const obraFormateada = {
              id: item.obras.id_obra,
              nombre: item.obras.obra,
              cc: item.obras.cc,
              id_empresa: item.obras.id_empresa, // ✅ AGREGAR
              empresa: item.obras.empresas?.empresa || "Sin empresa",
              sufijo: item.obras.empresas?.sufijo || "",
              logo: item.obras.empresas?.logo || null, // ✅ AGREGAR
              esPrincipal: index === 0,
            };

            return obraFormateada;
          })
          .filter(Boolean); // Eliminar nulls

        setObras(obrasFormateadas);
      } catch (err) {
        console.error("[useObras] 💥 Error:", err);
        console.error("[useObras] 💥 Error message:", err.message);
        setError(err.message);
        setObras([]);
      } finally {
        setLoading(false);
      }
    };

    fetchObras();
  }, [personaId]);

  return { obras, loading, error };
};
