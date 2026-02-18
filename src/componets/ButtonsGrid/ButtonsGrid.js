import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const ButtonsGrid = ({ buttons }) => {
  // Separar el botón principal (Crear Vale) de los secundarios
  const [mainButton, ...secondaryButtons] = buttons;

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

      {/* CARD PRINCIPAL - Crear Vale */}
      <TouchableOpacity
        style={[
          styles.mainCard,
          { backgroundColor: mainButton.backgroundColor },
        ]}
        onPress={mainButton.onPress}
        activeOpacity={0.8}
      >
        <View style={styles.mainCardContent}>
          <MaterialCommunityIcons
            name={mainButton.iconName}
            size={64}
            color="#FFFFFF"
          />
          <View style={styles.mainCardText}>
            <Text style={styles.mainCardTitle}>{mainButton.buttonText}</Text>
            <Text style={styles.mainCardSubtitle}>Material o Renta</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={32}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      {/* CARDS SECUNDARIAS - Archivados y Tarifas */}
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
              size={48}
              color="#FFFFFF"
            />
            <Text style={styles.secondaryCardTitle}>{button.buttonText}</Text>
            <Text style={styles.secondaryCardSubtitle}>
              {button.subtitle || getSubtitle(button.buttonText)}
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
    </View>
  );
};

// Función helper para subtítulos por defecto
const getSubtitle = (buttonText) => {
  const subtitles = {
    Archivados: "Ver histórico",
    Tarifas: "Consultar precios",
  };
  return subtitles[buttonText] || "Ver detalles";
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

  // Main Card (Crear Vale)
  mainCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  mainCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mainCardText: {
    flex: 1,
    marginLeft: 16,
  },
  mainCardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },

  // Secondary Cards Row
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minHeight: 180,
    justifyContent: "space-between",
  },
  secondaryCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    textAlign: "center",
  },
  secondaryCardSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.85,
    marginTop: 4,
    textAlign: "center",
  },
  secondaryCardButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
