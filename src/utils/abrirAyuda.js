/**
 * utils/abrirAyuda.js
 *
 * Abre una página del Centro de Ayuda en un navegador DENTRO de la app (Chrome
 * Custom Tabs en Android). Se eligió así en lugar de `Linking.openURL` para que el
 * checador no pierda lo que estaba haciendo: el navegador se monta encima y el
 * botón "Listo" lo regresa a la misma pantalla, con el mismo estado.
 *
 * En web (`react-native-web`) `openBrowserAsync` degrada a `window.open`, así que
 * funciona igual sin código aparte.
 *
 * Las URLs se arman en `src/config/ayuda.js` — aquí solo se abren.
 */
import * as WebBrowser from "expo-web-browser";
import crossAlert from "./crossAlert";

const abrirAyuda = async (url) => {
  if (!url) return;

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch (error) {
    console.error("[abrirAyuda] Error abriendo la ayuda:", error);
    // crossAlert y no Alert.alert: este código también corre en el build web,
    // donde Alert.alert es un no-op silencioso.
    crossAlert(
      "Ayuda no disponible",
      "No se pudo abrir el Centro de Ayuda. Revisa tu conexión e intenta de nuevo.",
      [{ text: "Entendido" }],
    );
  }
};

export default abrirAyuda;
