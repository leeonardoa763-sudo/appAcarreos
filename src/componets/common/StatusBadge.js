/**
 * components/common/StatusBadge.js
 *
 * Badge visual para mostrar el estado de un vale
 *
 * PROPÓSITO:
 * - Mostrar estado del vale con color distintivo
 * - Reutilizable en tarjetas de vales (Material y Renta)
 * - Colores según estado: emitido, en_proceso, completado, etc.
 *
 * USADO EN:
 * - ValeCard (componente de tarjeta de vale)
 * - Cualquier pantalla que muestre estados
 *
 * PROPS:
 * - estado: string - Estado del vale ('emitido', 'en_proceso', 'completado', 'borrador', 'verificado', 'pagado')
 * - size: string - Tamaño del badge ('small' | 'medium' | 'large')
 *
 * EJEMPLO DE USO:
 * <StatusBadge estado="emitido" size="medium" />
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../config/colors";

const StatusBadge = ({ estado = "borrador", size = "medium" }) => {
  const getStatusConfig = () => {
    switch (estado.toLowerCase()) {
      case "emitido":
        return {
          backgroundColor: colors.accent,
          textColor: "#FFFFFF",
          label: "Emitido",
        };
      case "en_proceso":
        return {
          backgroundColor: "#FFA726",
          textColor: "#FFFFFF",
          label: "En proceso",
        };
      case "completado":
        return {
          backgroundColor: colors.accent,
          textColor: "#FFFFFF",
          label: "Completado",
        };
      case "borrador":
        return {
          backgroundColor: "#BDBDBD",
          textColor: "#FFFFFF",
          label: "Borrador",
        };
      case "verificado":
        return {
          backgroundColor: "#42A5F5",
          textColor: "#FFFFFF",
          label: "Verificado",
        };
      case "pagado":
        return {
          backgroundColor: "#66BB6A",
          textColor: "#FFFFFF",
          label: "Pagado",
        };
      default:
        return {
          backgroundColor: "#E0E0E0",
          textColor: colors.textSecondary,
          label: estado,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 8,
          paddingVertical: 3,
          fontSize: 11,
        };
      case "large":
        return {
          paddingHorizontal: 16,
          paddingVertical: 7,
          fontSize: 15,
        };
      case "medium":
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 5,
          fontSize: 13,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: config.textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontWeight: "600",
  },
});
