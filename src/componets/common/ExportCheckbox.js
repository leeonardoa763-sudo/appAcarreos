/**
 * components/common/ExportCheckbox.js
 *
 * COMPONENTE REUTILIZABLE DE CHECKBOX PARA EXPORTACIÓN
 *
 * PROPÓSITO:
 * - Checkbox con label personalizable
 * - Estado seleccionado/no seleccionado
 * - Icono dinámico según tipo de vale
 *
 * USADO EN:
 * - InformesScreen
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const ExportCheckbox = ({
  label,
  icon,
  iconColor,
  checked,
  onToggle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        checked && styles.containerChecked,
        disabled && styles.containerDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}
        >
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>
        <Text
          style={[
            styles.label,
            checked && styles.labelChecked,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && (
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={colors.surface}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ExportCheckbox;

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
  containerChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  labelChecked: {
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
