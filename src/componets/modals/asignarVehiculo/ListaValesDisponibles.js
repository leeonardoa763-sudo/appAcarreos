import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import styles from "./asignarStyles";

const GRUPOS = [
  {
    key: "renta",
    titulo: "Renta de Equipo",
    icono: "truck-cargo-container",
    color: "#004E89",
    filtro: (vale) => vale.tipo_vale === "renta",
  },
  {
    key: "material_1",
    titulo: "Material — Tipo 1",
    icono: "package-variant",
    color: "#FF6B35",
    filtro: (vale) =>
      vale.tipo_vale === "material" &&
      vale.vale_material_detalles?.[0]?.material?.id_tipo_de_material === 1,
  },
  {
    key: "material_2",
    titulo: "Material — Tipo 2",
    icono: "package-variant-closed",
    color: "#E67E22",
    filtro: (vale) =>
      vale.tipo_vale === "material" &&
      vale.vale_material_detalles?.[0]?.material?.id_tipo_de_material === 2,
  },
  {
    key: "material_3",
    titulo: "Material — Tipo 3",
    icono: "package-up",
    color: "#1A936F",
    filtro: (vale) =>
      vale.tipo_vale === "material" &&
      vale.vale_material_detalles?.[0]?.material?.id_tipo_de_material === 3,
  },
];

const ItemVale = ({ vale, asignando, onSeleccionar }) => {
  const esMaterial = vale.tipo_vale === "material";
  const obra = vale.obras
    ? `${vale.obras.cc ? vale.obras.cc + " - " : ""}${vale.obras.obra}`
    : "Sin obra";

  return (
    <TouchableOpacity
      style={styles.itemVale}
      onPress={() => onSeleccionar(vale.id_vale, vale.folio)}
      disabled={asignando}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.itemValeTipoBar,
          esMaterial ? styles.barMaterial : styles.barRenta,
        ]}
      />
      <View style={styles.itemValeBody}>
        <View style={styles.itemValeTop}>
          <MaterialCommunityIcons
            name={esMaterial ? "package-variant" : "truck-cargo-container"}
            size={20}
            color={esMaterial ? colors.primary : colors.secondary}
          />
          <Text style={styles.itemValeFolio}>{vale.folio}</Text>
          <View
            style={[
              styles.itemValeTipoBadge,
              esMaterial ? styles.badgeMaterial : styles.badgeRenta,
            ]}
          >
            <Text style={styles.itemValeTipoTexto}>
              {esMaterial ? "Material" : "Renta"}
            </Text>
          </View>
        </View>
        <Text style={styles.itemValeObra} numberOfLines={1}>
          {obra}
        </Text>
      </View>
      {asignando ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
};

const ListaValesDisponibles = ({ vales, asignando, onSeleccionar }) => {
  if (vales.length === 0) {
    return (
      <View style={styles.sinValesContainer}>
        <MaterialCommunityIcons
          name="clipboard-off-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.sinValesTexto}>
          No hay vales en proceso disponibles para este sindicato.
        </Text>
      </View>
    );
  }

  const gruposConVales = GRUPOS.map((grupo) => ({
    ...grupo,
    vales: vales.filter(grupo.filtro),
  })).filter((grupo) => grupo.vales.length > 0);

  return (
    <View style={styles.listaContainer}>
      <Text style={styles.listaTitulo}>Selecciona un vale para asignar</Text>
      {gruposConVales.map((grupo) => (
        <View key={grupo.key} style={styles.grupoContainer}>
          <View style={[styles.grupoHeader, { borderLeftColor: grupo.color }]}>
            <MaterialCommunityIcons
              name={grupo.icono}
              size={16}
              color={grupo.color}
            />
            <Text style={[styles.grupoTitulo, { color: grupo.color }]}>
              {grupo.titulo}
            </Text>
            <View
              style={[
                styles.grupoBadge,
                { backgroundColor: `${grupo.color}15` },
              ]}
            >
              <Text style={[styles.grupoBadgeTexto, { color: grupo.color }]}>
                {grupo.vales.length}
              </Text>
            </View>
          </View>
          {grupo.vales.map((vale) => (
            <ItemVale
              key={vale.id_vale}
              vale={vale}
              asignando={asignando}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

export default ListaValesDisponibles;
