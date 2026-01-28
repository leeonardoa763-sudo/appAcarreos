// src/components/stats/PieChartCard.js

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import ChartCard from "./ChartCard";
import { colors } from "../../config/colors";

const screenWidth = Dimensions.get("window").width;

/**
 * PieChartCard
 *
 * Gráfico de pastel con leyendas personalizadas
 * Muestra distribución porcentual de categorías
 */
const PieChartCard = ({
  title,
  icon,
  iconColor,
  subtitle,
  data = [],
  showPercentage = true,
  showValues = true,
}) => {
  const isEmpty = !data || data.length === 0;

  // Calcular total para porcentajes
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <ChartCard
      title={title}
      icon={icon}
      iconColor={iconColor}
      subtitle={subtitle}
      isEmpty={isEmpty}
      emptyMessage="No hay datos suficientes para mostrar"
    >
      {!isEmpty && (
        <View style={styles.chartWrapper}>
          <PieChart
            data={data}
            width={screenWidth - 80}
            height={200}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute={false}
            hasLegend={false}
            center={[(screenWidth - 80) / 4, 0]}
          />

          {/* Leyenda personalizada */}
          <View style={styles.legendContainer}>
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);

              return (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <View style={styles.legendTextContainer}>
                    <Text style={styles.legendName}>{item.name}</Text>
                    <View style={styles.legendValues}>
                      {showValues && (
                        <Text style={styles.legendValue}>
                          {item.value.toFixed(1)}
                        </Text>
                      )}
                      {showPercentage && (
                        <Text style={styles.legendPercentage}>
                          ({percentage}%)
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ChartCard>
  );
};

export default PieChartCard;

const styles = StyleSheet.create({
  legendContainer: {
    width: "100%",
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },
  legendValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  legendPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
