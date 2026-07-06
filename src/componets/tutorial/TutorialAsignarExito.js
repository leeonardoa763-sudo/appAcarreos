// 1. React
import React from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

/**
 * TutorialAsignarExito
 *
 * Pantalla de éxito simulado tras "asignar" el vehículo ficticio.
 *
 * PROPS:
 * - onContinuar: navega (de verdad) a la pestaña Acarreos
 */
const TutorialAsignarExito = ({ onContinuar }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MaterialCommunityIcons name="check-circle" size={72} color={colors.success} />
        <Text style={styles.title}>Vehículo asignado</Text>
        <Text style={styles.subtitle}>Serás redirigido a Acarreos para ver el vale</Text>

        <TouchableOpacity style={styles.button} onPress={onContinuar} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Ver en Acarreos</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TutorialAsignarExito;
