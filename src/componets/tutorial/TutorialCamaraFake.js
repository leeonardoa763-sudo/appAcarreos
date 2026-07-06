// 1. React y hooks nativos
import React, { useState, useEffect } from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

/**
 * TutorialCamaraFake
 *
 * Imita el viewfinder de QRScannerModal.js (marco con esquinas + línea
 * animada) pero SIN montar <CameraView> ni pedir permiso real de cámara —
 * es un fondo sólido oscuro. Auto-detecta un QR ficticio a los ~1.5s.
 *
 * PROPS:
 * - onDetectado: se llama automáticamente tras el auto-escaneo
 * - onCancelar: cierra el flujo del tutorial
 */

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCANNER_SIZE = SCREEN_WIDTH * 0.7;
const AUTO_DETECT_MS = 1500;

const TutorialCamaraFake = ({ onDetectado, onCancelar }) => {
  const [lineAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    lineAnim.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(lineAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    animation.start();

    const timer = setTimeout(() => {
      onDetectado?.();
    }, AUTO_DETECT_MS);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, []);

  const lineTranslateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancelar} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simulación: Escanear Vehículo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.instructionText}>
        Así se ve al apuntar la cámara al código QR del vehículo
      </Text>

      <View style={styles.scannerWrapper}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: lineTranslateY }] }]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons name="qrcode" size={20} color="rgba(255,255,255,0.7)" />
        <Text style={styles.footerText}>Buscando código QR...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSpacer: { width: 44 },
  instructionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  scannerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  cornerTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    opacity: 0.9,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
});

export default TutorialCamaraFake;
