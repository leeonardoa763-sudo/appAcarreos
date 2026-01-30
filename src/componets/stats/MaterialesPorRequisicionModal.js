// src/components/stats/MaterialesPorRequisicionModal.js

import React, { useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * Modal que muestra materiales agrupados por requisición
 * Diseñado para que el residente vea cuánto material ha pedido por requisición
 */
const MaterialesPorRequisicionModal = ({
  visible,
  onClose,
  valesMaterial,
  obraData,
}) => {
  // Procesar datos: agrupar por requisición y material
  // Procesar datos: agrupar por requisición y material
  const datosAgrupados = useMemo(() => {
    if (!valesMaterial || valesMaterial.length === 0) {
      return { porRequisicion: {}, totalesPorMaterial: {} };
    }

    const porRequisicion = {};
    const totalesPorMaterial = {};

    valesMaterial.forEach((vale, index) => {
      const detalle = vale.vale_material_detalles?.[0];

      if (!detalle) {
        return;
      }

      const requisicion = detalle.requisicion || "SIN REQUISICIÓN";
      const nombreMaterial =
        detalle.material?.material || "Material desconocido";
      const m3 = detalle.volumen_real_m3 || detalle.cantidad_pedida_m3 || 0;

      // Agrupar por requisición
      if (!porRequisicion[requisicion]) {
        porRequisicion[requisicion] = {};
      }

      if (!porRequisicion[requisicion][nombreMaterial]) {
        porRequisicion[requisicion][nombreMaterial] = 0;
      }

      porRequisicion[requisicion][nombreMaterial] += m3;

      // Totales generales por material
      if (!totalesPorMaterial[nombreMaterial]) {
        totalesPorMaterial[nombreMaterial] = 0;
      }

      totalesPorMaterial[nombreMaterial] += m3;
    });

    return { porRequisicion, totalesPorMaterial };
  }, [valesMaterial]);

  const { porRequisicion, totalesPorMaterial } = datosAgrupados;

  // Calcular total general de m³
  const totalGeneralM3 = Object.values(totalesPorMaterial).reduce(
    (acc, m3) => acc + m3,
    0,
  );

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
                name="file-document-multiple"
                size={28}
                color={colors.primary}
              />
              <View style={styles.headerText}>
                <Text style={styles.title}>Materiales por Requisición</Text>
                <Text style={styles.subtitle}>
                  {obraData?.obra || "Obra no especificada"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Agrupación por requisición */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por Requisición</Text>

              {Object.keys(porRequisicion).length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    No hay datos de materiales en este periodo
                  </Text>
                </View>
              ) : (
                Object.entries(porRequisicion).map(
                  ([requisicion, materiales]) => (
                    <View key={requisicion} style={styles.requisicionCard}>
                      {/* Header de requisición */}
                      <View style={styles.requisicionHeader}>
                        <MaterialCommunityIcons
                          name="clipboard-text"
                          size={20}
                          color={colors.secondary}
                        />
                        <Text style={styles.requisicionNombre}>
                          {requisicion}
                        </Text>
                      </View>

                      {/* Materiales de esta requisición */}
                      {Object.entries(materiales).map(([material, m3]) => (
                        <View key={material} style={styles.materialRow}>
                          <View style={styles.materialInfo}>
                            <MaterialCommunityIcons
                              name="cube-outline"
                              size={18}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.materialNombre}>
                              {material}
                            </Text>
                          </View>
                          <Text style={styles.materialM3}>
                            {m3.toFixed(2)} m³
                          </Text>
                        </View>
                      ))}

                      {/* Subtotal de requisición */}
                      <View style={styles.requisicionSubtotal}>
                        <Text style={styles.subtotalLabel}>Subtotal</Text>
                        <Text style={styles.subtotalValue}>
                          {Object.values(materiales)
                            .reduce((acc, m3) => acc + m3, 0)
                            .toFixed(2)}{" "}
                          m³
                        </Text>
                      </View>
                    </View>
                  ),
                )
              )}
            </View>

            {/* Totales generales por material */}
            {Object.keys(totalesPorMaterial).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Totales por Material</Text>

                <View style={styles.totalesCard}>
                  {Object.entries(totalesPorMaterial).map(([material, m3]) => (
                    <View key={material} style={styles.totalRow}>
                      <View style={styles.totalInfo}>
                        <MaterialCommunityIcons
                          name="cube"
                          size={20}
                          color={colors.primary}
                        />
                        <Text style={styles.totalMaterial}>{material}</Text>
                      </View>
                      <Text style={styles.totalM3}>{m3.toFixed(2)} m³</Text>
                    </View>
                  ))}

                  {/* Gran total */}
                  <View style={styles.granTotal}>
                    <Text style={styles.granTotalLabel}>TOTAL GENERAL</Text>
                    <Text style={styles.granTotalValue}>
                      {totalGeneralM3.toFixed(2)} m³
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MaterialesPorRequisicionModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "95%", // ← AGREGAR ESTA LÍNEA
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
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },

  // ScrollView

  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Secciones
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Card de requisición
  requisicionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requisicionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requisicionNombre: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.secondary,
    marginLeft: 8,
  },

  // Material row
  materialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  materialInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  materialNombre: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  materialM3: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },

  // Subtotal de requisición
  requisicionSubtotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Totales generales
  totalesCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  totalMaterial: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 10,
  },
  totalM3: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Gran total
  granTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  granTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  granTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
});
