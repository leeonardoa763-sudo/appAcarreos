// src/components/stats/PieChartCard.js
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import ChartCard from "./ChartCard";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";

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
  valueFormatter = null,
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
            height={220}
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
                    <Text style={styles.legendName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.legendValues}>
                      {showValues && (
                        <Text style={styles.legendValue}>
                          {valueFormatter
                            ? valueFormatter(item.value, item.name)
                            : item.value.toFixed(1)}
                        </Text>
                      )}
                      {showPercentage && (
                        <View style={styles.percentageBadge}>
                          <Text style={styles.legendPercentage}>
                            {percentage}%
                          </Text>
                        </View>
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
  chartWrapper: {
    width: "100%",
    alignItems: "center",
  },
  legendContainer: {
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: statsColors.backgrounds.cardLight,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  legendValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  percentageBadge: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  legendPercentage: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
});
