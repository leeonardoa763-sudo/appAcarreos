/**
 * hooks/useSpotlightTutorial.js
 *
 * Motor del tutorial guiado (spotlight). Agnóstico de rol y de pantalla:
 * recibe una lista de pasos y expone el estado del recorrido más una
 * función para registrar refs de los botones reales a resaltar.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export const useSpotlightTutorial = (steps = []) => {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentRect, setCurrentRect] = useState(null);
  const targetsRef = useRef({});

  const registerTarget = useCallback(
    (id) => (node) => {
      if (node) targetsRef.current[id] = node;
    },
    [],
  );

  const measureCurrent = useCallback(() => {
    const step = steps[stepIndex];
    if (!step?.targetId) {
      setCurrentRect(null);
      return;
    }
    const node = targetsRef.current[step.targetId];
    if (!node?.measureInWindow) {
      setCurrentRect(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setCurrentRect({ x, y, width, height });
    });
  }, [steps, stepIndex]);

  useEffect(() => {
    if (!visible) return;
    // Pequeño delay para que el layout esté estable tras el cambio de paso.
    const timeoutId = setTimeout(measureCurrent, 60);
    return () => clearTimeout(timeoutId);
  }, [visible, stepIndex, measureCurrent]);

  const start = useCallback(() => {
    setStepIndex(0);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= steps.length) {
        setVisible(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  return {
    visible,
    stepIndex,
    totalSteps: steps.length,
    currentStep: steps[stepIndex] || null,
    currentRect,
    registerTarget,
    start,
    next,
    prev,
    close,
    isLastStep: stepIndex === steps.length - 1,
  };
};
