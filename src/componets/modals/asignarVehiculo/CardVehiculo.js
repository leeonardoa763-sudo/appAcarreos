import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import styles from "./asignarStyles";

const CardVehiculo = ({
  vehiculo,
  valesActivos,
  foliosActivos,
  onReScanear,
}) => {
  const operador =
    vehiculo.operador_sugerido?.nombre_completo ?? "Sin operador asignado";
  const hayOperador = !!vehiculo.operador_sugerido;

  return (
    <View style={styles.cardVehiculo}>
      {/* Encabezado */}
      <View style={styles.cardVehiculoHeader}>
        <View style={styles.cardVehiculoIcono}>
          <MaterialCommunityIcons
            name="dump-truck"
            size={32}
            color={colors.secondary}
          />
        </View>
        <View style={styles.cardVehiculoInfo}>
          <Text style={styles.cardVehiculoPlacas}>{vehiculo.placas}</Text>
          {vehiculo.capacidad_m3 && (
            <Text style={styles.cardVehiculoCapacidad}>
              {vehiculo.capacidad_m3} m³
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onReScanear} style={styles.cardRescanBtn}>
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={20}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Operador */}
      <View style={styles.cardVehiculoFila}>
        <MaterialCommunityIcons
          name="account-hard-hat"
          size={18}
          color={hayOperador ? colors.accent : colors.textSecondary}
        />
        <Text
          style={[
            styles.cardVehiculoOperador,
            !hayOperador && styles.sinOperador,
          ]}
        >
          {operador}
        </Text>
      </View>

      {/* Sindicato */}
      <View style={styles.cardVehiculoFila}>
        <MaterialCommunityIcons
          name="account-group"
          size={18}
          color={colors.secondary}
        />
        <Text style={styles.cardVehiculoOperador}>
          {vehiculo.sindicatos?.sindicato ?? "Sin sindicato"}
        </Text>
      </View>

      {/* Activos */}
      <View style={styles.cardVehiculoFila}>
        <MaterialCommunityIcons
          name="clipboard-list"
          size={18}
          color={valesActivos > 0 ? colors.warning : colors.textSecondary}
        />
        <Text style={styles.cardVehiculoActivos}>
          {valesActivos === 0
            ? "Sin vales activos"
            : `${valesActivos} vale${valesActivos > 1 ? "s" : ""} activo${valesActivos > 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Folios */}
      {foliosActivos.length > 0 && (
        <View style={styles.foliosActivosRow}>
          {foliosActivos.map((folio) => (
            <View key={folio} style={styles.folioBadge}>
              <Text style={styles.folioBadgeTexto}>{folio}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default CardVehiculo;
