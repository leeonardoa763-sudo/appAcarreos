// 1. React
import { useState, useCallback } from "react";

// 2. Supabase
import { supabase } from "../config/supabase";

/**
 * useOperadoresSindicato
 *
 * Carga todos los operadores activos agrupados por sindicato.
 * El qr_uid se obtiene del vehículo asignado al operador
 * via vehiculos.id_operador_sugerido.
 */
export const useOperadoresSindicato = () => {
  const [grupos, setGrupos] = useState([]);
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
          sindicatos:id_sindicato (
            id_sindicato,
            sindicato
          ),
          vehiculos!vehiculos_id_operador_sugerido_fkey (
            placas,
            capacidad_m3,
            activo,
            qr_uid
          )
        `,
        )
        .eq("activo", true)
        .order("nombre_completo", { ascending: true });

      if (err) throw err;

      const mapa = {};

      (data || []).forEach((op) => {
        const sid = op.id_sindicato;
        const nombreSindicato = op.sindicatos?.sindicato ?? "Sin sindicato";

        if (!mapa[sid]) {
          mapa[sid] = {
            id_sindicato: sid,
            sindicato: nombreSindicato,
            operadores: [],
          };
        }

        // Normalizar vehiculos a array (Supabase puede devolver objeto o array)
        const vehiculos = Array.isArray(op.vehiculos)
          ? op.vehiculos
          : op.vehiculos
            ? [op.vehiculos]
            : [];

        const vehiculoActivo =
          vehiculos.find((v) => v.activo) ?? vehiculos[0] ?? null;

        mapa[sid].operadores.push({
          id_operador: op.id_operador,
          nombre_completo: op.nombre_completo,
          qr_uid: vehiculoActivo?.qr_uid ?? null,
          placas: vehiculoActivo?.placas ?? null,
          capacidad_m3: vehiculoActivo?.capacidad_m3 ?? null,
          sindicato: nombreSindicato,
        });
      });

      const resultado = Object.values(mapa).sort((a, b) =>
        a.sindicato.localeCompare(b.sindicato),
      );

      setGrupos(resultado);
    } catch (e) {
      console.error("[useOperadoresSindicato] Error:", e);
      setError("No se pudieron cargar los operadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { grupos, loading, error, cargar };
};
