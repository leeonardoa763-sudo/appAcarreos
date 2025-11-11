/**
 * FormTimePicker.js
 *
 * Componente selector de hora con interfaz nativa
 *
 * PROPÓSITO:
 * - Selector de hora con interfaz nativa del sistema
 * - Muestra label y hora seleccionada en formato legible
 * - Compatible con iOS y Android
 * - Maneja formato 12h y 24h según el sistema
 *
 * USADO EN:
 * - ValeRentaScreen (Hora Inicio, Hora Fin)
 * - Cualquier formulario que necesite selección de hora
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: Date - Objeto Date con la hora seleccionada
 * - onChange: function - Callback al cambiar hora
 * - enabled: boolean - Si está habilitado o no
 * - error: string - Mensaje de error (opcional)
 * - minimumDate: Date - Hora mínima permitida (opcional)
 * - maximumDate: Date - Hora máxima permitida (opcional)
 *
 * EJEMPLO DE USO:
 * <FormTimePicker
 *   label="Hora Inicio"
 *   value={horaInicio}
 *   onChange={setHoraInicio}
 *   enabled={true}
 * />
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const FormTimePicker = ({
  label,
  value,
  onChange,
  enabled = true,
  disabled = false,
  error = null,
  minimumDate = null,
  maximumDate = null,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const isEnabled = enabled && !disabled;

  // Formatear hora para mostrar (ej: "08:30 AM")
  const formatTime = (date) => {
    if (!date) return "Seleccionar hora";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Formatear hora para input web (formato HH:mm)
  const formatTimeForWeb = (date) => {
    if (!date) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Parsear hora desde input web
  const parseTimeFromWeb = (timeString) => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  const handleWebChange = (event) => {
    const timeString = event.target.value;
    const date = parseTimeFromWeb(timeString);
    onChange(date);
  };

  // Manejar cambio de hora
  const handleChange = (event, selectedDate) => {
    // En Android, cerrar el picker automáticamente
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    // Si el usuario canceló, no hacer nada
    if (event.type === "dismissed") {
      return;
    }

    // Si hay una fecha seleccionada, actualizar
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  // Abrir el picker
  const openPicker = () => {
    if (isEnabled) {
      setShowPicker(true);
    }
  };

  // Cerrar el picker (solo iOS)
  const closePicker = () => {
    setShowPicker(false);
  };

  // RENDERIZADO PARA WEB
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.webInputContainer, error && styles.webInputError]}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={disabled ? colors.textSecondary : colors.primary}
          />
          <input
            type="time"
            value={formatTimeForWeb(value)}
            onChange={handleWebChange}
            disabled={disabled}
            style={{
              border: "none",
              outline: "none",
              fontSize: 16,
              padding: 8,
              flex: 1,
              backgroundColor: "transparent",
              color: disabled ? colors.textSecondary : colors.textPrimary,
            }}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Botón para abrir picker */}
      <TouchableOpacity
        style={[
          styles.timeButton,
          !isEnabled && styles.timeButtonDisabled,
          error && styles.timeButtonError,
        ]}
        onPress={openPicker}
        disabled={!isEnabled}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={20}
          color={isEnabled ? colors.textPrimary : colors.disabled}
        />
        <Text
          style={[
            styles.timeText,
            !value && styles.timeTextPlaceholder,
            !isEnabled && styles.timeTextDisabled,
          ]}
        >
          {formatTime(value)}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={isEnabled ? colors.textSecondary : colors.disabled} // CAMBIAR
        />
      </TouchableOpacity>

      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Time Picker - Android (inline) */}
      {showPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={value || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* Time Picker - iOS (modal) */}
      {showPicker && Platform.OS === "ios" && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.modalButtonCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {label || "Seleccionar Hora"}
                </Text>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.modalButtonDone}>Listo</Text>
                </TouchableOpacity>
              </View>

              {/* Picker iOS */}
              <DateTimePicker
                value={value || new Date()}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.iosPickerStyle}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default FormTimePicker;

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
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  timeButtonDisabled: {
    backgroundColor: colors.input.disabled,
  },
  timeButtonError: {
    borderColor: colors.danger,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    color: colors.input.text,
  },
  timeTextPlaceholder: {
    color: colors.input.placeholder,
  },
  timeTextDisabled: {
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },

  // Estilos para modal iOS
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.shadow.medium,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalButtonCancel: {
    fontSize: 16,
    color: colors.danger,
  },
  modalButtonDone: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  iosPickerStyle: {
    height: 200,
  },
});
