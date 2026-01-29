// src/componets/stats/StatsKPISection.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../config/colors";
import StatCard from "./StatCard";
import TrendIndicator from "./TrendIndicator";

/**
 * Sección de KPIs principales que muestra:
 * - Título de sección con indicador de tendencia
 * - Grid de tarjetas con métricas clave:
 *   * Total de viajes
 *   * Total de metros cúbicos
 *   * Costo total
 *   * Promedio por viaje
 */
const StatsKPISection = ({ displayData }) => {
  // Validación defensiva: asegurar que totales existe
  const totales = displayData?.totales || {
    totalViajes: 0,
    totalM3: 0,
    costoTotal: 0,
    costoPromedioPorViaje: 0,
  };

  // Formatear números grandes con comas (con validación)
  const formatNumber = (num) => {
    const validNum = Number(num) || 0;
    return new Intl.NumberFormat("es-MX").format(validNum);
  };

  // Formatear valores monetarios (con validación)
  const formatCurrency = (num) => {
    const validNum = Number(num) || 0;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(validNum);
  };

  // Formatear volumen con validación
  const formatVolume = (num) => {
    const validNum = Number(num) || 0;
    return `${formatNumber(validNum)} m³`;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resumen General</Text>
        {totales.totalViajes > 0 && (
          <TrendIndicator
            direction="up"
            percentage={12.5}
            size="small"
            showBackground={true}
          />
        )}
      </View>

      <View style={styles.kpiGrid}>
        {/* Total de viajes */}
        <StatCard
          icon="cube-outline"
          iconColor={colors.primary}
          value={formatNumber(totales.totalViajes)}
          label="Total Viajes"
          subtitle="Registrados"
        />

        {/* Total de metros cúbicos */}
        <StatCard
          icon="package-variant"
          iconColor={colors.secondary}
          value={formatVolume(totales.totalM3)}
          label="Volumen Total"
          subtitle="Metros cúbicos"
        />

        {/* Costo total */}
        <StatCard
          icon="currency-usd"
          iconColor={colors.accent}
          value={formatCurrency(totales.costoTotal)}
          label="Costo Total"
          subtitle="Inversión"
        />

        {/* Promedio por viaje */}
        <StatCard
          icon="calculator"
          iconColor={colors.info}
          value={formatCurrency(totales.costoPromedioPorViaje)}
          label="Promedio/Viaje"
          subtitle="Costo medio"
        />
      </View>
    </View>
  );
};

export default StatsKPISection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
