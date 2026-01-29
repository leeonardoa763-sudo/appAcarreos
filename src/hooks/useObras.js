// src/hooks/useObras.js

import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

/**
 * Hook para obtener las obras asignadas a un residente
 * Retorna lista de obras para selector de filtros
 */
export const useObras = (personaId) => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchObras = async () => {
      if (!personaId) {
        setObras([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("[useObras] Fetching obras para persona:", personaId);

        // Obtener obras desde la tabla persona usando id_current_obra
        // y luego obtener todas las obras disponibles
        const { data: personaData, error: personaError } = await supabase
          .from("persona")
          .select(
            `
            id_current_obra,
            obras:id_current_obra (
              id_obra,
              obra,
              cc,
              empresas:id_empresa (
                empresa,
                sufijo
              )
            )
          `,
          )
          .eq("id_persona", personaId)
          .single();

        if (personaError) {
          throw personaError;
        }

        // Por ahora, solo retornar la obra actual del usuario
        // Si en el futuro necesitas todas las obras, ajusta el query
        const obrasFormateadas = personaData.obras
          ? [
              {
                id: personaData.obras.id_obra,
                nombre: personaData.obras.obra,
                cc: personaData.obras.cc,
                empresa: personaData.obras.empresas?.empresa || "Sin empresa",
                sufijo: personaData.obras.empresas?.sufijo || "",
              },
            ]
          : [];

        console.log("[useObras] Obras obtenidas:", obrasFormateadas.length);
        setObras(obrasFormateadas);
      } catch (err) {
        console.error("[useObras] Error:", err);
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
