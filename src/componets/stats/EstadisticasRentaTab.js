// src/components/stats/EstadisticasRentaTab.js

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";
import { useEstadisticasRenta } from "../../hooks/useEstadisticasRenta";
import PieChartCard from "./PieChartCard";
import BarChartCard from "./BarChartCard";
import TopOperadoresList from "./TopOperadoresList";
import { useEstadisticasRentaTendencia } from "../../hooks/useEstadisticasRentaTendencia";
import LineChartCard from "./LineChartCard";

/**
 * EstadisticasRentaTab
 *
 * Pestaña completa de estadísticas de renta.
 * Consume useEstadisticasRenta y renderiza:
 *   - Tarjetas de totales (horas, dias, costo)
 *   - Lista de sindicatos usados
 *   - Pie chart de distribucion por sindicato
 *   - Bar chart de tendencia (vales por dia)
 *   - Top 5 operadores
 *
 * Props:
 * - periodo: string - 'semana' | 'mes' | 'trimestre' | 'semestre' | 'año'
 * - residenteId: number | null
 * - obraId: number | null
 */
const EstadisticasRentaTab = ({ periodo, residenteId, obraId }) => {
  const {
    totales,
    sindicatosUsados,
    materialesMovidos,
    topOperadores,
    chartData,
    loading,
    error,
    refetch,
  } = useEstadisticasRenta(periodo, residenteId, obraId);

  const {
    semanal,
    periodo: tendenciaPeriodo,
    materialesDisponibles,
    materialIdFiltroSemanal,
    setMaterialIdFiltroSemanal,
    materialIdFiltroPeriodo,
    setMaterialIdFiltroPeriodo,
  } = useEstadisticasRentaTendencia(periodo, residenteId, obraId);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Cargando renta...</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centrado}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={colors.danger}
        />
        <Text style={styles.errorText}>No se pudieron cargar los datos</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Adaptar bar data al formato que espera BarChartCard ───────────────────
  const barDataFormateada = {
    labels: chartData.barData.map((d) => d.label),
    datasets: [{ data: chartData.barData.map((d) => d.value) }],
  };

  // ── TopOperadoresList espera { nombre, viajes } — mapeamos vales a viajes ─
  const topOperadoresAdaptado = topOperadores.map((op) => ({
    nombre: op.nombre,
    viajes: op.viajes,
    placas: op.placas,
  }));

  return (
    <View style={styles.container}>
      {/* ── Tarjetas de totales ─────────────────────────────────────────── */}
      <View style={styles.totalesGrid}>
        <TotalCard
          icono="clock-outline"
          valor={totales.totalHoras.toFixed(1)}
          unidad="hrs"
          etiqueta="Total horas"
          color={statsColors.gradients.rental[0]}
        />
        <TotalCard
          icono="calendar-check-outline"
          valor={totales.totalDias.toFixed(1)}
          unidad="días"
          etiqueta="Total días"
          color={colors.secondary}
        />
        <TotalCard
          icono="cash-multiple"
          valor={`$${(totales.costoTotal / 1000).toFixed(1)}K`}
          unidad=""
          etiqueta="Costo total"
          color={statsColors.gradients.financial[0]}
        />
      </View>

      {/* ── Lista de materiales─────────────────────────────────────────── */}
      {materialesMovidos.length > 0 && (
        <View style={styles.seccion}>
          <MaterialesRentaList materiales={materialesMovidos} />
        </View>
      )}

      {/* ── Pie chart: distribucion por sindicato ────────────────────────── */}
      {chartData.pieData.length > 0 && (
        <View style={styles.seccion}>
          <PieChartCard
            title="Distribución por Material"
            subtitle="M³ por tipo de material (capacidad × viajes)"
            icon="chart-pie"
            iconColor={colors.secondary}
            data={chartData.pieData}
            showPercentage
          />
        </View>
      )}

      {/* Tendencia semanal fija */}
      <View style={styles.seccion}>
        <LineChartCard
          title="Tendencia Semanal"
          subtitle="Viajes por día — semana en curso"
          icon="chart-line"
          iconColor={colors.secondary}
          labels={semanal.labels}
          datasets={semanal.datasets}
          materiales={semanal.materiales}
          yAxisSuffix=" v"
          loading={semanal.loading}
          error={semanal.error}
          materialesDisponibles={semanal.materiales}
          materialIdFiltro={materialIdFiltroSemanal}
          onMaterialChange={setMaterialIdFiltroSemanal}
        />
      </View>

      {/* Tendencia por periodo — una linea por sindicato */}
      <View style={styles.seccion}>
        <LineChartCard
          title="Tendencia por Periodo"
          subtitle="Viajes por semana ISO"
          icon="chart-line-variant"
          iconColor={colors.secondary}
          labels={tendenciaPeriodo.labels}
          datasets={tendenciaPeriodo.datasets}
          materiales={tendenciaPeriodo.materiales}
          yAxisSuffix=" v"
          loading={tendenciaPeriodo.loading}
          error={tendenciaPeriodo.error}
          materialesDisponibles={materialesDisponibles}
          materialIdFiltro={materialIdFiltroPeriodo}
          onMaterialChange={setMaterialIdFiltroPeriodo}
        />
      </View>

      {/* ── Top operadores ───────────────────────────────────────────────── */}
      {topOperadoresAdaptado.length > 0 && (
        <View style={styles.seccion}>
          <TopOperadoresList
            data={topOperadoresAdaptado}
            title="Top 5 Operadores"
            subtitle="Operadores con más vales de renta en el periodo"
          />
        </View>
      )}

      {/* ── Mensaje sin datos ────────────────────────────────────────────── */}
      {totales.totalVales === 0 && (
        <View style={styles.sinDatos}>
          <MaterialCommunityIcons
            name="truck-cargo-container"
            size={52}
            color={colors.border}
          />
          <Text style={styles.sinDatosTitle}>Sin vales de renta</Text>
          <Text style={styles.sinDatosSubtitle}>
            No hay vales de renta en este periodo
            {obraId ? " para la obra seleccionada" : ""}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Subcomponente: lista de sindicatos ───────────────────────────────────────

const MaterialesRentaList = ({ materiales }) => {
  const maxM3 = materiales[0]?.m3Total ?? 1;
  const COLORES = statsColors.chartPalette;

  return (
    <View style={styles.sindicatosCard}>
      <Text style={styles.sindicatosTitulo}>Materiales Movidos</Text>

      {materiales.map((item, index) => {
        const porcentaje = maxM3 > 0 ? (item.m3Total / maxM3) * 100 : 0;
        const color = COLORES[index % COLORES.length];

        return (
          <View key={item.nombre} style={styles.sindicatoFila}>
            <View style={[styles.colorDot, { backgroundColor: color }]} />

            <View style={styles.sindicatoCentro}>
              <View style={styles.sindicatoNombreRow}>
                <Text style={styles.sindicatoNombre} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.sindicatoVales}>
                  {item.m3Total.toFixed(1)} m³
                </Text>
              </View>

              <View style={styles.barraFondo}>
                <View
                  style={[
                    styles.barraRelleno,
                    { width: `${porcentaje}%`, backgroundColor: color },
                  ]}
                />
              </View>

              <View style={styles.sindicatoDetalle}>
                <Text style={styles.sindicatoDetalleTexto}>
                  {item.viajes} {item.viajes === 1 ? "viaje" : "viajes"}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── Subcomponente TotalCard ──────────────────────────────────────────────────

const TotalCard = ({ icono, valor, unidad, etiqueta, color }) => (
  <View style={[styles.totalCard, { borderTopColor: color }]}>
    <MaterialCommunityIcons name={icono} size={22} color={color} />
    <Text style={styles.totalValor}>
      {valor}
      {unidad ? <Text style={styles.totalUnidad}> {unidad}</Text> : null}
    </Text>
    <Text style={styles.totalEtiqueta}>{etiqueta}</Text>
  </View>
);

export default EstadisticasRentaTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Loading / Error
  centrado: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },

  // Totales
  totalesGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  totalCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  totalValor: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  totalUnidad: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  totalEtiqueta: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 14,
  },

  // Secciones
  seccion: {
    marginBottom: 20,
  },

  // Sindicatos list
  sindicatosCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sindicatosTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sindicatoFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  sindicatoCentro: {
    flex: 1,
    gap: 5,
  },
  sindicatoNombreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sindicatoNombre: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  sindicatoVales: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  barraFondo: {
    height: 5,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: 3,
  },
  sindicatoDetalle: {
    flexDirection: "row",
    gap: 10,
  },
  sindicatoDetalleTexto: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Sin datos
  sinDatos: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 10,
  },
  sinDatosTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sinDatosSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
