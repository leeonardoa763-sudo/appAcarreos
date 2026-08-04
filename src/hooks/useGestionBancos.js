import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../config/supabase";

// Normaliza el nombre de un banco para comparar duplicados: colapsa espacios
// y quita diferencias de mayusculas. "planta  de asfaltos" y
// "PLANTA DE ASFALTOS" cuentan como el mismo banco.
export const normalizarNombreBanco = (valor) =>
  String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const porTexto = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), "es");

// 23505 = unique_violation. Llega cuando dos admins guardan lo mismo casi al
// mismo tiempo y el chequeo en memoria no alcanza a verlo.
const esDuplicado = (err) => err?.code === "23505";

export function useGestionBancos() {
  const [bancos, setBancos] = useState([]);
  const [distancias, setDistancias] = useState([]);
  const [distanciasPlanta, setDistanciasPlanta] = useState([]);
  const [pesosEspecificos, setPesosEspecificos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // ─── Fetchers ──────────────────────────────────────────────────────────────
  // No tocan `loading`: se usan tambien para refrescar despues de guardar, y
  // ahi un spinner de pantalla completa solo hace parpadear la lista.
  const fetchBancos = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("bancos")
      .select("id_banco, banco")
      .order("banco");
    if (err) throw err;
    if (montadoRef.current) setBancos(data ?? []);
  }, []);

  const fetchDistancias = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("distancias_banco_obra")
      .select(
        "id_distancia_banco_obra, id_banco, id_obra, distancia_km, bancos(banco), obras(obra)"
      );
    if (err) throw err;
    const ordenadas = (data ?? []).sort(
      (a, b) =>
        porTexto(a.bancos?.banco, b.bancos?.banco) ||
        porTexto(a.obras?.obra, b.obras?.obra)
    );
    if (montadoRef.current) setDistancias(ordenadas);
  }, []);

  const fetchDistanciasPlanta = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("distancias_banco_planta")
      .select("id_distancia_banco_planta, id_banco, distancia_km, bancos(banco)");
    if (err) throw err;
    const ordenadas = (data ?? []).sort((a, b) =>
      porTexto(a.bancos?.banco, b.bancos?.banco)
    );
    if (montadoRef.current) setDistanciasPlanta(ordenadas);
  }, []);

  const fetchPesos = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("peso_especifico")
      .select(
        "id_peso_especifico, id_banco, id_material, peso_especifico, bancos(banco), material(material)"
      );
    if (err) throw err;
    const ordenados = (data ?? []).sort(
      (a, b) =>
        porTexto(a.bancos?.banco, b.bancos?.banco) ||
        porTexto(a.material?.material, b.material?.material)
    );
    if (montadoRef.current) setPesosEspecificos(ordenados);
  }, []);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchBancos(),
        fetchDistancias(),
        fetchDistanciasPlanta(),
        fetchPesos(),
      ]);
    } catch (err) {
      console.error("[useGestionBancos] Error al cargar:", err);
      if (montadoRef.current) setError(err?.message ?? "Error al cargar datos");
    } finally {
      if (montadoRef.current) setLoading(false);
    }
  }, [fetchBancos, fetchDistancias, fetchDistanciasPlanta, fetchPesos]);

  // ─── Bancos ────────────────────────────────────────────────────────────────
  const crearBanco = async (nombre) => {
    const limpio = String(nombre).trim();
    const normalizado = normalizarNombreBanco(limpio);

    const existente = bancos.find(
      (b) => normalizarNombreBanco(b.banco) === normalizado
    );
    if (existente) {
      throw new Error(`Ya existe un banco registrado como "${existente.banco}".`);
    }

    const { error: err } = await supabase.from("bancos").insert({ banco: limpio });
    if (err) {
      if (esDuplicado(err)) throw new Error("Ese banco ya existe.");
      throw err;
    }
    await fetchBancos();
  };

  const editarBanco = async (idBanco, nombre) => {
    const limpio = String(nombre).trim();
    const normalizado = normalizarNombreBanco(limpio);

    const existente = bancos.find(
      (b) =>
        b.id_banco !== idBanco &&
        normalizarNombreBanco(b.banco) === normalizado
    );
    if (existente) {
      throw new Error(`Ya existe un banco registrado como "${existente.banco}".`);
    }

    const { error: err } = await supabase
      .from("bancos")
      .update({ banco: limpio })
      .eq("id_banco", idBanco);
    if (err) {
      if (esDuplicado(err)) throw new Error("Ese nombre ya lo usa otro banco.");
      throw err;
    }
    await fetchBancos();
  };

  // ─── Distancias banco-obra ─────────────────────────────────────────────────
  const crearDistancia = async ({ id_banco, id_obra, distancia_km }) => {
    const yaExiste = distancias.some(
      (d) => d.id_banco === id_banco && d.id_obra === id_obra
    );
    if (yaExiste) {
      throw new Error(
        "Ese banco ya tiene una distancia configurada para esa obra. Editala en lugar de crear otra."
      );
    }

    const { error: err } = await supabase
      .from("distancias_banco_obra")
      .insert({ id_banco, id_obra, distancia_km: parseFloat(distancia_km) });
    if (err) {
      if (esDuplicado(err)) {
        throw new Error("Ese banco ya tiene distancia para esa obra.");
      }
      throw err;
    }
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

  // ─── Distancias banco-planta ───────────────────────────────────────────────
  const crearDistanciaPlanta = async ({ id_banco, distancia_km }) => {
    const yaExiste = distanciasPlanta.some((d) => d.id_banco === id_banco);
    if (yaExiste) {
      throw new Error(
        "Ese banco ya tiene distancia a la planta de asfaltos. Editala en lugar de crear otra."
      );
    }

    const { error: err } = await supabase
      .from("distancias_banco_planta")
      .insert({ id_banco, distancia_km: parseFloat(distancia_km) });
    if (err) {
      if (esDuplicado(err)) {
        throw new Error("Ese banco ya tiene distancia a la planta.");
      }
      throw err;
    }
    await fetchDistanciasPlanta();
  };

  const editarDistanciaPlanta = async (idDistanciaPlanta, distancia_km) => {
    const { error: err } = await supabase
      .from("distancias_banco_planta")
      .update({ distancia_km: parseFloat(distancia_km) })
      .eq("id_distancia_banco_planta", idDistanciaPlanta);
    if (err) throw err;
    await fetchDistanciasPlanta();
  };

  const eliminarDistanciaPlanta = async (idDistanciaPlanta) => {
    const { error: err } = await supabase
      .from("distancias_banco_planta")
      .delete()
      .eq("id_distancia_banco_planta", idDistanciaPlanta);
    if (err) throw err;
    await fetchDistanciasPlanta();
  };

  // ─── Pesos especificos ─────────────────────────────────────────────────────
  const crearPeso = async ({ id_banco, id_material, peso_especifico }) => {
    const yaExiste = pesosEspecificos.some(
      (p) => p.id_banco === id_banco && p.id_material === id_material
    );
    if (yaExiste) {
      throw new Error(
        "Ese material ya tiene peso especifico en ese banco. Editalo en lugar de crear otro."
      );
    }

    const { error: err } = await supabase.from("peso_especifico").insert({
      id_banco,
      id_material,
      peso_especifico: parseFloat(peso_especifico),
    });
    if (err) {
      if (esDuplicado(err)) {
        throw new Error("Ese material ya tiene peso especifico en ese banco.");
      }
      throw err;
    }
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
    distanciasPlanta,
    pesosEspecificos,
    loading,
    error,
    cargarTodo,
    crearBanco,
    editarBanco,
    crearDistancia,
    editarDistancia,
    eliminarDistancia,
    crearDistanciaPlanta,
    editarDistanciaPlanta,
    eliminarDistanciaPlanta,
    crearPeso,
    editarPeso,
    eliminarPeso,
  };
}
