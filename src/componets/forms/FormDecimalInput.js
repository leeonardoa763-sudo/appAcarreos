/**
 * components/forms/FormDecimalInput.js (VERSIÓN FINAL)
 *
 * Input para capturar números decimales sin botones +/-
 *
 * CORRECCIONES FINALES:
 * - Control total del estado local
 * - No sobrescribir mientras el usuario escribe
 * - Sincronización inteligente solo cuando es necesario
 *
 * PROPÓSITO:
 * - Capturar valores decimales con validación
 * - Teclado numérico con punto decimal
 * - Validación de rango min/max
 */

import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../../config/colors";

const FormDecimalInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  decimalPlaces = 2,
  placeholder = "0.00",
  suffix = null,
  error = null,
  disabled = false,
}) => {
  // Estado local para el texto mostrado
  const [displayValue, setDisplayValue] = useState("");
  // Flag para saber si el usuario está escribiendo
  const isTyping = useRef(false);

  // Sincronizar SOLO cuando el valor cambia externamente (no por el usuario)
  useEffect(() => {
    if (!isTyping.current) {
      if (value !== null && value !== undefined && value !== "") {
        setDisplayValue(String(value));
      } else {
        setDisplayValue("");
      }
    }
  }, [value]);

  const handleTextChange = (text) => {
    // Marcar que el usuario está escribiendo
    isTyping.current = true;

    // Permitir vacío
    if (text === "") {
      setDisplayValue("");
      onChange(null);
      return;
    }

    // Validar formato: números, un punto opcional, y decimales
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimalPlaces}}$`);
    if (!regex.test(text)) {
      return; // Rechazar caracteres inválidos
    }

    // SIEMPRE actualizar el display (esto permite ver el punto)
    setDisplayValue(text);

    // Si termina en punto, NO llamar a onChange todavía
    if (text.endsWith(".")) {
      return;
    }

    // Si es solo un punto, no hacer nada
    if (text === ".") {
      return;
    }

    // Convertir a número
    const numValue = parseFloat(text);
    if (isNaN(numValue)) {
      return;
    }

    // Validar rango
    if (numValue < min) {
      onChange(min);
      return;
    }

    if (numValue > max) {
      onChange(max);
      setDisplayValue(String(max));
      return;
    }

    // Actualizar valor (sin cambiar display)
    onChange(numValue);
  };

  const handleFocus = () => {
    isTyping.current = true;
  };

  const handleBlur = () => {
    // Usuario terminó de escribir
    isTyping.current = false;

    // Formatear el número
    if (displayValue === "" || displayValue === ".") {
      setDisplayValue("");
      onChange(null);
      return;
    }

    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      // Formatear con decimales
      const formatted = numValue.toFixed(decimalPlaces);
      setDisplayValue(formatted);
      onChange(numValue);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            !disabled && styles.inputEditable,
            disabled && styles.inputDisabled,
            error && styles.inputError,
            suffix && styles.inputWithSuffix,
          ]}
          value={displayValue}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          maxLength={8}
          editable={!disabled}
          selectTextOnFocus={true}
        />

        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormDecimalInput;

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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.background,
    paddingHorizontal: 16,
  },
  inputEditable: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  inputWithSuffix: {
    paddingRight: 50,
  },
  suffix: {
    position: "absolute",
    right: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 4,
    marginLeft: 4,
  },
});
