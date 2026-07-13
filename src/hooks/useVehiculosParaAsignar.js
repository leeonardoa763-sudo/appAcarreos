// 1. React
import { useState, useCallback } from "react";

// 2. Supabase
import { supabase } from "../config/supabase";

/**
 * useVehiculosParaAsignar
 *
 * Carga todos los vehiculos activos ya registrados para el buscador de
 * "Asignar placas". Incluye el sindicato al que pertenecen y el operador
 * actualmente sugerido (si lo hay), para mostrarlo en el resultado.
 */
export const useVehiculosParaAsignar = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("vehiculos")
        .select(
          `
          id_vehiculo,
          placas,
          capacidad_m3,
          qr_uid,
          id_sindicato,
          sindicatos:id_sindicato ( sindicato ),
          id_operador_sugerido,
          operador_sugerido:operadores!id_operador_sugerido ( nombre_completo )
        `,
        )
        .eq("activo", true)
        .order("placas", { ascending: true });

      if (err) throw err;

      const normalizados = (data || []).map((v) => ({
        id_vehiculo: v.id_vehiculo,
        placas: v.placas,
        capacidad_m3: v.capacidad_m3,
        qr_uid: v.qr_uid,
        id_sindicato: v.id_sindicato,
        sindicato: v.sindicatos?.sindicato ?? "Sin sindicato",
        operadorActual: v.operador_sugerido?.nombre_completo ?? null,
      }));

      setVehiculos(normalizados);
    } catch (e) {
      console.error("[useVehiculosParaAsignar] Error:", e);
      setError("No se pudieron cargar los vehículos.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { vehiculos, loading, error, cargar };
};
