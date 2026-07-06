// 1. React y hooks nativos
import React, { useState, useEffect, useMemo } from "react";

// 2. React Native
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

// 5. Servicio (función pura, sin Bluetooth ni Supabase)
import { generarTicketMaterial } from "../../services/ticketGenerator";

/**
 * TutorialTicketPreview
 *
 * Simula el flujo de impresión (buscando -> conectando -> imprimiendo ->
 * listo) con temporizadores, sin tocar bluetoothPrinter.js ni hardware
 * real. Al terminar, muestra la vista previa del ticket generado con la
 * función pura generarTicketMaterial(vale).
 *
 * PROPS:
 * - vale: vale ficticio (src/config/tutorialFakeData.js)
 * - onFinalizar: se llama al presionar "Finalizar"
 */

const FASES = [
  { key: "buscando", texto: "Buscando impresora...", delay: 0 },
  { key: "conectando", texto: "Conectando...", delay: 700 },
  { key: "imprimiendo", texto: "Imprimiendo...", delay: 1400 },
  { key: "listo", texto: "", delay: 2200 },
];

const alignToStyle = (align) => {
  if (align === "center") return "center";
  if (align === "right") return "right";
  return "left";
};

const TutorialTicketPreview = ({ vale, onFinalizar }) => {
  const [fase, setFase] = useState("buscando");

  useEffect(() => {
    const timers = FASES.map((f) => setTimeout(() => setFase(f.key), f.delay));
    return () => timers.forEach(clearTimeout);
  }, []);

  const lineas = useMemo(() => generarTicketMaterial(vale), [vale]);

  if (fase !== "listo") {
    const faseActual = FASES.find((f) => f.key === fase);
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{faseActual?.texto}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.rollo}>
          {lineas.map((linea, index) => {
            if (linea.tipo === "separador") {
              return <Text key={index} style={styles.rolloSeparador}>--------------------------------</Text>;
            }
            if (linea.tipo === "qr") {
              return (
                <View key={index} style={styles.rolloQr}>
                  <MaterialCommunityIcons name="qrcode" size={80} color={colors.textPrimary} />
                  <Text style={styles.rolloQrUrl}>{linea.contenido}</Text>
                </View>
              );
            }
            return (
              <Text
                key={index}
                style={[
                  styles.rolloTexto,
                  { textAlign: alignToStyle(linea.opciones?.align) },
                  linea.opciones?.bold && styles.rolloTextoBold,
                ]}
              >
                {linea.contenido}
              </Text>
            );
          })}
        </View>

        <View style={styles.successBanner}>
          <MaterialCommunityIcons name="truck-check" size={32} color={colors.success} />
          <Text style={styles.successText}>El camión ya puede salir a su primer viaje</Text>
        </View>

        <TouchableOpacity style={styles.finalizarButton} onPress={onFinalizar} activeOpacity={0.85}>
          <Text style={styles.finalizarButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  rollo: {
    backgroundColor: "#FFFEF0",
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  rolloTexto: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#1A1A1A",
  },
  rolloTextoBold: {
    fontWeight: "700",
  },
  rolloSeparador: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#1A1A1A",
    textAlign: "center",
  },
  rolloQr: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  rolloQrUrl: {
    fontFamily: "monospace",
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  finalizarButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  finalizarButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TutorialTicketPreview;
