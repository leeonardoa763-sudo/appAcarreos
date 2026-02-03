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

  // Determinar color de las barras basado en el sufijo
  const getBarColor = (opacity = 1) => {
    // Si es m³, usar color azul cielo (material)
    if (yAxisSuffix.includes("m³")) {
      const baseColor = statsColors.gradients.material[0]; // #0984E3
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Si es horas, usar color turquesa (renta)
    if (yAxisSuffix.includes("h")) {
      const baseColor = statsColors.gradients.rental[0]; // #00B894
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Por defecto, usar color primario
    return `rgba(255, 107, 53, ${opacity})`;
  };

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#F8F9FA",
    decimalPlaces: 1,
    color: getBarColor,
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: "#E5E7EB",
      strokeWidth: 0.5,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: "600",
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
          height={240}
          yAxisSuffix={yAxisSuffix}
          chartConfig={chartConfig}
          style={{
            borderRadius: 12,
          }}
          showValuesOnTopOfBars={showValuesOnTopOfBars}
          fromZero={true}
          segments={5}
        />
      )}
    </ChartCard>
  );
};

export default BarChartCard;
