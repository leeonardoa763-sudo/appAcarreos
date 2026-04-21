/**
 * utils/preciosMaterial.js
 *
 * Funciones para calcular precios de material según tarifas por distancia
 *
 * PROPÓSITO:
 * - Calcular precio por m³ según distancia y tarifas del sindicato
 * - Aplicar lógica de intervalos (primer km + subsecuentes)
 * - Manejar límites NULL (sin límite de distancia)
 * - Obtener tarifa correcta desde BD
 */

import { supabase } from "../config/supabase";

/**
 * Calcula el precio por m³ según la distancia y los intervalos de precios
 *
 * LÓGICA CON LÍMITES NULL:
 * - limite_int1 = NULL: Intervalo 1 sin límite, se usa km_sub_int1 para toda distancia
 * - limite_int2 = NULL: Intervalo 2 sin límite, se usa km_sub_int2 después del int1
 *
 * EJEMPLOS REALES:
 *
 * Caso A - 1 intervalo sin límite (Base Asfáltica CTM):
 *   primer_km=10, km_sub_int1=60, limite_int1=NULL
 *   Distancia 30km: 10 + (29*60) = $1,750/m³
 *
 * Caso B - 2 intervalos, segundo sin límite (Materiales Petreos CATEM):
 *   primer_km=11, km_sub_int1=6, limite_int1=20, km_sub_int2=5, limite_int2=NULL
 *   Distancia 30km: 11 + (19*6) + (10*5) = $175/m³
 *
 * @param {number} distanciaKm - Distancia al banco en kilómetros
 * @param {object} precioMaterial - Objeto con estructura de precios_material
 * @returns {number} - Precio por m³ calculado
 */
export const calcularPrecioM3 = (distanciaKm, precioMaterial) => {

  const distancia = parseFloat(distanciaKm);
  const primerKm = parseFloat(precioMaterial.primer_km);
  const numeroIntervalos = parseFloat(precioMaterial.numero_de_intervalos);

  // Validaciones básicas
  if (isNaN(distancia) || distancia <= 0) {
    console.error("[preciosMaterial] Error: Distancia inválida:", distanciaKm);
    throw new Error("Distancia inválida");
  }

  if (isNaN(primerKm) || primerKm <= 0) {
    console.error(
      "[preciosMaterial] Error: Precio primer km inválido:",
      precioMaterial.primer_km
    );
    throw new Error("Tarifa primer km inválida");
  }

  let precioTotal = primerKm;

  // Si solo hay 1 km de distancia, devolver solo el primer km
  if (distancia === 1) {
    return precioTotal;
  }

  // INTERVALO 1
  if (numeroIntervalos >= 1) {
    const kmSubInt1 = parseFloat(precioMaterial.km_sub_int1);
    const limiteInt1 = precioMaterial.limite_int1
      ? parseFloat(precioMaterial.limite_int1)
      : null;


    if (isNaN(kmSubInt1)) {
      console.error(
        "[preciosMaterial] Error: Tarifa subsecuente intervalo 1 inválida"
      );
      throw new Error("Tarifa intervalo 1 inválida");
    }

    // Caso A: Límite INT1 es NULL (sin límite)
    if (limiteInt1 === null) {
      const kmAdicionales = distancia - 1;
      precioTotal += kmAdicionales * kmSubInt1;
      return precioTotal;
    }

    // Caso B: Límite INT1 tiene valor
    if (distancia <= limiteInt1) {
      // La distancia está dentro del intervalo 1
      const kmAdicionales = distancia - 1;
      precioTotal += kmAdicionales * kmSubInt1;
      return precioTotal;
    } else {
      // La distancia supera el intervalo 1, aplicar completo
      const kmInt1 = limiteInt1 - 1;
      const costoInt1 = kmInt1 * kmSubInt1;
      precioTotal += costoInt1;
    }
  }

  // INTERVALO 2
  if (numeroIntervalos >= 2) {
    const kmSubInt2 = parseFloat(precioMaterial.km_sub_int2);
    const limiteInt1 = parseFloat(precioMaterial.limite_int1);
    const limiteInt2 = precioMaterial.limite_int2
      ? parseFloat(precioMaterial.limite_int2)
      : null;


    if (isNaN(kmSubInt2)) {
      console.error(
        "[preciosMaterial] Error: Tarifa subsecuente intervalo 2 inválida"
      );
      throw new Error("Tarifa intervalo 2 inválida");
    }

    // Caso A: Límite INT2 es NULL (sin límite)
    if (limiteInt2 === null) {
      const kmAdicionales = distancia - limiteInt1;
      precioTotal += kmAdicionales * kmSubInt2;
      return precioTotal;
    }

    // Caso B: Límite INT2 tiene valor
    if (distancia <= limiteInt2) {
      // La distancia está dentro del intervalo 2
      const kmAdicionales = distancia - limiteInt1;
      precioTotal += kmAdicionales * kmSubInt2;
      return precioTotal;
    } else {
      // La distancia supera el intervalo 2
      const kmInt2 = limiteInt2 - limiteInt1;
      const costoInt2 = kmInt2 * kmSubInt2;
      precioTotal += costoInt2;

      // Distancia excede ambos límites, usar última tarifa
      const kmAdicionales = distancia - limiteInt2;
      precioTotal += kmAdicionales * kmSubInt2;
    }
  }

  return precioTotal;
};

