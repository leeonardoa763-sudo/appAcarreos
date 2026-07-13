// 1. React
import { useState, useCallback } from "react";

// 2. Supabase
import { supabase } from "../config/supabase";

/**
 * useOperadoresParaPlacas
 *
 * Carga todos los operadores activos para el selector de "Asignar placas".
 * Se necesita id_sindicato para el insert del vehiculo (hereda el sindicato
 * del operador seleccionado).
 */
export const useOperadoresParaPlacas = () => {
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("operadores")
        .select(
          `
          id_operador,
          nombre_completo,
          id_sindicato,
          sindicatos:id_sindicato ( sindicato )
        `,
        )
        .eq("activo", true)
        .order("nombre_completo", { ascending: true });

      if (err) throw err;

      const normalizados = (data || []).map((op) => ({
        id_operador: op.id_operador,
        nombre_completo: op.nombre_completo,
        id_sindicato: op.id_sindicato,
        sindicato: op.sindicatos?.sindicato ?? "Sin sindicato",
      }));

      setOperadores(normalizados);
    } catch (e) {
      console.error("[useOperadoresParaPlacas] Error:", e);
      setError("No se pudieron cargar los operadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { operadores, loading, error, cargar };
};
