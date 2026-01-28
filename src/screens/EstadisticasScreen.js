// src/screens/EstadisticasScreen.js

import React, { useState } from "react";
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

// Agregar estos imports al inicio
import StatCard from "../componets/stats/StatCard";
import TrendIndicator from "../componets/stats/TrendIndicator";
import ComparisonCard from "../componets/stats/ComparisonCard";
import { useChartData } from "../hooks/useChartData";
import PieChartCard from "../componets/stats/PieChartCard";
import BarChartCard from "../componets/stats/BarChartCard";
import TopOperadoresList from "../componets/stats/TopOperadoresList";
import SavingsCard from "../componets/stats/SavingsCard";
import QuickStatsRow from "../componets/stats/QuickStatsRow";
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
  const chartData = useChartData(data);

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
      </View>

      {/* Contenido principal */}
      <ScrollView
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

            {/* KPIs principales */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Resumen General</Text>
                <TrendIndicator
                  direction="up"
                  percentage={12.5}
                  size="small"
                  showBackground={true}
                />
              </View>

              <View style={styles.kpiGrid}>
                <StatCard
                  icon="cube-outline"
                  iconColor={colors.primary}
                  value={data.totales.totalM3}
                  label="m³ Movidos"
                  suffix=""
                  decimals={1}
                  trend={{ direction: "up", percentage: 8.3 }}
                />

                <StatCard
                  icon="clock-outline"
                  iconColor={colors.secondary}
                  value={data.totales.totalHoras}
                  label="Horas Renta"
                  suffix=""
                  decimals={1}
                  trend={{ direction: "down", percentage: -3.2 }}
                />

                <StatCard
                  icon="truck-outline"
                  iconColor={colors.accent}
                  value={data.totales.totalViajes}
                  label="Viajes Total"
                  suffix=""
                  decimals={0}
                  trend={{ direction: "up", percentage: 15.7 }}
                />

                <StatCard
                  icon="cash"
                  iconColor="#1A936F"
                  value={data.totales.costoTotal / 1000}
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
                  currentValue={data.totales.costoMaterial / 1000}
                  previousValue={(data.totales.costoMaterial / 1000) * 0.92}
                  prefix="$"
                  suffix="K"
                  decimals={1}
                  invertTrend={true}
                />

                <ComparisonCard
                  title="Renta"
                  icon="truck-cargo-container"
                  currentValue={data.totales.costoRenta / 1000}
                  previousValue={(data.totales.costoRenta / 1000) * 1.05}
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
              subtitle="Top 5 materiales más solicitados"
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

            {/* Info de datos */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Mostrando {data.valesMaterial.length} vales de material y{" "}
                {data.valesRenta.length} vales de renta
              </Text>
            </View>

            {/* Card de Ahorros - Impacto */}
            <SavingsCard
              totalVales={data.valesMaterial.length + data.valesRenta.length}
              periodoLabel={periodos
                .find((p) => p.id === periodoSeleccionado)
                ?.label.toLowerCase()}
            />

            {/* Métricas rápidas adicionales */}
            <QuickStatsRow
              stats={[
                {
                  icon: "file-document",
                  value: data.valesMaterial.length,
                  label: "Vales Material",
                  color: colors.primary,
                },
                {
                  icon: "truck-cargo-container",
                  value: data.valesRenta.length,
                  label: "Vales Renta",
                  color: colors.secondary,
                },
                {
                  icon: "calendar-today",
                  value: data.totales.totalDias.toFixed(0),
                  label: "Días de Renta",
                  color: colors.accent,
                },
                {
                  icon: "map-marker-distance",
                  value: "N/A",
                  label: "Distancia Total",
                  color: "#F77F00",
                },
              ]}
            />

            {/* Top Operadores */}
            <TopOperadoresList
              data={chartData.topOperadoresData}
              title="Top 5 Operadores"
              subtitle="Operadores más activos del periodo"
            />
          </>
        )}
      </ScrollView>
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
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
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

  // Scroll y contenido
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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

  // Grid de KPIs
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  // Placeholder
  chartPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  comparisonGrid: {
    gap: 12,
  },
});
