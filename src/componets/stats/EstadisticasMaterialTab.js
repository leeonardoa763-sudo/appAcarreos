// src/components/stats/EstadisticasMaterialTab.js

import React, { useState } from "react";
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
import { useEstadisticasMaterial } from "../../hooks/useEstadisticasMaterial";
import { useEstadisticasMaterialTendencia } from "../../hooks/useEstadisticasMaterialTendencia";
import MaterialesMovidosList from "./MaterialesMovidosList";
import PieChartCard from "./PieChartCard";
import TopOperadoresList from "./TopOperadoresList";
import LineChartCard from "./LineChartCard";
import MaterialesPorRequisicionModal from "./MaterialesPorRequisicionModal";

/**
 * EstadisticasMaterialTab
 *
 * Pestaña completa de estadísticas de material.
 * Consume useEstadisticasMaterial y renderiza:
 *   - Tarjetas de totales (m3, viajes, costo)
 *   - Boton de materiales por requisicion (sin filtros, datos completos)
 *   - Lista de materiales movidos
 *   - Pie chart de distribucion por material
 *   - Tendencia semanal (fija)
 *   - Tendencia por periodo (filtrable por material)
 *   - Top 5 operadores
 *
 * Props:
 * - periodo: string - 'semana' | 'mes' | 'trimestre' | 'semestre' | 'año'
 * - residenteId: number | null
 * - obraId: number | null
 */
const EstadisticasMaterialTab = ({ periodo, residenteId, obraId }) => {
  const [modalRequisicionVisible, setModalRequisicionVisible] = useState(false);

  // Hook principal de estadísticas (afectado por filtros)
  const {
    vales,
    totales,
    materialesMovidos,
    topOperadores,
    chartData,
    loading,
    error,
    refetch,
  } = useEstadisticasMaterial(periodo, residenteId, obraId);

  // Hook de tendencias (dos graficas de linea)
  const {
    semanal,
    periodo: tendenciaPeriodo,
    materialesDisponibles,
    materialIdFiltro,
    setMaterialIdFiltro,
    materialIdFiltroSemanal,
    setMaterialIdFiltroSemanal,
  } = useEstadisticasMaterialTendencia(periodo, residenteId, obraId);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando material...</Text>
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

  return (
    <View style={styles.container}>
      {/* ── Tarjetas de totales ─────────────────────────────────────────── */}
      <View style={styles.totalesGrid}>
        <TotalCard
          icono="cube-outline"
          valor={totales.totalM3.toFixed(1)}
          unidad="m³"
          etiqueta="Material movido"
          color={statsColors.gradients.material[0]}
        />
        <TotalCard
          icono="truck-outline"
          valor={totales.totalViajes}
          unidad="viajes"
          etiqueta="Total viajes"
          color={colors.primary}
        />
        <TotalCard
          icono="cash-multiple"
          valor={`$${(totales.costoTotal / 1000).toFixed(1)}K`}
          unidad=""
          etiqueta="Costo total"
          color={statsColors.gradients.financial[0]}
        />
      </View>

      {/* ── Boton de materiales por requisicion ─────────────────────────── */}
      <TouchableOpacity
        style={styles.btnRequisicion}
        onPress={() => setModalRequisicionVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="file-document-multiple"
          size={18}
          color={colors.surface}
        />
        <Text style={styles.btnRequisicionText}>Ver por Requisición</Text>
      </TouchableOpacity>

      {/* ── Lista de materiales movidos ─────────────────────────────────── */}
      <View style={styles.seccion}>
        <MaterialesMovidosList materiales={materialesMovidos} />
      </View>

      {/* ── Pie chart: distribucion por material ────────────────────────── */}
      {chartData.pieData.length > 0 && (
        <View style={styles.seccion}>
          <PieChartCard
            title="Distribución por Material"
            subtitle="M³ por tipo de material"
            icon="chart-pie"
            iconColor={colors.primary}
            data={chartData.pieData}
            showPercentage
          />
        </View>
      )}

      {/* ── Tendencia semanal fija ───────────────────────────────────────── */}
      <View style={styles.seccion}>
        <LineChartCard
          title="Tendencia Semanal"
          subtitle="M³ por día — semana en curso"
          icon="chart-line"
          iconColor={colors.secondary}
          labels={semanal.labels}
          datasets={semanal.datasets}
          materiales={semanal.materiales}
          loading={semanal.loading}
          error={semanal.error}
          materialesDisponibles={semanal.materiales}
          materialIdFiltro={materialIdFiltroSemanal}
          onMaterialChange={setMaterialIdFiltroSemanal}
        />
      </View>

      {/* ── Tendencia por periodo filtrable ─────────────────────────────── */}
      <View style={styles.seccion}>
        <LineChartCard
          title="Tendencia por Periodo"
          subtitle="M³ por semana ISO"
          icon="chart-line-variant"
          iconColor={colors.primary}
          labels={tendenciaPeriodo.labels}
          datasets={tendenciaPeriodo.datasets}
          materiales={tendenciaPeriodo.materiales}
          loading={tendenciaPeriodo.loading}
          error={tendenciaPeriodo.error}
          materialesDisponibles={materialesDisponibles}
          materialIdFiltro={materialIdFiltro}
          onMaterialChange={setMaterialIdFiltro}
        />
      </View>

      {/* ── Top operadores ───────────────────────────────────────────────── */}
      {topOperadores.length > 0 && (
        <View style={styles.seccion}>
          <TopOperadoresList
            data={topOperadores}
            title="Top 5 Operadores"
            subtitle="Operadores con más viajes en el periodo"
          />
        </View>
      )}

      {/* ── Mensaje sin datos ────────────────────────────────────────────── */}
      {totales.totalViajes === 0 && (
        <View style={styles.sinDatos}>
          <MaterialCommunityIcons
            name="truck-off-outline"
            size={52}
            color={colors.border}
          />
          <Text style={styles.sinDatosTitle}>Sin movimientos</Text>
          <Text style={styles.sinDatosSubtitle}>
            No hay vales de material en este periodo
            {obraId ? " para la obra seleccionada" : ""}
          </Text>
        </View>
      )}

      {/* ── Modal de materiales por requisicion ─────────────────────────── */}
      <MaterialesPorRequisicionModal
        visible={modalRequisicionVisible}
        onClose={() => setModalRequisicionVisible(false)}
        valesMaterial={vales}
        obraData={null}
      />
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

export default EstadisticasMaterialTab;

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
    backgroundColor: colors.primary,
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
    marginBottom: 16,
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

  // Boton requisicion
  btnRequisicion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  btnRequisicionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },

  // Secciones
  seccion: {
    marginBottom: 20,
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
