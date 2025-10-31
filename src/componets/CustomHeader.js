// src/components/CustomHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const CustomHeader = ({ title, showMenuButton = true }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {showMenuButton && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={30} color="Black" />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>{title}</Text>

      {/* Espacio vacío para centrar el título */}
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50, // Ajusta según tu notch/statusbar
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuButton: {
    padding: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "Black",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 38, // Mismo ancho que el botón del menú
  },
});

export default CustomHeader;
