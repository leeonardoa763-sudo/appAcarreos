import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";
import { esDentroJornada } from "../utils/jornadaLaboral";

const MINUTOS_DEFAULT = 20;

export const useViajesRenta = (
  idValeRentaDetalle,
  idObra,
  horaInicioVale = null,
  fechaCreacionVale = null,
) => {
  const { userProfile } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [eliminandoViaje, setEliminandoViaje] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState(0);
  const [minMinutosEntreViajes, setMinMinutosEntreViajes] =
    useState(MINUTOS_DEFAULT);
  const intervaloRef = useRef(null);

  const cargarConfiguracion = useCallback(async () => {
    if (!idObra) return;
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("min_minutos_entre_viajes")
        .eq("id_obra", idObra)
        .single();

      if (error) throw error;

      const valor = data?.min_minutos_entre_viajes ?? MINUTOS_DEFAULT;
      setMinMinutosEntreViajes(valor);
    } catch (error) {
      console.error("[Viajes] Error cargando configuracion:", error);
    }
  }, [idObra]);

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

  const calcularMinutosRestantes = useCallback(
    (viajesActuales) => {
      const ahora = new Date();

      // Sin viajes: tiempo de espera desde hora_inicio del vale
      if (viajesActuales.length === 0) {
        if (!horaInicioVale) return 0;
        const horaInicio = new Date(horaInicioVale);
        const diffMinutos = (ahora - horaInicio) / (1000 * 60);
        const restantes = minMinutosEntreViajes - diffMinutos;
        return restantes > 0 ? Math.ceil(restantes) : 0;
      }

      // Con viajes: tiempo desde el último viaje registrado
      const ultimoViaje = viajesActuales[viajesActuales.length - 1];
      const horaUltimo = new Date(ultimoViaje.hora_registro);
      const diffMinutos = (ahora - horaUltimo) / (1000 * 60);
      const restantes = minMinutosEntreViajes - diffMinutos;
      return restantes > 0 ? Math.ceil(restantes) : 0;
    },
    [minMinutosEntreViajes, horaInicioVale],
  );

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
        }, 30000);
      }
    },
    [calcularMinutosRestantes],
  );

  // Siempre verificar minutosRestantes — aplica tanto para viajes vacíos como con viajes
  const puedeRegistrar = useCallback(() => {
    return minutosRestantes <= 0;
  }, [minutosRestantes]);

  const registrarViaje = useCallback(async () => {
    const esAdministrador = userProfile?.roles?.role === "Administrador";

    if (!esAdministrador && !esDentroJornada(fechaCreacionVale)) {
      Alert.alert(
        "Vale fuera de jornada",
        "Este vale fue creado en una jornada anterior y ya no puede recibir viajes. Usa un vale del dia de hoy.",
        [{ text: "Entendido" }],
      );
      return false;
    }

    if (!esAdministrador && !puedeRegistrar()) {
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
          { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Confirmar",
            style: "default",
            onPress: async () => {
              try {
                setRegistrando(true);
                const { data, error } = await supabase
                  .from("vale_renta_viajes")
                  .insert({
                    id_vale_renta_detalle: idValeRentaDetalle,
                    numero_viaje: viajes.length + 1,
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
    fechaCreacionVale,
  ]);

  const eliminarUltimoViaje = useCallback(
    async (idViaje) => {
      try {
        setEliminandoViaje(true);
        const { data: deleted, error } = await supabase
          .from("vale_renta_viajes")
          .delete()
          .eq("id_viaje", idViaje)
          .select("id_viaje");
        if (error) throw error;
        if (!deleted || deleted.length === 0) {
          throw new Error("RLS: fila no eliminada");
        }

        setViajes((prev) => prev.slice(0, -1));
        return true;
      } catch (error) {
        console.error("[useViajesRenta] Error eliminando viaje:", error);
        Alert.alert("Error", "No se pudo eliminar el viaje. Verifica permisos.");
        return false;
      } finally {
        setEliminandoViaje(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  useEffect(() => {
    cargarViajes();
  }, [cargarViajes]);

  // Iniciar cuenta regresiva siempre al terminar de cargar,
  // sin importar si hay viajes o no
  useEffect(() => {
    if (!loading) {
      iniciarCuentaRegresiva(viajes);
    }
  }, [loading]);

  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  return {
    viajes,
    loading,
    registrando,
    eliminandoViaje,
    puedeRegistrar: puedeRegistrar(),
    totalViajes: viajes.length,
    registrarViaje,
    eliminarUltimoViaje,
    recargarViajes: cargarViajes,
  };
};
