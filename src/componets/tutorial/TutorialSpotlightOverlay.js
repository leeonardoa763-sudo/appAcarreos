// 1. React y hooks nativos
import React, { useRef, useState, useEffect } from "react";

// 2. React Native
import { View, StyleSheet, Dimensions } from "react-native";

// 3. Third party
import Svg, { Mask, Rect } from "react-native-svg";

// 4. Config
import { colors } from "../../config/colors";

// 6. Subcomponentes
import TutorialTooltip from "./TutorialTooltip";

/**
 * TutorialSpotlightOverlay
 *
 * Overlay oscuro con un "hueco" (máscara SVG) que resalta el botón real
 * indicado por `rect`. No usa <Modal>: en Android, un Modal se renderiza
 * en una ventana nativa separada y sus coordenadas no coinciden con las
 * de measureInWindow() sobre los botones reales, lo que rompería la
 * alineación del hueco. Este overlay es un View absoluto normal, hermano
 * del contenido real de la pantalla.
 *
 * `rect` llega en coordenadas de VENTANA (measureInWindow del botón). Como
 * este overlay puede vivir debajo de un header, su propia esquina superior
 * izquierda no es (0,0) en esas coordenadas — por eso se mide el propio
 * wrapper y se resta ese offset antes de dibujar el hueco.
 *
 * El wrapper bloquea todos los toques (pointerEvents="auto"), incluidos
 * los del botón real dentro del hueco: el hueco es puramente visual, así
 * se garantiza que durante el tutorial nunca se dispara una acción real.
 */

const { width: FALLBACK_W, height: FALLBACK_H } = Dimensions.get("window");
const HOLE_PADDING = 8;
const HOLE_RADIUS = 14;

const TutorialSpotlightOverlay = ({
  visible,
  rect,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
  hideNextButton,
  onArm,
}) => {
  const wrapperRef = useRef(null);
  // Tamaño y posición REALES del propio wrapper (no de la ventana completa):
  // el header y el tab bar le quitan espacio, así que Dimensions.get("window")
  // sería más grande que el área visible real donde vive el tutorial.
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    if (!visible) return;
    wrapperRef.current?.measureInWindow((x, y, width, height) =>
      setLayout({ x, y, width, height }),
    );
  }, [visible, stepIndex]);

  if (!visible || !step) return null;

  const containerW = layout?.width || FALLBACK_W;
  const containerH = layout?.height || FALLBACK_H;

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
    <View ref={wrapperRef} style={styles.wrapper} pointerEvents="auto">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        <Mask id="spotlightMask">
          <Rect x={0} y={0} width={containerW} height={containerH} fill="#FFFFFF" />
          {localRect && (
            <Rect
              x={localRect.x}
              y={localRect.y}
              width={localRect.width}
              height={localRect.height}
              rx={HOLE_RADIUS}
              ry={HOLE_RADIUS}
              fill="#000000"
            />
          )}
        </Mask>
        <Rect
          x={0}
          y={0}
          width={containerW}
          height={containerH}
          fill={colors.shadow.dark}
          mask="url(#spotlightMask)"
        />
      </Svg>

      <TutorialTooltip
        step={step}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        holeRect={localRect}
        containerHeight={containerH}
        onNext={onNext}
        onSkip={onSkip}
        hideNextButton={hideNextButton}
        onArm={onArm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default TutorialSpotlightOverlay;
