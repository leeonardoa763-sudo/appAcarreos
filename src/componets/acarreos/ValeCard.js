/**
 * components/acarreos/ValeCard.js
 *
 * Tarjeta individual para mostrar información de un vale
 *
 * PROPÓSITO:
 * - Mostrar datos clave del vale en formato compacto
 * - Diferenciar visualmente entre Material y Renta
 * - Mostrar estado actual con StatusBadge
 * - Botón para abrir detalle completo
 *
 * USADO EN:
 * - AcarreosScreen (secciones de Material y Renta)
 *
 * PROPS:
 * - vale: object - Objeto completo del vale desde Supabase
 * - onPress: function - Callback al presionar la tarjeta o botón "Abrir"
 *
 * EJEMPLO DE USO:
 * <ValeCard
 *   vale={valeData}
 *   onPress={() => handleOpenVale(valeData)}
 * />
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import StatusBadge from "../common/StatusBadge";

const ValeCard = ({ vale, onPress }) => {
  const isMaterial = vale.tipo_vale === "material";
  const isRenta = vale.tipo_vale === "renta";

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Sin hora";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoVale = () => {
    if (isRenta) {
      const detalleRenta = vale.vale_renta_detalle?.[0];
      if (detalleRenta?.hora_fin) {
        return "completado";
      } else if (detalleRenta?.hora_inicio) {
        return "en_proceso";
      }
    }
    return vale.estado || "emitido";
  };

  const getMaterialInfo = () => {
    if (isMaterial && vale.vale_material_detalles?.length > 0) {
      const detalle = vale.vale_material_detalles[0];
      return detalle.cantidad_pedida_m3
        ? `${detalle.cantidad_pedida_m3} m³`
        : "Sin cantidad";
    }
    return null;
  };

  const getRentaInfo = () => {
    if (isRenta && vale.vale_renta_detalle?.length > 0) {
      const detalle = vale.vale_renta_detalle[0];
      return {
        horaInicio: detalle.hora_inicio,
        horaFin: detalle.hora_fin,
      };
    }
    return null;
  };

  const materialInfo = getMaterialInfo();
  const rentaInfo = getRentaInfo();
  const estadoActual = getEstadoVale();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isMaterial && styles.cardMaterial,
        isRenta && styles.cardRenta,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header con folio y estado */}
      <View style={styles.header}>
        <View style={styles.folioContainer}>
          <MaterialCommunityIcons
            name={isMaterial ? "package-variant" : "truck-cargo-container"}
            size={20}
            color={isMaterial ? colors.primary : colors.secondary}
          />
          <Text style={styles.folio}>{vale.folio}</Text>
        </View>
        <StatusBadge estado={estadoActual} size="small" />
      </View>

      {/* Información del operador */}
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="account-hard-hat"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>{vale.operador_nombre}</Text>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons
          name="car"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>{vale.placas_vehiculo}</Text>
      </View>

      {/* Información específica según tipo */}
      {isMaterial && materialInfo && (
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="cube-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText}>Cantidad: {materialInfo}</Text>
        </View>
      )}

      {isRenta && rentaInfo && (
        <>
          <View style={styles.row}>
            <MaterialCommunityIcons
              name="clock-start"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Inicio: {formatTime(rentaInfo.horaInicio)}
            </Text>
          </View>
          {rentaInfo.horaFin && (
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="clock-end"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Fin: {formatTime(rentaInfo.horaFin)}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Footer con fecha y botón */}
      <View style={styles.footer}>
        <Text style={styles.dateText}>{formatDate(vale.fecha_creacion)}</Text>
        <TouchableOpacity
          style={[
            styles.button,
            isMaterial && styles.buttonMaterial,
            isRenta && styles.buttonRenta,
          ]}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>Abrir</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ValeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMaterial: {
    borderLeftColor: colors.primary,
  },
  cardRenta: {
    borderLeftColor: colors.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  folioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  folio: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonMaterial: {
    backgroundColor: colors.primary,
  },
  buttonRenta: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
});
