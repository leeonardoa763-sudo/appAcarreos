// src/components/stats/WatermarkOverlay.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * WatermarkOverlay
 *
 * Marca de agua que aparece en las capturas de pantalla
 * No interfiere visualmente pero aparece en las imágenes compartidas
 */
const WatermarkOverlay = ({ periodo }) => {
  const fecha = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="chart-line"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={styles.text}>
          Control de Acarreos • {periodo} • {fecha}
        </Text>
      </View>
    </View>
  );
};

export default WatermarkOverlay;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
