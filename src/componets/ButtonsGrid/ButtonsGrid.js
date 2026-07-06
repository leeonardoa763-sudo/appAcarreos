// 1. React
import React from "react";

// 2. React Native
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";

/**
 * ButtonsGrid
 *
 * Grid de botones para ValesScreen
 *
 * ESTRUCTURA:
 * - Botones con isMain: true  → card alargada (full width)
 * - Botones sin isMain        → cards secundarias en fila de 2
 *
 * PROPS:
 * - buttons: array de { onPress, iconName, buttonText, subtitle, backgroundColor, isMain, loading, tutorialId }
 * - registerRef: opcional, función (tutorialId) => ref, para que el tutorial guiado
 *   pueda medir la posición real de un botón. Si un botón no trae tutorialId, o no
 *   se pasa registerRef, el comportamiento es idéntico al de siempre.
 */
const ButtonsGrid = ({ buttons, registerRef }) => {
  const mainButtons = buttons.filter((b) => b.isMain);
  const secondaryButtons = buttons.filter((b) => !b.isMain);

  return (
    <View style={styles.container}>
      {/* Título de sección */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="target"
          size={24}
          color={colors.primary}
        />
        <Text style={styles.sectionTitle}>Acciones Principales</Text>
      </View>

      {/* CARDS PRINCIPALES - alargadas */}
      {mainButtons.map((button, index) => (
        <TouchableOpacity
          key={index}
          ref={button.tutorialId && registerRef ? registerRef(button.tutorialId) : undefined}
          style={[styles.mainCard, { backgroundColor: button.backgroundColor }]}
          onPress={button.onPress}
          activeOpacity={0.8}
          disabled={button.loading}
        >
          <View style={styles.mainCardContent}>
            {button.loading ? (
              <ActivityIndicator size={40} color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons
                name={button.iconName}
                size={48}
                color="#FFFFFF"
              />
            )}
            <View style={styles.mainCardText}>
              <Text style={styles.mainCardTitle}>{button.buttonText}</Text>
              <Text style={styles.mainCardSubtitle}>{button.subtitle}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={32}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </TouchableOpacity>
      ))}

      {/* CARDS SECUNDARIAS - fila de 2 */}
      {secondaryButtons.length > 0 && (
        <View style={styles.secondaryRow}>
          {secondaryButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.secondaryCard,
                { backgroundColor: button.backgroundColor },
              ]}
              onPress={button.onPress}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={button.iconName}
                size={40}
                color="#FFFFFF"
              />
              <Text style={styles.secondaryCardTitle}>{button.buttonText}</Text>
              <Text style={styles.secondaryCardSubtitle}>
                {button.subtitle}
              </Text>
              <View style={styles.secondaryCardButton}>
                <Text style={styles.secondaryCardButtonText}>Ver</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 8,
  },

  // Main Cards
  mainCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  mainCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainCardText: {
    flex: 1,
    marginLeft: 16,
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },

  // Secondary Cards
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minHeight: 160,
    justifyContent: "space-between",
  },
  secondaryCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 10,
    textAlign: "center",
  },
  secondaryCardSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    textAlign: "center",
  },
  secondaryCardButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  secondaryCardButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 4,
  },
});

export default ButtonsGrid;
