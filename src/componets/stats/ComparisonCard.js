// src/components/stats/ComparisonCard.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";
import TrendIndicator from "./TrendIndicator";

/**
 * ComparisonCard con Gradiente
 *
 * Card para mostrar comparativas entre periodos con fondo de gradiente moderno
 * Muestra valor actual vs anterior con tendencia (opcional)
 *
 * Props:
 * - title: string - Título de la tarjeta
 * - icon: string - Nombre del icono de MaterialCommunityIcons
 * - currentValue: number - Valor actual
 * - previousValue: number - Valor del periodo anterior (opcional)
 * - gradient: array - Array de colores para el gradiente [color1, color2]
 * - suffix: string - Sufijo del valor (ej: " m³")
 * - prefix: string - Prefijo del valor (ej: "$")
 * - decimals: number - Cantidad de decimales
 * - invertTrend: boolean - Invertir dirección de tendencia
 */
const ComparisonCard = ({
  title,
  icon,
  currentValue = 0,
  previousValue = null,
  gradient = null, // Si no se pasa, usa fondo blanco
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

  // Componente interno para el contenido
  const CardContent = () => (
    <View style={styles.innerContainer}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={icon}
          size={28}
          color={gradient ? statsColors.iconColors.onGradient : colors.primary}
        />
        <Text style={[styles.title, gradient && styles.titleOnGradient]}>
          {title}
        </Text>
      </View>

      {/* Valores */}
      <View style={styles.content}>
        <View style={styles.valueContainer}>
          <Text style={[styles.label, gradient && styles.labelOnGradient]}>
            {showComparison ? "Actual" : "Total"}
          </Text>
          <Text
            style={[styles.currentValue, gradient && styles.valueOnGradient]}
          >
            {prefix}
            {safeCurrentValue.toFixed(decimals)}
            {suffix}
          </Text>
        </View>

        {showComparison && (
          <>
            <View
              style={[styles.separator, gradient && styles.separatorOnGradient]}
            />

            <View style={styles.valueContainer}>
              <Text style={[styles.label, gradient && styles.labelOnGradient]}>
                Anterior
              </Text>
              <Text
                style={[
                  styles.previousValue,
                  gradient && styles.previousValueOnGradient,
                ]}
              >
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
            showBackground={!gradient} // No mostrar fondo si ya hay gradiente
            lightMode={!!gradient} // Modo claro si hay gradiente
          />
        </View>
      )}
    </View>
  );

  // Si hay gradiente, usar LinearGradient, si no, View normal
  if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <CardContent />
      </LinearGradient>
    );
  }

  // Sin gradiente - fondo blanco tradicional
  return (
    <View style={[styles.container, styles.containerWhite]}>
      <CardContent />
    </View>
  );
};

export default ComparisonCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  containerWhite: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  innerContainer: {
    // Sin estilos adicionales, solo contenedor
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  titleOnGradient: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  labelOnGradient: {
    color: "rgba(255,255,255,0.8)",
  },
  currentValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  valueOnGradient: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  previousValue: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  previousValueOnGradient: {
    color: "rgba(255,255,255,0.85)",
  },
  separator: {
    width: 1,
    height: 45,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  separatorOnGradient: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  trendContainer: {
    alignItems: "center",
    marginTop: 12,
  },
});
