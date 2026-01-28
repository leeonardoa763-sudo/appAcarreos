// src/components/stats/BarChartCard.js

import React from "react";
import { Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import ChartCard from "./ChartCard";
import { colors } from "../../config/colors";
import { statsColors } from "../../config/statsColors";

const screenWidth = Dimensions.get("window").width;

/**
 * BarChartCard
 *
 * Gráfico de barras para tendencias temporales
 * Muestra evolución de métricas en el tiempo
 */
const BarChartCard = ({
  title,
  icon,
  iconColor,
  subtitle,
  data = { labels: [], datasets: [{ data: [0] }] },
  yAxisSuffix = "",
  showValuesOnTopOfBars = true,
}) => {
  const isEmpty = !data || !data.labels || data.labels.length === 0;

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: colors.border,
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 10,
    },
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
        <BarChart
          data={data}
          width={screenWidth - 80}
          height={220}
          yAxisSuffix={yAxisSuffix}
          chartConfig={chartConfig}
          style={{
            borderRadius: 12,
          }}
          showValuesOnTopOfBars={showValuesOnTopOfBars}
          fromZero={true}
          segments={4}
        />
      )}
    </ChartCard>
  );
};

export default BarChartCard;
