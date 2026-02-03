// src/components/stats/TrendIndicator.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { statsColors } from "../../config/statsColors";

/**
 * TrendIndicator
 *
 * Indicador visual de tendencias (subida/bajada/neutral)
 * Muestra flecha, porcentaje y label opcional
 *
 * Props:
 * - direction: 'up' | 'down' | 'neutral'
 * - percentage: number - Porcentaje de cambio
 * - label: string - Label descriptivo
 * - size: 'small' | 'medium' | 'large'
 * - showBackground: boolean - Mostrar fondo de color
 * - lightMode: boolean - Modo claro para usar sobre gradientes (texto blanco)
 */
const TrendIndicator = ({
  direction = "neutral",
  percentage,
  label = "",
  size = "medium",
  showBackground = true,
  lightMode = false, // NUEVO: modo claro para gradientes
}) => {
  const getIconName = () => {
    switch (direction) {
      case "up":
        return "arrow-up-bold";
      case "down":
        return "arrow-down-bold";
      case "neutral":
        return "minus";
      default:
        return "minus";
    }
  };

  const getColor = () => {
    // En modo claro, usar siempre blanco
    if (lightMode) {
      return "#FFFFFF";
    }

    // En modo oscuro, usar colores semánticos
    switch (direction) {
      case "up":
        return statsColors.trend.positive;
      case "down":
        return statsColors.trend.negative;
      case "neutral":
        return statsColors.trend.neutral;
      default:
        return statsColors.trend.neutral;
    }
  };

  const getBackgroundColor = () => {
    // En modo claro sobre gradiente, fondo semi-transparente blanco
    if (lightMode) {
      return "rgba(255, 255, 255, 0.25)";
    }

    // En modo oscuro, fondo con opacidad del color
    const baseColor = getColor();
    return baseColor + "15"; // Agregar opacidad
  };

  const sizeConfig = {
    small: { icon: 14, text: 11, padding: 4 },
    medium: { icon: 16, text: 12, padding: 6 },
    large: { icon: 20, text: 14, padding: 8 },
  };

  const currentSize = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        showBackground && {
          backgroundColor: getBackgroundColor(),
          paddingHorizontal: currentSize.padding,
          paddingVertical: currentSize.padding - 2,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={getIconName()}
        size={currentSize.icon}
        color={getColor()}
      />

      {percentage !== undefined && (
        <Text
          style={[
            styles.percentage,
            {
              fontSize: currentSize.text,
              color: getColor(),
            },
          ]}
        >
          {percentage > 0 ? "+" : ""}
          {percentage.toFixed(1)}%
        </Text>
      )}

      {label !== "" && (
        <Text
          style={[
            styles.label,
            {
              fontSize: currentSize.text - 1,
              color: lightMode ? "rgba(255,255,255,0.9)" : "#7F8C8D",
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

export default TrendIndicator;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    gap: 4,
  },
  percentage: {
    fontWeight: "700",
  },
  label: {
    marginLeft: 4,
  },
});
