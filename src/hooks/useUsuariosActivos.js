import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

export function useUsuariosActivos() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("persona")
      .select(
        "id_persona, nombre, primer_apellido, segundo_apellido, roles:id_role (role)",
      )
      .eq("usuario_activo", true)
      .order("nombre");
    if (err) setError(err.message);
    else setUsuarios(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return { usuarios, loading, error, refetch: fetchUsuarios };
}
