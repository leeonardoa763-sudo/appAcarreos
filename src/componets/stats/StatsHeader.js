// src/componets/stats/StatsHeader.js

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * Header de estadísticas con:
 * - Título del dashboard
 * - Selector de periodos (semana, mes, trimestre, etc.)
 * - Botón de filtros avanzados con badge de contador
 */
const StatsHeader = ({
  periodoSeleccionado,
  onPeriodoChange,
  onFilterPress,
  hasFilters,
  activeFiltersCount,
  periodoLabel,
}) => {
  const periodos = [
    { id: "semana", label: "Semana", icon: "calendar-week" },
    { id: "mes", label: "Mes", icon: "calendar-month" },
    { id: "trimestre", label: "Trimestre", icon: "calendar-range" },
    { id: "semestre", label: "Semestre", icon: "calendar-multiple" },
    { id: "año", label: "Año", icon: "calendar" },
  ];

  return (
    <>
      {/* Título del dashboard */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="chart-line"
          size={40}
          color={colors.primary}
        />
        <Text style={styles.headerTitle}>Dashboard Ejecutivo</Text>
        <Text style={styles.headerSubtitle}>
          Análisis de vales - {periodoLabel}
        </Text>
      </View>

      {/* Barra de filtros de periodo */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {periodos.map((periodo) => (
            <TouchableOpacity
              key={periodo.id}
              style={[
                styles.filterButton,
                periodoSeleccionado === periodo.id && styles.filterButtonActive,
              ]}
              onPress={() => onPeriodoChange(periodo.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={periodo.icon}
                size={18}
                color={
                  periodoSeleccionado === periodo.id
                    ? colors.surface
                    : colors.textPrimary
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  periodoSeleccionado === periodo.id &&
                    styles.filterButtonTextActive,
                ]}
              >
                {periodo.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botón de filtros avanzados */}
        <TouchableOpacity
          style={[
            styles.advancedFilterButton,
            hasFilters && styles.advancedFilterButtonActive,
          ]}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="tune"
            size={24}
            color={hasFilters ? colors.surface : colors.textPrimary}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

export default StatsHeader;

const styles = StyleSheet.create({
  // Header del dashboard
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Barra de filtros
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterScrollContent: {
    paddingRight: 8,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterButtonTextActive: {
    color: colors.surface,
  },

  // Botón de filtros avanzados
  advancedFilterButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  advancedFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  filterBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "bold",
  },
});
