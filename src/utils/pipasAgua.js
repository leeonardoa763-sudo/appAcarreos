/**
 * utils/pipasAgua.js
 *
 * Helpers para los vales de pipas de agua.
 *
 * Las pipas reparten agua en obra y se cobran por hora/dia exactamente igual que
 * la renta de equipo. NO son un tipo_vale nuevo: son tipo_vale = "renta" con el
 * sello vales.es_pipa_agua = true (mismo patron que es_planta_asfaltos para
 * material). Lo unico que cambia: otros camiones, otro sindicato, material = Agua.
 *
 * El sello (es_pipa_agua) vive en la cabecera del vale y es lo unico que clasifica
 * un vale ya creado. Las marcas de catalogo (sindicatos.es_pipas, material.es_agua_pipa)
 * solo sirven para filtrar los pickers al crear un vale; nunca para reclasificar
 * uno historico.
 *
 * Centralizado aqui porque ValeRentaScreen, AcarreosScreen, ArchivadosScreen,
 * ValeCard y las estadisticas deben usar el mismo criterio.
 */

/**
 * Parametro de navegacion que ValeSelectionModal pasa a ValeRentaScreen para
 * abrir la misma pantalla en modo pipa.
 */
export const MODO_PIPA = "pipa";

/**
 * True si el vale es de pipa de agua. Se apoya solo en el sello de cabecera.
 */
export const esValePipa = (vale) => !!vale?.es_pipa_agua;

/**
 * Particiona el catalogo de materiales segun el modo de la pantalla.
 * - modo pipa: solo los materiales de agua (es_agua_pipa).
 * - modo renta normal: todos menos los de agua.
 */
export const filtrarMaterialesPorModo = (materiales, esModoPipa) => {
  if (!Array.isArray(materiales)) return [];
  return materiales.filter((m) => !!m?.es_agua_pipa === esModoPipa);
};

/**
 * Particiona el catalogo de sindicatos segun el modo de la pantalla.
 * - modo pipa: solo el sindicato de pipas (es_pipas).
 * - modo renta normal: todos menos el de pipas.
 */
export const filtrarSindicatosPorModo = (sindicatos, esModoPipa) => {
  if (!Array.isArray(sindicatos)) return [];
  return sindicatos.filter((s) => !!s?.es_pipas === esModoPipa);
};
