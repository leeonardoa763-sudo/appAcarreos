// 1. React
import React from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

/**
 * TutorialHelpButton
 *
 * Botón flotante "?" que activa el tutorial guiado manualmente.
 * Genérico y reutilizable por cualquier rol/pantalla: no sabe nada
 * del contenido del tour, solo dispara onPress.
 *
 * PROPS:
 * - onPress: función que inicia el tutorial
 * - showLabel: si se muestra la burbuja "¿Eres nuevo en la app?"
 */
const TutorialHelpButton = ({ onPress, showLabel = true }) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {showLabel && (
        <TouchableOpacity onPress={onPress} style={styles.labelBubble} activeOpacity={0.8}>
          <Text style={styles.labelText}>¿Eres nuevo en la app?</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.85}>
        <MaterialCommunityIcons name="help-circle" size={30} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 20,
    alignItems: "flex-end",
    zIndex: 500,
    elevation: 500,
  },
  labelBubble: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    elevation: 4,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  labelText: { fontSize: 12, color: colors.textPrimary, fontWeight: "500" },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});

export default TutorialHelpButton;
