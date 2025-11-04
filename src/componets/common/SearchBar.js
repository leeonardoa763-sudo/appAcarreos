/**
 * components/common/SearchBar.js
 *
 * Barra de búsqueda reutilizable con icono y botón de limpiar
 *
 * PROPÓSITO:
 * - Input de búsqueda en tiempo real
 * - Icono de lupa visual
 * - Botón X para limpiar búsqueda
 * - Diseño consistente con la app
 *
 * USADO EN:
 * - AcarreosScreen (búsqueda de vales)
 * - Cualquier pantalla que necesite búsqueda
 *
 * PROPS:
 * - value: string - Texto de búsqueda actual
 * - onChangeText: function - Callback al cambiar texto
 * - placeholder: string - Texto placeholder
 * - onClear: function - Callback al presionar X (opcional)
 *
 * EJEMPLO DE USO:
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Buscar por folio, operador o placas"
 * />
 */

import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Buscar...",
  onClear,
}) => {
  const handleClear = () => {
    onChangeText("");
    if (onClear) onClear();
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
});
