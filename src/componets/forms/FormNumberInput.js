/**
 * components/forms/FormNumberInput.js
 *
 * Input numérico con validaciones y controles incrementales
 *
 * PROPÓSITO:
 * - Capturar valores numéricos con validación
 * - Botones + y - para incrementar/decrementar
 * - Prevenir valores negativos o fuera de rango
 *
 * USADO EN:
 * - ValeDetalleModal (número de viajes)
 * - Futuros formularios que requieran inputs numéricos
 *
 * PROPS:
 * - label: string - Etiqueta del campo
 * - value: number - Valor actual
 * - onChange: function - Callback cuando cambia el valor
 * - min: number - Valor mínimo permitido (default: 1)
 * - max: number - Valor máximo permitido (default: 999)
 * - step: number - Incremento/decremento (default: 1)
 * - error: string - Mensaje de error
 * - disabled: boolean - Deshabilitar input
 */

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const FormNumberInput = ({
  label,
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  error,
  disabled = false,
}) => {
  const handleIncrement = () => {
    const newValue = (value || 0) + step;
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = (value || 0) - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleTextChange = (text) => {
    if (text === "") {
      onChange(min);
      return;
    }

    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            (disabled || value <= min) && styles.buttonDisabled,
          ]}
          onPress={handleDecrement}
          disabled={disabled || value <= min}
        >
          <MaterialCommunityIcons
            name="minus"
            size={24}
            color={
              disabled || value <= min ? colors.textSecondary : colors.primary
            }
          />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={String(value || min)}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          maxLength={3}
          editable={!disabled}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (disabled || value >= max) && styles.buttonDisabled,
          ]}
          onPress={handleIncrement}
          disabled={disabled || value >= max}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={
              disabled || value >= max ? colors.textSecondary : colors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormNumberInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.background,
  },
  button: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 4,
    marginLeft: 4,
  },
});
