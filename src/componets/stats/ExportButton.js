// src/components/stats/ExportButton.js

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import * as Haptics from "expo-haptics";

/**
 * ExportButton
 *
 * Botón flotante para exportar captura de pantalla
 * Con animación y feedback háptico
 */
const ExportButton = ({ onPress, loading = false, disabled = false }) => {
  const handlePress = async () => {
    if (disabled || loading) return;

    // Feedback háptico
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
    }

    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        (disabled || loading) && styles.containerDisabled,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      <View style={styles.content}>
        {loading ? (
          <>
            <ActivityIndicator size="small" color={colors.surface} />
            <Text style={styles.text}>Capturando...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons
              name="camera"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.text}>Compartir</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ExportButton;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  containerDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});
