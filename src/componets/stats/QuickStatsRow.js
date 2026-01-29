// src/componets/stats/QuickStatsRow.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * QuickStatsRow
 *
 * Fila horizontal de mini-stats para info rápida
 * Ideal para métricas secundarias
 */
const QuickStatsRow = ({
  viajesPorDia = 0,
  m3PorViaje = 0,
  operadoresActivos = 0,
}) => {
  // Formatear números
  const formatNumber = (num) => {
    const validNum = Number(num) || 0;
    return validNum.toFixed(1);
  };

  const stats = [
    {
      icon: "calendar-today",
      value: formatNumber(viajesPorDia),
      label: "Viajes/día",
      color: colors.primary,
    },
    {
      icon: "cube-outline",
      value: formatNumber(m3PorViaje),
      label: "m³/viaje",
      color: colors.secondary,
    },
    {
      icon: "account-hard-hat",
      value: Math.round(operadoresActivos || 0).toString(),
      label: "Operadores",
      color: colors.accent,
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <MaterialCommunityIcons
            name={stat.icon}
            size={20}
            color={stat.color}
          />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default QuickStatsRow;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: "30%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
