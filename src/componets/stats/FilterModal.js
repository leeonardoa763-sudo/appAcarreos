// src/components/stats/FilterModal.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * FilterModal
 *
 * Modal de filtros avanzados para estadísticas
 * Permite filtrar por material, sindicato y comparativas
 */
const FilterModal = ({
  visible,
  onClose,
  onApply,
  materiales = [],
  sindicatos = [],
  currentFilters = {},
}) => {
  const [selectedMateriales, setSelectedMateriales] = useState(
    currentFilters.materiales || [],
  );
  const [selectedSindicatos, setSelectedSindicatos] = useState(
    currentFilters.sindicatos || [],
  );
  const [mostrarComparativa, setMostrarComparativa] = useState(
    currentFilters.mostrarComparativa || false,
  );

  const handleToggleMaterial = (materialId) => {
    setSelectedMateriales((prev) => {
      if (prev.includes(materialId)) {
        return prev.filter((id) => id !== materialId);
      } else {
        return [...prev, materialId];
      }
    });
  };

  const handleToggleSindicato = (sindicatoId) => {
    setSelectedSindicatos((prev) => {
      if (prev.includes(sindicatoId)) {
        return prev.filter((id) => id !== sindicatoId);
      } else {
        return [...prev, sindicatoId];
      }
    });
  };

  const handleSelectAllMateriales = () => {
    if (selectedMateriales.length === materiales.length) {
      setSelectedMateriales([]);
    } else {
      setSelectedMateriales(materiales.map((m) => m.id));
    }
  };

  const handleSelectAllSindicatos = () => {
    if (selectedSindicatos.length === sindicatos.length) {
      setSelectedSindicatos([]);
    } else {
      setSelectedSindicatos(sindicatos.map((s) => s.id));
    }
  };

  const handleApply = () => {
    onApply({
      materiales: selectedMateriales,
      sindicatos: selectedSindicatos,
      mostrarComparativa,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedMateriales([]);
    setSelectedSindicatos([]);
    setMostrarComparativa(false);
  };

  const activeFiltersCount =
    selectedMateriales.length +
    selectedSindicatos.length +
    (mostrarComparativa ? 1 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="filter-variant"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.title}>Filtros Avanzados</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Sección: Comparativa */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comparativa</Text>
              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setMostrarComparativa(!mostrarComparativa)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={
                    mostrarComparativa
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                  size={24}
                  color={
                    mostrarComparativa ? colors.primary : colors.textSecondary
                  }
                />
                <View style={styles.checkboxContent}>
                  <Text style={styles.checkboxLabel}>
                    Comparar con periodo anterior
                  </Text>
                  <Text style={styles.checkboxDescription}>
                    Muestra tendencias y cambios porcentuales
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Sección: Materiales */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Materiales</Text>
                <TouchableOpacity onPress={handleSelectAllMateriales}>
                  <Text style={styles.selectAllText}>
                    {selectedMateriales.length === materiales.length
                      ? "Deseleccionar"
                      : "Seleccionar"}{" "}
                    todos
                  </Text>
                </TouchableOpacity>
              </View>

              {materiales.length === 0 ? (
                <Text style={styles.emptyText}>
                  No hay materiales disponibles
                </Text>
              ) : (
                materiales.map((material) => (
                  <TouchableOpacity
                    key={material.id}
                    style={styles.checkboxItem}
                    onPress={() => handleToggleMaterial(material.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        selectedMateriales.includes(material.id)
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={24}
                      color={
                        selectedMateriales.includes(material.id)
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text style={styles.checkboxLabel}>{material.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Sección: Sindicatos */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sindicatos</Text>
                <TouchableOpacity onPress={handleSelectAllSindicatos}>
                  <Text style={styles.selectAllText}>
                    {selectedSindicatos.length === sindicatos.length
                      ? "Deseleccionar"
                      : "Seleccionar"}{" "}
                    todos
                  </Text>
                </TouchableOpacity>
              </View>

              {sindicatos.length === 0 ? (
                <Text style={styles.emptyText}>
                  No hay sindicatos disponibles
                </Text>
              ) : (
                sindicatos.map((sindicato) => (
                  <TouchableOpacity
                    key={sindicato.id}
                    style={styles.checkboxItem}
                    onPress={() => handleToggleSindicato(sindicato.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        selectedSindicatos.includes(sindicato.id)
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={24}
                      color={
                        selectedSindicatos.includes(sindicato.id)
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text style={styles.checkboxLabel}>{sindicato.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="restore"
                size={20}
                color={colors.textPrimary}
              />
              <Text style={styles.buttonSecondaryText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={colors.surface}
              />
              <Text style={styles.buttonPrimaryText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: "70%",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  selectAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  checkboxDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
});