/**
 * Obtiene la tarifa de precios_material según tipo de material y sindicato
 *
 * @param {number} idTipoMaterial - ID del tipo de material
 * @param {number} idSindicato - ID del sindicato
 * @returns {Promise<object|null>} - Objeto con datos de precios_material o null
 */
export const obtenerTarifaMaterial = async (idTipoMaterial, idSindicato) => {

  try {
    const { data, error } = await supabase
      .from("precios_material")
      .select("*")
      .eq("id_tipo_de_material", idTipoMaterial)
      .eq("id_sindicato", idSindicato)
      .single();

    if (error) {
      console.error(
        "[preciosMaterial] Error en query Supabase:",
        error.message
      );
      throw error;
    }

    if (!data) {
      console.warn(
        "[preciosMaterial] No se encontró tarifa para combinación tipo/sindicato"
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error("[preciosMaterial] Error obteniendo tarifa:", error.message);
    throw error;
  }
};
/**
 * Calcula precio y costo total de un vale de material
 *
 * @param {number} idTipoMaterial - ID del tipo de material
 * @param {number} idSindicato - ID del sindicato
 * @param {number} distanciaKm - Distancia al banco
 * @param {number} cantidadM3 - Cantidad de metros cúbicos
 * @returns {Promise<object>} - { precioM3, costoTotal, idPreciosMaterial, tarifaPrimerKm, tarifaSubsecuente }
 */
export const calcularCostoValeMaterial = async (
  idTipoMaterial,
  idSindicato,
  distanciaKm,
  cantidadM3
) => {

  // Obtener tarifa
  const tarifa = await obtenerTarifaMaterial(idTipoMaterial, idSindicato);

  if (!tarifa) {
    console.error("[preciosMaterial] No se encontró tarifa aplicable");
    throw new Error(
      "No se encontró tarifa para el tipo de material y sindicato seleccionados"
    );
  }

  // Calcular precio por m³
  const precioM3 = calcularPrecioM3(distanciaKm, tarifa);

  // Calcular costo total
  const cantidad = parseFloat(cantidadM3);
  if (isNaN(cantidad) || cantidad <= 0) {
    console.error("[preciosMaterial] Cantidad inválida:", cantidadM3);
    throw new Error("Cantidad de m³ inválida");
  }

  const costoTotal = precioM3 * cantidad;

  // Determinar tarifa subsecuente usada (último intervalo aplicado)
  let tarifaSubsecuente = tarifa.km_sub_int1;

  if (
    tarifa.numero_de_intervalos >= 2 &&
    distanciaKm > (tarifa.limite_int1 || 0)
  ) {
    tarifaSubsecuente = tarifa.km_sub_int2;
  }


  return {
    precioM3: parseFloat(precioM3.toFixed(2)),
    costoTotal: parseFloat(costoTotal.toFixed(2)),
    idPreciosMaterial: tarifa.id_precios_material,
    tarifaPrimerKm: parseFloat(tarifa.primer_km.toFixed(2)),
    tarifaSubsecuente: parseFloat(tarifaSubsecuente.toFixed(2)),
  };
};
