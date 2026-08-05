/**
 * utils/duplicadoVale.js
 *
 * Deteccion de vales de material creados por duplicado.
 *
 * El folio se genera leyendo el ultimo folio de la obra, asi que dos creaciones
 * seguidas producen dos vales validos con folios distintos: nada en la BD los
 * rechaza. El unico filtro posible es comparar el contenido contra los vales
 * recientes del mismo capturista.
 *
 * Es una advertencia, no un bloqueo: si la consulta falla se deja pasar la
 * creacion (nunca impedir capturar por un error de red).
 */

import { supabase } from "../config/supabase";

// Ventana de comparacion. Un mismo camion no vuelve a cargar el mismo material
// y la misma cantidad en este lapso; si aparece, casi siempre es un doble toque.
export const MINUTOS_VENTANA_DUPLICADO = 10;

// Tolerancia al comparar m3 (numeric de Postgres vs float de JS)
const TOLERANCIA_M3 = 0.001;

/**
 * Busca un vale de material reciente con los mismos datos que el que se va a
 * crear (misma obra, mismo capturista, mismo vehiculo, mismo material y misma
 * cantidad pedida).
 *
 * @returns {Promise<{folio: string, fecha_creacion: string} | null>}
 */
export const buscarValeMaterialDuplicado = async ({
  idObra,
  idPersonaCreador,
  idVehiculo,
  idMaterial,
  cantidadM3,
  minutos = MINUTOS_VENTANA_DUPLICADO,
}) => {
  if (!idObra || !idPersonaCreador || !idVehiculo || !idMaterial) return null;

  const desde = new Date(Date.now() - minutos * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("vales")
    .select(
      `
      folio,
      fecha_creacion,
      vale_material_detalles (
        id_material,
        cantidad_pedida_m3
      )
    `,
    )
    .eq("id_obra", idObra)
    .eq("id_persona_creador", idPersonaCreador)
    .eq("id_vehiculo", idVehiculo)
    .eq("tipo_vale", "material")
    .neq("estado", "cancelado")
    .gte("fecha_creacion", desde)
    .order("fecha_creacion", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[duplicadoVale] Error consultando vales recientes:", error);
    return null;
  }

  const cantidad = Number(cantidadM3);

  const duplicado = (data || []).find((vale) =>
    (vale.vale_material_detalles || []).some((detalle) => {
      if (detalle.id_material !== idMaterial) return false;
      if (!Number.isFinite(cantidad)) return true;
      const pedida = Number(detalle.cantidad_pedida_m3);
      return (
        Number.isFinite(pedida) && Math.abs(pedida - cantidad) < TOLERANCIA_M3
      );
    }),
  );

  return duplicado || null;
};

/**
 * "hace 3 minutos" — para el texto de la advertencia.
 */
export const minutosDesde = (fechaISO) => {
  const ms = Date.now() - new Date(fechaISO).getTime();
  const minutos = Math.max(0, Math.round(ms / 60000));
  if (minutos <= 1) return "hace menos de un minuto";
  return `hace ${minutos} minutos`;
};
