import { useState, useCallback } from "react";
import { supabase } from "../config/supabase";

export function useAsignacionesObra() {
  const [asignaciones, setAsignaciones] = useState([]);
  // null = todavia no se pudo leer el conteo global (o RLS no lo permite).
  const [conteos, setConteos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAsignaciones = useCallback(async (personaId) => {
    if (!personaId) {
      setAsignaciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("persona_obra")
      .select("id, obra_id, obras:obra_id (id_obra, obra)")
      .eq("persona_id", personaId);
    if (err) {
      console.error("[useAsignacionesObra] Error al cargar asignaciones:", err);
      setError(err.message);
    } else {
      setAsignaciones(data ?? []);
    }
    setLoading(false);
  }, []);

  // Conteo por usuario para la lista. Si RLS no permite leer todas las filas,
  // se degrada a "sin conteo" en vez de romper la pantalla.
  const fetchConteos = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("persona_obra")
      .select("persona_id, obra_id");
    if (err) {
      console.error("[useAsignacionesObra] Error al contar asignaciones:", err);
      setConteos(null);
      return;
    }
    const mapa = {};
    (data ?? []).forEach((fila) => {
      mapa[fila.persona_id] = (mapa[fila.persona_id] ?? 0) + 1;
    });
    setConteos(mapa);
  }, []);

  const asignarObra = useCallback(
    async (personaId, obraId) => {
      const { error: err } = await supabase
        .from("persona_obra")
        .insert({ persona_id: personaId, obra_id: obraId });
      if (err) throw err;
      await Promise.all([fetchAsignaciones(personaId), fetchConteos()]);
    },
    [fetchAsignaciones, fetchConteos],
  );

  const quitarObra = useCallback(
    async (personaId, obraId) => {
      const { error: err } = await supabase
        .from("persona_obra")
        .delete()
        .eq("persona_id", personaId)
        .eq("obra_id", obraId);
      if (err) throw err;
      await Promise.all([fetchAsignaciones(personaId), fetchConteos()]);
    },
    [fetchAsignaciones, fetchConteos],
  );

  return {
    asignaciones,
    conteos,
    loading,
    error,
    fetchAsignaciones,
    fetchConteos,
    asignarObra,
    quitarObra,
  };
}
