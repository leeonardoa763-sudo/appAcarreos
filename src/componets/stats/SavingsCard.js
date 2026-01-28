// src/components/stats/SavingsCard.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";
import { LinearGradient } from "expo-linear-gradient";

/**
 * SavingsCard
 *
 * Card destacado que muestra el ROI y ahorros vs vales físicos
 * Diseñado para impresionar a directivos con métricas de valor
 */
const SavingsCard = ({ totalVales, periodoLabel = "este mes" }) => {
  // Cálculos de ahorro (estimaciones basadas en vales físicos)
  const tiempoPromedioFisico = 45; // minutos por vale físico
  const tiempoPromedioDigital = 3; // minutos por vale digital
  const tiempoAhorradoPorVale = tiempoPromedioFisico - tiempoPromedioDigital; // 42 min
  const tiempoTotalAhorrado = (totalVales * tiempoAhorradoPorVale) / 60; // en horas

  const hojasAhorradas = totalVales * 1; // 1 hoja por vale
  const erroresEvitados = Math.round(totalVales * 0.08); // 8% de error estimado en físicos

  const porcentajeEficiencia = Math.round(
    ((tiempoPromedioFisico - tiempoPromedioDigital) / tiempoPromedioFisico) *
      100,
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A936F", "#88D498"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="cash-check" size={32} color="#FFFFFF" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Impacto Digital</Text>
            <Text style={styles.subtitle}>vs Vales Físicos</Text>
          </View>
        </View>

        {/* Métricas principales */}
        <View style={styles.metricsGrid}>
          {/* Tiempo ahorrado */}
          <View style={styles.metricCard}>
            <MaterialCommunityIcons
              name="clock-fast"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.metricValue}>
              {tiempoTotalAhorrado.toFixed(0)} hrs
            </Text>
            <Text style={styles.metricLabel}>Tiempo Ahorrado</Text>
          </View>

          {/* Papel ahorrado */}
          <View style={styles.metricCard}>
            <MaterialCommunityIcons
              name="file-document-remove"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.metricValue}>{hojasAhorradas}</Text>
            <Text style={styles.metricLabel}>Hojas Ahorradas</Text>
          </View>

          {/* Errores evitados */}
          <View style={styles.metricCard}>
            <MaterialCommunityIcons
              name="shield-check"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.metricValue}>{erroresEvitados}</Text>
            <Text style={styles.metricLabel}>Errores Evitados</Text>
          </View>

          {/* Eficiencia */}
          <View style={styles.metricCard}>
            <MaterialCommunityIcons
              name="speedometer"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.metricValue}>{porcentajeEficiencia}%</Text>
            <Text style={styles.metricLabel}>Más Eficiente</Text>
          </View>
        </View>

        {/* Footer con contexto */}
        <View style={styles.footer}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={styles.footerText}>
            Basado en {totalVales} vales procesados {periodoLabel}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default SavingsCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
});
