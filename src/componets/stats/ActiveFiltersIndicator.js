// src/componets/stats/ActiveFiltersIndicator.js

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * Indicador de filtros activos con:
 * - Header con contador de filtros
 * - Botón para limpiar todos los filtros
 * - Chips visuales mostrando filtros aplicados (materiales, sindicatos, comparativa)
 */
const ActiveFiltersIndicator = ({
  filters,
  activeFiltersCount,
  onClearFilters,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="filter-check"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.title}>Filtros activos ({activeFiltersCount})</Text>
        <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsList}>
        {filters.materiales.length > 0 && (
          <View style={styles.chip}>
            <MaterialCommunityIcons
              name="package-variant"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.chipText}>
              {filters.materiales.length} material(es)
            </Text>
          </View>
        )}

        {filters.sindicatos.length > 0 && (
          <View style={styles.chip}>
            <MaterialCommunityIcons
              name="account-group"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.chipText}>
              {filters.sindicatos.length} sindicato(s)
            </Text>
          </View>
        )}

        {filters.mostrarComparativa && (
          <View style={styles.chip}>
            <MaterialCommunityIcons
              name="compare"
              size={14}
              color={colors.accent}
            />
            <Text style={styles.chipText}>Comparativa activa</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ActiveFiltersIndicator;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  chipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
