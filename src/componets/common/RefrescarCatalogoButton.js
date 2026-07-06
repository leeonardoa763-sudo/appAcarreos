// Boton reutilizable para forzar una recarga del catalogo (materiales, etc.)
// ignorando la cache local de useCatalogos. Se usa en pantallas de creacion
// de vales para no depender del TTL cuando un usuario necesita ver un
// material recien creado de inmediato.
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const RefrescarCatalogoButton = ({ onPress, refrescando, label = "Actualizar catálogo" }) => {
  return (
    <TouchableOpacity
      style={styles.boton}
      onPress={onPress}
      disabled={refrescando}
      activeOpacity={0.7}
    >
      {refrescando ? (
        <ActivityIndicator size="small" color={colors.secondary} />
      ) : (
        <MaterialCommunityIcons name="refresh" size={16} color={colors.secondary} />
      )}
      <Text style={styles.texto}>{refrescando ? "Actualizando..." : label}</Text>
    </TouchableOpacity>
  );
};

export default RefrescarCatalogoButton;

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  texto: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
