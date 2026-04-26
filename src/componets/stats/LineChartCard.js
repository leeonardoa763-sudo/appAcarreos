// src/components/stats/LineChartCard.js

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ChartCard from "./ChartCard";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";

const screenWidth = Dimensions.get("window").width;

/**
 * LineChartCard
 *
 * Grafica de lineas con puntos para tendencias de m3.
 * Soporta multiples lineas (una por material) con leyenda de colores.
 * Opcionalmente muestra un selector de material para filtrar.
 *
 * Props:
 * - title: string
 * - subtitle: string
 * - icon: string (MaterialCommunityIcons)
 * - iconColor: string
 * - labels: string[] — etiquetas eje X ("Lun", "Mar" o "1", "2", "3"...)
 * - datasets: array — formato react-native-chart-kit con { data, color, strokeWidth }
 * - materiales: [{ id, nombre }] — para la leyenda
 * - yAxisSuffix: string — por defecto " m³"
 * - loading: boolean
 * - error: string | null
 *
 * Props opcionales para selector de material (grafica 2):
 * - materialesDisponibles: [{ id, nombre }]
 * - materialIdFiltro: number | null
 * - onMaterialChange: (id | null) => void
 */
const LineChartCard = ({
  title,
  subtitle,
  icon = "chart-line",
  iconColor = colors.secondary,
  labels = [],
  datasets = [],
  materiales = [],
  yAxisSuffix = " m³",
  loading = false,
  error = null,
  // Selector opcional
  materialesDisponibles = [],
  materialIdFiltro = null,
  onMaterialChange = null,
}) => {
  const tieneSelector =
    onMaterialChange !== null && materialesDisponibles.length > 0;
  const isEmpty =
    !loading && !error && (labels.length === 0 || datasets.length === 0);

  // Asegurar que cada dataset tenga al menos un valor para evitar crash de LineChart
  const datasetsValidos = datasets.filter(
    (ds) => ds.data && ds.data.length > 0 && ds.data.length === labels.length,
  );

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    propsForBackgroundLines: {
      strokeDasharray: "4,4",
      stroke: "#E5E7EB",
      strokeWidth: 0.8,
    },
    propsForLabels: {
      fontSize: 9,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
    },
  };

  const chartData = {
    labels,
    datasets: datasetsValidos.length > 0 ? datasetsValidos : [{ data: [0] }],
  };

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      isEmpty={false}
    >
      {/* ── Selector de material (opcional, solo grafica 2) ─────────────── */}
      {tieneSelector && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorScroll}
          style={styles.selectorContainer}
        >
          {/* Opcion: Todos */}
          <TouchableOpacity
            style={[
              styles.selectorChip,
              materialIdFiltro === null && styles.selectorChipActivo,
            ]}
            onPress={() => onMaterialChange(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectorChipText,
                materialIdFiltro === null && styles.selectorChipTextActivo,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {/* Un chip por material */}
          {materialesDisponibles.map((mat, idx) => {
            const activo = materialIdFiltro === mat.id;
            const colorMat =
              statsColors.chartPalette[idx % statsColors.chartPalette.length];
            return (
              <TouchableOpacity
                key={mat.id}
                style={[
                  styles.selectorChip,
                  activo && {
                    backgroundColor: colorMat,
                    borderColor: colorMat,
                  },
                ]}
                onPress={() => onMaterialChange(activo ? null : mat.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.chipDot,
                    { backgroundColor: activo ? colors.surface : colorMat },
                  ]}
                />
                <Text
                  style={[
                    styles.selectorChipText,
                    activo && styles.selectorChipTextActivo,
                  ]}
                >
                  {mat.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Estados: loading / error / vacío ───────────────────────────── */}
      {loading && (
        <View style={styles.centrado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centrado}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={32}
            color={colors.danger}
          />
          <Text style={styles.errorText}>No se pudo cargar la gráfica</Text>
        </View>
      )}

      {!loading && !error && isEmpty && (
        <View style={styles.centrado}>
          <MaterialCommunityIcons
            name="chart-line-variant"
            size={40}
            color={colors.border}
          />
          <Text style={styles.emptyText}>Sin movimientos en este periodo</Text>
        </View>
      )}

      {/* ── Grafica ─────────────────────────────────────────────────────── */}
      {!loading && !error && !isEmpty && datasetsValidos.length > 0 && (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={screenWidth - 72}
            height={220}
            yAxisSuffix={yAxisSuffix}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero
            withInnerLines
            withOuterLines={false}
            withVerticalLines={false}
            segments={4}
          />
        </View>
      )}

      {/* ── Leyenda ─────────────────────────────────────────────────────── */}
      {!loading && !error && !isEmpty && materiales.length > 0 && (
        <View style={styles.leyenda}>
          {materiales.map((mat, idx) => {
            const colorMat =
              statsColors.chartPalette[idx % statsColors.chartPalette.length];
            const activo =
              materialIdFiltro === null || materialIdFiltro === mat.id;
            return (
              <View
                key={mat.id}
                style={[
                  styles.leyendaItem,
                  !activo && styles.leyendaItemInactivo,
                ]}
              >
                <View
                  style={[styles.leyendaDot, { backgroundColor: colorMat }]}
                />
                <Text style={styles.leyendaTexto} numberOfLines={1}>
                  {mat.nombre}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ChartCard>
  );
};

export default LineChartCard;

const styles = StyleSheet.create({
  // Selector de material
  selectorContainer: {
    marginBottom: 12,
  },
  selectorScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  selectorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectorChipActivo: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  selectorChipTextActivo: {
    color: colors.surface,
    fontWeight: "600",
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Loading / error / vacío
  centrado: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Grafica
  chartWrapper: {
    alignItems: "center",
    marginHorizontal: -4,
  },
  chart: {
    borderRadius: 10,
  },

  // Leyenda
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leyendaItemInactivo: {
    opacity: 0.35,
  },
  leyendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leyendaTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    maxWidth: 120,
  },
});
