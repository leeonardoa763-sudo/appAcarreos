/**
 * components/acarreos/helpersMaterial/SeccionViajesMaterialCompletado.js
 *
 * Muestra los viajes registrados en un vale de MATERIAL completado.
 * Solo visible cuando el vale ya no está en_proceso.
 *
 * Columnas: # | Remisión | Ton | m³ | Hora
 *
 * PROPS:
 * - viajes: array — vale_material_viajes del detalle
 * - loading: boolean
 * - totalViajes: number
 * - esTipo3: boolean — tipo tepetate, no tiene peso en toneladas
 */

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatHora = (isoString) => {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatNum = (valor, decimales = 2) => {
  if (valor === null || valor === undefined) return "--";
  return parseFloat(valor).toFixed(decimales);
};

// ─── Fila de viaje ────────────────────────────────────────────────────────────

const ViajeRow = ({ viaje, esTipo3, esUltimo }) => (
  <View style={[styles.viajeRow, esUltimo && styles.viajeRowUltimo]}>
    <View style={styles.colNumero}>
      <Text style={styles.viajeNumero}>{viaje.numero_viaje}</Text>
    </View>
    <View style={styles.colRemision}>
      <Text style={styles.remisionTexto} numberOfLines={1}>
        {viaje.folio_vale_fisico || "--"}
      </Text>
    </View>
    {!esTipo3 && (
      <View style={styles.colTon}>
        <Text style={styles.metricTexto}>{formatNum(viaje.peso_ton)}</Text>
      </View>
    )}
    <View style={styles.colM3}>
      <Text style={styles.m3Texto}>{formatNum(viaje.volumen_m3)}</Text>
    </View>
    <View style={styles.colHora}>
      <Text style={styles.horaTexto}>{formatHora(viaje.hora_registro)}</Text>
    </View>
  </View>
);

// ─── Fila de totales ──────────────────────────────────────────────────────────

const FilaTotales = ({ viajes, esTipo3 }) => {
  const totalM3 = viajes.reduce(
    (acc, v) => acc + parseFloat(v.volumen_m3 || 0),
    0,
  );
  const totalTon = !esTipo3
    ? viajes.reduce((acc, v) => acc + parseFloat(v.peso_ton || 0), 0)
    : null;

  return (
    <View style={styles.filaTotales}>
      <View style={styles.colNumero} />
      <View style={styles.colRemision}>
        <Text style={styles.totalesLabel}>{viajes.length} viajes</Text>
      </View>
      {!esTipo3 && (
        <View style={styles.colTon}>
          <Text style={styles.totalesValor}>{totalTon.toFixed(2)}</Text>
        </View>
      )}
      <View style={styles.colM3}>
        <Text style={styles.totalesValor}>{totalM3.toFixed(2)}</Text>
      </View>
      <View style={styles.colHora} />
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const SeccionViajesMaterialCompletado = ({
  viajes = [],
  loading = false,
  totalViajes = 0,
  esTipo3 = false,
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
      {/* Header */}
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

      {/* Tabla */}
      <View style={styles.tabla}>
        {/* Encabezado */}
        <View style={styles.tablaHeader}>
          <View style={styles.colNumero}>
            <Text style={styles.tablaHeaderTexto}>#</Text>
          </View>
          <View style={styles.colRemision}>
            <Text style={styles.tablaHeaderTexto}>Remision</Text>
          </View>
          {!esTipo3 && (
            <View style={styles.colTon}>
              <Text style={styles.tablaHeaderTexto}>Ton</Text>
            </View>
          )}
          <View style={styles.colM3}>
            <Text style={styles.tablaHeaderTexto}>m³</Text>
          </View>
          <View style={styles.colHora}>
            <Text style={styles.tablaHeaderTexto}>Hora</Text>
          </View>
        </View>

        {/* Filas */}
        {viajes.map((viaje, index) => (
          <ViajeRow
            key={viaje.id_viaje}
            viaje={viaje}
            esTipo3={esTipo3}
            esUltimo={index === viajes.length - 1}
          />
        ))}

        {/* Totales */}
        <FilaTotales viajes={viajes} esTipo3={esTipo3} />
      </View>
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
    minWidth: 24,
    alignItems: "center",
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
    paddingHorizontal: 10,
    alignItems: "center",
  },
  tablaHeaderTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  viajeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viajeRowUltimo: {
    borderBottomWidth: 0,
  },
  filaTotales: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F5F6FA",
    borderTopWidth: 1,
    borderTopColor: "#D0D5DD",
  },
  // ─── Columnas ───────────────────────────────────────────────────────────────
  colNumero: {
    width: 24,
    alignItems: "center",
  },
  colRemision: {
    flex: 1,
    paddingRight: 4,
  },
  colTon: {
    width: 52,
    alignItems: "flex-end",
    paddingRight: 4,
  },
  colM3: {
    width: 52,
    alignItems: "flex-end",
    paddingRight: 4,
  },
  colHora: {
    width: 60,
    alignItems: "flex-end",
  },
  // ─── Textos ─────────────────────────────────────────────────────────────────
  viajeNumero: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  remisionTexto: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "500",
  },
  metricTexto: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  m3Texto: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  horaTexto: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  totalesLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  totalesValor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});

export default SeccionViajesMaterialCompletado;
