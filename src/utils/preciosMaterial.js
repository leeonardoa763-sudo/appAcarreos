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
  console.log("[preciosMaterial] Iniciando cálculo de precio");
  console.log("[preciosMaterial] Distancia:", distanciaKm, "km");
  console.log("[preciosMaterial] Tarifa:", JSON.stringify(precioMaterial));

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
  console.log("[preciosMaterial] Precio base (primer km):", precioTotal);

  // Si solo hay 1 km de distancia, devolver solo el primer km
  if (distancia === 1) {
    console.log(
      "[preciosMaterial] Distancia de 1km, precio final:",
      precioTotal
    );
    return precioTotal;
  }

  // INTERVALO 1
  if (numeroIntervalos >= 1) {
    const kmSubInt1 = parseFloat(precioMaterial.km_sub_int1);
    const limiteInt1 = precioMaterial.limite_int1
      ? parseFloat(precioMaterial.limite_int1)
      : null;

    console.log(
      "[preciosMaterial] Intervalo 1 - Tarifa subsecuente:",
      kmSubInt1
    );
    console.log(
      "[preciosMaterial] Intervalo 1 - Límite:",
      limiteInt1 === null ? "SIN LÍMITE" : limiteInt1 + " km"
    );

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
      console.log("[preciosMaterial] Intervalo 1 SIN LÍMITE aplicado");
      console.log("[preciosMaterial] Km adicionales:", kmAdicionales);
      console.log(
        "[preciosMaterial] Costo adicional:",
        (kmAdicionales * kmSubInt1).toFixed(2)
      );
      console.log(
        "[preciosMaterial] Precio total final:",
        precioTotal.toFixed(2)
      );
      return precioTotal;
    }

    // Caso B: Límite INT1 tiene valor
    if (distancia <= limiteInt1) {
      // La distancia está dentro del intervalo 1
      const kmAdicionales = distancia - 1;
      precioTotal += kmAdicionales * kmSubInt1;
      console.log("[preciosMaterial] Distancia dentro de límite intervalo 1");
      console.log("[preciosMaterial] Km adicionales:", kmAdicionales);
      console.log(
        "[preciosMaterial] Costo adicional:",
        (kmAdicionales * kmSubInt1).toFixed(2)
      );
      console.log(
        "[preciosMaterial] Precio total final:",
        precioTotal.toFixed(2)
      );
      return precioTotal;
    } else {
      // La distancia supera el intervalo 1, aplicar completo
      const kmInt1 = limiteInt1 - 1;
      const costoInt1 = kmInt1 * kmSubInt1;
      precioTotal += costoInt1;
      console.log("[preciosMaterial] Intervalo 1 completo aplicado");
      console.log("[preciosMaterial] Km intervalo 1:", kmInt1);
      console.log("[preciosMaterial] Costo intervalo 1:", costoInt1.toFixed(2));
      console.log(
        "[preciosMaterial] Subtotal después int1:",
        precioTotal.toFixed(2)
      );
    }
  }

  // INTERVALO 2
  if (numeroIntervalos >= 2) {
    const kmSubInt2 = parseFloat(precioMaterial.km_sub_int2);
    const limiteInt1 = parseFloat(precioMaterial.limite_int1);
    const limiteInt2 = precioMaterial.limite_int2
      ? parseFloat(precioMaterial.limite_int2)
      : null;

    console.log(
      "[preciosMaterial] Intervalo 2 - Tarifa subsecuente:",
      kmSubInt2
    );
    console.log(
      "[preciosMaterial] Intervalo 2 - Límite:",
      limiteInt2 === null ? "SIN LÍMITE" : limiteInt2 + " km"
    );

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
      console.log("[preciosMaterial] Intervalo 2 SIN LÍMITE aplicado");
      console.log("[preciosMaterial] Km adicionales int2:", kmAdicionales);
      console.log(
        "[preciosMaterial] Costo adicional int2:",
        (kmAdicionales * kmSubInt2).toFixed(2)
      );
      console.log(
        "[preciosMaterial] Precio total final:",
        precioTotal.toFixed(2)
      );
      return precioTotal;
    }

    // Caso B: Límite INT2 tiene valor
    if (distancia <= limiteInt2) {
      // La distancia está dentro del intervalo 2
      const kmAdicionales = distancia - limiteInt1;
      precioTotal += kmAdicionales * kmSubInt2;
      console.log("[preciosMaterial] Distancia dentro de límite intervalo 2");
      console.log("[preciosMaterial] Km adicionales int2:", kmAdicionales);
      console.log(
        "[preciosMaterial] Costo adicional int2:",
        (kmAdicionales * kmSubInt2).toFixed(2)
      );
      console.log(
        "[preciosMaterial] Precio total final:",
        precioTotal.toFixed(2)
      );
      return precioTotal;
    } else {
      // La distancia supera el intervalo 2
      const kmInt2 = limiteInt2 - limiteInt1;
      const costoInt2 = kmInt2 * kmSubInt2;
      precioTotal += costoInt2;
      console.log("[preciosMaterial] Intervalo 2 completo aplicado");
      console.log("[preciosMaterial] Km intervalo 2:", kmInt2);
      console.log("[preciosMaterial] Costo intervalo 2:", costoInt2.toFixed(2));

      // Distancia excede ambos límites, usar última tarifa
      const kmAdicionales = distancia - limiteInt2;
      precioTotal += kmAdicionales * kmSubInt2;
      console.log("[preciosMaterial] Distancia excede todos los límites");
      console.log(
        "[preciosMaterial] Km adicionales después de int2:",
        kmAdicionales
      );
      console.log(
        "[preciosMaterial] Costo adicional (tarifa int2):",
        (kmAdicionales * kmSubInt2).toFixed(2)
      );
      console.log(
        "[preciosMaterial] Precio total final:",
        precioTotal.toFixed(2)
      );
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
  console.log("[preciosMaterial] Buscando tarifa en BD");
  console.log("[preciosMaterial] Tipo material ID:", idTipoMaterial);
  console.log("[preciosMaterial] Sindicato ID:", idSindicato);

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

    console.log(
      "[preciosMaterial] Tarifa encontrada ID:",
      data.id_precios_material
    );
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
  console.log("[preciosMaterial] ========================================");
  console.log("[preciosMaterial] INICIANDO CALCULO DE COSTO VALE");
  console.log("[preciosMaterial] Parámetros recibidos:");
  console.log("[preciosMaterial] - Tipo Material ID:", idTipoMaterial);
  console.log("[preciosMaterial] - Sindicato ID:", idSindicato);
  console.log("[preciosMaterial] - Distancia:", distanciaKm, "km");
  console.log("[preciosMaterial] - Cantidad:", cantidadM3, "m³");

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

  console.log("[preciosMaterial] ========================================");
  console.log("[preciosMaterial] RESULTADO FINAL:");
  console.log(
    "[preciosMaterial] - Tarifa 1er km:",
    "$" + parseFloat(tarifa.primer_km).toFixed(2)
  );
  console.log(
    "[preciosMaterial] - Tarifa subsecuente:",
    "$" + parseFloat(tarifaSubsecuente).toFixed(2)
  );
  console.log("[preciosMaterial] - Precio por m³:", "$" + precioM3.toFixed(2));
  console.log("[preciosMaterial] - Costo total:", "$" + costoTotal.toFixed(2));
  console.log(
    "[preciosMaterial] - ID Tarifa usada:",
    tarifa.id_precios_material
  );
  console.log("[preciosMaterial] ========================================");

  return {
    precioM3: parseFloat(precioM3.toFixed(2)),
    costoTotal: parseFloat(costoTotal.toFixed(2)),
    idPreciosMaterial: tarifa.id_precios_material,
    tarifaPrimerKm: parseFloat(tarifa.primer_km.toFixed(2)),
    tarifaSubsecuente: parseFloat(tarifaSubsecuente.toFixed(2)),
  };
};
