/**
 * hooks/exportHelpers/fileSystemUtils.web.js
 *
 * VARIANTE WEB de fileSystemUtils.js
 *
 * El archivo nativo importa expo-file-system/legacy, expo-sharing y expo-print;
 * ninguno de los tres tiene implementacion en react-native-web, asi que el boton
 * de exportar no hacia nada en el build web. Metro prioriza automaticamente esta
 * variante .web.js — mismo patron que services/bluetoothPrinter.web.js.
 *
 * Aqui no hay menu de compartir: el navegador descarga el archivo directo.
 *
 * Se conserva la misma firma y el mismo BOM UTF-8 que la version nativa, para
 * que Excel abra el CSV con los acentos correctos.
 */

/** U+FEFF. Se construye en codigo para no dejar un caracter invisible en el fuente. */
const BOM_UTF8 = String.fromCharCode(0xfeff);

export const shareCSVFile = async (csvContent, filename) => {
  try {
    const blob = new Blob([BOM_UTF8 + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = filename;
    enlace.style.display = "none";

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Safari necesita que la URL siga viva un instante despues del click.
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return filename;
  } catch (error) {
    console.error("[csvExport.web] ERROR:", error.message);
    throw error;
  }
};

// Alias para mantener la misma API que la version nativa
export const saveAndShareCSV = shareCSVFile;
