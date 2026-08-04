import { useState, useCallback } from "react";
import { supabase } from "../config/supabase";

const OBRAS_ADMIN_SELECT = `
  id_obra,
  obra,
  cc,
  id_empresa,
  latitud,
  longitud,
  radio_validacion_metros,
  min_minutos_entre_viajes,
  activo,
  empresas:id_empresa (
    id_empresa,
    empresa,
    sufijo
  )
`;

export function useGestionObras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchObras = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("obras")
      .select(OBRAS_ADMIN_SELECT)
      .order("obra");
    if (err) {
      console.error("[useGestionObras] Error al cargar obras:", err);
      setError(err.message);
    } else {
      setObras(data ?? []);
    }
    setLoading(false);
  }, []);

  const crearObra = useCallback(
    async (datos) => {
      const { error: err } = await supabase.from("obras").insert({
        obra: datos.obra,
        cc: datos.cc,
        id_empresa: datos.id_empresa,
        latitud: datos.latitud,
        longitud: datos.longitud,
        radio_validacion_metros: datos.radio_validacion_metros,
        min_minutos_entre_viajes: datos.min_minutos_entre_viajes,
      });
      if (err) throw err;
      await fetchObras();
    },
    [fetchObras],
  );

  const editarObra = useCallback(
    async (idObra, datos) => {
      const { error: err } = await supabase
        .from("obras")
        .update({
          obra: datos.obra,
          cc: datos.cc,
          id_empresa: datos.id_empresa,
          latitud: datos.latitud,
          longitud: datos.longitud,
          radio_validacion_metros: datos.radio_validacion_metros,
          min_minutos_entre_viajes: datos.min_minutos_entre_viajes,
        })
        .eq("id_obra", idObra);
      if (err) throw err;
      await fetchObras();
    },
    [fetchObras],
  );

  const toggleActivoObra = useCallback(
    async (idObra, nuevoValor) => {
      const { error: err } = await supabase
        .from("obras")
        .update({ activo: nuevoValor })
        .eq("id_obra", idObra);
      if (err) throw err;
      await fetchObras();
    },
    [fetchObras],
  );

  return {
    obras,
    loading,
    error,
    fetchObras,
    crearObra,
    editarObra,
    toggleActivoObra,
  };
}
