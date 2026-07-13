/**
 * utils/crossAlert.js
 *
 * react-native-web no implementa Alert.alert (es un no-op silencioso:
 * https://necolas.github.io/react-native-web/docs/alert/). Cualquier
 * confirmación o alerta con botones deja de funcionar en web sin este
 * wrapper. En nativo delega directo a Alert.alert.
 */
import { Alert, Platform } from "react-native";

const crossAlert = (title, message = "", buttons) => {
  if (Platform.OS !== "web") {
    return Alert.alert(title, message, buttons);
  }

  const texto = [title, message].filter(Boolean).join("\n\n");

  if (!buttons || buttons.length <= 1) {
    window.alert(texto);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelable = buttons.find((b) => b.style === "cancel");
  const confirmable =
    buttons.find((b) => b.style !== "cancel") ?? buttons[buttons.length - 1];

  if (window.confirm(texto)) {
    confirmable?.onPress?.();
  } else {
    cancelable?.onPress?.();
  }
};

export default crossAlert;
