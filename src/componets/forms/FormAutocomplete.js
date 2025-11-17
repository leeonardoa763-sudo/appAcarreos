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

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
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
  const [searchText, setSearchText] = useState("");
  const [showList, setShowList] = useState(false);

  // Filtrar items basado en búsqueda
  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const search = searchText.toLowerCase();
    return items.filter((item) =>
      item[displayField]?.toLowerCase().includes(search)
    );
  }, [items, searchText, displayField]);

  // Obtener el item seleccionado
  const selectedItem = items.find((item) => item[valueField] === value);

  const handleSelectItem = (item) => {
    setSearchText("");
    setShowList(false);
    onSelect(item);
  };

  const handleClear = () => {
    setSearchText("");
    onSelect(null);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        <TextInput
          style={styles.input}
          value={selectedItem ? selectedItem[displayField] : searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setShowList(true);
            if (!text) onSelect(null);
          }}
          onFocus={() => setShowList(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
        {selectedItem && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showList && filteredItems.length > 0 && (
        <View style={styles.listContainer}>
          <ScrollView
            style={styles.list}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item[valueField]?.toString()}
                style={styles.listItem}
                onPress={() => handleSelectItem(item)}
              >
                <Text style={styles.listItemText}>{item[displayField]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormAutocomplete;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  listContainer: {
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    marginTop: 4,
  },
  list: {
    flexGrow: 0,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
