import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
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
  disabled = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [showList, setShowList] = useState(false);
  // Flag para saber si el usuario está tocando la lista
  const isSelectingItem = useRef(false);

  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const search = searchText.toLowerCase();
    return items.filter((item) =>
      item[displayField]?.toLowerCase().includes(search),
    );
  }, [items, searchText, displayField]);

  const selectedItem = items.find((item) => item[valueField] === value);

  const handleSelectItem = (item) => {
    isSelectingItem.current = false;
    setSearchText("");
    setShowList(false);
    onSelect(item);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setSearchText("");
    onSelect(null);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          error && styles.errorBorder,
          disabled && styles.disabledContainer,
        ]}
      >
        <TextInput
          style={[styles.input, disabled && styles.disabledInput]}
          value={selectedItem ? selectedItem[displayField] : searchText}
          editable={!disabled}
          onChangeText={(text) => {
            setSearchText(text);
            setShowList(true);
            if (!text) onSelect(null);
          }}
          onFocus={() => {
            if (!disabled) setShowList(true);
          }}
          onBlur={() => {
            // Solo cerrar si el usuario NO está tocando la lista
            if (!isSelectingItem.current) {
              setShowList(false);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          blurOnSubmit={true}
        />
        {selectedItem && !disabled && (
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
            keyboardShouldPersistTaps="always"
            // Al iniciar scroll o touch en la lista, marcar el flag
            onScrollBeginDrag={() => {
              isSelectingItem.current = true;
            }}
            onMomentumScrollEnd={() => {
              // Al terminar el scroll, si no seleccionó nada, apagar el flag
              // con un pequeño delay para dar tiempo al onPress
              setTimeout(() => {
                isSelectingItem.current = false;
              }, 200);
            }}
          >
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item[valueField]?.toString()}
                style={styles.listItem}
                // Marcar flag ANTES de que se dispare el onBlur del TextInput
                onPressIn={() => {
                  isSelectingItem.current = true;
                }}
                onPress={() => handleSelectItem(item)}
                // Si cancela el press, apagar el flag
                onPressOut={() => {
                  setTimeout(() => {
                    isSelectingItem.current = false;
                  }, 200);
                }}
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
  disabledContainer: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  disabledInput: {
    color: colors.textSecondary,
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
