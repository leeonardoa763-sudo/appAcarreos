/**
 * hooks/exportHelpers/fileSystemUtils.js
 *
 * COMPARTIR CSV - Método híbrido usando Print
 * Si FileSystem falla, usamos Print para inicializarlo
 */

import * as FileSystem from "expo-file-system";
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
    console.log("[csvExport] Usando directorio cacheado:", cachedDirectory);
    return cachedDirectory;
  }

  // Intentar usar cacheDirectory directamente
  if (FileSystem.cacheDirectory) {
    console.log(
      "[csvExport] cacheDirectory disponible:",
      FileSystem.cacheDirectory
    );
    cachedDirectory = FileSystem.cacheDirectory;
    return cachedDirectory;
  }

  // Si no está disponible, inicializar con Print (como hacen los PDFs)
  console.log("[csvExport] Inicializando FileSystem con Print...");
  try {
    const { uri } = await Print.printToFileAsync({
      html: "<h1>Init</h1>",
    });

    // Extraer el directorio base del URI que devuelve Print
    const baseDir = uri.substring(0, uri.lastIndexOf("/") + 1);
    console.log("[csvExport] Directorio extraído de Print:", baseDir);

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
    console.log("[csvExport] === INICIO shareCSVFile ===");
    console.log("[csvExport] Nombre:", filename);
    console.log("[csvExport] Tamaño:", csvContent.length, "caracteres");

    // Agregar BOM para UTF-8 (Excel compatibility)
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Obtener directorio de trabajo (inicializa si es necesario)
    const workingDir = await getWorkingDirectory();
    const fileUri = `${workingDir}${filename}`;

    console.log("[csvExport] Escribiendo archivo en:", fileUri);

    // Crear archivo temporal SIN especificar encoding
    // (el encoding por defecto es UTF-8)
    await FileSystem.writeAsStringAsync(fileUri, csvWithBOM);

    console.log("[csvExport] ✅ Archivo creado");

    // Verificar que existe
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log("[csvExport] Verificación:");
    console.log("  - Existe:", fileInfo.exists);
    console.log("  - Tamaño:", fileInfo.size, "bytes");

    if (!fileInfo.exists) {
      throw new Error("No se pudo crear el archivo temporal");
    }

    // Verificar disponibilidad de compartir
    console.log("[csvExport] Verificando disponibilidad de compartir...");
    const isAvailable = await Sharing.isAvailableAsync();
    console.log("[csvExport] Sharing disponible:", isAvailable);

    if (!isAvailable) {
      throw new Error("La función de compartir no está disponible");
    }

    console.log("[csvExport] Compartiendo archivo...");

    // COMPARTIR - Con timeout igual que PDFs
    await Promise.race([
      Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: `Exportar ${filename}`,
        UTI: "public.comma-separated-values-text",
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout compartiendo")), 15000)
      ),
    ]);

    console.log("[csvExport] ✅ Archivo compartido exitosamente");
    return fileUri;
  } catch (error) {
    console.error("[csvExport] ❌ ERROR:", error.message);

    // Mismo manejo de timeout que tus PDFs
    if (error.message === "Timeout compartiendo") {
      console.log("[csvExport] Timeout pero archivo probablemente compartido");
      return true;
    }

    throw error;
  }
};

// Alias para mantener compatibilidad
export const saveAndShareCSV = shareCSVFile;
