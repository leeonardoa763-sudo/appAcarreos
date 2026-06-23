import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const formatHora = (isoString) => {
  if (!isoString) return "--:--";
  const fecha = new Date(isoString);
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ViajeItem = ({ viaje }) => (
  <View style={styles.viajeItem}>
    <View style={styles.viajeIcono}>
      <MaterialCommunityIcons
        name="truck-check"
        size={16}
        color={colors.accent}
      />
    </View>
    <View style={styles.viajeInfo}>
      <Text style={styles.viajeNumero}>Viaje {viaje.numero_viaje}</Text>
      <Text style={styles.viajeHora}>{formatHora(viaje.hora_registro)}</Text>
    </View>
    <Text style={styles.viajePersona}>
      {viaje.persona?.nombre} {viaje.persona?.primer_apellido}
    </Text>
  </View>
);

const ViajesRentaSection = ({
  viajes,
  loading,
  registrando,
  puedeRegistrar,
  totalViajes,
  onRegistrarViaje,
  esResidente = false,
  esChecador = false,
  onEliminarUltimoViaje,
  eliminandoViaje = false,
  totalTickets = 0,
  esMaterialDescarga = false,
}) => {
  const tieneTicketPendiente = !esMaterialDescarga || totalTickets > totalViajes;
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

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <>
          {viajes.length === 0 ? (
            <View style={styles.sinViajes}>
              <MaterialCommunityIcons
                name="truck-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.sinViajesTexto}>Sin viajes registrados</Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {viajes.map((viaje) => (
                <ViajeItem key={viaje.id_viaje} viaje={viaje} />
              ))}
            </View>
          )}

          {(esResidente || esChecador) && totalViajes > 0 && (
            <TouchableOpacity
              style={[styles.botonEliminarViaje, eliminandoViaje && styles.botonDeshabilitado]}
              onPress={() => {
                const ultimoViaje = viajes[viajes.length - 1];
                Alert.alert(
                  "Eliminar Viaje",
                  `¿Eliminar el Viaje #${totalViajes}? Esta accion no se puede deshacer.`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: () => onEliminarUltimoViaje?.(ultimoViaje.id_viaje),
                    },
                  ],
                );
              }}
              disabled={eliminandoViaje}
              activeOpacity={0.7}
            >
              {eliminandoViaje ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="delete-circle-outline"
                    size={18}
                    color={colors.danger}
                  />
                  <Text style={styles.botonEliminarViajeTexto}>
                    Eliminar Viaje #{totalViajes}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.botonRegistrar,
              (!puedeRegistrar || !tieneTicketPendiente || registrando) && styles.botonDeshabilitado,
            ]}
            onPress={onRegistrarViaje}
            disabled={!puedeRegistrar || !tieneTicketPendiente || registrando}
            activeOpacity={0.8}
          >
            {registrando ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={20}
                  color={(puedeRegistrar && tieneTicketPendiente) ? colors.surface : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.botonTexto,
                    (!puedeRegistrar || !tieneTicketPendiente) && styles.botonTextoDeshabilitado,
                  ]}
                >
                  {totalViajes === 0
                    ? "Registrar Primer Viaje"
                    : `Registrar Viaje ${totalViajes + 1}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {esMaterialDescarga && !tieneTicketPendiente && (
            <Text style={styles.avisoTicket}>
              Imprime el ticket antes de registrar el siguiente viaje
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8EAF0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  badgeTexto: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  loader: {
    paddingVertical: 20,
  },
  sinViajes: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  sinViajesTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lista: {
    marginBottom: 12,
    gap: 6,
  },
  viajeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  viajeIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  viajeInfo: {
    flex: 1,
  },
  viajeNumero: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  viajeHora: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  viajePersona: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 110,
    textAlign: "right",
  },
  botonRegistrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  botonDeshabilitado: {
    backgroundColor: "#E8EAF0",
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },
  botonTextoDeshabilitado: {
    color: colors.textSecondary,
  },
  avisoTicket: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  botonEliminarViaje: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 6,
  },
  botonEliminarViajeTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
});

export default ViajesRentaSection;
