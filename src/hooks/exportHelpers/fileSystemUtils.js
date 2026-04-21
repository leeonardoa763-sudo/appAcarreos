/**
 * hooks/exportHelpers/fileSystemUtils.js
 *
 * COMPARTIR CSV - Método híbrido usando Print
 * Si FileSystem falla, usamos Print para inicializarlo
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

// Variable global para cachear el directorio
let cachedDirectory = null;

/**
 * Obtiene el directorio de trabajo, inicializándolo si es necesario
 */
const getWorkingDirectory = async () => {
  // Si ya tenemos el directorio cacheado, usarlo
  if (cachedDirectory) {
    return cachedDirectory;
  }

  // Intentar usar cacheDirectory directamente
  if (FileSystem.cacheDirectory) {
    cachedDirectory = FileSystem.cacheDirectory;
    return cachedDirectory;
  }

  // Si no está disponible, inicializar con Print (como hacen los PDFs)

  try {
    const { uri } = await Print.printToFileAsync({
      html: "<h1>Init</h1>",
    });

    // Extraer el directorio base del URI que devuelve Print
    const baseDir = uri.substring(0, uri.lastIndexOf("/") + 1);

    cachedDirectory = baseDir;
    return cachedDirectory;
  } catch (error) {
    console.error("[csvExport] Error inicializando con Print:", error);
    throw new Error("No se pudo inicializar el sistema de archivos");
  }
};

/**
 * Comparte CSV usando el mismo método que los PDFs
 */
export const shareCSVFile = async (csvContent, filename) => {
  try {
    // Agregar BOM para UTF-8 (Excel compatibility)
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Obtener directorio de trabajo (inicializa si es necesario)
    const workingDir = await getWorkingDirectory();
    const fileUri = `${workingDir}${filename}`;

    // Crear archivo temporal con codificación UTF-8 explícita
    await FileSystem.writeAsStringAsync(fileUri, csvWithBOM, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Verificar que existe
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      throw new Error("No se pudo crear el archivo temporal");
    }

    // Verificar disponibilidad de compartir

    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      throw new Error("La función de compartir no está disponible");
    }

    // COMPARTIR - Con timeout igual que PDFs
    await Promise.race([
      Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: `Exportar ${filename}`,
        UTI: "public.comma-separated-values-text",
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout compartiendo")), 30000),
      ),
    ]);

    return fileUri;
  } catch (error) {
    console.error("[csvExport] ❌ ERROR:", error.message);

    // Mismo manejo de timeout que tus PDFs
    if (error.message === "Timeout compartiendo") {
      return true;
    }

    throw error;
  }
};

// Alias para mantener compatibilidad
export const saveAndShareCSV = shareCSVFile;
