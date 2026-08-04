// src/componets/bancos/GestionBancosFilas.js
//
// Filas de las listas de GestionBancosScreen. Separadas de la pantalla para
// mantener cada archivo bajo 600 lineas.
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { estilosBancos as estilos } from "./gestionBancosStyles";

const plural = (n, singular, prefijoPlural = "s") =>
  `${n} ${singular}${n === 1 ? "" : prefijoPlural}`;

// Fila de la pestana Bancos: muestra de un vistazo cuanto tiene configurado
// cada banco, para detectar los que estan a medias.
export const FilaBanco = ({ banco, conteos, onPress }) => {
  const c = conteos ?? { obras: 0, pesos: 0, planta: false };

  return (
    <TouchableOpacity style={estilos.fila} onPress={onPress} activeOpacity={0.7}>
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons
          name="home-city-outline"
          size={22}
          color={colors.secondary}
        />
      </View>

      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre}>{banco.banco}</Text>
        <View style={estilos.filaSubRow}>
          <View style={estilos.badge}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={11}
              color={colors.textSecondary}
            />
            <Text style={estilos.badgeTexto}>{plural(c.obras, "obra")}</Text>
          </View>
          <View style={estilos.badge}>
            <MaterialCommunityIcons
              name="weight-kilogram"
              size={11}
              color={colors.textSecondary}
            />
            <Text style={estilos.badgeTexto}>{plural(c.pesos, "peso")}</Text>
          </View>
          {c.planta && (
            <View style={[estilos.badge, estilos.badgeAcento]}>
              <MaterialCommunityIcons
                name="factory"
                size={11}
                color={colors.accent}
              />
              <Text style={[estilos.badgeTexto, { color: colors.accent }]}>
                Planta
              </Text>
            </View>
          )}
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

// Fila comun de distancias y pesos: titulo (banco), subtitulo (obra / planta /
// material), badge con el valor y boton de eliminar.
export const FilaRegistro = ({
  icono,
  titulo,
  subIcono,
  subTexto,
  badgeTexto,
  acentuada,
  onEditar,
  onEliminar,
}) => (
  <TouchableOpacity style={estilos.fila} onPress={onEditar} activeOpacity={0.7}>
    <View style={estilos.filaIcono}>
      <MaterialCommunityIcons name={icono} size={22} color={colors.secondary} />
    </View>

    <View style={estilos.filaTextos}>
      <Text style={estilos.filaNombre}>{titulo}</Text>
      <View style={estilos.filaSubRow}>
        <MaterialCommunityIcons
          name={subIcono}
          size={12}
          color={colors.textSecondary}
        />
        <Text style={estilos.filaSubtexto}>{subTexto}</Text>
        <View style={[estilos.badge, acentuada && estilos.badgeAcento]}>
          <Text
            style={[
              estilos.badgeTexto,
              { color: acentuada ? colors.accent : colors.secondary },
            ]}
          >
            {badgeTexto}
          </Text>
        </View>
      </View>
    </View>

    <TouchableOpacity
      style={estilos.btnEliminar}
      onPress={onEliminar}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={18}
        color={colors.danger}
      />
    </TouchableOpacity>
  </TouchableOpacity>
);
