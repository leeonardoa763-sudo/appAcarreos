// src/screens/EstadisticasScreen.js

import React, { useState, useRef, useEffect } from "react";
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
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import { useObraData } from "../hooks/useObraData";
import MaterialesPorRequisicionModal from "../componets/stats/MaterialesPorRequisicionModal";
// Importar componentes modulares
import StatsHeader from "../componets/stats/StatsHeader";
import ActiveFiltersIndicator from "../componets/stats/ActiveFiltersIndicator";

const EstadisticasScreen = () => {
  // ========== ESTADOS ==========
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mes");
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [materialesModalVisible, setMaterialesModalVisible] = useState(false);

  // ========== REFS ==========
  const scrollViewRef = useRef(null);

  // ========== HOOKS ==========
  const { userProfile } = useAuth();
  const { obraData } = useObraData(userProfile);

  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

  const { data, loading, error, refetch } = useEstadisticas(
    periodoSeleccionado,
    userProfile?.id_persona,
    obraSeleccionada,
  );

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

  // ========== DATOS DERIVADOS ==========
  const displayData = hasFilters ? filteredData : data;
  const chartData = useChartData(displayData);

  const periodos = [
    { id: "semana", label: "Semana", icon: "calendar-week" },
    { id: "mes", label: "Mes", icon: "calendar-month" },
    { id: "trimestre", label: "Trimestre", icon: "calendar-range" },
    { id: "semestre", label: "Semestre", icon: "calendar-multiple" },
    { id: "año", label: "Año", icon: "calendar" },
  ];

  // ========== EFFECTS ==========
  useEffect(() => {
    if (obras.length > 0 && obraSeleccionada === null) {
      setObraSeleccionada(obras[0].id);
    }
  }, [obras, obraSeleccionada]);

  // ========== FUNCIONES ==========
  const handlePeriodoChange = (periodo) => {
    console.log(`[EstadisticasScreen] Cambiando periodo a: ${periodo}`);
    setPeriodoSeleccionado(periodo);
  };

  const handleApplyFilters = (newFilters) => {
    console.log("[EstadisticasScreen] Aplicando filtros:", newFilters);

    // Actualizar obra seleccionada
    setObraSeleccionada(newFilters.obraId);

    // Aplicar otros filtros
    applyFilters(newFilters);
  };

  /**
   * Renderiza el contenido de estadísticas
   */
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Header informativo */}
        <StatsHeader
          periodoSeleccionado={periodoSeleccionado}
          onPeriodoChange={handlePeriodoChange}
          onFilterPress={() => setFilterModalVisible(true)}
          hasFilters={hasFilters}
          activeFiltersCount={activeFiltersCount}
          periodoLabel={
            periodos.find((p) => p.id === periodoSeleccionado)?.label
          }
        />

        {/* Indicador de filtros activos */}
        {hasFilters && (
          <ActiveFiltersIndicator
            filters={filters}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearFilters}
          />
        )}

        {/* KPIs principales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumen General</Text>
          </View>

          {/* Grid vertical - un card por fila CON GRADIENTES */}
          <View style={styles.kpiColumn}>
            <ComparisonCard
              title="Material Movido"
              icon="cube-outline"
              currentValue={displayData.totales.totalM3}
              previousValue={displayData.periodoAnterior?.totalM3}
              gradient={statsColors.gradients.material} // ← AGREGAR ESTA LÍNEA
              suffix=" m³"
              decimals={1}
            />

            <ComparisonCard
              title="Horas de Renta"
              icon="clock-outline"
              currentValue={displayData.totales.totalHoras}
              previousValue={displayData.periodoAnterior?.totalHoras}
              gradient={statsColors.gradients.rental} // ← AGREGAR ESTA LÍNEA
              suffix=" hrs"
              decimals={1}
            />

            <ComparisonCard
              title="Viajes Total"
              icon="truck-outline"
              currentValue={displayData.totales.totalViajes}
              previousValue={displayData.periodoAnterior?.totalViajes}
              gradient={statsColors.gradients.trips} // ← AGREGAR ESTA LÍNEA
              suffix=""
              decimals={0}
            />

            <ComparisonCard
              title="Costo Total"
              icon="cash"
              currentValue={displayData.totales.costoTotal / 1000}
              previousValue={displayData.periodoAnterior?.costoTotal / 1000}
              gradient={statsColors.gradients.financial} // ← AGREGAR ESTA LÍNEA
              prefix="$"
              suffix="K"
              decimals={1}
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
              currentValue={(displayData.totales.costoMaterial || 0) / 1000}
              previousValue={
                (displayData.periodoAnterior?.costoMaterial || 0) / 1000
              }
              gradient={statsColors.gradients.material}
              prefix="$"
              suffix="K"
              decimals={1}
            />

            <ComparisonCard
              title="Renta"
              icon="truck-cargo-container"
              currentValue={(displayData.totales.costoRenta || 0) / 1000}
              previousValue={
                (displayData.periodoAnterior?.costoRenta || 0) / 1000
              }
              gradient={statsColors.gradients.rental}
              prefix="$"
              suffix="K"
              decimals={1}
            />
          </View>
        </View>

        {/* Botón para ver materiales por requisición */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => setMaterialesModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons
              name="clipboard-text-multiple"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.buttonText}>
              Ver Materiales por Requisición
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Gráfico: Distribución de Material */}
        <PieChartCard
          title="Distribución por Material"
          subtitle={
            hasFilters ? "Datos filtrados" : "Top 5 materiales más solicitados"
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
          valueFormatter={(value, name) => {
            // Formatear como moneda con símbolo de pesos
            return `$${(value / 1000).toFixed(1)}K`;
          }}
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
    );
  };

  // ========== MANEJO DE ERRORES ==========
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

  // ========== RENDER PRINCIPAL ==========
  return (
    <View style={styles.container}>
      {/* ScrollView con pull-to-refresh */}
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
        {renderContent()}
      </ScrollView>

      {/* Modal de filtros avanzados */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        obras={obras}
        materiales={materiales}
        sindicatos={sindicatos}
        currentFilters={{ ...filters, obraId: obraSeleccionada }}
        loadingObras={loadingObras}
      />

      {/* Modal de materiales por requisición */}
      <MaterialesPorRequisicionModal
        visible={materialesModalVisible}
        onClose={() => setMaterialesModalVisible(false)}
        valesMaterial={displayData.valesMaterial}
        obraData={obraData}
      />
    </View>
  );
};

export default EstadisticasScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: statsColors.backgrounds.screen, // Nuevo fondo gris claro
  },

  // ScrollView
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

  // Botón para ver detalles
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 10,
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
  // Grid de KPIs
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  //columna de KPIs (uno debajo del otro)
  kpiColumn: {
    flexDirection: "column",
    gap: 12,
  },
});
