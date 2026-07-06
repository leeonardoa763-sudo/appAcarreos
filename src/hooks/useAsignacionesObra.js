import { useState } from "react";
import { supabase } from "../config/supabase";

export function useAsignacionesObra() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAsignaciones = async (personaId) => {
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
    if (err) setError(err.message);
    else setAsignaciones(data ?? []);
    setLoading(false);
  };

  const asignarObra = async (personaId, obraId) => {
    const { error: err } = await supabase
      .from("persona_obra")
      .insert({ persona_id: personaId, obra_id: obraId });
    if (err) throw err;
    await fetchAsignaciones(personaId);
  };

  const quitarObra = async (personaId, obraId) => {
    const { error: err } = await supabase
      .from("persona_obra")
      .delete()
      .eq("persona_id", personaId)
      .eq("obra_id", obraId);
    if (err) throw err;
    await fetchAsignaciones(personaId);
  };

  return {
    asignaciones,
    loading,
    error,
    fetchAsignaciones,
    asignarObra,
    quitarObra,
  };
}
