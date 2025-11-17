/**
 * components/common/SuccessModal.js
 *
 * Modal de éxito personalizado con acciones
 *
 * PROPÓSITO:
 * - Reemplazar Alert nativo con diseño profesional
 * - Mostrar mensaje de éxito con acciones personalizadas
 * - Reutilizable en todo el sistema
 *
 * PROPS:
 * - visible: boolean
 * - title: string
 * - message: string
 * - primaryAction: { text, onPress, icon }
 * - secondaryAction: { text, onPress } (opcional)
 * - onClose: function
 */

import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const SuccessModal = ({
  visible,
  title,
  message,
  primaryAction,
  secondaryAction,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={64}
              color={colors.accent}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={primaryAction.onPress}
            >
              {primaryAction.icon && (
                <MaterialCommunityIcons
                  name={primaryAction.icon}
                  size={20}
                  color={colors.surface}
                  style={styles.buttonIcon}
                />
              )}
              <Text style={styles.primaryButtonText}>{primaryAction.text}</Text>
            </TouchableOpacity>

            {secondaryAction && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryAction.onPress}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryAction.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.background,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
});
