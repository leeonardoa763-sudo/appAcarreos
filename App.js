import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import Navegation from "./src/navigation/BottomTabNavigator.js";
import AuthGuard from "./src/componets/AuthGuard.js";
import { AuthProvider } from "./src/context/AuthContext.js";

export default function App() {
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
