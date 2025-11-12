/**
 * FormAutocomplete.js
 *
 * Componente de autocompletado con búsqueda en tiempo real
 *
 * PROPÓSITO:
 * - Búsqueda incremental mientras el usuario escribe
 * - Filtrado automático de opciones
 * - Compatible con catálogos de Supabase
 *
 * USADO EN:
 * - DatosOperadorSection (operadores y vehículos)
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: number - ID seleccionado
 * - onSelect: function - Callback al seleccionar (recibe objeto completo)
 * - items: array - Lista de opciones
 * - displayField: string - Campo a mostrar (ej: 'nombre_completo', 'placas')
 * - valueField: string - Campo del ID (ej: 'id_operador', 'id_vehiculo')
 * - placeholder: string - Texto del placeholder
 * - error: string - Mensaje de error
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";
import { colors } from "../../config/colors";

const FormAutocomplete = ({
  label,
  value,
  onSelect,
  items = [],
  displayField,
  valueField,
  placeholder = "Buscar...",
  error = null,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);

  // Convertir items a formato de la librería
  const dataSet = items.map((item) => ({
    id: item[valueField]?.toString(),
    title: item[displayField],
    originalItem: item,
  }));

  // Sincronizar cuando cambia el value desde afuera
  useEffect(() => {
    if (value) {
      const item = items.find((i) => i[valueField] === value);
      if (item) {
        setSelectedItem({
          id: item[valueField]?.toString(),
          title: item[displayField],
        });
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, items]);

  const handleSelect = (item) => {
    if (item && item.id) {
      setSelectedItem(item);
      const originalItem = items.find(
        (i) => i[valueField]?.toString() === item.id
      );
      onSelect(originalItem || null);
    } else {
      setSelectedItem(null);
      onSelect(null);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.autocompleteContainer, error && styles.errorBorder]}>
        <AutocompleteDropdown
          clearOnFocus={false}
          closeOnBlur={true}
          closeOnSubmit={false}
          initialValue={selectedItem}
          onSelectItem={handleSelect}
          dataSet={dataSet}
          textInputProps={{
            placeholder: placeholder,
            autoCorrect: false,
            autoCapitalize: "none",
            style: styles.input,
            placeholderTextColor: colors.textSecondary,
          }}
          inputContainerStyle={styles.inputContainer}
          suggestionsListContainerStyle={styles.suggestionsList}
          containerStyle={styles.dropdownContainer}
          renderItem={(item) => (
            <Text style={styles.suggestionItem}>{item.title}</Text>
          )}
          EmptyResultComponent={
            <Text style={styles.emptyText}>Sin resultados</Text>
          }
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormAutocomplete;

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
  autocompleteContainer: {
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  dropdownContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  inputContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  input: {
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  suggestionsList: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 4,
  },
  suggestionItem: {
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptyText: {
    padding: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
