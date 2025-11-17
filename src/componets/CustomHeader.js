// src/components/CustomHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../config/colors";

const CustomHeader = ({ title, showMenuButton = true }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {showMenuButton && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <MaterialCommunityIcons
            name="menu"
            size={30}
            color={colors.textPrimary}
          />
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
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 38,
  },
});

export default CustomHeader;
