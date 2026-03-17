/**
 * hooks/exportHelpers/valesQueries.js
 *
 * QUERIES A SUPABASE PARA EXPORTACIÓN
 * - Obtención de semanas con vales
 * - Queries de vales de material
 * - Queries de vales de renta
 * MODIFICADO: Soporta múltiples obras asignadas
 */

import { supabase } from "../../config/supabase";
import { getWeekDateRange, getWeeksFromVales } from "../../utils/dateUtils";

/**
 * Obtiene todas las semanas que tienen vales emitidos
 * MODIFICADO: Ahora acepta array de obras en lugar de una sola
 */
export const fetchWeeksWithVales = async (obrasIds) => {
  try {
    if (!obrasIds || obrasIds.length === 0) {
      console.log("[valesQueries] No hay obras para buscar semanas");
      return [];
    }

    console.log("[valesQueries] Buscando semanas para obras:", obrasIds);

    const { data, error } = await supabase
      .from("vales_con_semanas")
      .select("numero_semana, anio_semana, fecha_creacion")
      .in("id_obra", obrasIds) // ✅ CAMBIO: Múltiples obras
      .order("fecha_creacion", { ascending: false });

    if (error) {
      console.error("[valesQueries] ❌ Error en query:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("[valesQueries] No se encontraron vales con semanas");
      return [];
    }

    console.log("[valesQueries] ✅ Registros encontrados:", data.length);

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

    console.log(
      "[valesQueries] ✅ Semanas únicas encontradas:",
      semanasUnicas.size,
    );

    return getWeeksFromVales(
      Array.from(semanasUnicas.values()).map((s) => ({
        fecha_creacion: s.fecha_creacion,
      })),
    );
  } catch (err) {
    console.error("[valesQueries] ❌ Error obteniendo semanas:", err);
    return [];
  }
};

/**
 * Obtiene vales de material con todos sus datos relacionados
 * MODIFICADO: Ahora acepta array de obras en lugar de una sola
 */
export const fetchValesMaterial = async (weekNumber, year, obrasIds) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      fecha_completado,
      tipo_vale,
      estado,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      persona_completador:id_persona_completador(nombre, primer_apellido, segundo_apellido),
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
        notas_adicionales,
        tarifa_primer_km,
        tarifa_subsecuente,
        requisicion,
        folio_vale_fisico
      )
    `,
    )
    .eq("tipo_vale", "material")
    .in("estado", ["emitido", "verificado", "conciliado"])
    .in("id_obra", obrasIds) // ✅ CAMBIO: Múltiples obras
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Obtiene vales de renta con todos sus datos relacionados
 * MODIFICADO: Ahora acepta array de obras en lugar de una sola
 */
export const fetchValesRenta = async (weekNumber, year, obrasIds) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      fecha_completado,
      tipo_vale,
      estado,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      persona_completador:id_persona_completador(nombre, primer_apellido, segundo_apellido),
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
        notas_adicionales,
        precios_renta!vale_renta_detalle_id_precios_renta_fkey(costo_hr, costo_dia)
      )
    `,
    )
    .eq("tipo_vale", "renta")
    .in("estado", ["emitido", "verificado", "conciliado"])
    .in("id_obra", obrasIds) // ✅ CAMBIO: Múltiples obras
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Obtiene tickets de descarga vinculados a vales de una semana específica
 * Parte desde vales para poder filtrar correctamente por fecha_creacion
 */
