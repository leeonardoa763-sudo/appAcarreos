import { useState } from "react";
import { supabase } from "../config/supabase";

export function useGestionBancos() {
  const [bancos, setBancos] = useState([]);
  const [distancias, setDistancias] = useState([]);
  const [pesosEspecificos, setPesosEspecificos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBancos = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("bancos")
      .select("id_banco, banco")
      .order("banco");
    if (err) setError(err.message);
    else setBancos(data ?? []);
    setLoading(false);
  };

  const fetchDistancias = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("distancias_banco_obra")
      .select("id_distancia_banco_obra, id_banco, id_obra, distancia_km, bancos(banco), obras(obra)")
      .order("id_banco");
    if (err) setError(err.message);
    else setDistancias(data ?? []);
    setLoading(false);
  };

  const fetchPesos = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("peso_especifico")
      .select("id_peso_especifico, id_banco, id_material, peso_especifico, bancos(banco), material(material)")
      .order("id_banco");
    if (err) setError(err.message);
    else setPesosEspecificos(data ?? []);
    setLoading(false);
  };

  const crearBanco = async (nombre) => {
    const { error: err } = await supabase
      .from("bancos")
      .insert({ banco: nombre.trim() });
    if (err) throw err;
    await fetchBancos();
  };

  const editarBanco = async (idBanco, nombre) => {
    const { error: err } = await supabase
      .from("bancos")
      .update({ banco: nombre.trim() })
      .eq("id_banco", idBanco);
    if (err) throw err;
    await fetchBancos();
  };

  const crearDistancia = async ({ id_banco, id_obra, distancia_km }) => {
    const { error: err } = await supabase
      .from("distancias_banco_obra")
      .insert({ id_banco, id_obra, distancia_km: parseFloat(distancia_km) });
    if (err) throw err;
    await fetchDistancias();
  };

  const editarDistancia = async (idDistancia, distancia_km) => {
    const { error: err } = await supabase
      .from("distancias_banco_obra")
      .update({ distancia_km: parseFloat(distancia_km) })
      .eq("id_distancia_banco_obra", idDistancia);
    if (err) throw err;
    await fetchDistancias();
  };

  const eliminarDistancia = async (idDistancia) => {
    const { error: err } = await supabase
      .from("distancias_banco_obra")
      .delete()
      .eq("id_distancia_banco_obra", idDistancia);
    if (err) throw err;
    await fetchDistancias();
  };

  const crearPeso = async ({ id_banco, id_material, peso_especifico }) => {
    const { error: err } = await supabase
      .from("peso_especifico")
      .insert({ id_banco, id_material, peso_especifico: parseFloat(peso_especifico) });
    if (err) throw err;
    await fetchPesos();
  };

  const editarPeso = async (idPeso, valor) => {
    const { error: err } = await supabase
      .from("peso_especifico")
      .update({ peso_especifico: parseFloat(valor) })
      .eq("id_peso_especifico", idPeso);
    if (err) throw err;
    await fetchPesos();
  };

  const eliminarPeso = async (idPeso) => {
    const { error: err } = await supabase
      .from("peso_especifico")
      .delete()
      .eq("id_peso_especifico", idPeso);
    if (err) throw err;
    await fetchPesos();
  };

  return {
    bancos,
    distancias,
    pesosEspecificos,
    loading,
    error,
    fetchBancos,
    fetchDistancias,
    fetchPesos,
    crearBanco,
    editarBanco,
    crearDistancia,
    editarDistancia,
    eliminarDistancia,
    crearPeso,
    editarPeso,
    eliminarPeso,
  };
}
