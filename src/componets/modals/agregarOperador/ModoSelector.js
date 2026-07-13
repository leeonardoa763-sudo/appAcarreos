// 1. React
import React from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../../config/colors";

/**
 * ModoSelector
 *
 * Segmentado para elegir qué se va a registrar: un operador o una placa.
 *
 * PROPS:
 * - modo: "operador" | "placa"
 * - onCambiar: (modo) => void
 * - disabled: boolean
 */
const OPCIONES = [
  { valor: "operador", label: "Operador", icono: "account-hard-hat" },
  { valor: "placa", label: "Placa", icono: "dump-truck" },
];

const ModoSelector = ({ modo, onCambiar, disabled }) => {
  return (
    <View style={styles.contenedor}>
      {OPCIONES.map((op) => {
        const activo = modo === op.valor;
        return (
          <TouchableOpacity
            key={op.valor}
            style={[styles.opcion, activo && styles.opcionActiva]}
            onPress={() => onCambiar(op.valor)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={op.icono}
              size={18}
              color={activo ? colors.surface : colors.textSecondary}
            />
            <Text style={[styles.texto, activo && styles.textoActivo]}>
              {op.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ModoSelector;

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginHorizontal: 20,
    marginTop: 16,
  },
  opcion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  opcionActiva: {
    backgroundColor: colors.secondary,
  },
  texto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  textoActivo: {
    color: colors.surface,
  },
});
