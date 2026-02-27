// src/components/stats/MaterialesMovidosList.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";

/**
 * MaterialesMovidosList
 *
 * Lista de materiales movidos en el periodo/obra seleccionada.
 * Cada fila muestra nombre del material, m3 total y numero de viajes.
 * El material con mas m3 lleva una barra de progreso relativa al maximo.
 *
 * Props:
 * - materiales: [{ id, nombre, m3Total, viajes }]
 */
const MaterialesMovidosList = ({ materiales = [] }) => {
  if (materiales.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={40}
          color={colors.border}
        />
        <Text style={styles.emptyText}>Sin movimientos en este periodo</Text>
      </View>
    );
  }

  // El primero ya viene ordenado por mayor m3 desde el hook
  const maxM3 = materiales[0].m3Total;

  const COLORES = statsColors.chartPalette;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Materiales Movidos</Text>

      {materiales.map((item, index) => {
        const porcentaje = maxM3 > 0 ? (item.m3Total / maxM3) * 100 : 0;
        const color = COLORES[index % COLORES.length];

        return (
          <View key={item.id} style={styles.fila}>
            {/* Indicador de color */}
            <View style={[styles.colorDot, { backgroundColor: color }]} />

            {/* Nombre y barra */}
            <View style={styles.centro}>
              <View style={styles.nombreRow}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.viajes}>
                  {item.viajes} {item.viajes === 1 ? "viaje" : "viajes"}
                </Text>
              </View>

              {/* Barra de progreso relativa */}
              <View style={styles.barraFondo}>
                <View
                  style={[
                    styles.barraRelleno,
                    { width: `${porcentaje}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>

            {/* m3 total */}
            <View style={styles.m3Container}>
              <Text style={styles.m3Valor}>{item.m3Total.toFixed(1)}</Text>
              <Text style={styles.m3Unidad}>m³</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default MaterialesMovidosList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  titulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Estado vacio
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Fila de material
  fila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  centro: {
    flex: 1,
    gap: 5,
  },

  nombreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nombre: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },

  viajes: {
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

  // m3
  m3Container: {
    alignItems: "flex-end",
    flexShrink: 0,
    minWidth: 52,
  },

  m3Valor: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  m3Unidad: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
