// 1. React
import React from "react";

// 2. React Native
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../../config/colors";

const formatHora = (isoString) => {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ViajeRow = ({ viaje }) => (
  <View style={styles.viajeRow}>
    <View style={styles.viajeNumeroContainer}>
      <Text style={styles.viajeNumero}>{viaje.numero_viaje}</Text>
    </View>
    <View style={styles.viajeHoraContainer}>
      <MaterialCommunityIcons
        name="clock-outline"
        size={14}
        color={colors.textSecondary}
      />
      <Text style={styles.viajeHora}>{formatHora(viaje.hora_registro)}</Text>
    </View>
    <Text style={styles.viajePersona} numberOfLines={1}>
      {viaje.persona?.nombre} {viaje.persona?.primer_apellido}
    </Text>
  </View>
);

const SeccionViajesCompletado = ({
  viajes = [],
  loading = false,
  totalViajes = 0,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!viajes || viajes.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="truck-fast"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Viajes Registrados</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{totalViajes}</Text>
        </View>
      </View>

      <View style={styles.tabla}>
        <View style={styles.tablaHeader}>
          <Text style={[styles.tablaHeaderTexto, styles.colNumero]}>#</Text>
          <Text style={[styles.tablaHeaderTexto, styles.colHora]}>Hora</Text>
          <Text style={[styles.tablaHeaderTexto, styles.colPersona]}>
            Registrado por
          </Text>
        </View>

        {viajes.map((viaje) => (
          <ViajeRow key={viaje.id_viaje} viaje={viaje} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeTexto: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
  tabla: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F6FA",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tablaHeaderTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  colNumero: {
    width: 32,
  },
  colHora: {
    width: 90,
  },
  colPersona: {
    flex: 1,
  },
  viajeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viajeNumeroContainer: {
    width: 32,
    alignItems: "flex-start",
  },
  viajeNumero: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  viajeHoraContainer: {
    width: 90,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viajeHora: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  viajePersona: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default SeccionViajesCompletado;
