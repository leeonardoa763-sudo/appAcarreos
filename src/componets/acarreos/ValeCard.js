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

  const formatPlacas = (placas) => {
    if (!placas) return "Pendiente";
    return placas.replace(/([A-Za-z]+)(\d+)([A-Za-z]*)/, "$1 $2 $3").trim();
  };

  const getMaterialInfo = () => {
    if (isMaterial && vale.vale_material_detalles?.length > 0) {
      const detalle = vale.vale_material_detalles[0];
      return {
        requisicion: detalle.requisicion || null,
        material: detalle.material?.material || "N/A",
        folioValeFisico: detalle.folio_vale_fisico || null,
      };
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
  const estadoActual = vale.estado;

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
        <Text>{vale.operadores?.nombre_completo || "Pendiente"}</Text>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons
          name="car"
          size={16}
          color={colors.textSecondary}
        />
        <Text>{formatPlacas(vale.vehiculos?.placas)}</Text>
      </View>
      {/* Mostrar persona que completó (solo si NO está en proceso) */}
      {vale.estado !== "en_proceso" && vale.persona_completador?.nombre && (
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="account-check"
            size={16}
            color={colors.accent}
          />
          <Text style={styles.completadorText}>
            {`${vale.persona_completador.nombre} ${vale.persona_completador.primer_apellido || ""} ${vale.persona_completador.segundo_apellido || ""}`.trim()}
          </Text>
        </View>
      )}

      {isMaterial && materialInfo && (
        <>
          <View style={styles.row}>
            <MaterialCommunityIcons
              name="package-variant"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>{materialInfo.material}</Text>
          </View>

          {/* Folio Vale Físico (solo si existe) */}
          {materialInfo.folioValeFisico && (
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Vale físico: {materialInfo.folioValeFisico}
              </Text>
            </View>
          )}
        </>
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
        <Text style={styles.dateText}>
          {isRenta
            ? `${formatDate(rentaInfo?.horaInicio ?? vale.fecha_creacion)} ${formatTime(rentaInfo?.horaInicio ?? vale.fecha_creacion)}`
            : `${formatDate(vale.fecha_creacion)} ${formatTime(vale.fecha_creacion)}`}
        </Text>
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
    padding: 10,
    marginBottom: 8,
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
    marginBottom: 8,
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
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
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
  completadorText: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "500",
  },
});
