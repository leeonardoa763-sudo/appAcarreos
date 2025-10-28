// screens/ValesScreen.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import UserProfile from "../componets/ButtonsGrid/UserProfile";
import ButtonsGrid from "../componets/ButtonsGrid/ButtonsGrid";

const ValesScreen = () => {
  const navigation = useNavigation();

  const handleCrearVale = () => {
    navigation.navigate("SeleccionarTipoVale");
  };

  // Configuración de botones - fácil de modificar y extender
  const buttonConfigs = [
    {
      onPress: handleCrearVale,
      iconName: "add",
      iconSize: 70,
      buttonText: "Crear Vale",
      backgroundColor: "#035798ff",
    },
    {
      onPress: () => console.log("Botón 2 presionado"),
      iconName: "help",
      iconSize: 80,
      buttonText: "Botón",
      backgroundColor: "#035798ff",
    },
    {
      onPress: () => console.log("Botón 3 presionado"),
      iconName: "help",
      iconSize: 80,
      buttonText: "Botón",
      backgroundColor: "#035798ff",
    },

    // Puedes agregar más botones fácilmente aquí
  ];

  return (
    <View style={styles.container}>
      <UserProfile userName="Bruno Leonardo Aguila Saucedo" />

      <ButtonsGrid buttons={buttonConfigs} />

      {/* Agregar otro BottonGrid para mas botones*/}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  additionalButtons: {
    marginTop: 20,
    alignItems: "center",
  },
});

export default ValesScreen;
