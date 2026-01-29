// src/components/stats/ComparisonCard.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import TrendIndicator from "./TrendIndicator";

/**
 * ComparisonCard
 *
 * Card para mostrar comparativas entre periodos
 * Muestra valor actual vs anterior con tendencia (opcional)
 */
const ComparisonCard = ({
  title,
  icon,
  currentValue = 0,
  previousValue = null, // Ahora es opcional
  suffix = "",
  prefix = "",
  decimals = 0,
  invertTrend = false,
}) => {
  // Validar valores
  const safeCurrentValue = currentValue || 0;
  const safePreviousValue = previousValue || 0;

  // Solo calcular comparación si hay previousValue
  const showComparison = previousValue !== null && previousValue !== undefined;

  // Calcular diferencia y porcentaje
  const difference = showComparison ? safeCurrentValue - safePreviousValue : 0;
  const percentage =
    showComparison && safePreviousValue !== 0
      ? (difference / safePreviousValue) * 100
      : 0;

  // Determinar dirección de tendencia
  let direction = "neutral";
  if (showComparison) {
    if (difference > 0) {
      direction = invertTrend ? "down" : "up";
    } else if (difference < 0) {
      direction = invertTrend ? "up" : "down";
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Valores */}
      <View style={styles.content}>
        <View style={styles.valueContainer}>
          <Text style={styles.label}>
            {showComparison ? "Actual" : "Total"}
          </Text>
          <Text style={styles.currentValue}>
            {prefix}
            {safeCurrentValue.toFixed(decimals)}
            {suffix}
          </Text>
        </View>

        {showComparison && (
          <>
            <View style={styles.separator} />

            <View style={styles.valueContainer}>
              <Text style={styles.label}>Anterior</Text>
              <Text style={styles.previousValue}>
                {prefix}
                {safePreviousValue.toFixed(decimals)}
                {suffix}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Tendencia - Solo si hay comparación */}
      {showComparison && (
        <View style={styles.trendContainer}>
          <TrendIndicator
            direction={direction}
            percentage={percentage}
            label="vs periodo anterior"
            size="medium"
            showBackground={true}
          />
        </View>
      )}
    </View>
  );
};

export default ComparisonCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  previousValue: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  trendContainer: {
    alignItems: "center",
    marginTop: 12,
  },
});
