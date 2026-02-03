/**
 * componets/forms/CustomWeekPicker.js
 *
 * SELECTOR DE SEMANAS PERSONALIZADO - COMPATIBLE CON TODOS LOS DISPOSITIVOS
 *
 * PROPÓSITO:
 * - Reemplazo del FormPicker nativo para selección de semanas
 * - Modal con lista de semanas touchable
 * - Diseño consistente en iOS y Android
 * - Sin dependencias de componentes nativos problemáticos
 * - Muestra formato claro: "Semana 4 (20-26 Ene 2025)"
 *
 * USADO EN:
 * - InformesScreen (Selector de semana para exportación)
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: any - Valor seleccionado (número de semana)
 * - onValueChange: function - Callback al cambiar selección
 * - items: array - Lista de opciones [{id, label}, ...]
 * - placeholder: string - Texto cuando no hay selección
 * - enabled: boolean - Si está habilitado o no
 * - error: string - Mensaje de error (opcional)
 * - loading: boolean - Muestra indicador de carga
 * - icon: string - Icono a mostrar (opcional, default: "calendar-week")
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

const CustomWeekPicker = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = "Seleccionar semana...",
  enabled = true,
  error = null,
  loading = false,
  icon = "calendar-week",
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
        <View style={styles.listItemContent}>
          <MaterialCommunityIcons
            name="calendar-range"
            size={24}
            color={isSelected ? colors.accent : colors.textSecondary}
            style={styles.listItemIcon}
          />
          <Text
            style={[
              styles.listItemText,
              isSelected && styles.listItemTextSelected,
            ]}
          >
            {item.label}
          </Text>
        </View>
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
      {label && (
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.textPrimary}
          />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}

      {/* Botón selector */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando semanas...</Text>
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
          <View style={styles.pickerButtonContent}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={20}
              color={enabled ? colors.primary : colors.disabled}
              style={styles.pickerIcon}
            />
            <Text
              style={[
                styles.pickerButtonText,
                !value && styles.pickerButtonPlaceholder,
                !enabled && styles.pickerButtonTextDisabled,
              ]}
            >
              {getSelectedLabel()}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={enabled ? colors.textSecondary : colors.disabled}
          />
        </TouchableOpacity>
      )}

      {/* Mensaje de error */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={14}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
                <View style={styles.modalTitleContainer}>
                  <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.modalTitle}>
                    {label || "Seleccionar Semana"}
                  </Text>
                </View>
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
              {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="calendar-remove"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    No hay semanas disponibles
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={items}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.list}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                  bounces={true}
                />
              )}
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default CustomWeekPicker;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  // Label
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 6,
  },

  // Botón selector
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minHeight: 56,
  },
  pickerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pickerIcon: {
    marginRight: 10,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 15,
    color: colors.input.text,
    fontWeight: "500",
  },
  pickerButtonPlaceholder: {
    color: colors.input.placeholder,
    fontWeight: "400",
  },
  pickerButtonTextDisabled: {
    color: colors.textSecondary,
  },
  pickerButtonDisabled: {
    backgroundColor: colors.input.disabled,
    opacity: 0.6,
  },
  pickerButtonError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginLeft: 4,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === "ios" ? "65%" : "70%",
    paddingBottom: Platform.OS === "ios" ? 0 : 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.input.border,
    backgroundColor: colors.surface,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 10,
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
    paddingTop: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.input.border,
    backgroundColor: colors.surface,
  },
  listItemSelected: {
    backgroundColor: colors.accent + "10",
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  listItemTextSelected: {
    color: colors.accent,
    fontWeight: "700",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
});
