// src/screens/DevToolsScreen.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";

const OPCIONES = [
  {
    destino: "PresupuestosObra",
    icono: "chart-bar",
    label: "Presupuestos de obra",
    descripcion: "Ver y configurar presupuestos por material y renta",
  },
  {
    destino: "GestionMateriales",
    icono: "package-variant-closed",
    label: "Gestion de materiales",
    descripcion: "Agregar, editar y desactivar materiales del catalogo",
  },
];

export default function DevToolsScreen({ navigation }) {
  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.banner}>
        <MaterialCommunityIcons
          name="shield-crown-outline"
          size={18}
          color={colors.surface}
        />
        <Text style={estilos.bannerTexto}>Panel de Administrador</Text>
      </View>

      <Text style={estilos.seccionTitulo}>Configuracion</Text>

      {OPCIONES.map((op) => (
        <TouchableOpacity
          key={op.destino}
          style={estilos.boton}
          onPress={() => navigation.navigate(op.destino)}
          activeOpacity={0.7}
        >
          <View style={estilos.botonIcono}>
            <MaterialCommunityIcons
              name={op.icono}
              size={26}
              color={colors.secondary}
            />
          </View>
          <View style={estilos.botonTextos}>
            <Text style={estilos.botonLabel}>{op.label}</Text>
            <Text style={estilos.botonDesc}>{op.descripcion}</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 16,
    paddingBottom: 40,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 24,
  },
  bannerTexto: {
    color: colors.surface,
    fontWeight: "bold",
    fontSize: 14,
  },

  seccionTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },

  boton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  botonIcono: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  botonTextos: {
    flex: 1,
  },
  botonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  botonDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
