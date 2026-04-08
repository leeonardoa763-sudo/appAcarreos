/**
 * components/acarreos/helpersMaterial/SeccionViajesMaterialCompletado.js
 *
 * Muestra los viajes registrados en un vale de MATERIAL completado.
 * Solo visible cuando el vale ya no está en_proceso.
 *
 * Columnas: # | Banco | m³ | Precio | Hora
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
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

const formatCosto = (valor) => {
  if (valor === null || valor === undefined) return "--";
  return `$${parseFloat(valor).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ─── Helpers para resolver valores reales del viaje ──────────────────────────

const getBancoNombre = (viaje, bancoDefault) => {
  if (viaje.banco_override?.banco) return viaje.banco_override.banco;
  return bancoDefault || "--";
};

const getPrecioM3Real = (viaje) => {
  return viaje.precio_m3_override ?? viaje.precio_m3;
};

const getCostoViajeReal = (viaje) => {
  return viaje.costo_viaje_override ?? viaje.costo_viaje;
};

const tieneOverride = (viaje) => !!viaje.id_banco_override;

// ─── Fila de viaje ────────────────────────────────────────────────────────────

const ViajeRow = ({ viaje, esTipo3, esUltimo, bancoDefault, esChecador }) => {
  const banco = getBancoNombre(viaje, bancoDefault);
  const costoReal = getCostoViajeReal(viaje);
  const precioReal = getPrecioM3Real(viaje);
  const conOverride = tieneOverride(viaje);

  return (
    <View style={[styles.viajeRow, esUltimo && styles.viajeRowUltimo]}>
      {/* Número */}
      <View style={styles.colNumero}>
        <Text style={styles.viajeNumero}>{viaje.numero_viaje}</Text>
      </View>

      {/* Banco */}
      <View style={styles.colBanco}>
        <Text style={styles.bancoTexto} numberOfLines={1}>
          {banco}
        </Text>
        {conOverride && (
          <View style={styles.badgeOverride}>
            <Text style={styles.badgeOverrideTexto}>alt</Text>
          </View>
        )}
        {viaje.folio_vale_fisico ? (
          <Text style={styles.remisionTexto} numberOfLines={1}>
            Rem. {viaje.folio_vale_fisico}
          </Text>
        ) : null}
      </View>

      {/* Ton — solo tipo 1/2 */}
      {!esTipo3 && (
        <View style={styles.colTon}>
          <Text style={styles.metricTexto}>{formatNum(viaje.peso_ton)}</Text>
        </View>
      )}

      {/* m³ */}
      <View style={styles.colM3}>
        <Text style={styles.m3Texto}>{formatNum(viaje.volumen_m3)}</Text>
      </View>

      {/* Costo — oculto para checador */}
      {!esChecador && (
        <View style={styles.colCosto}>
          <Text
            style={[styles.costoTexto, conOverride && styles.costoOverride]}
          >
            {formatCosto(costoReal)}
          </Text>
          {conOverride && (
            <Text style={styles.distanciaTexto}>
              {viaje.distancia_km_override} km
            </Text>
          )}
        </View>
      )}

      {/* Hora */}
      <View style={styles.colHora}>
        <Text style={styles.horaTexto}>{formatHora(viaje.hora_registro)}</Text>
      </View>
    </View>
  );
};

// ─── Fila de totales ──────────────────────────────────────────────────────────

const FilaTotales = ({ viajes, esTipo3, esChecador }) => {
  const totalM3 = viajes.reduce(
    (acc, v) => acc + parseFloat(v.volumen_m3 || 0),
    0,
  );
  const totalTon = !esTipo3
    ? viajes.reduce((acc, v) => acc + parseFloat(v.peso_ton || 0), 0)
    : null;
  const totalCosto = viajes.reduce(
    (acc, v) => acc + parseFloat(getCostoViajeReal(v) || 0),
    0,
  );

  return (
    <View style={styles.filaTotales}>
      <View style={styles.colNumero} />
      <View style={styles.colBanco}>
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
      {!esChecador && (
        <View style={styles.colCosto}>
          <Text style={styles.totalesCosto}>{formatCosto(totalCosto)}</Text>
        </View>
      )}
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
  bancoDefault = null,
  esChecador = false,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!viajes || viajes.length === 0) return null;

  const hayOverrides = viajes.some((v) => !!v.id_banco_override);

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

      {/* Nota si hay viajes con banco alternativo */}
      {hayOverrides && (
        <View style={styles.notaOverride}>
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color={colors.secondary}
          />
          <Text style={styles.notaOverrideTexto}>
            Viajes marcados con "alt" usaron un banco diferente al del vale
          </Text>
        </View>
      )}

      {/* Tabla */}
      <View style={styles.tabla}>
        {/* Encabezado */}
        <View style={styles.tablaHeader}>
          <View style={styles.colNumero}>
            <Text style={styles.tablaHeaderTexto}>#</Text>
          </View>
          <View style={styles.colBanco}>
            <Text style={styles.tablaHeaderTexto}>Banco</Text>
          </View>
          {!esTipo3 && (
            <View style={styles.colTon}>
              <Text style={styles.tablaHeaderTexto}>Ton</Text>
            </View>
          )}
          <View style={styles.colM3}>
            <Text style={styles.tablaHeaderTexto}>m³</Text>
          </View>
          {!esChecador && (
            <View style={styles.colCosto}>
              <Text style={styles.tablaHeaderTexto}>Costo</Text>
            </View>
          )}
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
            bancoDefault={bancoDefault}
            esChecador={esChecador}
          />
        ))}

        {/* Totales */}
        <FilaTotales
          viajes={viajes}
          esTipo3={esTipo3}
          esChecador={esChecador}
        />
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
  notaOverride: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF4FB",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  notaOverrideTexto: {
    flex: 1,
    fontSize: 11,
    color: colors.secondary,
    lineHeight: 16,
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
    width: 20,
    alignItems: "center",
  },
  colBanco: {
    flex: 1,
    paddingRight: 4,
  },
  colTon: {
    width: 44,
    alignItems: "flex-end",
    paddingRight: 4,
  },
  colM3: {
    width: 44,
    alignItems: "flex-end",
    paddingRight: 4,
  },
  colCosto: {
    width: 72,
    alignItems: "flex-end",
    paddingRight: 4,
  },
  colHora: {
    width: 56,
    alignItems: "flex-end",
  },
  // ─── Textos ─────────────────────────────────────────────────────────────────
  viajeNumero: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  bancoTexto: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  badgeOverride: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF4FB",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  badgeOverrideTexto: {
    fontSize: 9,
    color: colors.secondary,
    fontWeight: "700",
  },
  remisionTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
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
  costoTexto: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  costoOverride: {
    color: colors.secondary,
  },
  distanciaTexto: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
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
  totalesCosto: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
  },
});

export default SeccionViajesMaterialCompletado;
