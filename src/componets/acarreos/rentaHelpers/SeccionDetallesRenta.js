/**
 * components/acarreos/rentaHelpers/SeccionDetallesRenta.js
 *
 * Sección "Detalles de Renta" del detalle del vale.
 * Muestra material, capacidad, tipo de renta, horas, días, viajes y notas.
 *
 * PROPS:
 * - vale: object — datos completos del vale
 * - detalleRenta: object — detalle específico de renta
 * - formatTime: function — formateador de horas
 * - formatDate: function — formateador de fechas
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import { rentaStyles as styles } from "./rentaStyles";
import InfoRow from "./InfoRow";

const SeccionDetallesRenta = ({
  vale,
  detalleRenta,
  formatTime,
  formatDate,
}) => {
  return (
    <View style={styles.section}>
      <View style={localStyles.tituloRow}>
        <Text style={styles.sectionTitle}>Detalles de Renta</Text>
        {detalleRenta?.es_turno_nocturno && (
          <View style={localStyles.badgeNocturno}>
            <MaterialCommunityIcons
              name="weather-night"
              size={12}
              color={colors.surface}
            />
            <Text style={localStyles.badgeNocturnoTexto}>Turno nocturno</Text>
          </View>
        )}
      </View>

      {detalleRenta.material?.material && (
        <InfoRow
          icon="package-variant"
          label="Material Movido"
          value={detalleRenta.material.material}
        />
      )}

      {(vale.vehiculos?.capacidad_m3 ?? detalleRenta.capacidad_m3) && (
        <InfoRow
          icon="truck-cargo-container"
          label="Capacidad"
          value={`${vale.vehiculos?.capacidad_m3 ?? detalleRenta.capacidad_m3} m³`}
        />
      )}

      {detalleRenta.es_renta_por_dia !== null &&
        vale.estado !== "en_proceso" && (
          <InfoRow
            icon="calendar-clock"
            label="Tipo de Renta"
            value={detalleRenta.es_renta_por_dia ? "Por día" : "Por hora"}
          />
        )}

      <InfoRow
        icon="clock-start"
        label="Hora Inicio"
        value={formatTime(detalleRenta.hora_inicio)}
      />

      {detalleRenta.hora_fin && (
        <InfoRow
          icon="clock-end"
          label="Hora Fin"
          value={formatTime(detalleRenta.hora_fin)}
        />
      )}

      {detalleRenta.total_horas > 0 && (
        <InfoRow
          icon="clock-outline"
          label="Total Horas"
          value={`${detalleRenta.total_horas} hrs`}
        />
      )}

      {detalleRenta.total_dias > 0 && (
        <InfoRow
          icon="calendar-check"
          label="Total Días"
          value={`${detalleRenta.total_dias} día(s)`}
        />
      )}

      {detalleRenta.numero_viajes && (
        <InfoRow
          icon="truck-check"
          label="Número de Viajes"
          value={detalleRenta.numero_viajes}
        />
      )}

      {vale.estado !== "en_proceso" && vale.fecha_completado && (
        <InfoRow
          icon="calendar-check"
          label="Emitido el"
          value={`${formatDate(vale.fecha_completado)} · ${formatTime(vale.fecha_completado)}`}
        />
      )}

      {detalleRenta.notas_adicionales && (
        <View style={styles.notasContainer}>
          <View style={styles.notasHeader}>
            <MaterialCommunityIcons
              name="note-text"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.notasLabel}>Notas Adicionales</Text>
          </View>
          <Text style={styles.notasText}>{detalleRenta.notas_adicionales}</Text>
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  badgeNocturno: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeNocturnoTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.surface,
  },
});

export default SeccionDetallesRenta;
