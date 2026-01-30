// src/components/stats/FilterModal.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * FilterModal
 *
 * Modal de filtros avanzados para estadísticas
 * Permite filtrar por obra, material, sindicato y comparativas
 */
const FilterModal = ({
  visible,
  onClose,
  onApply,
  obras = [],
  materiales = [],
  sindicatos = [],
  currentFilters = {},
  loadingObras = false,
}) => {
  const [selectedObra, setSelectedObra] = useState(
    currentFilters.obraId || null,
  );
  const [selectedMateriales, setSelectedMateriales] = useState(
    currentFilters.materiales || [],
  );
  const [selectedSindicatos, setSelectedSindicatos] = useState(
    currentFilters.sindicatos || [],
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
      obraId: selectedObra,
      materiales: selectedMateriales,
      sindicatos: selectedSindicatos,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedObra(null);
    setSelectedMateriales([]);
    setSelectedSindicatos([]);
  };

  const activeFiltersCount =
    (selectedObra ? 1 : 0) +
    selectedMateriales.length +
    selectedSindicatos.length;

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
            {/* Sección: Obra */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Obra</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Selecciona una obra específica o deja "Todas" para ver el
                consolidado
              </Text>

              {loadingObras ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Cargando obras...</Text>
                </View>
              ) : (
                <>
                  {/* Opción: Todas las obras */}
                  <TouchableOpacity
                    style={styles.radioItem}
                    onPress={() => setSelectedObra(null)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        selectedObra === null
                          ? "radiobox-marked"
                          : "radiobox-blank"
                      }
                      size={24}
                      color={
                        selectedObra === null
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <View style={styles.radioContent}>
                      <Text style={styles.radioLabel}>Todas las obras</Text>
                      <Text style={styles.radioDescription}>
                        Ver consolidado de todas tus obras
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Lista de obras */}
                  {obras.map((obra) => (
                    <TouchableOpacity
                      key={obra.id}
                      style={styles.radioItem}
                      onPress={() => setSelectedObra(obra.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={
                          selectedObra === obra.id
                            ? "radiobox-marked"
                            : "radiobox-blank"
                        }
                        size={24}
                        color={
                          selectedObra === obra.id
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <View style={styles.radioContent}>
                        <Text style={styles.radioLabel}>{obra.nombre}</Text>
                        <Text style={styles.radioDescription}>
                          {obra.empresa} • CC: {obra.cc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {obras.length === 0 && (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={32}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.emptyText}>
                        No tienes obras asignadas
                      </Text>
                    </View>
                  )}
                </>
              )}
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
    height: "90%", // ← Cambio de maxHeight a height
    paddingBottom: 20,
  },

  // Header
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
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Radio items (para obra)
  radioItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Checkbox items
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
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },

  // Footer
  footer: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 16,
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
