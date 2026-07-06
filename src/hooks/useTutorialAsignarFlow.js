/**
 * hooks/useTutorialAsignarFlow.js
 *
 * Máquina de estados del flujo simulado "Asignar Vehículo" del tutorial
 * CHECADOR. No sabe nada de UI: solo controla la fase actual y los
 * temporizadores. Nunca toca Supabase, cámara ni Bluetooth.
 *
 * Fases: "idle" -> "camera" -> "resultado" -> "asignando" -> "exito"
 *
 * "idle" y "resultado" replican exactamente la estructura real de
 * ModalAsignarVehiculo.js (mismo componente contenedor, mismos
 * componentes de presentación reales: EstadoIdle, CardVehiculo,
 * ConfirmarOperadorCard, ListaValesDisponibles).
 */

import { useState, useRef, useCallback, useEffect } from "react";

const DELAY_ASIGNANDO_MS = 900;

export const useTutorialAsignarFlow = ({ onFinalizarIrAVale }) => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState("idle");
  const asignandoTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (asignandoTimeoutRef.current) clearTimeout(asignandoTimeoutRef.current);
    };
  }, []);

  const start = useCallback(() => {
    setPhase("idle");
    setActive(true);
  }, []);

  const handleAbrirCamara = useCallback(() => {
    setPhase("camera");
  }, []);

  const handleQrDetectado = useCallback(() => {
    setPhase("resultado");
  }, []);

  // Firma (idVale, folio) -- igual a la que espera ListaValesDisponibles.js real
  // via su prop onSeleccionar, así se puede pasar directo sin adaptar nada.
  const handleAsignar = useCallback(() => {
    setPhase("asignando");
    asignandoTimeoutRef.current = setTimeout(() => {
      setPhase("exito");
    }, DELAY_ASIGNANDO_MS);
  }, []);

  const handleIrAAcarreos = useCallback(() => {
    setActive(false);
    onFinalizarIrAVale?.();
  }, [onFinalizarIrAVale]);

  const cancelar = useCallback(() => {
    if (asignandoTimeoutRef.current) clearTimeout(asignandoTimeoutRef.current);
    setActive(false);
  }, []);

  return {
    active,
    phase,
    start,
    handleAbrirCamara,
    handleQrDetectado,
    handleAsignar,
    handleIrAAcarreos,
    cancelar,
  };
};
