// src/screens/EstadisticasScreen.js

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { statsColors } from "../config/statsColors";
import { useEstadisticas } from "../hooks/useEstadisticas";
import StatCard from "../componets/stats/StatCard";
import TrendIndicator from "../componets/stats/TrendIndicator";
import ComparisonCard from "../componets/stats/ComparisonCard";
import { useChartData } from "../hooks/useChartData";
import PieChartCard from "../componets/stats/PieChartCard";
import BarChartCard from "../componets/stats/BarChartCard";
import TopOperadoresList from "../componets/stats/TopOperadoresList";
import SavingsCard from "../componets/stats/SavingsCard";
import QuickStatsRow from "../componets/stats/QuickStatsRow";
import FilterModal from "../componets/stats/FilterModal";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useFilterCatalogos } from "../hooks/useFilterCatalogos";
import ExportButton from "../componets/stats/ExportButton";
import { useStatsPDF } from "../hooks/useStatsPDF";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import WatermarkOverlay from "../componets/stats/WatermarkOverlay";

/**
 * EstadisticasScreen
 *
 * Pantalla principal de estadísticas y analítica
 * Muestra KPIs, gráficos y tendencias de vales
 */
const EstadisticasScreen = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mes");
  const { data, loading, error, refetch } =
    useEstadisticas(periodoSeleccionado);
  const { userProfile } = useAuth();

  const scrollViewRef = useRef(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const {
    materiales,
    sindicatos,
    loading: catalogosLoading,
  } = useFilterCatalogos();
  const {
    filters,
    filteredData,
    applyFilters,
    clearFilters,
    activeFiltersCount,
    hasFilters,
  } = useStatsFilters(data);

  const { generating, captureAndShare } = useStatsPDF();

  // Usar datos filtrados en lugar de datos originales
  const displayData = hasFilters ? filteredData : data;
  const chartData = useChartData(displayData);

  const periodos = [
    { id: "semana", label: "Semana", icon: "calendar-week" },
    { id: "mes", label: "Mes", icon: "calendar-month" },
    { id: "trimestre", label: "Trimestre", icon: "calendar-range" },
    { id: "semestre", label: "Semestre", icon: "calendar-multiple" },
    { id: "año", label: "Año", icon: "calendar" },
  ];

  const handlePeriodoChange = (periodo) => {
    console.log(`[EstadisticasScreen] Cambiando periodo a: ${periodo}`);
    setPeriodoSeleccionado(periodo);
  };
  const handleExportPDF = async () => {
    console.log("[EstadisticasScreen] Iniciando captura de pantalla...");

    try {
      const success = await captureAndShare(scrollViewRef);

      if (success) {
        console.log("[EstadisticasScreen] Captura compartida exitosamente");
      } else {
        console.log("[EstadisticasScreen] Error al compartir captura");
      }
    } catch (err) {
      console.error("[EstadisticasScreen] Error en handleExportPDF:", err);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={64}
          color={colors.error}
        />
        <Text style={styles.errorTitle}>Error al cargar estadísticas</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de filtros sticky */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {periodos.map((periodo) => (
            <TouchableOpacity
              key={periodo.id}
              style={[
                styles.filterButton,
                periodoSeleccionado === periodo.id && styles.filterButtonActive,
              ]}
              onPress={() => handlePeriodoChange(periodo.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={periodo.icon}
                size={20}
                color={
                  periodoSeleccionado === periodo.id
                    ? colors.surface
                    : colors.textPrimary
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  periodoSeleccionado === periodo.id &&
                    styles.filterButtonTextActive,
                ]}
              >
                {periodo.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botón de filtros avanzados */}
        <TouchableOpacity
          style={[
            styles.advancedFilterButton,
            hasFilters && styles.advancedFilterButtonActive,
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="tune"
            size={24}
            color={hasFilters ? colors.surface : colors.textPrimary}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : (
          <>
            {/* Header informativo */}
            <View style={styles.header}>
              <MaterialCommunityIcons
                name="chart-line"
                size={40}
                color={colors.primary}
              />
              <Text style={styles.headerTitle}>Dashboard Ejecutivo</Text>
              <Text style={styles.headerSubtitle}>
                Análisis de vales -{" "}
                {periodos.find((p) => p.id === periodoSeleccionado)?.label}
              </Text>
            </View>

            {/* Indicador de filtros activos */}
            {hasFilters && (
              <View style={styles.activeFiltersContainer}>
                <View style={styles.activeFiltersHeader}>
                  <MaterialCommunityIcons
                    name="filter-check"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.activeFiltersTitle}>
                    Filtros activos ({activeFiltersCount})
                  </Text>
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={styles.clearFiltersButton}
                  >
                    <Text style={styles.clearFiltersText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.activeFiltersList}>
                  {filters.materiales.length > 0 && (
                    <View style={styles.filterChip}>
                      <MaterialCommunityIcons
                        name="package-variant"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.filterChipText}>
                        {filters.materiales.length} material(es)
                      </Text>
                    </View>
                  )}
                  {filters.sindicatos.length > 0 && (
                    <View style={styles.filterChip}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={14}
                        color={colors.secondary}
                      />
                      <Text style={styles.filterChipText}>
                        {filters.sindicatos.length} sindicato(s)
                      </Text>
                    </View>
                  )}
                  {filters.mostrarComparativa && (
                    <View style={styles.filterChip}>
                      <MaterialCommunityIcons
                        name="compare"
                        size={14}
                        color={colors.accent}
                      />
                      <Text style={styles.filterChipText}>
                        Comparativa activa
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* KPIs principales */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Resumen General</Text>
                {displayData.totales.totalViajes > 0 && (
                  <TrendIndicator
                    direction="up"
                    percentage={12.5}
                    size="small"
                    showBackground={true}
                  />
                )}
              </View>

              <View style={styles.kpiGrid}>
                <StatCard
                  icon="cube-outline"
                  iconColor={colors.primary}
                  value={displayData.totales.totalM3}
                  label="m³ Movidos"
                  suffix=""
                  decimals={1}
                  trend={{ direction: "up", percentage: 8.3 }}
                />

                <StatCard
                  icon="clock-outline"
                  iconColor={colors.secondary}
                  value={displayData.totales.totalHoras}
                  label="Horas Renta"
                  suffix=""
                  decimals={1}
                  trend={{ direction: "down", percentage: -3.2 }}
                />

                <StatCard
                  icon="truck-outline"
                  iconColor={colors.accent}
                  value={displayData.totales.totalViajes}
                  label="Viajes Total"
                  suffix=""
                  decimals={0}
                  trend={{ direction: "up", percentage: 15.7 }}
                />

                <StatCard
                  icon="cash"
                  iconColor="#1A936F"
                  value={displayData.totales.costoTotal / 1000}
                  label="Costo Total"
                  prefix="$"
                  suffix="K"
                  decimals={1}
                  trend={{ direction: "up", percentage: 5.4 }}
                />
              </View>
            </View>

            {/* Comparativas de costos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comparativa de Costos</Text>

              <View style={styles.comparisonGrid}>
                <ComparisonCard
                  title="Material"
                  icon="package-variant"
                  currentValue={displayData.totales.costoMaterial / 1000}
                  previousValue={
                    (displayData.totales.costoMaterial / 1000) * 0.92
                  }
                  prefix="$"
                  suffix="K"
                  decimals={1}
                  invertTrend={true}
                />

                <ComparisonCard
                  title="Renta"
                  icon="truck-cargo-container"
                  currentValue={displayData.totales.costoRenta / 1000}
                  previousValue={(displayData.totales.costoRenta / 1000) * 1.05}
                  prefix="$"
                  suffix="K"
                  decimals={1}
                  invertTrend={true}
                />
              </View>
            </View>

            {/* Gráfico: Distribución de Material */}
            <PieChartCard
              title="Distribución por Material"
              subtitle={
                hasFilters
                  ? "Datos filtrados"
                  : "Top 5 materiales más solicitados"
              }
              icon="package-variant"
              iconColor={colors.primary}
              data={chartData.materialPieData}
              showPercentage={true}
              showValues={true}
            />

            {/* Gráfico: Distribución de Costos */}
            <PieChartCard
              title="Distribución de Costos"
              subtitle="Material vs Renta"
              icon="chart-pie"
              iconColor={colors.secondary}
              data={chartData.costoPieData}
              showPercentage={true}
              showValues={true}
            />

            {/* Gráfico: Tendencia de m³ */}
            <BarChartCard
              title="Tendencia de Material"
              subtitle="Metros cúbicos por semana"
              icon="chart-bar"
              iconColor={colors.accent}
              data={chartData.tendenciaM3Data}
              yAxisSuffix=" m³"
              showValuesOnTopOfBars={true}
            />

            {/* Gráfico: Tendencia de Horas */}
            <BarChartCard
              title="Tendencia de Renta"
              subtitle="Horas acumuladas por semana"
              icon="clock-outline"
              iconColor={colors.secondary}
              data={chartData.tendenciaHorasData}
              yAxisSuffix=" h"
              showValuesOnTopOfBars={true}
            />

            {/* Card de Ahorros - Impacto */}
            <SavingsCard
              totalVales={
                displayData.valesMaterial.length + displayData.valesRenta.length
              }
              periodoLabel={periodos
                .find((p) => p.id === periodoSeleccionado)
                ?.label.toLowerCase()}
            />

            {/* Métricas rápidas adicionales */}
            <QuickStatsRow
              stats={[
                {
                  icon: "file-document",
                  value: displayData.valesMaterial.length,
                  label: "Vales Material",
                  color: colors.primary,
                },
                {
                  icon: "truck-cargo-container",
                  value: displayData.valesRenta.length,
                  label: "Vales Renta",
                  color: colors.secondary,
                },
                {
                  icon: "calendar-today",
                  value: displayData.totales.totalDias.toFixed(0),
                  label: "Días de Renta",
                  color: colors.accent,
                },
                {
                  icon: "map-marker-distance",
                  value:
                    displayData.totales.totalDistancia > 0
                      ? `${displayData.totales.totalDistancia.toFixed(1)} km`
                      : "0 km",
                  label: "Distancia Total",
                  color: "#F77F00",
                },
              ]}
            />

            {/* Top Operadores */}
            <TopOperadoresList
              data={chartData.topOperadoresData}
              title="Top 5 Operadores"
              subtitle={
                hasFilters
                  ? "Basado en filtros activos"
                  : "Operadores más activos del periodo"
              }
            />

            {/* Info de datos */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Mostrando {displayData.valesMaterial.length} vales de material y{" "}
                {displayData.valesRenta.length} vales de renta
                {hasFilters && " (filtrados)"}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Marca de agua para capturas */}
      {!loading && displayData.totales.totalViajes > 0 && (
        <WatermarkOverlay
          periodo={periodos.find((p) => p.id === periodoSeleccionado)?.label}
        />
      )}
      {/* Botón flotante de exportación */}
      {!loading && displayData.totales.totalViajes > 0 && (
        <ExportButton
          onPress={handleExportPDF}
          loading={generating}
          disabled={generating}
        />
      )}

      {/* Modal de filtros avanzados */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={applyFilters}
        materiales={materiales}
        sindicatos={sindicatos}
        currentFilters={filters}
      />
    </View>
  );
};

export default EstadisticasScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Barra de filtros
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterScrollContent: {
    paddingRight: 8,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterButtonTextActive: {
    color: colors.surface,
  },

  // Botón de filtros avanzados
  advancedFilterButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  advancedFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  filterBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "bold",
  },

  // Scroll y contenido
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },

  // Header
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
    marginTop: 4,
  },

  // Indicador de filtros activos
  activeFiltersContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderLeftWidth: 4,
  },
  activeFiltersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  activeFiltersTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  activeFiltersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  // Secciones
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Grid de KPIs
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  // Comparativas
  comparisonGrid: {
    gap: 12,
  },

  // Info box
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: statsColors.backgrounds.cardLight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
