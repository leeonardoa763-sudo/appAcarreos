/**
 * screens/InformesScreen.js
 *
 * PANTALLA DE EXPORTACIÓN DE INFORMES CSV
 *
 * FUNCIONALIDADES:
 * - Selector de semanas con vales emitidos
 * - Checkboxes para seleccionar tipo de vale (Material/Renta)
 * - Exportación a CSV con filtro de semana
 * - UI minimalista y limpia
 *
 * USADO EN:
 * - BottomTabNavigator
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Config
import { colors } from "../config/colors";

// Estilos
import { commonStyles } from "../styles";

// Hooks
import { useAuth } from "../hooks/useAuth";
import { useValesExport } from "../hooks/useValesExport";

// Utils
import { getCurrentWeek, getCurrentYear } from "../utils/dateUtils";

// Components
import ExportCheckbox from "../componets/common/ExportCheckbox";
import FormPicker from "../componets/forms/FormPicker";
import PrimaryButton from "../componets/common/PrimaryButton";

const InformesScreen = () => {
  const { userProfile } = useAuth();
  const { loading, fetchWeeksWithVales, exportMaterialCSV, exportRentaCSV } =
    useValesExport(userProfile);

  // Estados
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedYear] = useState(getCurrentYear());
  const [exportMaterial, setExportMaterial] = useState(false);
  const [exportRenta, setExportRenta] = useState(false);
  const [weeksOptions, setWeeksOptions] = useState([]);
  const [loadingWeeks, setLoadingWeeks] = useState(true);

  /**
   * Carga las semanas que tienen vales al montar el componente
   * SOLO cuando userProfile esté disponible
   */
  useEffect(() => {
    if (userProfile?.id_persona) {
      console.log("👤 UserProfile cargado:", {
        id_persona: userProfile.id_persona,
        id_current_obra: userProfile.id_current_obra,
        nombre: userProfile.nombre,
      });
      loadWeeks();
    } else {
      console.log("⏳ Esperando userProfile...");
    }
  }, [userProfile]); // ← IMPORTANTE: Agregar userProfile como dependencia

  const loadWeeks = async () => {
    try {
      setLoadingWeeks(true);
      const weeks = await fetchWeeksWithVales();

      setWeeksOptions(weeks);

      // Establecer semana actual como seleccionada por defecto si existe
      if (weeks.length > 0) {
        const currentWeek = getCurrentWeek();
        const currentWeekExists = weeks.find((w) => w.id === currentWeek);

        if (currentWeekExists) {
          setSelectedWeek(currentWeek);
        } else {
          // Si no hay vales de la semana actual, seleccionar la más reciente
          setSelectedWeek(weeks[0].id);
        }
      }
    } catch (error) {
      console.error("❌ Error cargando semanas:", error);
    } finally {
      setLoadingWeeks(false);
    }
  };

  /**
   * Obtiene el label de la semana seleccionada para mostrar en el texto informativo
   */
  const getSelectedWeekLabel = () => {
    if (!selectedWeek || weeksOptions.length === 0) return "";
    const week = weeksOptions.find((w) => w.id === selectedWeek);
    return week ? week.label : `Semana ${selectedWeek}`;
  };

  /**
   * Maneja la exportación según los checkboxes seleccionados
   */
  const handleExport = async () => {
    if (!exportMaterial && !exportRenta) {
      return;
    }

    if (!selectedWeek) {
      return;
    }

    console.log("📤 Exportando semana:", selectedWeek);

    let successCount = 0;

    if (exportMaterial) {
      const success = await exportMaterialCSV(selectedWeek, selectedYear);
      if (success) successCount++;
    }

    if (exportRenta) {
      const success = await exportRentaCSV(selectedWeek, selectedYear);
      if (success) successCount++;
    }

    console.log("✅ Exportaciones exitosas:", successCount);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={commonStyles.scrollView}
        contentContainerStyle={commonStyles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="file-export"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Exportar Informes</Text>
          <Text style={styles.headerSubtitle}>
            Genera archivos CSV de tus vales emitidos por semana
          </Text>
        </View>

        {/* Selector de Semana */}
        <View style={commonStyles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="calendar-week"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={styles.sectionTitle}>Seleccionar Semana</Text>
          </View>

          {loadingWeeks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>
                Cargando semanas con vales...
              </Text>
            </View>
          ) : weeksOptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-remove"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No tienes vales emitidos aún</Text>
              <Text style={styles.emptySubtext}>
                Los vales aparecerán aquí una vez que sean emitidos
              </Text>
            </View>
          ) : (
            <>
              <FormPicker
                label="Semana"
                value={selectedWeek}
                onValueChange={(value) => {
                  console.log("📅 Semana seleccionada:", value);
                  setSelectedWeek(value);
                }}
                items={weeksOptions}
                placeholder="Selecciona una semana"
                enabled={!loading}
              />

              {selectedWeek && (
                <View style={styles.weekInfo}>
                  <MaterialCommunityIcons
                    name="information"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.weekInfoText}>
                    Se exportarán los vales emitidos de {getSelectedWeekLabel()}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Tipo de Exportación - Solo mostrar si hay semanas disponibles */}
        {weeksOptions.length > 0 && (
          <>
            <View style={commonStyles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="checkbox-multiple-marked"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.sectionTitle}>Tipo de Exportación</Text>
              </View>

              <ExportCheckbox
                label="Vales de Material"
                icon="package-variant"
                iconColor={colors.primary}
                checked={exportMaterial}
                onToggle={() => setExportMaterial(!exportMaterial)}
                disabled={loading || !selectedWeek}
              />

              <ExportCheckbox
                label="Vales de Renta"
                icon="truck-cargo-container"
                iconColor={colors.secondary}
                checked={exportRenta}
                onToggle={() => setExportRenta(!exportRenta)}
                disabled={loading || !selectedWeek}
              />

              {!exportMaterial && !exportRenta && (
                <View style={styles.warningBox}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={styles.warningText}>
                    Selecciona al menos un tipo de vale para exportar
                  </Text>
                </View>
              )}
            </View>

            {/* Información adicional */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Los archivos CSV se generarán con todos los datos de los vales
                emitidos seleccionados y se podrán compartir o abrir con Excel.
              </Text>
            </View>

            {/* Botón Exportar */}
            <View style={commonStyles.buttonContainer}>
              <PrimaryButton
                title={loading ? "Exportando..." : "Exportar"}
                onPress={handleExport}
                loading={loading}
                disabled={
                  (!exportMaterial && !exportRenta) || loading || !selectedWeek
                }
                icon="file-export"
                backgroundColor={colors.accent}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default InformesScreen;

const styles = StyleSheet.create({
  // Header específico de esta pantalla
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },

  // Loading state
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Información de semana
  weekInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent + "15",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  weekInfoText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },

  // Warning box
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning + "15",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
