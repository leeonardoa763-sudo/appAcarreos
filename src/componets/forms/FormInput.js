/**
 * FormInput.js
 *
 * Componente de input de texto reutilizable con label y validación visual
 *
 * PROPÓSITO:
 * - Input genérico para texto, números, email, etc.
 * - Muestra label, placeholder y maneja estado
 * - Feedback visual de error
 *
 * USADO EN:
 * - ValeRentaScreen (capacidad, nombre operador, placas)
 * - Cualquier formulario que necesite inputs de texto
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: string - Valor del input
 * - onChangeText: function - Callback al cambiar texto
 * - placeholder: string - Texto placeholder
 * - keyboardType: string - Tipo de teclado
 * - editable: boolean - Si es editable o no
 * - error: string - Mensaje de error (opcional)
 * - suffix: string - Texto al final del input (ej: "m³")
 * - multiline: boolean - Si es área de texto
 *
 * EJEMPLO DE USO:
 * <FormInput
 *   label="Capacidad"
 *   value={capacidad}
 *   onChangeText={setCapacidad}
 *   placeholder="Ej: 8"
 *   keyboardType="numeric"
 *   suffix="m³"
 * />
 */

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../../config/colors";

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder = "",
  keyboardType = "default",
  editable = true,
  error = null,
  suffix = null,
  multiline = false,
  numberOfLines = 1,
}) => {
  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input con sufijo opcional */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            !editable && styles.inputDisabled,
            error && styles.inputError,
            multiline && styles.inputMultiline,
            suffix && styles.inputWithSuffix,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.input.placeholder}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? "top" : "center"}
        />

        {/* Sufijo (ej: m³, km, etc) */}
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>

      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.input.text,
  },
  inputDisabled: {
    backgroundColor: colors.input.disabled,
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputWithSuffix: {
    paddingRight: 50,
  },
  suffix: {
    position: "absolute",
    right: 12,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
