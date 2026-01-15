/**
 * CustomModalPicker.js
 *
 * SELECTOR MODAL PERSONALIZADO - COMPATIBLE CON TODOS LOS DISPOSITIVOS
 * VERSIÓN 2: Corregido para iPhone (SafeAreaView + altura fija)
 *
 * PROPÓSITO:
 * - Reemplazo del Picker nativo que da problemas en Samsung/otros
 * - Modal con lista de opciones touchable
 * - Diseño consistente en iOS y Android
 * - Sin dependencias de componentes nativos problemáticos
 *
 * USADO EN:
 * - ValeMaterialScreen (Material, Banco, Sindicato)
 * - Cualquier pantalla que necesite selector confiable
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
  FlatList,
  Pressable,
  Platform,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const CustomModalPicker = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = "Seleccionar...",
  enabled = true,
  error = null,
  loading = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Obtener el label del item seleccionado
  const getSelectedLabel = () => {
    if (!value) return placeholder;
    const selectedItem = items.find((item) => item.id === value);
    return selectedItem ? selectedItem.label : placeholder;
  };

  // Abrir modal
  const openModal = () => {
    if (enabled && !loading) {
      setShowModal(true);
    }
  };

  // Seleccionar un item
  const handleSelectItem = (itemId) => {
    onValueChange(itemId);
    setShowModal(false);
  };

  // Renderizar cada item de la lista
  const renderItem = ({ item }) => {
    const isSelected = item.id === value;

    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.listItemSelected]}
        onPress={() => handleSelectItem(item.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.listItemText,
            isSelected && styles.listItemTextSelected,
          ]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={colors.accent}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Botón selector */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando opciones...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.pickerButton,
            !enabled && styles.pickerButtonDisabled,
            error && styles.pickerButtonError,
          ]}
          onPress={openModal}
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
            size={24}
            color={enabled ? colors.textSecondary : colors.disabled}
          />
        </TouchableOpacity>
      )}

      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal con lista de opciones */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.safeArea}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || "Seleccionar"}</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* Lista de opciones */}
              <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.listContent}
                bounces={true}
              />
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default CustomModalPicker;

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

  // Botón selector
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
    minHeight: 50,
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
  pickerButtonDisabled: {
    backgroundColor: colors.input.disabled,
  },
  pickerButtonError: {
    borderColor: colors.danger,
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Error
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },

  // SafeArea para iOS
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Platform.OS === "ios" ? "60%" : "70%", // Altura fija para iOS
    paddingBottom: Platform.OS === "ios" ? 0 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.input.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },

  // Lista
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.input.border,
    backgroundColor: colors.surface,
  },
  listItemSelected: {
    backgroundColor: `${colors.accent}15`,
  },
  listItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  listItemTextSelected: {
    fontWeight: "600",
    color: colors.accent,
  },
});
