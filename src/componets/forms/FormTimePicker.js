/**
 * FormTimePicker.js
 *
 * VERSIÓN MEJORADA - MEJOR VISUALIZACIÓN EN iOS
 *
 * Componente selector de hora con interfaz nativa
 *
 * PROPÓSITO:
 * - Selector de hora con interfaz nativa del sistema
 * - Botón más visible y legible en iOS
 * - Muestra label y hora seleccionada en formato legible
 * - Compatible con iOS y Android
 *
 * USADO EN:
 * - ValeRentaScreen (Hora Inicio, Hora Fin)
 * - ValeDetalleRenta (Hora Fin)
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: Date - Objeto Date con la hora seleccionada
 * - onChange: function - Callback al cambiar hora
 * - enabled: boolean - Si está habilitado o no
 * - error: string - Mensaje de error (opcional)
 * - minimumDate: Date - Hora mínima permitida (opcional)
 * - maximumDate: Date - Hora máxima permitida (opcional)
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
        {label && <Text style={styles.label}>{label}</Text>}
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

  // RENDERIZADO PARA MÓVIL (iOS y Android)
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
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={22}
            color={isEnabled ? colors.primary : colors.disabled}
          />
        </View>
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
          size={22}
          color={isEnabled ? colors.textPrimary : colors.disabled}
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
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closePicker}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={closePicker}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalButtonCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {label || "Seleccionar Hora"}
                </Text>
                <TouchableOpacity
                  onPress={closePicker}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
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
                textColor={colors.textPrimary}
              />
            </View>
          </TouchableOpacity>
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
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input.background,
    borderWidth: 1.5,
    borderColor: colors.input.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  timeButtonDisabled: {
    backgroundColor: colors.input.disabled,
    borderColor: colors.border,
  },
  timeButtonError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  iconContainer: {
    marginRight: 10,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  timeTextPlaceholder: {
    color: colors.input.placeholder,
    fontWeight: "400",
  },
  timeTextDisabled: {
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
  },

  // Estilos para input web
  webInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input.background,
    borderWidth: 1.5,
    borderColor: colors.input.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  webInputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },

  // Estilos para modal iOS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Extra para área segura en iPhone
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalButtonCancel: {
    fontSize: 17,
    color: colors.danger,
    fontWeight: "400",
  },
  modalButtonDone: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.primary,
  },
  iosPickerStyle: {
    height: 216,
    backgroundColor: colors.surface,
  },
});
