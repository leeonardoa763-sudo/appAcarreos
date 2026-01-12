/**
 * hooks/exportHelpers/valesQueries.js
 *
 * QUERIES A SUPABASE PARA EXPORTACIÓN
 * - Obtención de semanas con vales
 * - Queries de vales de material
 * - Queries de vales de renta
 */

import { supabase } from "../../config/supabase";
import { getWeekDateRange, getWeeksFromVales } from "../../utils/dateUtils";

/**
 * Obtiene todas las semanas que tienen vales emitidos
 */
export const fetchWeeksWithVales = async (idObra) => {
  try {
    if (!idObra) {
      return [];
    }

    const { data, error } = await supabase
      .from("vales_con_semanas")
      .select("numero_semana, anio_semana, fecha_creacion")
      .eq("id_obra", idObra)
      .order("fecha_creacion", { ascending: false });

    if (error) {
      console.error("[valesQueries] ❌ Error en query:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agrupar por semana
    const semanasUnicas = new Map();
    data.forEach((vale) => {
      const key = `${vale.numero_semana}-${vale.anio_semana}`;
      if (!semanasUnicas.has(key)) {
        semanasUnicas.set(key, {
          numero_semana: vale.numero_semana,
          fecha_creacion: vale.fecha_creacion,
        });
      }
    });

    return getWeeksFromVales(
      Array.from(semanasUnicas.values()).map((s) => ({
        fecha_creacion: s.fecha_creacion,
      }))
    );
  } catch (err) {
    console.error("[valesQueries] ❌ Error obteniendo semanas:", err);
    return [];
  }
};

/**
 * Obtiene vales de material con todos sus datos relacionados
 */
export const fetchValesMaterial = async (weekNumber, year, idObra) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      tipo_vale,
      estado,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      operadores!vales_id_operador_fkey(nombre, primer_apellido, segundo_apellido),
      vehiculos!vales_id_vehiculo_fkey(placas),
      vale_material_detalles(
        material!vale_material_detalles_id_material_fkey(material),
        bancos!vale_material_detalles_id_banco_fkey(banco),
        capacidad_m3,
        distancia_km,
        cantidad_pedida_m3,
        volumen_real_m3,
        peso_ton,
        precio_m3,
        costo_total,
        tarifa_primer_km,
        tarifa_subsecuente
      )
    `
    )
    .eq("tipo_vale", "material")
    .in("estado", ["emitido", "verificado", "conciliado"])
    .eq("id_obra", idObra)
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Obtiene vales de renta con todos sus datos relacionados
 */
export const fetchValesRenta = async (weekNumber, year, idObra) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      tipo_vale,
      estado,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      operadores!vales_id_operador_fkey(nombre, primer_apellido, segundo_apellido),
      vehiculos!vales_id_vehiculo_fkey(placas),
      vale_renta_detalle(
        material!vale_renta_detalle_id_material_fkey(material),
        hora_inicio,
        hora_fin,
        total_horas,
        total_dias,
        es_renta_por_dia,
        costo_total,
        precios_renta!vale_renta_detalle_id_precios_renta_fkey(costo_hr, costo_dia)
      )
    `
    )
    .eq("tipo_vale", "renta")
    .in("estado", ["emitido", "verificado", "conciliado"])
    .eq("id_obra", idObra)
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;
  return data;
};
