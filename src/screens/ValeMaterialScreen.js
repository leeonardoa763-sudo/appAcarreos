import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ValeMaterialScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Vale de Material</Text>
      <Text>Pantalla para crear vale de material</Text>
    </View>
  );
};

export default ValeMaterialScreen;

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
