// src/componets/common/PresupuestoIndicator.js
//
// Indicador visual de presupuesto disponible.
// Muestra barra de progreso, porcentaje y monto/m3 disponibles.
// Reutilizable para material (m3) y renta (pesos).
//
// PROPS:
//   label       string   - Nombre del material u "Renta de equipo"
//   disponible  number   - Cantidad disponible (m3 o pesos)
//   presupuesto number   - Total presupuestado
//   porcentaje  number   - % consumido (0-100)
//   nivel       string   - 'ok' | 'warning' | 'danger' | 'blocked'
//   tipo        string   - 'material' | 'renta'
//
// USADO EN:
//   ValeMaterialScreen, ValeRentaScreen

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// Colores y configuración por nivel de alerta
const NIVEL_CONFIG = {
  ok: {
    color: colors.accent,
    icon: "check-circle-outline",
    label: "Disponible",
  },
  warning: {
    color: colors.warning,
    icon: "alert-circle-outline",
    label: "Poco disponible",
  },
  danger: {
    color: colors.danger,
    icon: "alert-outline",
    label: "Casi agotado",
  },
  blocked: { color: colors.danger, icon: "cancel", label: "Sin presupuesto" },
};

// Formatea el valor según tipo
const formatearValor = (valor, tipo) => {
  if (tipo === "renta") {
    return `$${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
  }
  return `${Number(valor).toFixed(1)} m³`;
};

const PresupuestoIndicator = ({
  label,
  disponible,
  presupuesto,
  consumidos,
  porcentaje,
  nivel = "ok",
  tipo = "material",
  sinConfigurar = false,
}) => {
  const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.ok;
  const barWidth = `${Math.min(100, porcentaje)}%`;

  // Sin presupuesto configurado
  if (sinConfigurar) {
    return (
      <View style={styles.sinConfigurarContainer}>
        <MaterialCommunityIcons
          name="information-outline"
          size={15}
          color={colors.textSecondary}
        />
        <Text style={styles.sinConfigurarText}>
          Sin presupuesto configurado para{" "}
          <Text style={styles.sinConfigurarLabel}>{label}</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      {/* Encabezado */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={tipo === "renta" ? "crane" : "truck"}
          size={16}
          color={config.color}
        />
        <Text style={styles.labelText} numberOfLines={1}>
          {label}
        </Text>
        <View
          style={[styles.nivelBadge, { backgroundColor: config.color + "20" }]}
        >
          <MaterialCommunityIcons
            name={config.icon}
            size={13}
            color={config.color}
          />
          <Text style={[styles.nivelText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.barraFondo}>
        <View
          style={[
            styles.barraRelleno,
            { width: barWidth, backgroundColor: config.color },
          ]}
        />
      </View>

      {/* Datos numéricos */}
      <View style={styles.datosRow}>
        <Text style={styles.disponibleText}>
          Disponible:{" "}
          <Text style={[styles.disponibleValor, { color: config.color }]}>
            {formatearValor(disponible, tipo)}
          </Text>
        </Text>
        <Text style={styles.porcentajeText}>
          {Math.round(porcentaje)}% usado
        </Text>
      </View>

      {/* Mensaje de bloqueo */}
      {nivel === "blocked" && (
        <View style={styles.bloqueadoContainer}>
          <Text style={styles.mensajeBloqueo}>
            Presupuesto agotado. Contacta al administrador para ampliarlo.
          </Text>
          <View style={styles.bloqueadoDetalle}>
            <Text style={styles.bloqueadoItem}>
              Usado:{" "}
              <Text style={styles.bloqueadoValor}>
                {formatearValor(consumidos ?? presupuesto, tipo)}
              </Text>
            </Text>
            <Text style={styles.bloqueadoSeparador}>|</Text>
            <Text style={styles.bloqueadoItem}>
              Presupuesto:{" "}
              <Text style={styles.bloqueadoValor}>
                {formatearValor(presupuesto, tipo)}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PresupuestoIndicator;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 12,
    marginVertical: 8,
    elevation: 1,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  labelText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  nivelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  nivelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  barraFondo: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  barraRelleno: {
    height: 6,
    borderRadius: 3,
  },
  datosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disponibleText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  disponibleValor: {
    fontWeight: "700",
  },
  porcentajeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mensajeBloqueo: {
    marginTop: 6,
    fontSize: 12,
    color: colors.danger,
    fontStyle: "italic",
  },
  sinConfigurarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  sinConfigurarText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  sinConfigurarLabel: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bloqueadoContainer: {
    marginTop: 6,
    gap: 4,
  },
  bloqueadoDetalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bloqueadoItem: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bloqueadoValor: {
    fontWeight: "700",
    color: colors.danger,
  },
  bloqueadoSeparador: {
    fontSize: 12,
    color: colors.border,
  },
});
