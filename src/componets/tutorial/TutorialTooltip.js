// 1. React
import React from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

/**
 * TutorialTooltip
 *
 * Globo de texto del tutorial: título, texto, dots de progreso y
 * botones Omitir/Siguiente. Se posiciona arriba o abajo del hueco
 * del spotlight según el espacio disponible; si no hay hueco
 * (holeRect null) se centra en la pantalla.
 */

const TOOLTIP_ESTIMATED_HEIGHT = 210;
const SCREEN_MARGIN = 16;

/**
 * containerHeight: alto REAL del área donde vive el tutorial (la pantalla,
 * sin header ni tab bar) — no el alto total del dispositivo. Usar
 * Dimensions.get("window") aquí subestimaría cuánto espacio le quitan el
 * header y el tab bar, y la tarjeta terminaría cortada por el tab bar.
 */
const TutorialTooltip = ({
  step,
  stepIndex,
  totalSteps,
  holeRect,
  containerHeight,
  onNext,
  onSkip,
  hideNextButton,
  onArm,
}) => {
  const isLast = stepIndex === totalSteps - 1;

  let top = containerHeight * 0.42;
  if (holeRect) {
    const spaceBelow = containerHeight - (holeRect.y + holeRect.height);
    const placeBelow = spaceBelow >= TOOLTIP_ESTIMATED_HEIGHT + SCREEN_MARGIN;
    top = placeBelow
      ? holeRect.y + holeRect.height + SCREEN_MARGIN
      : holeRect.y - TOOLTIP_ESTIMATED_HEIGHT - SCREEN_MARGIN;
  }
  // Límite final: la tarjeta (con los botones Omitir/Siguiente) nunca debe
  // quedar fuera del área visible, sin importar qué tan abajo esté el botón real.
  top = Math.min(top, containerHeight - TOOLTIP_ESTIMATED_HEIGHT - SCREEN_MARGIN);
  top = Math.max(top, SCREEN_MARGIN);
  const positionStyle = { top };

  return (
    <View style={[styles.container, positionStyle]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcons name={step.icon} size={28} color={colors.primary} />
          <Text style={styles.title}>{step.title}</Text>
        </View>
        <Text style={styles.text}>{step.text}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
            {hideNextButton ? (
              <TouchableOpacity onPress={onArm} style={styles.nextButton} activeOpacity={0.85}>
                <Text style={styles.nextText}>Entendido, lo intento</Text>
                <MaterialCommunityIcons name="gesture-tap" size={18} color={colors.surface} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onNext} style={styles.nextButton} activeOpacity={0.85}>
                <Text style={styles.nextText}>{isLast ? "Entendido" : "Siguiente"}</Text>
                <MaterialCommunityIcons
                  name={isLast ? "check" : "arrow-right"}
                  size={18}
                  color={colors.surface}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "absolute", left: 16, right: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    elevation: 10,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  title: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, flexShrink: 1 },
  text: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 16 },
  actions: { flexDirection: "row", alignItems: "center", gap: 16 },
  skipButton: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { color: colors.textSecondary, fontSize: 14, fontWeight: "500" },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  nextText: { color: colors.surface, fontSize: 14, fontWeight: "600" },
});

export default TutorialTooltip;
