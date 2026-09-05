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

const ViajeRow = ({ viaje, ticket, esMaterialDescarga, materialDefault }) => {
  // Renta normal declara el material (y la carga) por viaje; el flujo viejo de
  // descarga (pipas) lo resuelve por ticket, y los vales viejos caen al
  // material fijo del vale completo.
  const matNombre =
    viaje.material?.material ||
    (esMaterialDescarga ? ticket?.material?.material : null) ||
    materialDefault ||
    null;
  const cargaTxt = viaje.carga_porcentaje ? `${viaje.carga_porcentaje}% carga` : null;
  // Renta normal guarda el banco en el propio viaje; el flujo viejo de
  // descarga (pipas) lo resuelve por ticket.
  const banco =
    viaje.banco_descarga || (esMaterialDescarga ? ticket?.banco_descarga : null) || null;
  const mostrarFilaSecundaria = !!matNombre || !!banco;

  return (
    <View style={styles.viajeRow}>
      <View style={styles.viajeNumeroContainer}>
        <Text style={styles.viajeNumero}>{viaje.numero_viaje}</Text>
      </View>

      <View style={styles.viajeContenido}>
        {/* Fila principal: hora + quién registró */}
        <View style={styles.viajeFilaPrincipal}>
          <View style={styles.viajeHoraContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text style={styles.viajeHora}>{formatHora(viaje.hora_registro)}</Text>
          </View>
          <Text style={styles.viajePersona} numberOfLines={1}>
            {viaje.persona?.nombre} {viaje.persona?.primer_apellido}
          </Text>
        </View>

        {/* Fila secundaria: material/carga (renta normal) o material/banco (descarga) */}
        {mostrarFilaSecundaria && (
          <View style={styles.viajeFilaDescarga}>
            <MaterialCommunityIcons
              name="package-variant"
              size={11}
              color={colors.accent}
            />
            <Text style={styles.viajeMaterial} numberOfLines={1}>
              {matNombre}
            </Text>
            {!!cargaTxt && (
              <>
                <Text style={styles.viajeSeparador}>·</Text>
                <Text style={styles.viajeBanco} numberOfLines={1}>
                  {cargaTxt}
                </Text>
              </>
            )}
            {banco && banco !== "—" && (
              <>
                <Text style={styles.viajeSeparador}>·</Text>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={11}
                  color={colors.textSecondary}
                />
                <Text style={styles.viajeBanco} numberOfLines={1}>
                  {banco}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const SeccionViajesCompletado = ({
  viajes = [],
  loading = false,
  totalViajes = 0,
  vale = null,
  detalleRenta = null,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!viajes || viajes.length === 0) return null;

  const esMaterialDescarga = detalleRenta?.material?.es_material_descarga === true;
  const materialDefault = detalleRenta?.material?.material || null;
  // Renta normal declara material por viaje (viaje.material); esMaterialDescarga
  // solo cubre el flujo viejo de descarga (pipas) — sin esto, la columna de
  // material no se mostraba nunca en vales de renta normal nuevos.
  const mostrarColumnaMaterial =
    esMaterialDescarga ||
    viajes.some((v) => v.material || v.carga_porcentaje || v.banco_descarga);

  // Mapa numero_ticket → ticket para cruzar con viajes
  const ticketMap = {};
  (vale?.tickets_descarga || []).forEach((t) => {
    ticketMap[t.numero_ticket] = t;
  });

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
          <View style={styles.colContenido}>
            <Text style={styles.tablaHeaderTexto}>Hora · Registrado por</Text>
            {mostrarColumnaMaterial && (
              <Text style={[styles.tablaHeaderTexto, { marginTop: 1 }]}>
                Material · Carga{esMaterialDescarga ? " · Banco" : ""}
              </Text>
            )}
          </View>
        </View>

        {viajes.map((viaje) => (
          <ViajeRow
            key={viaje.id_viaje}
            viaje={viaje}
            ticket={ticketMap[viaje.numero_viaje]}
            esMaterialDescarga={esMaterialDescarga}
            materialDefault={materialDefault}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTexto: {
    color: colors.surface,
    fontSize: 12,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  tablaHeaderTexto: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  colNumero: {
    width: 25,
    paddingTop: 1,
  },
  colContenido: {
    flex: 1,
  },
  viajeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viajeNumeroContainer: {
    width: 22,
    paddingTop: 1,
  },
  viajeNumero: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
  },
  viajeContenido: {
    flex: 1,
    gap: 3,
  },
  viajeFilaPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viajeHoraContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viajeHora: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  viajePersona: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
  },
  viajeFilaDescarga: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  viajeMaterial: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "600",
    flexShrink: 1,
  },
  viajeSeparador: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  viajeBanco: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});

export default SeccionViajesCompletado;
