// src/services/presupuestoService.js
//
// Consultas a Supabase para el sistema de presupuestos por obra.
// Sin estado, sin hooks. Solo funciones async puras.

import { supabase } from "../config/supabase";

/**
 * Obtiene el presupuesto de un material específico en una obra.
 * Retorna null si no hay presupuesto configurado.
 */
export const fetchPresupuestoMaterial = async (id_obra, id_material) => {
  if (!id_obra || !id_material) return null;

  const { data, error } = await supabase
    .from("presupuesto_material_obra")
    .select("m3_presupuestados, m3_consumidos")
    .eq("id_obra", id_obra)
    .eq("id_material", id_material)
    .eq("activo", true)
    .maybeSingle();

  console.log("[presupuestoService] data:", data, "error:", error);

  if (error) throw error;
  return data;
};

/**
 * Obtiene el presupuesto de renta de una obra.
 * Retorna null si no hay presupuesto configurado.
 */
export const fetchPresupuestoRenta = async (id_obra) => {
  if (!id_obra) return null;

  const { data, error } = await supabase
    .from("presupuesto_renta_obra")
    .select("monto_presupuestado, monto_consumido")
    .eq("id_obra", id_obra)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw error;
  return data;
};
