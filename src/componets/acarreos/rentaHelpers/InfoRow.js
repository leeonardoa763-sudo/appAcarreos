/**
 * components/acarreos/rentaHelpers/InfoRow.js
 *
 * Fila de información con ícono, etiqueta y valor.
 * Componente visual reutilizable en todas las secciones del detalle de renta.
 *
 * PROPS:
 * - icon: string — nombre del ícono MaterialCommunityIcons
 * - label: string — etiqueta descriptiva
 * - value: string | number — valor a mostrar
 */

import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import { rentaStyles as styles } from "./rentaStyles";

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={colors.textSecondary}
      />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <Text style={styles.valueText}>{value}</Text>
  </View>
);

export default InfoRow;
