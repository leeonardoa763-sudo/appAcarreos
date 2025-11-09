/**
 * components/forms/FormCheckbox.js
 *
 * Componente de checkbox reutilizable con label
 *
 * PROPÓSITO:
 * - Input tipo checkbox consistente en toda la app
 * - Manejo de estado controlado
 * - Estilos unificados con otros FormComponents
 *
 * USADO EN:
 * - ValeDetalleModal (para renta por día completo)
 *
 * PROPS:
 * - label: string - Texto descriptivo del checkbox
 * - value: boolean - Estado del checkbox (checked/unchecked)
 * - onChange: function - Callback cuando cambia el estado
 * - disabled: boolean - Deshabilitar checkbox
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const FormCheckbox = ({ label, value, onChange, disabled = false }) => {
  const handlePress = () => {
    if (!disabled) {
      console.log(`[FormCheckbox] ${label} - Cambiando a:`, !value);
      onChange(!value);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkboxContainer, disabled && styles.checkboxDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            value && styles.checkboxChecked,
            disabled && styles.checkboxDisabled,
          ]}
        >
          {value && (
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={colors.surface}
            />
          )}
        </View>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FormCheckbox;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.disabled,
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});
