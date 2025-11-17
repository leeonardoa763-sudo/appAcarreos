/**
 * FormPicker.js
 *
 * Componente de selector desplegable (picker) reutilizable con label
 *
 * PROPÓSITO:
 * - Desplegable para seleccionar opciones de una lista
 * - Muestra label y valor seleccionado
 * - Feedback visual de error
 * - Compatible con datos de Supabase (arrays de objetos)
 *
 * USADO EN:
 * - ValeRentaScreen (Material, Sindicato)
 * - Cualquier formulario que necesite selección de opciones
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
 *
 * EJEMPLO DE USO:
 * <FormPicker
 *   label="Material"
 *   value={materialId}
 *   onValueChange={setMaterialId}
 *   items={materiales.map(m => ({
 *     id: m.id_material,
 *     label: m.material
 *   }))}
 *   placeholder="Selecciona un material"
 * />
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
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
  pickerContainer: {
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerDisabled: {
    backgroundColor: colors.input.disabled,
  },
  pickerError: {
    borderColor: colors.danger,
  },
  picker: {
    height: 50,
    width: "100%",
  },
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
});
