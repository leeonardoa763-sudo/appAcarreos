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

        console.log("[useObras] 🔍 Fetching obras para persona:", personaId);

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
              empresas:id_empresa (
                empresa,
                sufijo
              )
            )
          `,
            )
            .eq("persona_id", personaId)
            .order("created_at", { ascending: true }); // La primera insertada es la "principal"

        console.log(
          "[useObras] 📊 Raw data from persona_obra:",
          JSON.stringify(personaObrasData, null, 2),
        );
        console.log("[useObras] ❗ Error from Supabase:", personaObrasError);

        if (personaObrasError) {
          throw personaObrasError;
        }

        if (!personaObrasData || personaObrasData.length === 0) {
          console.log("[useObras] ⚠️ No hay obras asignadas a este residente");
          setObras([]);
          setLoading(false);
          return;
        }

        // Formatear obras obtenidas
        const obrasFormateadas = personaObrasData
          .map((item, index) => {
            console.log(`[useObras] 🔄 Procesando item ${index}:`, item);

            if (!item.obras) {
              console.log(`[useObras] ⚠️ Item ${index} no tiene campo 'obras'`);
              return null;
            }

            const obraFormateada = {
              id: item.obras.id_obra,
              nombre: item.obras.obra,
              cc: item.obras.cc,
              empresa: item.obras.empresas?.empresa || "Sin empresa",
              sufijo: item.obras.empresas?.sufijo || "",
              esPrincipal: index === 0, // La primera es la principal
            };

            console.log(
              `[useObras] ✅ Obra ${index} formateada:`,
              obraFormateada,
            );
            return obraFormateada;
          })
          .filter(Boolean); // Eliminar nulls

        console.log(
          "[useObras] 🎯 Total obras obtenidas:",
          obrasFormateadas.length,
        );
        console.log(
          "[useObras] 📋 Obras finales:",
          JSON.stringify(obrasFormateadas, null, 2),
        );

        setObras(obrasFormateadas);
      } catch (err) {
        console.error("[useObras] 💥 Error:", err);
        console.error("[useObras] 💥 Error message:", err.message);
        setError(err.message);
        setObras([]);
      } finally {
        setLoading(false);
        console.log("[useObras] 🏁 Fetching completado");
      }
    };

    fetchObras();
  }, [personaId]);

  return { obras, loading, error };
};
