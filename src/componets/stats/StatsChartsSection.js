// src/componets/stats/StatsChartsSection.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";
import PieChartCard from "./PieChartCard";
import BarChartCard from "./BarChartCard";
import TopOperadoresList from "./TopOperadoresList";
import ComparisonCard from "./ComparisonCard";
import SavingsCard from "./SavingsCard";
import QuickStatsRow from "./QuickStatsRow";

/**
 * Sección de gráficas y análisis avanzados que incluye:
 * - Estadísticas rápidas (QuickStatsRow)
 * - Gráfica de distribución por material (PieChart)
 * - Gráfica de distribución por sindicato (PieChart)
 * - Gráfica de viajes por día (BarChart)
 * - Top 5 operadores más activos
 * - Tarjetas de comparativas (material vs sindicato)
 * - Tarjeta de ahorros vs papel
 * - Info box con descripción del periodo
 */
const StatsChartsSection = ({ displayData, chartData, filters }) => {
  // Validación defensiva de datos
  const totales = displayData?.totales || {
    totalViajes: 0,
    viajesPorDia: 0,
    m3PorViaje: 0,
    operadoresActivos: 0,
  };

  const topOperadores = displayData?.topOperadores || [];

  // Validación de chartData
  const safeChartData = {
    materialesData: chartData?.materialesData || [],
    sindicatosData: chartData?.sindicatosData || [],
    viajesPorDiaData: chartData?.viajesPorDiaData || [],
  };

  // Validación de comparativas
  const materialMasUsado = displayData?.materialMasUsado || {
    nombre: "N/A",
    porcentaje: 0,
  };

  const sindicatoMasActivo = displayData?.sindicatoMasActivo || {
    nombre: "N/A",
    porcentaje: 0,
  };

  // Validación de filters
  const safeFilters = filters || { mostrarComparativa: false };

  return (
    <>
      {/* Estadísticas rápidas */}
      {totales.totalViajes > 0 && (
        <QuickStatsRow
          viajesPorDia={totales.viajesPorDia || 0}
          m3PorViaje={totales.m3PorViaje || 0}
          operadoresActivos={totales.operadoresActivos || 0}
        />
      )}

      {/* Gráfica de materiales */}
      {safeChartData.materialesData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución por Material</Text>
          <PieChartCard
            data={safeChartData.materialesData}
            title="Viajes por tipo de material"
          />
        </View>
      )}

      {/* Gráfica de sindicatos */}
      {safeChartData.sindicatosData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución por Sindicato</Text>
          <PieChartCard
            data={safeChartData.sindicatosData}
            title="Viajes por organización"
          />
        </View>
      )}

      {/* Gráfica de viajes por día */}
      {safeChartData.viajesPorDiaData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencia Semanal</Text>
          <BarChartCard
            data={safeChartData.viajesPorDiaData}
            title="Viajes por día de la semana"
          />
        </View>
      )}

      {/* Top 5 operadores */}
      {topOperadores.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Operadores</Text>
          <TopOperadoresList operadores={topOperadores} />
        </View>
      )}

      {/* Comparativas */}
      {safeFilters.mostrarComparativa && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis Comparativo</Text>
          <View style={styles.comparisonGrid}>
            <ComparisonCard
              title="Material más usado"
              value={materialMasUsado.nombre}
              percentage={materialMasUsado.porcentaje}
              icon="dump-truck"
              iconColor={colors.primary}
            />
            <ComparisonCard
              title="Sindicato más activo"
              value={sindicatoMasActivo.nombre}
              percentage={sindicatoMasActivo.porcentaje}
              icon="account-group"
              iconColor={colors.secondary}
            />
          </View>
        </View>
      )}

      {/* Tarjeta de ahorros */}
      {totales.totalViajes > 0 && (
        <View style={styles.section}>
          <SavingsCard totalViajes={totales.totalViajes} />
        </View>
      )}

      {/* Info box final */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons
          name="information"
          size={20}
          color={colors.info}
        />
        <Text style={styles.infoText}>
          Los datos mostrados corresponden al periodo seleccionado. Use los
          filtros para obtener análisis más específicos por obra, material o
          sindicato.
        </Text>
      </View>
    </>
  );
};

export default StatsChartsSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  comparisonGrid: {
    gap: 12,
  },
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
