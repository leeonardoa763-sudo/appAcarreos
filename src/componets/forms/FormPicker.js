/**
 * FormPicker.js
 *
 * VERSIÓN MEJORADA CON SOPORTE COMPLETO PARA iOS
 *
 * Componente de selector desplegable (picker) reutilizable con label
 * - Android: Picker nativo tipo dropdown
 * - iOS: Modal con Picker estilo rueda
 *
 * PROPÓSITO:
 * - Desplegable para seleccionar opciones de una lista
 * - Muestra label y valor seleccionado
 * - Feedback visual de error
 * - Compatible con datos de Supabase (arrays de objetos)
 * - SOLUCIÓN para problema de visibilidad en iOS
 *
 * USADO EN:
 * - ValeRentaScreen (Material, Sindicato)
 * - ValeMaterialScreen (Material, Banco, Sindicato)
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: any - Valor seleccionado (id del item)
 * - onValueChange: function - Callback al cambiar selección
 * - items: array - Lista de opciones [{id, label}, ...]
 * - placeholder: string - Texto cuando no hay selección
 * - enabled: boolean - Si está habilitado o no
 * - error: string - Mensaje de error (opcional)
 * - loading: boolean - Muestra indicador de carga
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const FormPicker = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = "Seleccionar...",
  enabled = true,
  error = null,
  loading = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // Obtener el label del item seleccionado
  const getSelectedLabel = () => {
    if (!value) return placeholder;
    const selectedItem = items.find((item) => item.id === value);
    return selectedItem ? selectedItem.label : placeholder;
  };

  // Abrir modal (solo iOS)
  const openPicker = () => {
    if (enabled && !loading) {
      setTempValue(value);
      setShowPicker(true);
    }
  };

  // Cerrar modal sin guardar (iOS)
  const closePicker = () => {
    setShowPicker(false);
    setTempValue(value);
  };

  // Confirmar selección (iOS)
  const confirmPicker = () => {
    onValueChange(tempValue);
    setShowPicker(false);
  };

  // Manejar cambio en el picker temporal (iOS)
  const handleTempChange = (itemValue) => {
    setTempValue(itemValue);
  };

  // RENDERIZADO PARA iOS - Modal con Picker tipo rueda
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        {/* Label */}
        {label && <Text style={styles.label}>{label}</Text>}

        {/* Loading State */}
        {loading ? (
          <View style={[styles.pickerButton, styles.pickerDisabled]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando opciones...</Text>
          </View>
        ) : (
          <>
            {/* Botón para abrir modal */}
            <TouchableOpacity
              style={[
                styles.pickerButton,
                !enabled && styles.pickerDisabled,
                error && styles.pickerError,
              ]}
              onPress={openPicker}
              disabled={!enabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !value && styles.pickerButtonPlaceholder,
                  !enabled && styles.pickerButtonTextDisabled,
                ]}
              >
                {getSelectedLabel()}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={enabled ? colors.textSecondary : colors.disabled}
              />
            </TouchableOpacity>

            {/* Modal iOS */}
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
                      {label || "Seleccionar"}
                    </Text>
                    <TouchableOpacity onPress={confirmPicker}>
                      <Text style={styles.modalButtonDone}>Listo</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Picker iOS */}
                  <Picker
                    selectedValue={tempValue}
                    onValueChange={handleTempChange}
                    style={styles.iosPickerStyle}
                    itemStyle={styles.iosPickerItem}
                  >
                    {/* Opción placeholder */}
                    <Picker.Item
                      label={placeholder}
                      value={null}
                      color={colors.textSecondary}
                    />

                    {/* Opciones */}
                    {items.map((item) => (
                      <Picker.Item
                        key={item.id}
                        label={item.label}
                        value={item.id}
                        color={colors.textPrimary}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </Modal>
          </>
        )}

        {/* Mensaje de error */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // RENDERIZADO PARA ANDROID - Picker nativo inline
  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Picker Container */}
      <View
        style={[
          styles.pickerContainer,
          !enabled && styles.pickerDisabled,
          error && styles.pickerError,
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando opciones...</Text>
          </View>
        ) : (
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            enabled={enabled}
            style={styles.picker}
            dropdownIconColor={enabled ? colors.textPrimary : colors.disabled}
          >
            {/* Opción placeholder */}
            <Picker.Item
              label={placeholder}
              value={null}
              color={colors.textSecondary}
            />

            {/* Opciones del array */}
            {items.map((item) => (
              <Picker.Item
                key={item.id}
                label={item.label}
                value={item.id}
                color={colors.textPrimary}
              />
            ))}
          </Picker>
        )}
      </View>

      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormPicker;

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

  // Estilos para iOS - Botón tipo TouchableOpacity
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.input.text,
  },
  pickerButtonPlaceholder: {
    color: colors.input.placeholder,
  },
  pickerButtonTextDisabled: {
    color: colors.textSecondary,
  },
  pickerDisabled: {
    backgroundColor: colors.input.disabled,
  },
  pickerError: {
    borderColor: colors.danger,
  },

  // Estilos para Android - Picker nativo
  pickerContainer: {
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },

  // Estados comunes
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
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
  iosPickerItem: {
    fontSize: 18,
    color: colors.textPrimary,
  },
});
