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
 * TarjetaOperador
 *
 * Card individual de un operador con botón para compartir su QR en PDF.
 *
 * PROPS:
 * - operador: { id_operador, nombre_completo, qr_uid, placas, capacidad_m3 }
 * - onCompartirQR: (operador) => void
 * - compartiendo: boolean — muestra spinner mientras genera el PDF
 */
const TarjetaOperador = ({ operador, onCompartirQR, compartiendo }) => {
  const tieneQR = !!operador.qr_uid;
  const tieneVehiculo = !!operador.placas;

  return (
    <View style={styles.card}>
      {/* Icono + Datos */}
      <View style={styles.info}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name="account-hard-hat"
            size={26}
            color={colors.secondary}
          />
        </View>

        <View style={styles.textos}>
          <Text style={styles.nombre} numberOfLines={1}>
            {operador.nombre_completo}
          </Text>

          {tieneVehiculo ? (
            <View style={styles.vehiculoRow}>
              <MaterialCommunityIcons
                name="dump-truck"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.vehiculoTexto}>
                {operador.placas}
                {operador.capacidad_m3
                  ? `  •  ${operador.capacidad_m3} m³`
                  : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.sinVehiculo}>Sin vehículo asignado</Text>
          )}

          {!tieneQR && (
            <View style={styles.sinQRBadge}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={12}
                color={colors.warning}
              />
              <Text style={styles.sinQRTexto}>Sin QR generado</Text>
            </View>
          )}
        </View>
      </View>

      {/* Botón compartir */}
      <TouchableOpacity
        style={[
          styles.boton,
          (!tieneQR || compartiendo) && styles.botonDeshabilitado,
        ]}
        onPress={() => onCompartirQR(operador)}
        disabled={!tieneQR || compartiendo}
        activeOpacity={0.75}
      >
        {compartiendo ? (
          <ActivityIndicator size={18} color={colors.surface} />
        ) : (
          <MaterialCommunityIcons
            name="share-variant"
            size={18}
            color={tieneQR ? colors.surface : colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TarjetaOperador;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF0FB",
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  nombre: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  vehiculoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vehiculoTexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sinVehiculo: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  sinQRBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  sinQRTexto: {
    fontSize: 11,
    color: colors.warning,
  },
  boton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  botonDeshabilitado: {
    backgroundColor: colors.background,
  },
});
