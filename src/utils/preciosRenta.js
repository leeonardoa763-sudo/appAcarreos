/**
 * utils/preciosRenta.js
 *
 * Resolución de la tarifa de renta (aplica también a pipas de agua, que son
 * vales de renta con el sello es_pipa_agua).
 *
 * TARIFA POR OBRA (2026-08-04):
 * Una obra puede tener tarifa propia en `precios_renta_obra`. La resolución es
 * la misma que en material:
 *
 *   tarifa de (obra, sindicato) → si no existe → tarifa del sindicato (precios_renta)
 *
 * POR QUÉ SE CONGELA LA TARIFA EN EL VALE:
 * Hasta ahora `vale_renta_detalle` solo guardaba `id_precios_renta` (una FK) y
 * todos los lectores mostraban costo_hr/costo_dia del join en vivo. Con eso,
 * editar una tarifa reprecia visualmente todos los vales históricos de ese
 * sindicato — el importe mostrado dejaba de cuadrar con el `costo_total` que se
 * calculó al completarlos. Al guardar la tarifa resuelta en
 * costo_hr_aplicado / costo_dia_aplicado, un cambio posterior ya no toca los
 * vales viejos. Material ya funcionaba así (congela precio_m3 y costo_total).
 */

import { supabase } from "../config/supabase";

/**
 * Resuelve la tarifa de renta vigente para un sindicato en una obra.
 * Se llama UNA vez, al crear el vale.
 *
 * Consulta directa a la BD, sin caché de catálogos: una tarifa recién capturada
 * por el administrador debe aplicar de inmediato. Por eso `useCatalogos` ya no
 * expone `preciosRenta`.
 *
 * `id_precios_renta` (la FK al default del sindicato) se devuelve SIEMPRE, gane
 * o no la tarifa de obra, y el vale la sigue guardando. La columna existe desde
 * antes y hay consumidores fuera de este repo — la web pública de verificación y
 * el trigger `calcular_totales_vale_renta`, cuyo cuerpo no está versionado aquí.
 * Dejarla en NULL sería un cambio de contrato con esos consumidores; qué tarifa
 * ganó se sabe por `id_precios_renta_obra`, y el importe real viaja congelado en
 * costo_hr_aplicado / costo_dia_aplicado.
 *
 * `.maybeSingle()` es seguro en precios_renta_obra por el UNIQUE
 * (id_obra, id_sindicato). Para precios_renta se usa el mismo patrón defensivo
 * que en preciosMaterial: sin .single(), porque esa tabla no tiene restricción
 * de unicidad y 0 filas debe devolver null, no un error ilegible de PostgREST.
 *
 * @param {number} idSindicato - ID del sindicato
 * @param {number} [idObra] - ID de la obra del vale
 * @returns {Promise<object|null>} - { costoHr, costoDia, idPreciosRenta, idPreciosRentaObra, esTarifaDeObra } o null
 */
export const resolverTarifaRenta = async (idSindicato, idObra) => {
  if (!idSindicato) return null;

  const [resObra, resSindicato] = await Promise.all([
    idObra
      ? supabase
          .from("precios_renta_obra")
          .select("id_precios_renta_obra, costo_hr, costo_dia")
          .eq("id_obra", idObra)
          .eq("id_sindicato", idSindicato)
          .eq("activo", true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("precios_renta")
      .select("id_precios_renta, costo_hr, costo_dia")
      .eq("id_sindicato", idSindicato),
  ]);

  if (resObra.error) {
    console.error(
      "[preciosRenta] Error consultando precios_renta_obra:",
      resObra.error.message,
    );
    throw resObra.error;
  }

  if (resSindicato.error) {
    console.error(
      "[preciosRenta] Error consultando precios_renta:",
      resSindicato.error.message,
    );
    throw resSindicato.error;
  }

  const tarifaObra = resObra.data;
  const tarifaSindicato = (resSindicato.data || [])[0] || null;

  // Sin tarifa de obra Y sin default del sindicato no hay con qué facturar
  if (!tarifaObra && !tarifaSindicato) return null;

  const vigente = tarifaObra || tarifaSindicato;

  return {
    costoHr: vigente.costo_hr,
    costoDia: vigente.costo_dia,
    idPreciosRenta: tarifaSindicato?.id_precios_renta ?? null,
    idPreciosRentaObra: tarifaObra?.id_precios_renta_obra ?? null,
    esTarifaDeObra: Boolean(tarifaObra),
  };
};

/**
 * Tarifa efectiva de un vale de renta ya guardado. Se llama en cada lectura
 * (pantalla de detalle, PDFs, CSVs).
 *
 * Prefiere lo congelado en el vale. Si viene null es un vale anterior a la
 * migración del 2026-08-04: cae al join con precios_renta, exactamente el
 * comportamiento que tenía antes, para no alterar el histórico.
 *
 * Devuelve la misma forma que el join (`costo_hr` / `costo_dia`) para poder
 * sustituirlo sin tocar a los consumidores.
 *
 * @param {object} detalleRenta - Fila de vale_renta_detalle (con el join precios_renta)
 * @returns {{costo_hr: number|null, costo_dia: number|null}}
 */
export const tarifaRentaEfectiva = (detalleRenta) => ({
  costo_hr: detalleRenta?.costo_hr_aplicado ?? detalleRenta?.precios_renta?.costo_hr ?? null,
  costo_dia: detalleRenta?.costo_dia_aplicado ?? detalleRenta?.precios_renta?.costo_dia ?? null,
});