export const fetchTicketsDescarga = async (weekNumber, year, obrasIds) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      estado,
      id_obra,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      operadores!vales_id_operador_fkey(nombre, primer_apellido, segundo_apellido),
      vehiculos!vales_id_vehiculo_fkey(placas),
      vale_renta_detalle(
        material!vale_renta_detalle_id_material_fkey(material)
      ),
      tickets_descarga(
        id_ticket,
        folio_ticket,
        numero_ticket,
        banco_descarga,
        fecha_impresion,
        persona_registro:id_persona_registro(nombre, primer_apellido, segundo_apellido)
      )
    `,
    )
    .eq("tipo_vale", "renta")
    .in("id_obra", obrasIds)
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .not("tickets_descarga", "is", null);

  if (error) throw error;

  // Aplanar: un registro por ticket (un vale puede tener varios tickets)
  const resultado = [];
  (data || []).forEach((vale) => {
    if (!vale.tickets_descarga || vale.tickets_descarga.length === 0) return;
    vale.tickets_descarga.forEach((ticket) => {
      resultado.push({ ...ticket, vales: vale });
    });
  });

  return resultado;
};

/**
 * Obtiene viajes de material (vale_material_viajes) por semana
 * Un registro por viaje — aplanado desde vales > vale_material_detalles > vale_material_viajes
 */
export const fetchViajesMaterial = async (weekNumber, year, obrasIds) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      estado,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      operadores!vales_id_operador_fkey(nombre, primer_apellido, segundo_apellido),
      vehiculos!vales_id_vehiculo_fkey(placas),
      vale_material_detalles(
        id_detalle_material,
        material!vale_material_detalles_id_material_fkey(material),
        bancos!vale_material_detalles_id_banco_fkey(banco),
        distancia_km,
        capacidad_m3,
        requisicion,
        vale_material_viajes(
          id_viaje,
          numero_viaje,
          hora_registro,
          peso_ton,
          volumen_m3,
          precio_m3,
          costo_viaje,
          folio_vale_fisico,
          persona:id_persona_registro(nombre, primer_apellido, segundo_apellido)
        )
      )
    `,
    )
    .eq("tipo_vale", "material")
    .in("estado", ["emitido", "verificado", "conciliado"])
    .in("id_obra", obrasIds)
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;

  // Aplanar: un registro por viaje
  const resultado = [];
  (data || []).forEach((vale) => {
    const detalle = vale.vale_material_detalles?.[0];
    if (!detalle?.vale_material_viajes?.length) return;
    detalle.vale_material_viajes.forEach((viaje) => {
      resultado.push({ ...viaje, vale, detalle });
    });
  });

  return resultado;
};

/**
 * Obtiene viajes de renta (vale_renta_viajes) por semana
 * Un registro por viaje — aplanado desde vales > vale_renta_detalle > vale_renta_viajes
 */
export const fetchViajesRenta = async (weekNumber, year, obrasIds) => {
  const { startDate, endDate } = getWeekDateRange(weekNumber, year);

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      id_vale,
      folio,
      fecha_creacion,
      estado,
      obras!vales_id_obra_fkey(obra),
      persona!vales_id_persona_creador_fkey(nombre, primer_apellido, segundo_apellido),
      operadores!vales_id_operador_fkey(nombre, primer_apellido, segundo_apellido),
      vehiculos!vales_id_vehiculo_fkey(placas),
      vale_renta_detalle(
        id_vale_renta_detalle,
        material!vale_renta_detalle_id_material_fkey(material),
        hora_inicio,
        es_renta_por_dia,
        vale_renta_viajes(
          id_viaje,
          numero_viaje,
          hora_registro,
          persona:id_persona_registro(nombre, primer_apellido, segundo_apellido)
        )
      )
    `,
    )
    .eq("tipo_vale", "renta")
    .in("estado", ["emitido", "verificado", "conciliado"])
    .in("id_obra", obrasIds)
    .gte("fecha_creacion", startDate.toISOString())
    .lte("fecha_creacion", endDate.toISOString())
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;

  // Aplanar: un registro por viaje
  const resultado = [];
  (data || []).forEach((vale) => {
    const detalle = vale.vale_renta_detalle?.[0];
    if (!detalle?.vale_renta_viajes?.length) return;
    detalle.vale_renta_viajes.forEach((viaje) => {
      resultado.push({ ...viaje, vale, detalle });
    });
  });

  return resultado;
};
