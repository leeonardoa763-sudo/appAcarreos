// src/components/stats/ChartCard.js

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const screenWidth = Dimensions.get("window").width;

/**
 * ChartCard
 *
 * Wrapper profesional para gráficos
 * Proporciona título, ícono y contenedor consistente
 */
const ChartCard = ({
  title,
  icon,
  iconColor = colors.primary,
  subtitle = null,
  children,
  isEmpty = false,
  emptyMessage = "Sin datos para mostrar",
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isEmpty ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

export default ChartCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
});
