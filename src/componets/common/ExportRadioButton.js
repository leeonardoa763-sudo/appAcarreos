/**
 * componets/common/ExportRadioButton.js
 *
 * COMPONENTE REUTILIZABLE DE RADIO BUTTON PARA EXPORTACIÓN
 *
 * PROPÓSITO:
 * - Radio button con diseño de checkbox pero comportamiento mutuamente excluyente
 * - Solo un item puede estar seleccionado a la vez
 * - Icono dinámico según tipo de vale
 * - Diseño consistente con ExportCheckbox pero con lógica de radio
 *
 * USADO EN:
 * - InformesScreen (Tipo de exportación)
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const ExportRadioButton = ({
  label,
  icon,
  iconColor,
  selected,
  onSelect,
  disabled = false,
  description = null,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        disabled && styles.containerDisabled,
      ]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}
        >
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.label,
              selected && styles.labelSelected,
              disabled && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>

      {/* Radio button circular */}
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

export default ExportRadioButton;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  containerSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "08",
  },
  containerDisabled: {
    opacity: 0.5,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.accent,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Radio button circular (en lugar de checkbox cuadrado)
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  radioOuterSelected: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});
