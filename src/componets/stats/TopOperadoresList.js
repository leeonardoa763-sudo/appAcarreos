// src/components/stats/TopOperadoresList.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";
import ChartCard from "./ChartCard";

/**
 * TopOperadoresList
 *
 * Lista ranqueada de operadores más activos
 * Muestra top 5 con medallas y barras de progreso
 */
const TopOperadoresList = ({
  data = [],
  title = "Top Operadores",
  subtitle = "Operadores más activos del periodo",
}) => {
  const isEmpty = !data || data.length === 0;

  // Obtener el máximo de viajes para calcular porcentaje de barra
  const maxViajes =
    data.length > 0 ? Math.max(...data.map((op) => op.viajes)) : 0;

  const getMedalIcon = (index) => {
    switch (index) {
      case 0:
        return { name: "medal", color: "#FFD700" }; // Oro
      case 1:
        return { name: "medal", color: "#C0C0C0" }; // Plata
      case 2:
        return { name: "medal", color: "#CD7F32" }; // Bronce
      default:
        return { name: "account-hard-hat", color: colors.textSecondary };
    }
  };

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      icon="account-group"
      iconColor={colors.accent}
      isEmpty={isEmpty}
      emptyMessage="No hay operadores registrados"
    >
      {!isEmpty && (
        <View style={styles.container}>
          {data.map((operador, index) => {
            const medal = getMedalIcon(index);
            const percentage =
              maxViajes > 0 ? (operador.viajes / maxViajes) * 100 : 0;

            return (
              <View key={index} style={styles.operadorItem}>
                {/* Ranking y medalla */}
                <View style={styles.rankContainer}>
                  <MaterialCommunityIcons
                    name={medal.name}
                    size={24}
                    color={medal.color}
                  />
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>

                {/* Info del operador */}
                <View style={styles.operadorInfo}>
                  <Text style={styles.operadorNombre} numberOfLines={1}>
                    {operador.nombre}
                  </Text>

                  {/* Barra de progreso */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${percentage}%`,
                          backgroundColor:
                            index < 3 ? medal.color : colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Cantidad de viajes */}
                <View style={styles.viajesContainer}>
                  <Text style={styles.viajesNumber}>{operador.viajes}</Text>
                  <Text style={styles.viajesLabel}>viajes</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ChartCard>
  );
};

export default TopOperadoresList;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  operadorItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  rankContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 2,
  },
  operadorInfo: {
    flex: 1,
    marginRight: 12,
  },
  operadorNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  viajesContainer: {
    alignItems: "flex-end",
    minWidth: 50,
  },
  viajesNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  viajesLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
