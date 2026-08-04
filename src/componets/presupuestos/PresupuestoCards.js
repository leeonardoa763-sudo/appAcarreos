// src/componets/presupuestos/PresupuestoCards.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const NIVEL_COLOR = {
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

const NIVEL_ICONO = {
  ok: "check-circle-outline",
  warning: "alert-outline",
  danger: "alert-circle-outline",
  blocked: "close-octagon-outline",
};

// Formateo defensivo: cualquier valor no numerico se muestra como 0 en vez de
// tumbar la pantalla.
const numero = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

export const formatM3 = (n) =>
  `${numero(n).toLocaleString("es-MX", { maximumFractionDigits: 1 })} m3`;

export const formatMonto = (n) =>
  numero(n).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

const colorNivel = (nivel) => NIVEL_COLOR[nivel] ?? colors.accent;

// ─── Barra de progreso ────────────────────────────────────────────────────────
const BarraProgreso = ({ porcentaje, nivel }) => (
  <View style={estilos.barraFondo}>
    <View
      style={[
        estilos.barraRelleno,
        {
          width: `${Math.max(0, Math.min(100, numero(porcentaje)))}%`,
          backgroundColor: colorNivel(nivel),
        },
      ]}
    />
  </View>
);

// ─── Etiqueta de nivel ────────────────────────────────────────────────────────
const EtiquetaNivel = ({ nivel }) => {
  const color = colorNivel(nivel);
  return (
    <View style={[estilos.etiquetaNivel, { backgroundColor: `${color}1A` }]}>
      <MaterialCommunityIcons
        name={NIVEL_ICONO[nivel] ?? NIVEL_ICONO.ok}
        size={12}
        color={color}
      />
      <Text style={[estilos.etiquetaNivelTexto, { color }]}>
        {NIVEL_LABEL[nivel] ?? NIVEL_LABEL.ok}
      </Text>
    </View>
  );
};

// ─── Dato pequeño ─────────────────────────────────────────────────────────────
const DatoItem = ({ label, valor, color }) => (
  <View style={estilos.datoItem}>
    <Text style={estilos.datoLabel}>{label}</Text>
    <Text style={[estilos.datoValor, color && { color }]} numberOfLines={1}>
      {valor}
    </Text>
  </View>
);

// ─── Acciones de la tarjeta ───────────────────────────────────────────────────
const AccionesCard = ({ onEditar, onEliminar }) => (
  <View style={estilos.botonesAccion}>
    <TouchableOpacity
      style={estilos.botonEliminar}
      onPress={onEliminar}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={15}
        color={colors.danger}
      />
      <Text style={estilos.botonEliminarTexto}>Eliminar</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={estilos.botonEditar}
      onPress={onEditar}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <MaterialCommunityIcons
        name="pencil-outline"
        size={15}
        color={colors.surface}
      />
      <Text style={estilos.botonEditarTexto}>Editar</Text>
    </TouchableOpacity>
  </View>
);

// ─── Distintivo de carpeta asfaltica ──────────────────────────────────────────
const EtiquetaAsfaltico = () => (
  <View style={estilos.etiquetaAsfaltico}>
    <MaterialCommunityIcons
      name="road-variant"
      size={11}
      color={colors.primary}
    />
    <Text style={estilos.etiquetaAsfalticoTexto}>Carpeta asfaltica</Text>
  </View>
);

// ─── Encabezado comun ─────────────────────────────────────────────────────────
const CardEncabezado = ({ icono, titulo, nivel, porcentaje, esAsfaltico }) => {
  const color = colorNivel(nivel);
  return (
    <>
      <View style={estilos.cardEncabezado}>
        <View style={[estilos.cardIcono, { backgroundColor: `${color}14` }]}>
          <MaterialCommunityIcons name={icono} size={20} color={color} />
        </View>
        <View style={estilos.cardTitulos}>
          <Text style={estilos.cardTitulo} numberOfLines={2}>
            {titulo}
          </Text>
          {esAsfaltico && <EtiquetaAsfaltico />}
        </View>
        <EtiquetaNivel nivel={nivel} />
      </View>

      <View style={estilos.barraFila}>
        <BarraProgreso porcentaje={porcentaje} nivel={nivel} />
        <Text style={[estilos.barraPorcentaje, { color }]}>
          {numero(porcentaje).toFixed(0)}%
        </Text>
      </View>
    </>
  );
};

// ─── Card material ────────────────────────────────────────────────────────────
export const CardPresupuestoMaterial = ({ item, onEditar, onEliminar }) => (
  <View style={estilos.card}>
    <CardEncabezado
      icono={item.esAsfaltico ? "road-variant" : "cube-outline"}
      titulo={item.nombre}
      nivel={item.nivel}
      porcentaje={item.porcentaje}
      esAsfaltico={item.esAsfaltico}
    />

    <View style={estilos.cardFila}>
      <DatoItem label="Presupuesto" valor={formatM3(item.presupuestados)} />
      <DatoItem label="Consumido" valor={formatM3(item.consumidos)} />
      <DatoItem
        label="Disponible"
        valor={formatM3(item.disponible)}
        color={colorNivel(item.nivel)}
      />
    </View>

    <AccionesCard
      onEditar={() => onEditar(item)}
      onEliminar={() => onEliminar(item)}
    />
  </View>
);

// ─── Card renta ───────────────────────────────────────────────────────────────
export const CardPresupuestoRenta = ({ renta, onEditar, onEliminar }) => {
  if (!renta) {
    return (
      <View style={[estilos.card, estilos.cardVacio]}>
        <MaterialCommunityIcons
          name="currency-usd-off"
          size={30}
          color={colors.textSecondary}
        />
        <Text style={estilos.cardVacioTexto}>
          Sin presupuesto de renta configurado
        </Text>
        <TouchableOpacity
          style={estilos.botonAgregar}
          onPress={onEditar}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.surface} />
          <Text style={estilos.botonAgregarTexto}>Configurar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.card}>
      <CardEncabezado
        icono="excavator"
        titulo="Renta de equipo"
        nivel={renta.nivel}
        porcentaje={renta.porcentaje}
      />

      <View style={estilos.cardFila}>
        <DatoItem label="Presupuesto" valor={formatMonto(renta.presupuestado)} />
        <DatoItem label="Consumido" valor={formatMonto(renta.consumido)} />
        <DatoItem
          label="Disponible"
          valor={formatMonto(renta.disponible)}
          color={colorNivel(renta.nivel)}
        />
      </View>

      <AccionesCard onEditar={onEditar} onEliminar={onEliminar} />
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardVacio: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 26,
  },
  cardVacioTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  cardEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardIcono: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitulos: {
    flex: 1,
    gap: 4,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  etiquetaAsfaltico: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${colors.primary}1A`,
  },
  etiquetaAsfalticoTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  etiquetaNivel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  etiquetaNivelTexto: {
    fontSize: 11,
    fontWeight: "700",
  },

  barraFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  barraFondo: {
    flex: 1,
    height: 7,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: 4,
  },
  barraPorcentaje: {
    fontSize: 11,
    fontWeight: "700",
    minWidth: 34,
    textAlign: "right",
  },

  cardFila: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  datoItem: {
    alignItems: "center",
    flex: 1,
  },
  datoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 3,
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
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: colors.secondary,
  },
  botonEditarTexto: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  botonEliminar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
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
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4,
  },
  botonAgregarTexto: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
  },
});
