// 1. React y hooks nativos
import React, { useRef, useState, useEffect } from "react";

// 2. React Native
import { View, Text, StyleSheet } from "react-native";

// 3. Third party
import Svg, { Mask, Rect } from "react-native-svg";

// 4. Config
import { colors } from "../../config/colors";

/**
 * TutorialInlineSpotlight
 *
 * Versión simplificada de TutorialSpotlightOverlay para usarse DENTRO de
 * las réplicas del tutorial (ej. dentro del Modal de "Asignar Vehículo").
 * A diferencia del spotlight principal, aquí `pointerEvents="none"` en
 * TODO momento: es puramente visual, nunca bloquea toques. No hace falta
 * bloquear nada porque los botones que resalta ya están conectados a
 * manejadores ficticios seguros (no a la lógica real de producción) — el
 * único propósito es guiar la vista, no proteger de acciones reales.
 *
 * PROPS:
 * - active: boolean, si se debe mostrar
 * - targetRef: ref ya asignado (via `ref`) al elemento real a resaltar
 * - label: texto corto opcional debajo del hueco
 */

const HOLE_PADDING = 10;
const HOLE_RADIUS = 16;

const TutorialInlineSpotlight = ({ active, targetRef, label }) => {
  const wrapperRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!active) {
      setLayout(null);
      setRect(null);
      return;
    }
    const timer = setTimeout(() => {
      wrapperRef.current?.measureInWindow((wx, wy, ww, wh) => {
        setLayout({ x: wx, y: wy, width: ww, height: wh });
        targetRef.current?.measureInWindow((tx, ty, tw, th) => {
          setRect({ x: tx, y: ty, width: tw, height: th });
        });
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  const localRect =
    rect && layout
      ? {
          x: rect.x - layout.x - HOLE_PADDING,
          y: rect.y - layout.y - HOLE_PADDING,
          width: rect.width + HOLE_PADDING * 2,
          height: rect.height + HOLE_PADDING * 2,
        }
      : null;

  return (
    <View ref={wrapperRef} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {localRect && layout && (
        <>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Mask id="inlineSpotlightMask">
              <Rect x={0} y={0} width={layout.width} height={layout.height} fill="#FFFFFF" />
              <Rect
                x={localRect.x}
                y={localRect.y}
                width={localRect.width}
                height={localRect.height}
                rx={HOLE_RADIUS}
                ry={HOLE_RADIUS}
                fill="#000000"
              />
            </Mask>
            <Rect
              x={0}
              y={0}
              width={layout.width}
              height={layout.height}
              fill={colors.shadow.dark}
              mask="url(#inlineSpotlightMask)"
            />
          </Svg>

          {label && (
            <View style={[styles.labelWrapper, { top: localRect.y + localRect.height + 10 }]}>
              <Text style={styles.labelText}>{label}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  labelWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  labelText: {
    backgroundColor: colors.primary,
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default TutorialInlineSpotlight;
