// 1. React y hooks
import React, { useState, useEffect } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";

// 3. Third party
import { CameraView } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 4. Local - Config
import { colors } from "../../config/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCANNER_SIZE = SCREEN_WIDTH * 0.7;

/**
 * QRScannerModal
 *
 * Modal con cámara para escanear códigos QR de vales
 *
 * PROPÓSITO:
 * - Mostrar vista de cámara en modal fullscreen
 * - Área de enfoque visual para el QR
 * - Animación de línea de escaneo
 * - Compatible con Samsung Galaxy (punch-hole, barra navegación)
 * - Compatible con iPhone notch e isla dinámica
 *
 * USADO EN:
 * - ValesScreen
 *
 * PROPS:
 * - visible: boolean
 * - scanning: boolean
 * - onBarCodeScanned: function
 * - onClose: function
 */
const QRScannerModal = ({ visible, scanning, onBarCodeScanned, onClose }) => {
  const [lineAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  // Altura dinámica del header según plataforma y safe area
  const headerPaddingTop = Platform.select({
    ios: insets.top + 12,
    android: (StatusBar.currentHeight || 24) + 12,
  });

  // Padding inferior dinámico para barra de navegación Samsung
  const footerPaddingBottom = Platform.select({
    ios: 30,
    android: 16 + insets.bottom,
  });

  // Animación de línea de escaneo
  useEffect(() => {
    if (!visible) return;

    lineAnim.setValue(0);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [visible]);

  const lineTranslateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Cámara fullscreen */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanning ? undefined : onBarCodeScanned}
        />

        {/* Overlay oscuro */}
        <View style={styles.overlay}>
          {/* Header con padding dinámico */}
          <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear Vale</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Instruccion superior */}
          <Text style={styles.instructionText}>
            Apunta la cámara al código QR del vale impreso
          </Text>

          {/* Área de escaneo */}
          <View style={styles.scannerWrapper}>
            <View style={styles.scannerFrame}>
              {/* Esquinas decorativas */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Línea animada de escaneo */}
              {!scanning && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: lineTranslateY }] },
                  ]}
                />
              )}

              {/* Estado: procesando */}
              {scanning && (
                <View style={styles.processingContainer}>
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={48}
                    color={colors.primary}
                  />
                  <Text style={styles.processingText}>Procesando...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer con padding dinámico */}
          <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
            <MaterialCommunityIcons
              name="qrcode"
              size={20}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.footerText}>
              El QR se encuentra en la parte inferior del vale PDF
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 44,
  },

  // Instrucciones
  instructionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: "100%",
  },

  // Scanner
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

  // Esquinas del marco
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },

  // Línea animada
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    opacity: 0.9,
  },

  // Procesando
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 30,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: "100%",
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
});

export default QRScannerModal;
