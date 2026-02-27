import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";

const MINUTOS_DEFAULT = 20;

export const useViajesRenta = (
  idValeRentaDetalle,
  minMinutosEntreViajes = MINUTOS_DEFAULT,
) => {
  const { userProfile } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState(0);
  const intervaloRef = useRef(null);

  // Cargar viajes existentes
  const cargarViajes = useCallback(async () => {
    if (!idValeRentaDetalle) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vale_renta_viajes")
        .select(
          `
          id_viaje,
          numero_viaje,
          hora_registro,
          persona:id_persona_registro (
            nombre,
            primer_apellido
          )
        `,
        )
        .eq("id_vale_renta_detalle", idValeRentaDetalle)
        .order("numero_viaje", { ascending: true });

      if (error) throw error;
      setViajes(data || []);
    } catch (error) {
      console.error("[useViajesRenta] Error cargando viajes:", error);
    } finally {
      setLoading(false);
    }
  }, [idValeRentaDetalle]);

  // Calcular minutos restantes para el siguiente viaje
  const calcularMinutosRestantes = useCallback(
    (viajesActuales) => {
      if (viajesActuales.length === 0) return 0;

      const ultimoViaje = viajesActuales[viajesActuales.length - 1];
      const horaUltimo = new Date(ultimoViaje.hora_registro);
      const ahora = new Date();
      const diffMs = ahora - horaUltimo;
      const diffMinutos = diffMs / (1000 * 60);
      const restantes = minMinutosEntreViajes - diffMinutos;

      return restantes > 0 ? Math.ceil(restantes) : 0;
    },
    [minMinutosEntreViajes],
  );

  // Iniciar/limpiar cuenta regresiva
  const iniciarCuentaRegresiva = useCallback(
    (viajesActuales) => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);

      const restantes = calcularMinutosRestantes(viajesActuales);
      setMinutosRestantes(restantes);

      if (restantes > 0) {
        intervaloRef.current = setInterval(() => {
          const nuevosRestantes = calcularMinutosRestantes(viajesActuales);
          setMinutosRestantes(nuevosRestantes);
          if (nuevosRestantes <= 0) {
            clearInterval(intervaloRef.current);
            intervaloRef.current = null;
          }
        }, 30000); // Recalcula cada 30 segundos
      }
    },
    [calcularMinutosRestantes],
  );

  // Verificar si se puede registrar un nuevo viaje
  const puedeRegistrar = useCallback(() => {
    if (viajes.length === 0) return true;
    return calcularMinutosRestantes(viajes) <= 0;
  }, [viajes, calcularMinutosRestantes]);

  // Registrar nuevo viaje
  const registrarViaje = useCallback(async () => {
    if (!puedeRegistrar()) {
      Alert.alert(
        "No disponible",
        "No es posible registrar un viaje en este momento.",
        [{ text: "OK" }],
      );
      return false;
    }

    return new Promise((resolve) => {
      Alert.alert(
        "Registrar Viaje",
        `Se registrara el viaje ${viajes.length + 1}. Esta accion no se puede revertir. ¿Deseas continuar?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Confirmar",
            style: "default",
            onPress: async () => {
              try {
                setRegistrando(true);

                const nuevoNumero = viajes.length + 1;

                const { data, error } = await supabase
                  .from("vale_renta_viajes")
                  .insert({
                    id_vale_renta_detalle: idValeRentaDetalle,
                    numero_viaje: nuevoNumero,
                    hora_registro: new Date().toISOString(),
                    id_persona_registro: userProfile.id_persona,
                  })
                  .select(
                    `
                    id_viaje,
                    numero_viaje,
                    hora_registro,
                    persona:id_persona_registro (
                      nombre,
                      primer_apellido
                    )
                  `,
                  )
                  .single();

                if (error) throw error;

                const viajesActualizados = [...viajes, data];
                setViajes(viajesActualizados);
                iniciarCuentaRegresiva(viajesActualizados);
                resolve(true);
              } catch (error) {
                console.error(
                  "[useViajesRenta] Error registrando viaje:",
                  error,
                );
                Alert.alert(
                  "Error",
                  "No se pudo registrar el viaje. Intenta de nuevo.",
                  [{ text: "OK" }],
                );
                resolve(false);
              } finally {
                setRegistrando(false);
              }
            },
          },
        ],
      );
    });
  }, [
    puedeRegistrar,
    viajes,
    idValeRentaDetalle,
    userProfile,
    iniciarCuentaRegresiva,
  ]);

  // Cargar al montar y cuando cambie el detalle
  useEffect(() => {
    cargarViajes();
  }, [cargarViajes]);

  // Iniciar cuenta regresiva cuando carguen los viajes
  useEffect(() => {
    if (!loading && viajes.length > 0) {
      iniciarCuentaRegresiva(viajes);
    }
  }, [loading]); // Solo al terminar de cargar

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  return {
    viajes,
    loading,
    registrando,
    puedeRegistrar: puedeRegistrar(),
    totalViajes: viajes.length,
    registrarViaje,
    recargarViajes: cargarViajes,
  };
};
