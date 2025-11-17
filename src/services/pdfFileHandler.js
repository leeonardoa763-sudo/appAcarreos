/**
 * services/pdfFileHandler.js
 *
 * Utilidades reutilizables para manejo de archivos PDF
 * Usa API legacy de expo-file-system para compatibilidad
 */

import * as FileSystem from "expo-file-system/legacy";

/**
 * Renombra un archivo PDF con nombre automático basado en folio y color de copia
 * @param {string} uri - URI original del archivo generado por expo-print
 * @param {string} folio - Folio único del vale desde base de datos
 * @param {string} colorCopia - Tipo de copia (blanco, roja, verde, etc.)
 * @returns {Promise<string>} - Nueva URI del archivo renombrado
 */
export const renamePDFWithAutoName = async (uri, folio, colorCopia) => {
  try {
    const formattedColor =
      colorCopia.charAt(0).toUpperCase() + colorCopia.slice(1);
    const fileName = `${folio}_${formattedColor}.pdf`;
    const directory = FileSystem.documentDirectory;
    const newUri = `${directory}${fileName}`;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    return newUri;
  } catch (error) {
    console.error("Error renombrando PDF:", error);
    return uri;
  }
};

/**
 * Genera nombre estandarizado para archivos PDF de vales
 * @param {string} folio - Folio único del vale
 * @param {string} colorCopia - Tipo de copia
 * @returns {string} - Nombre del archivo sin extensión
 */
export const generatePDFFileName = (folio, colorCopia) => {
  const formattedColor =
    colorCopia.charAt(0).toUpperCase() + colorCopia.slice(1);
  return `${folio}_${formattedColor}`;
};
