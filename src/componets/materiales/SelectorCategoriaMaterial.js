/**
 * componets/materiales/SelectorCategoriaMaterial.js
 *
 * Lista de "cards" para elegir una categoría de material de renta (o, con
 * `descripciones={false}`, un material concreto dentro de una categoría).
 * Cards en vez de chips porque cada categoría lleva una descripción breve.
 *
 * USADO EN:
 * - ValeRentaScreen (categoría planeada al crear el vale)
 * - ModalRegistrarViaje (paso "categoria" y paso "material")
 *
 * PROPS:
 * - items: array [{ id, nombre, descripcion? }]
 * - value: id seleccionado
 * - onSelect: (id) => void
 * - idDestacado: id a marcar con la nota "destacadoTexto" (ej. plan del residente)
 * - destacadoTexto: string
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const SelectorCategoriaMaterial = ({
  items = [],
  value,
  onSelect,
  idDestacado = null,
  destacadoTexto = "Planeado por el residente",
}) => {
  return (
    <View style={estilos.lista}>
      {items.map((item) => {
        const seleccionado = item.id === value;
        const destacado = idDestacado != null && item.id === idDestacado;
        return (
          <TouchableOpacity
            key={item.id}
            style={[estilos.card, seleccionado && estilos.cardSeleccionada]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.75}
          >
            <View style={estilos.cardIcono}>
              <MaterialCommunityIcons
                name={
                  seleccionado ? "check-circle" : "circle-outline"
                }
                size={22}
                color={seleccionado ? colors.accent : colors.textSecondary}
              />
            </View>
            <View style={estilos.cardTextos}>
              <View style={estilos.cardTituloRow}>
                <Text
                  style={[
                    estilos.cardTitulo,
                    seleccionado && estilos.cardTituloSeleccionado,
                  ]}
                >
                  {item.nombre}
                </Text>
                {destacado && (
                  <View style={estilos.badgeDestacado}>
                    <Text style={estilos.badgeDestacadoTexto}>
                      {destacadoTexto}
                    </Text>
                  </View>
                )}
              </View>
              {!!item.descripcion && (
                <Text style={estilos.cardDescripcion}>{item.descripcion}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default SelectorCategoriaMaterial;

const estilos = StyleSheet.create({
  lista: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
  },
  cardSeleccionada: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}12`,
  },
  cardIcono: {
    paddingTop: 1,
  },
  cardTextos: {
    flex: 1,
    gap: 3,
  },
  cardTituloRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardTituloSeleccionado: {
    color: colors.accent,
  },
  cardDescripcion: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  badgeDestacado: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: colors.secondary,
  },
  badgeDestacadoTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.surface,
  },
});
