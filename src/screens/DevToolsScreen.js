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
import { useAuth } from "../hooks/useAuth";

const SECCIONES = [
  {
    titulo: "Presupuestos",
    opciones: [
      {
        destino: "PresupuestosObra",
        icono: "chart-bar",
        color: colors.primary,
        label: "Presupuestos de obra",
        descripcion: "Ver y configurar presupuestos por material y renta",
      },
    ],
  },
  {
    titulo: "Catalogos",
    opciones: [
      {
        destino: "GestionMateriales",
        icono: "package-variant-closed",
        color: colors.secondary,
        label: "Gestion de materiales",
        descripcion: "Agregar, editar y desactivar materiales del catalogo",
      },
      {
        destino: "GestionBancos",
        icono: "home-city-outline",
        color: colors.secondary,
        label: "Bancos de material",
        descripcion: "Crear y configurar bancos, distancias y pesos especificos",
      },
      {
        destino: "GestionObras",
        icono: "office-building-marker-outline",
        color: colors.secondary,
        label: "Gestion de obras",
        descripcion: "Crear, editar y asignar obras a usuarios",
      },
    ],
  },
  {
    titulo: "Tarifas",
    opciones: [
      {
        destino: "GestionTarifas",
        icono: "cash-multiple",
        color: colors.primary,
        label: "Tarifas por obra",
        descripcion:
          "Asignar tarifas propias de una obra que sustituyan al default del sindicato",
      },
    ],
  },
];

export default function DevToolsScreen({ navigation }) {
  const { userProfile } = useAuth();

  const nombre = [userProfile?.nombre, userProfile?.primer_apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.banner}>
        <View style={estilos.bannerIcono}>
          <MaterialCommunityIcons
            name="shield-crown-outline"
            size={22}
            color={colors.surface}
          />
        </View>
        <View style={estilos.bannerTextos}>
          <Text style={estilos.bannerTitulo}>Panel de Administrador</Text>
          <Text style={estilos.bannerSubtitulo} numberOfLines={1}>
            {nombre
              ? `Sesion de ${nombre}`
              : "Configuracion global del sistema"}
          </Text>
        </View>
      </View>

      {SECCIONES.map((seccion) => (
        <View key={seccion.titulo} style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>{seccion.titulo}</Text>

          {seccion.opciones.map((op) => (
            <TouchableOpacity
              key={op.destino}
              style={estilos.boton}
              onPress={() => navigation.navigate(op.destino)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  estilos.botonIcono,
                  { backgroundColor: `${op.color}14` },
                ]}
              >
                <MaterialCommunityIcons
                  name={op.icono}
                  size={24}
                  color={op.color}
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
        </View>
      ))}

      <View style={estilos.nota}>
        <MaterialCommunityIcons
          name="information-outline"
          size={15}
          color={colors.textSecondary}
        />
        <Text style={estilos.notaTexto}>
          Los cambios de esta seccion afectan a todas las obras y usuarios.
        </Text>
      </View>
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
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 22,
  },
  bannerIcono: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTextos: {
    flex: 1,
  },
  bannerTitulo: {
    color: colors.surface,
    fontWeight: "bold",
    fontSize: 15,
  },
  bannerSubtitulo: {
    color: colors.surface,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },

  seccion: {
    marginBottom: 18,
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
    borderRadius: 11,
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
    lineHeight: 16,
  },

  nota: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  notaTexto: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
