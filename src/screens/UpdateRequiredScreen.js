/**
 * UpdateRequiredScreen.js
 *
 * Pantalla de actualización requerida
 *
 * PROPÓSITO:
 * - Bloquear acceso cuando la versión es obsoleta
 * - Mostrar información de versiones (actual vs requerida)
 * - Proporcionar link de descarga de nueva versión
 * - Impedir bypass (no hay botón "Continuar")
 *
 * PROPS:
 * - versionInfo: Objeto con información de versiones
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { formatVersion } from "../utils/versionChecker";

const UpdateRequiredScreen = ({ versionInfo }) => {
  const {
    currentVersion,
    minimumVersion,
    latestVersion,
    downloadUrl,
    message,
  } = versionInfo;

  /**
   * Abre el link de descarga del APK
   */
  const handleDownload = async () => {
    try {
      const canOpen = await Linking.canOpenURL(downloadUrl);

      if (canOpen) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert(
          "Error",
          "No se puede abrir el enlace de descarga. Por favor contacta a soporte.",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("[UpdateRequired] Error abriendo link:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir el enlace de descarga. Por favor contacta a soporte.",
        [{ text: "OK" }],
      );
    }
  };

  /**
   * Muestra información de contacto de soporte
   */
  const handleContactSupport = () => {
    Alert.alert(
      "Contactar Soporte",
      "Si tienes problemas para actualizar, contacta a:\n\nIng. Leonardo Aguilar Saucedo\nTeléfono: 492 145 2396",
      [{ text: "Entendido" }],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Icono principal */}
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={100}
          color={colors.warning}
        />
      </View>

      {/* Título */}
      <Text style={styles.title}>Actualización Requerida</Text>

      {/* Mensaje personalizado */}
      <Text style={styles.message}>{message}</Text>

      {/* Información de versiones */}
      <View style={styles.versionInfoContainer}>
        <View style={styles.versionRow}>
          <MaterialCommunityIcons
            name="cellphone"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.versionLabel}>Tu versión:</Text>
          <Text style={styles.versionValue}>
            {formatVersion(currentVersion)}
          </Text>
        </View>

        <View style={styles.versionRow}>
          <MaterialCommunityIcons
            name="shield-check"
            size={20}
            color={colors.accent}
          />
          <Text style={styles.versionLabel}>Versión mínima:</Text>
          <Text style={[styles.versionValue, styles.versionRequired]}>
            {formatVersion(minimumVersion)}
          </Text>
        </View>

        <View style={styles.versionRow}>
          <MaterialCommunityIcons
            name="star"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.versionLabel}>Última versión:</Text>
          <Text style={[styles.versionValue, styles.versionLatest]}>
            {formatVersion(latestVersion)}
          </Text>
        </View>
      </View>

      {/* Botón de descarga principal */}
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownload}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="download" size={24} color="#fff" />
        <Text style={styles.downloadButtonText}>Descargar Nueva Versión</Text>
      </TouchableOpacity>

      {/* Información adicional */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons
          name="information-outline"
          size={20}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          Después de descargar, instala el archivo APK y vuelve a abrir la
          aplicación.
        </Text>
      </View>

      {/* Botón de soporte */}
      <TouchableOpacity
        style={styles.supportButton}
        onPress={handleContactSupport}
      >
        <MaterialCommunityIcons
          name="help-circle-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.supportButtonText}>
          ¿Problemas para actualizar?
        </Text>
      </TouchableOpacity>

      {/* Footer con info del desarrollador */}
      <View style={styles.footer}>
        <View style={styles.developerRow}>
          <MaterialCommunityIcons
            name="account-hard-hat"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.developerText}>
            Ing. Leonardo Aguilar Saucedo
          </Text>
        </View>
        <View style={styles.developerRow}>
          <MaterialCommunityIcons
            name="phone"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.developerText}>492 145 2396</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  versionInfoContainer: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  versionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  versionRequired: {
    color: colors.warning,
  },
  versionLatest: {
    color: colors.accent,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3CD",
    padding: 16,
    borderRadius: 8,
    width: "100%",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#856404",
    marginLeft: 12,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 30,
  },
  supportButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: "100%",
  },
  developerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  developerText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
  },
});

export default UpdateRequiredScreen;
