import { StyleSheet, Text, View } from "react-native";

//Archivos
import Navegation from "./src/navigation/BottomTabNavigator";

export default function App() {
  return <Navegation />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
