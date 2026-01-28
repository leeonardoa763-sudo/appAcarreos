// src/components/stats/StatCard.js

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * StatCard
 *
 * Card de KPI con animación de conteo y opcionalmente indicador de tendencia
 * Muestra un valor numérico grande con label, ícono y tendencia opcional
 */
const StatCard = ({
  icon,
  iconColor = colors.primary,
  value,
  label,
  suffix = "",
  prefix = "",
  trend = null, // { direction: 'up' | 'down' | 'neutral', percentage: 12.5 }
  decimals = 0,
  size = "normal", // 'small' | 'normal' | 'large'
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada (scale)
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animación de conteo
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      case "neutral":
        return "trending-neutral";
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return colors.textSecondary;

    switch (trend.direction) {
      case "up":
        return "#1A936F";
      case "down":
        return "#E63946";
      case "neutral":
        return "#7F8C8D";
      default:
        return colors.textSecondary;
    }
  };

  const sizeStyles = {
    small: {
      iconSize: 24,
      valueSize: 20,
      labelSize: 11,
      padding: 12,
    },
    normal: {
      iconSize: 32,
      valueSize: 28,
      labelSize: 12,
      padding: 16,
    },
    large: {
      iconSize: 40,
      valueSize: 36,
      labelSize: 14,
      padding: 20,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
          padding: currentSize.padding,
        },
      ]}
    >
      {/* Ícono */}
      <MaterialCommunityIcons
        name={icon}
        size={currentSize.iconSize}
        color={iconColor}
      />

      {/* Valor animado */}
      <Animated.Text
        style={[styles.value, { fontSize: currentSize.valueSize }]}
      >
        {prefix}
        {animatedValue.interpolate({
          inputRange: [0, value],
          outputRange: ["0", value.toFixed(decimals)],
        })}
        {suffix}
      </Animated.Text>

      {/* Label */}
      <Text style={[styles.label, { fontSize: currentSize.labelSize }]}>
        {label}
      </Text>

      {/* Tendencia opcional */}
      {trend && (
        <View style={styles.trendContainer}>
          <MaterialCommunityIcons
            name={getTrendIcon()}
            size={16}
            color={getTrendColor()}
          />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend.percentage > 0 ? "+" : ""}
            {trend.percentage.toFixed(1)}%
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default StatCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  value: {
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 8,
  },
  label: {
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
