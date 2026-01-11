/**
 * utils/qrGenerator.js
 *
 * Utilidades para generar URLs de verificación de vales
 *
 * PROPÓSITO:
 * - Crear URLs únicas para verificar autenticidad de vales
 * - Generar links que se incrustan en códigos QR
 * - Centralizar lógica de generación de URLs
 *
 * USADO EN:
 * - ValeMaterialScreen
 * - ValeRentaScreen
 *
 * FORMATO URL:
 * https://web-acarreos.vercel.app/vale/{FOLIO}
 */

/**
 * Genera una URL de verificación para un vale
 * @param {string} folio - Folio único del vale (ej: "CD-140-00001")
 * @returns {string} - URL completa de verificación
 */
export const generateVerificationUrl = (folio) => {
  // NUEVA: Base URL del sistema de verificación (web desplegada en Vercel)
  const BASE_URL = "https://web-acarreos.vercel.app";

  // Construir URL con el folio
  return `${BASE_URL}/vale/${folio}`;
};

/**
 * Extrae el folio de una URL de verificación
 * @param {string} url - URL completa de verificación
 * @returns {string|null} - Folio extraído o null si es inválida
 */
export const extractFolioFromUrl = (url) => {
  try {
    const match = url.match(/\/vale\/([^/]+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extrayendo folio de URL:", error);
    return null;
  }
};

/**
 * Valida que una URL de verificación tenga el formato correcto
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es válida, false si no
 */
export const isValidVerificationUrl = (url) => {
  // ACTUALIZADO: Validar nueva URL de Vercel
  const pattern = /^https:\/\/web-acarreos\.vercel\.app\/vale\/[A-Z]+-\d+-\d+$/;
  return pattern.test(url);
};
