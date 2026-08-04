/**
 * componets/common/BotonAyuda.js
 *
 * Icono de ayuda que abre la página del Centro de Ayuda que se le pase.
 *
 * Se usa en los encabezados de las secciones y de los modales, donde ya no cabe
 * texto: es solo el icono, con hitSlop grande porque en obra se toca con guantes.
 *
 * PROPS:
 * - url: string — la arma `src/config/ayuda.js` (AYUDA_URLS o urlAyudaVale).
 * - variante: "seccion" (default, azul) | "header" (blanco, para cabeceras de color)
 * - size: number — 20 por default
 */
import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import abrirAyuda from "../../utils/abrirAyuda";

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const BotonAyuda = ({ url, variante = "seccion", size = 20 }) => {
  const handlePress = useCallback(() => abrirAyuda(url), [url]);

  if (!url) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={HIT_SLOP}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel="Ver ayuda de este paso"
    >
      <MaterialCommunityIcons
        name="help-circle-outline"
        size={size}
        color={variante === "header" ? colors.surface : colors.secondary}
      />
    </TouchableOpacity>
  );
};

export default BotonAyuda;
