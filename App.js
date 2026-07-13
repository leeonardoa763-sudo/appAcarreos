import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Navegation from "./src/navigation/BottomTabNavigator.js";
import AuthGuard from "./src/componets/AuthGuard.js";
import { AuthProvider } from "./src/context/AuthContext.js";

export default function App() {
  // En web, la fuente de MaterialCommunityIcons se descarga por red y se
  // inyecta después del primer render. Si el texto con esos glifos ya
  // pintó con la fuente de reserva, Safari/iOS no lo vuelve a repintar
  // cuando la fuente real llega (se quedan como cuadrados). Esperar a
  // que cargue evita pintar nada con la fuente de reserva.
  //
  // expo-font evita a propósito su propio mecanismo de espera en WebKit
  // (Safari/iOS — incluye Chrome en iPhone, que también corre sobre
  // WebKit) porque la libreria que usa es incompatible ahi, y en su
  // lugar resuelve la promesa de inmediato sin confirmar la descarga
  // real. Por eso se espera aparte con la API nativa document.fonts.
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  });
  const [webFontReady, setWebFontReady] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS !== "web" || !fontsLoaded) return undefined;
    if (typeof document === "undefined" || !document.fonts) {
      setWebFontReady(true);
      return undefined;
    }

    let cancelado = false;
    const marcarListo = () => {
      if (!cancelado) setWebFontReady(true);
    };
    const fontFamily = Object.keys(MaterialCommunityIcons.font)[0];

    Promise.race([
      document.fonts.load(`16px "${fontFamily}"`).then(() => document.fonts.ready),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ])
      .then(marcarListo)
      .catch(marcarListo);

    return () => {
      cancelado = true;
    };
  }, [fontsLoaded]);

  if (!fontsLoaded || !webFontReady) {
    return <View style={styles.container} />;
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AuthGuard>
          <Navegation />
        </AuthGuard>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
