// src/componets/presupuestos/PresupuestoCards.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

export const NIVEL_COLOR = {
  ok: colors.accent,
  warning: colors.warning,
  danger: colors.danger,
  blocked: "#7F2982",
};

const NIVEL_LABEL = {
  ok: "Normal",
  warning: "Atencion",
  danger: "Critico",
  blocked: "Agotado",
};

// ─── Barra de progreso ────────────────────────────────────────────────────────
const BarraProgreso = ({ porcentaje, nivel }) => (
  <View style={estilos.barraFondo}>
    <View
      style={[
        estilos.barraRelleno,
        {
          width: `${Math.min(100, porcentaje)}%`,
          backgroundColor: NIVEL_COLOR[nivel] ?? colors.accent,
        },
      ]}
    />
  </View>
);

// ─── Dato pequeño ─────────────────────────────────────────────────────────────
const DatoItem = ({ label, valor }) => (
  <View style={estilos.datoItem}>
    <Text style={estilos.datoLabel}>{label}</Text>
    <Text style={estilos.datoValor}>{valor}</Text>
  </View>
);

// ─── Card material ────────────────────────────────────────────────────────────
export const CardPresupuestoMaterial = ({ item, onEditar, onEliminar }) => (
  <View style={estilos.card}>
    <View style={estilos.cardEncabezado}>
      <Text style={estilos.cardTitulo}>{item.nombre}</Text>
      <View
        style={[
          estilos.etiquetaNivel,
          { backgroundColor: NIVEL_COLOR[item.nivel] + "22" },
        ]}
      >
        <Text
          style={[
            estilos.etiquetaNivelTexto,
            { color: NIVEL_COLOR[item.nivel] },
          ]}
        >
          {NIVEL_LABEL[item.nivel]}
        </Text>
      </View>
    </View>

    <BarraProgreso porcentaje={item.porcentaje} nivel={item.nivel} />

    <View style={estilos.cardFila}>
      <DatoItem label="Presupuesto" valor={`${item.presupuestados} m3`} />
      <DatoItem label="Consumido" valor={`${item.consumidos.toFixed(1)} m3`} />
      <DatoItem label="Disponible" valor={`${item.disponible.toFixed(1)} m3`} />
      <DatoItem label="%" valor={`${item.porcentaje.toFixed(0)}%`} />
    </View>

    <View style={estilos.botonesAccion}>
      <TouchableOpacity style={estilos.botonEliminar} onPress={() => onEliminar(item)}>
        <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.danger} />
        <Text style={estilos.botonEliminarTexto}>Eliminar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={estilos.botonEditar} onPress={() => onEditar(item)}>
        <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.secondary} />
        <Text style={estilos.botonEditarTexto}>Editar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Card renta ───────────────────────────────────────────────────────────────
const formatMonto = (n) =>
  n?.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) ?? "$0";

export const CardPresupuestoRenta = ({ renta, onEditar, onEliminar }) => {
  if (!renta) {
    return (
      <View style={[estilos.card, estilos.cardVacio]}>
        <MaterialCommunityIcons
          name="currency-usd-off"
          size={28}
          color={colors.textSecondary}
        />
        <Text style={estilos.cardVacioTexto}>
          Sin presupuesto de renta configurado
        </Text>
        <TouchableOpacity style={estilos.botonAgregar} onPress={onEditar}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.surface} />
          <Text style={estilos.botonAgregarTexto}>Configurar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.card}>
      <View style={estilos.cardEncabezado}>
        <Text style={estilos.cardTitulo}>Renta de equipo</Text>
        <View
          style={[
            estilos.etiquetaNivel,
            { backgroundColor: NIVEL_COLOR[renta.nivel] + "22" },
          ]}
        >
          <Text
            style={[
              estilos.etiquetaNivelTexto,
              { color: NIVEL_COLOR[renta.nivel] },
            ]}
          >
            {NIVEL_LABEL[renta.nivel]}
          </Text>
        </View>
      </View>

      <BarraProgreso porcentaje={renta.porcentaje} nivel={renta.nivel} />

      <View style={estilos.cardFila}>
        <DatoItem label="Presupuesto" valor={formatMonto(renta.presupuestado)} />
        <DatoItem label="Consumido" valor={formatMonto(renta.consumido)} />
        <DatoItem label="Disponible" valor={formatMonto(renta.disponible)} />
        <DatoItem label="%" valor={`${renta.porcentaje.toFixed(0)}%`} />
      </View>

      <View style={estilos.botonesAccion}>
        <TouchableOpacity style={estilos.botonEliminar} onPress={onEliminar}>
          <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.danger} />
          <Text style={estilos.botonEliminarTexto}>Eliminar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botonEditar} onPress={onEditar}>
          <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.secondary} />
          <Text style={estilos.botonEditarTexto}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardVacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  cardVacioTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  cardEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  etiquetaNivel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  etiquetaNivelTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  barraFondo: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: 3,
  },
  cardFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  datoItem: {
    alignItems: "center",
    flex: 1,
  },
  datoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  datoValor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  botonesAccion: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  botonEditarTexto: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  botonEliminar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  botonEliminarTexto: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  botonAgregar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  botonAgregarTexto: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
  },
});
