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
    throw new Error(
      `Distancia inválida: "${distanciaKm}". Revisa la distancia banco-obra configurada.`
    );
  }

  if (isNaN(primerKm) || primerKm <= 0) {
    console.error(
      "[preciosMaterial] Error: Precio primer km inválido:",
      precioMaterial.primer_km
    );
    throw new Error(
      `Tarifa de primer km inválida ("${precioMaterial.primer_km}") en la tarifa ` +
        `id_precios_material ${precioMaterial.id_precios_material}. Revísala en Precios de Material.`
    );
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
      throw new Error(
        `Tarifa de intervalo 1 inválida ("${precioMaterial.km_sub_int1}") en la tarifa ` +
          `id_precios_material ${precioMaterial.id_precios_material}. Revísala en Precios de Material.`
      );
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
      throw new Error(
        `Tarifa de intervalo 2 inválida ("${precioMaterial.km_sub_int2}") en la tarifa ` +
          `id_precios_material ${precioMaterial.id_precios_material}. Revísala en Precios de Material.`
      );
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
 * Resuelve los nombres de tipo de material y sindicato para armar mensajes
 * legibles. Si algún catálogo no responde se devuelven los IDs — el mensaje
 * sigue siendo útil para identificar la combinación que falta.
 *
 * @param {number} idTipoMaterial - ID del tipo de material
 * @param {number} idSindicato - ID del sindicato
 * @returns {Promise<{tipo: string, sindicato: string}>}
 */
const describirCombinacion = async (idTipoMaterial, idSindicato) => {
  let tipo = `tipo de material ${idTipoMaterial}`;
  let sindicato = `sindicato ${idSindicato}`;

  try {
    const [resTipo, resSindicato] = await Promise.all([
      supabase
        .from("tipo_de_material")
        .select("tipo_de_material")
        .eq("id_tipo_de_material", idTipoMaterial)
        .maybeSingle(),
      supabase
        .from("sindicatos")
        .select("sindicato")
        .eq("id_sindicato", idSindicato)
        .maybeSingle(),
    ]);

    if (resTipo.data?.tipo_de_material) tipo = resTipo.data.tipo_de_material;
    if (resSindicato.data?.sindicato) sindicato = resSindicato.data.sindicato;
  } catch (error) {
    console.warn(
      "[preciosMaterial] No se pudieron resolver nombres para el mensaje:",
      error.message
    );
  }

  return { tipo, sindicato };
};

/**
 * Obtiene la tarifa de precios_material según tipo de material y sindicato
 *
 * NO usa .single(): con 0 filas PostgREST lanza "Cannot coerce the result to a
 * single JSON object", un mensaje que no dice qué combinación falta y que dejaba
 * el vale a medio crear. Aquí 0 filas devuelve null (lo que promete el @returns)
 * y el duplicado se reporta con su propio mensaje.
 *
 * @param {number} idTipoMaterial - ID del tipo de material
 * @param {number} idSindicato - ID del sindicato
 * @returns {Promise<object|null>} - Objeto con datos de precios_material o null
 */
export const obtenerTarifaMaterial = async (idTipoMaterial, idSindicato) => {
  const { data, error } = await supabase
    .from("precios_material")
    .select("*")
    .eq("id_tipo_de_material", idTipoMaterial)
    .eq("id_sindicato", idSindicato);

  if (error) {
    console.error(
      "[preciosMaterial] Error consultando precios_material:",
      error.message
    );
    throw error;
  }

  const tarifas = data || [];

  if (tarifas.length === 0) {
    return null;
  }

  if (tarifas.length > 1) {
    const { tipo, sindicato } = await describirCombinacion(
      idTipoMaterial,
      idSindicato
    );
    const ids = tarifas.map((t) => t.id_precios_material).join(", ");
    throw new Error(
      `Hay ${tarifas.length} tarifas duplicadas para "${tipo}" con el sindicato "${sindicato}". ` +
        `Pide al administrador que deje solo una en Precios de Material. ` +
        `(id_precios_material: ${ids})`
    );
  }

  return tarifas[0];
};

/**
 * Verifica que exista tarifa para la combinación tipo de material + sindicato.
 * Lanza un error con nombres reales si falta o si está duplicada.
 *
 * Llamar ANTES de insertar el vale: así no queda un vale sin detalle (folio
 * quemado) cuando la tarifa no está cargada.
 *
 * @param {number} idTipoMaterial - ID del tipo de material
 * @param {number} idSindicato - ID del sindicato
 * @returns {Promise<object>} - La tarifa encontrada
 */
export const verificarTarifaMaterial = async (idTipoMaterial, idSindicato) => {
  const tarifa = await obtenerTarifaMaterial(idTipoMaterial, idSindicato);

  if (tarifa) {
    return tarifa;
  }

  const { tipo, sindicato } = await describirCombinacion(
    idTipoMaterial,
    idSindicato
  );

  throw new Error(
    `Falta el precio de "${tipo}" para el sindicato "${sindicato}". ` +
      `Pide al administrador que lo cargue en Precios de Material antes de crear este vale. ` +
      `(id_tipo_de_material: ${idTipoMaterial}, id_sindicato: ${idSindicato})`
  );
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

  // Obtener tarifa — lanza mensaje con nombres si falta o está duplicada
  const tarifa = await verificarTarifaMaterial(idTipoMaterial, idSindicato);

  // Calcular precio por m³
  const precioM3 = calcularPrecioM3(distanciaKm, tarifa);

  // Calcular costo total
  const cantidad = parseFloat(cantidadM3);
  if (isNaN(cantidad) || cantidad <= 0) {
    console.error("[preciosMaterial] Cantidad inválida:", cantidadM3);
    throw new Error(
      `Cantidad de m³ inválida: "${cantidadM3}". Revisa el campo de cantidad de material.`
    );
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
