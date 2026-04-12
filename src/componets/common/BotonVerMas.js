// src/componets/common/BotonVerMas.js
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

/**
 * BotonVerMas
 *
 * Botón al pie de una sección paginada.
 * Muestra cuántos items quedan por cargar.
 *
 * PROPS:
 * - onPress: función para cargar más
 * - totalMostrados: cuántos se muestran ahora
 * - total: total real de la sección
 */
const BotonVerMas = ({ onPress, totalMostrados, total }) => {
  const restantes = total - totalMostrados;

  return (
    <TouchableOpacity
      style={styles.boton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="chevron-double-down"
        size={18}
        color={colors.secondary}
      />
      <Text style={styles.texto}>
        Ver {Math.min(restantes, 20)} más{" "}
        <Text style={styles.subtexto}>({restantes} pendientes)</Text>
      </Text>
    </TouchableOpacity>
  );
};

export default BotonVerMas;

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderStyle: "dashed",
    gap: 8,
  },
  texto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
  },
  subtexto: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textSecondary,
  },
});
