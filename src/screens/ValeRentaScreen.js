import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ValeRentaScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Vale de Renta</Text>
      <Text>Pantalla para crear vale de renta</Text>
    </View>
  );
};

export default ValeRentaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});
